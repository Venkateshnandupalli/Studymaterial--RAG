from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth_utils import get_current_user
from supabase_client import supabase
from services.embeddings import get_embedding
from services.llm_service import generate_answer

router = APIRouter(tags=["query"])


class AskRequest(BaseModel):
    question: str
    match_count: int = 5


@router.post("/ask")
def ask_question(body: AskRequest, current_user: dict = Depends(get_current_user)):
    """
    Embed the question, retrieve top-k relevant chunks via pgvector,
    then generate an answer using GPT-4o-mini.
    """
    if not body.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    # 1. Embed the question
    query_embedding = get_embedding(body.question)
    if query_embedding is None:
        raise HTTPException(status_code=500, detail="Failed to generate question embedding")

    # 2. Vector similarity search via Supabase RPC
    results = supabase.rpc("match_document_chunks", {
        "query_embedding": query_embedding,
        "match_count": body.match_count,
        "similarity_threshold": 0.1,
    }).execute()

    if not results.data:
        return {"answer": "No relevant content found in your documents. Please upload a relevant file first."}

    # 3. Build context from retrieved chunks
    context = "\n\n".join([row.get("content", "") for row in results.data])

    # 4. Generate answer
    answer = generate_answer(context, body.question)

    return {
        "answer": answer,
        "sources_used": len(results.data),
    }
