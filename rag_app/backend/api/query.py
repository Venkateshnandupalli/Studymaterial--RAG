from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth_utils import get_current_user
from supabase_client import supabase
from services.embeddings import get_embedding
from services.llm_service import generate_answer

router = APIRouter(tags=["query"])


from typing import Optional, List

class AskRequest(BaseModel):
    question: str
    match_count: int = 5
    document_ids: Optional[List[str]] = None


@router.post("/ask")
def ask_question(body: AskRequest, current_user: dict = Depends(get_current_user)):
    """
    Embed the question, retrieve top-k relevant chunks via pgvector,
    then generate an answer using GPT-4o-mini. Can filter by document_ids.
    """
    if not body.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    # 1. Fetch user's documents to restrict query access for security
    user_docs_res = supabase.table("documents") \
        .select("id") \
        .eq("user_email", current_user["sub"]) \
        .execute()
    user_doc_ids = [row["id"] for row in (user_docs_res.data or [])]

    if not user_doc_ids:
        return {"answer": "No documents found. Please upload a relevant file first.", "sources_used": 0}

    # Intersect requested document_ids with user's allowed document_ids
    if body.document_ids:
        allowed_doc_ids = list(set(body.document_ids) & set(user_doc_ids))
        if not allowed_doc_ids:
             return {"answer": "None of the selected documents belong to your account.", "sources_used": 0}
    else:
        allowed_doc_ids = user_doc_ids

    # 2. Embed the question
    query_embedding = get_embedding(body.question)
    if query_embedding is None:
        raise HTTPException(status_code=500, detail="Failed to generate question embedding")

    # 3. Vector similarity search via Supabase RPC (with fallback support)
    results_data = []
    try:
        # Attempt to use the v2 function which supports array filtering in the database
        res = supabase.rpc("match_document_chunks_v2", {
            "query_embedding": query_embedding,
            "match_count": body.match_count,
            "similarity_threshold": 0.1,
            "filter_document_ids": allowed_doc_ids,
        }).execute()
        results_data = res.data or []
    except Exception:
        # Fallback: Use standard match_document_chunks and filter results in Python
        # Retrieve more chunks to increase the probability of getting matching documents
        res = supabase.rpc("match_document_chunks", {
            "query_embedding": query_embedding,
            "match_count": body.match_count * 4,
            "similarity_threshold": 0.1,
        }).execute()
        
        # Filter results that belong to the user's selected/allowed document IDs
        results_data = [
            row for row in (res.data or [])
            if row.get("document_id") in allowed_doc_ids
        ][:body.match_count]

    if not results_data:
        return {"answer": "No relevant content found in the selected documents. Try asking something else.", "sources_used": 0}

    # 4. Build context from retrieved chunks
    context = "\n\n".join([row.get("content", "") for row in results_data])

    # 5. Generate answer
    answer = generate_answer(context, body.question)

    return {
        "answer": answer,
        "sources_used": len(results_data),
    }
