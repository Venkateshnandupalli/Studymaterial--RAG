from typing import Optional, List
from openai import OpenAI
from config import OPENAI_API_KEY

client = OpenAI(api_key=OPENAI_API_KEY)


def get_embedding(text: str) -> Optional[List[float]]:
    """
    Generate a vector embedding for the given text using OpenAI
    text-embedding-3-small (1536 dimensions).

    Returns None on failure so callers can handle gracefully.
    """
    try:
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=text,
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"❌ Embedding error: {e}")
        return None
