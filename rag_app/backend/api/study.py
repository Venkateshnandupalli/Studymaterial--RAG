import json
from fastapi import APIRouter, Depends, HTTPException

from auth_utils import get_current_user
from supabase_client import supabase
from services.llm_service import client, DEFAULT_MODEL

router = APIRouter(tags=["study"])


@router.post("/documents/{doc_id}/flashcards")
def generate_flashcards(doc_id: str, current_user: dict = Depends(get_current_user)):
    """
    Retrieve document text, then call the LLM to generate 5 high-quality flashcards
    covering the main terms, formulas, definitions, or questions.
    """
    # 1. Fetch document and verify ownership
    doc_res = supabase.table("documents") \
        .select("user_email, status") \
        .eq("id", doc_id) \
        .execute()
    
    if not doc_res.data:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc_res.data[0]["user_email"] != current_user["sub"]:
        raise HTTPException(status_code=403, detail="Access denied to this document")
    if doc_res.data[0]["status"] != "READY":
        raise HTTPException(status_code=400, detail="Document is still processing. Please try again in a moment.")

    # 2. Retrieve document chunks (limit to first 30 chunks to respect LLM limits)
    chunks_res = supabase.table("document_chunks") \
        .select("content") \
        .eq("document_id", doc_id) \
        .order("chunk_number") \
        .execute()
    
    if not chunks_res.data:
        raise HTTPException(status_code=404, detail="No content chunks found for this document")
        
    doc_text = "\n\n".join([row["content"] for row in chunks_res.data[:30]])

    # 3. Call the LLM to generate 5 key flashcards
    system_prompt = (
        "You are an expert study assistant. Analyse the document content provided below, "
        "and generate exactly 5 key flashcards in JSON format for the student to study.\n"
        "Each flashcard must contain:\n"
        "- 'front': A key term, concept, formula, or question.\n"
        "- 'back': A clear, detailed definition, solution, or explanation.\n\n"
        "You must output a JSON object containing a 'flashcards' key with the list of cards. "
        "Do not include any other markdown formatting outside the JSON object.\n\n"
        f"Document Content:\n{doc_text}"
    )

    try:
        response = client.chat.completions.create(
            model=DEFAULT_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "Generate 5 flashcards for this document."}
            ],
            response_format={"type": "json_object"},
            temperature=0.4
        )
        raw_json = response.choices[0].message.content
        parsed = json.loads(raw_json)
        return parsed
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate flashcards: {str(e)}")


@router.post("/documents/{doc_id}/quiz")
def generate_quiz(doc_id: str, current_user: dict = Depends(get_current_user)):
    """
    Retrieve document text, then call the LLM to generate a practice quiz of
    exactly 3 multiple choice questions (MCQs) with option explanations.
    """
    # 1. Fetch document and verify ownership
    doc_res = supabase.table("documents") \
        .select("user_email, status") \
        .eq("id", doc_id) \
        .execute()
    
    if not doc_res.data:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc_res.data[0]["user_email"] != current_user["sub"]:
        raise HTTPException(status_code=403, detail="Access denied to this document")
    if doc_res.data[0]["status"] != "READY":
        raise HTTPException(status_code=400, detail="Document is still processing. Please try again in a moment.")

    # 2. Retrieve document chunks
    chunks_res = supabase.table("document_chunks") \
        .select("content") \
        .eq("document_id", doc_id) \
        .order("chunk_number") \
        .execute()
    
    if not chunks_res.data:
        raise HTTPException(status_code=404, detail="No content chunks found for this document")
        
    doc_text = "\n\n".join([row["content"] for row in chunks_res.data[:30]])

    # 3. Call the LLM to generate 3 MCQs
    system_prompt = (
        "You are an expert examiner. Analyse the document content provided below, "
        "and generate exactly 3 multiple choice practice questions (MCQs) in JSON format "
        "to test the student's comprehension.\n"
        "Each question object in the JSON list must contain:\n"
        "- 'question': The question string.\n"
        "- 'options': A list of exactly 4 choices.\n"
        "- 'correct_answer': The exact string of the correct choice (must be identical to one of the 4 choices).\n"
        "- 'explanation': A detailed explanation of why the correct answer is right and why other options are wrong.\n\n"
        "You must output a JSON object containing a 'quiz' key with the list of questions. "
        "Do not include any other markdown formatting outside the JSON object.\n\n"
        f"Document Content:\n{doc_text}"
    )

    try:
        response = client.chat.completions.create(
            model=DEFAULT_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "Generate 3 multiple choice questions for this document."}
            ],
            response_format={"type": "json_object"},
            temperature=0.4
        )
        raw_json = response.choices[0].message.content
        parsed = json.loads(raw_json)
        return parsed
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate practice quiz: {str(e)}")
