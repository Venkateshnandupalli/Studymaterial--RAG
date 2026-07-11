from typing import Optional, List
from openai import OpenAI
from config import OPENAI_API_KEY

client = OpenAI(api_key=OPENAI_API_KEY)

# Lazy-loaded local transformer model for free mode
_local_transformer = None


def get_embedding(text: str) -> Optional[List[float]]:
    """
    Generate a vector embedding for the given text.
    If a Groq key is detected (starts with 'gsk_'), we use local sentence-transformers (all-MiniLM-L6-v2)
    and pad the resulting 384-dimensional vector with zeros to 1536 dimensions to match the database.
    Otherwise, we use OpenAI's text-embedding-3-small model.
    """
    global _local_transformer

    is_groq = isinstance(OPENAI_API_KEY, str) and OPENAI_API_KEY.startswith("gsk_")

    if is_groq:
        import os
        import requests
        
        hf_token = os.getenv("HF_TOKEN")
        if hf_token:
            try:
                # Use Hugging Face Serverless Inference API (requires zero local RAM!)
                model_id = "sentence-transformers/all-MiniLM-L6-v2"
                api_url = f"https://api-inference.huggingface.co/pipeline/feature-extraction/{model_id}"
                headers = {"Authorization": f"Bearer {hf_token}"}
                payload = {
                    "inputs": [text],
                    "options": {"wait_for_model": True}
                }
                res = requests.post(api_url, headers=headers, json=payload)
                if res.status_code == 200:
                    raw_emb = res.json()[0]
                    # Pad to 1536 dimensions to fit the Supabase schema
                    return raw_emb + [0.0] * (1536 - len(raw_emb))
                else:
                    print(f"[WARNING] HF Inference API failed (status {res.status_code}): {res.text}. Falling back to local model.")
            except Exception as e:
                print(f"[WARNING] HF Inference API exception: {e}. Falling back to local model.")

        # Local fallback if HF_TOKEN is not set or API request failed
        try:
            if _local_transformer is None:
                from sentence_transformers import SentenceTransformer
                _local_transformer = SentenceTransformer('all-MiniLM-L6-v2')
            
            # Generate 384-dimensional local embedding
            raw_emb = _local_transformer.encode(text).tolist()
            # Pad to 1536 dimensions to fit the Supabase schema
            return raw_emb + [0.0] * (1536 - len(raw_emb))
        except Exception as e:
            print(f"[ERROR] Local embedding error: {e}")
            return None
    else:
        try:
            response = client.embeddings.create(
                model="text-embedding-3-small",
                input=text,
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"[ERROR] Embedding error: {e}")
            return None
