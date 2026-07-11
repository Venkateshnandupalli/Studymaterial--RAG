import os
import json
import urllib.request
import urllib.error
from typing import List

from config import OPENAI_API_KEY


def get_embedding(text: str) -> List[float]:
    """
    Generate a vector embedding for the given text.

    Strategy:
    - If OPENAI_API_KEY starts with 'gsk_' (Groq key), we cannot use
      OpenAI embeddings. Instead we call Google Gemini's embedding API
      (gemini-embedding-001) which returns 3072-dimensional vectors.
      We truncate to 1536 to match the existing Supabase pgvector column.
    - Otherwise (real OpenAI key), we use text-embedding-3-small which
      natively returns 1536-dimensional vectors.

    Never loads any local ML model — safe for Render's 512 MB free tier.
    """
    is_groq = isinstance(OPENAI_API_KEY, str) and OPENAI_API_KEY.startswith("gsk_")

    if is_groq:
        gemini_api_key = os.getenv("GEMINI_API_KEY", "").strip()
        if not gemini_api_key:
            raise RuntimeError(
                "GEMINI_API_KEY is not set. "
                "Add it to your Render environment variables."
            )

        api_url = (
            "https://generativelanguage.googleapis.com/v1beta"
            f"/models/gemini-embedding-001:embedContent?key={gemini_api_key}"
        )
        payload = {
            "model": "models/gemini-embedding-001",
            "content": {
                "parts": [{"text": text}]
            },
        }
        req = urllib.request.Request(
            api_url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                values: List[float] = data["embedding"]["values"]
                # gemini-embedding-001 outputs 3072 dims; truncate to 1536
                # to match the Supabase pgvector column size.
                return values[:1536]
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8")
            raise RuntimeError(
                f"Gemini API error {e.code} {e.reason}: {body}"
            )
        except Exception as e:
            raise RuntimeError(f"Gemini embedding request failed: {e}")

    # ── Real OpenAI key path ────────────────────────────────────────────────
    from openai import OpenAI
    client = OpenAI(api_key=OPENAI_API_KEY)
    try:
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=text,
        )
        return response.data[0].embedding
    except Exception as e:
        raise RuntimeError(f"OpenAI embedding failed: {e}")
