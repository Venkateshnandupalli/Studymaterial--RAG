import os
import uuid
import shutil
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks

from auth_utils import get_current_user
from supabase_client import supabase
from services.pdf_loader import load_pdf_text
from services.doc_loader import load_docx_text, load_txt_text
from services.chunker import chunk_text
from services.embeddings import get_embedding

router = APIRouter(tags=["upload"])

UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

SUPPORTED = {".pdf", ".docx", ".txt"}


def _extract_text(file_path: str) -> str:
    ext = Path(file_path).suffix.lower()
    if ext == ".pdf":
        return load_pdf_text(file_path)
    elif ext == ".docx":
        return load_docx_text(file_path)
    elif ext == ".txt":
        return load_txt_text(file_path)
    return ""


def _process_document(doc_id: str, file_path: str, file_name: str):
    """Background task: chunk → embed → store in Supabase."""
    try:
        text = _extract_text(file_path)
        if not text.strip():
            supabase.table("documents").update({"status": "FAILED"}).eq("id", doc_id).execute()
            return

        chunks = chunk_text(text)
        for idx, chunk_content in enumerate(chunks):
            embedding = get_embedding(chunk_content)
            if embedding is None:
                continue
            supabase.table("document_chunks").insert({
                "id": str(uuid.uuid4()),
                "document_id": doc_id,
                "chunk_number": idx,
                "content": chunk_content,
                "embedding": embedding,
            }).execute()

        supabase.table("documents").update({"status": "READY"}).eq("id", doc_id).execute()
    except Exception as e:
        print(f"[ERROR] Processing failed for {doc_id}: {e}")
        supabase.table("documents").update({"status": "FAILED"}).eq("id", doc_id).execute()
    finally:
        # Clean up temp file
        try:
            os.remove(file_path)
        except OSError:
            pass


@router.post("/upload")
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Upload a PDF / DOCX / TXT file for ingestion into the RAG pipeline."""
    ext = Path(file.filename or "").suffix.lower()
    if ext not in SUPPORTED:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}. Use PDF, DOCX, or TXT.")

    doc_id = str(uuid.uuid4())
    save_path = str(UPLOAD_DIR / f"{doc_id}{ext}")

    # Save file to disk temporarily
    with open(save_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Create document record
    supabase.table("documents").insert({
        "id": doc_id,
        "file_name": file.filename,
        "user_email": current_user["sub"],
        "status": "PROCESSING",
    }).execute()

    background_tasks.add_task(_process_document, doc_id, save_path, file.filename)

    return {
        "message": f"'{file.filename}' uploaded. Processing in background...",
        "document_id": doc_id,
    }


@router.get("/documents")
def list_documents(current_user: dict = Depends(get_current_user)):
    """List all documents uploaded by the current user."""
    result = supabase.table("documents") \
        .select("id, file_name, status, created_at") \
        .eq("user_email", current_user["sub"]) \
        .order("created_at", desc=True) \
        .execute()
    return {"documents": result.data or []}


@router.delete("/documents/{doc_id}")
def delete_document(doc_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a document uploaded by the current user."""
    # Verify ownership before deleting
    doc_res = supabase.table("documents") \
        .select("id") \
        .eq("id", doc_id) \
        .eq("user_email", current_user["sub"]) \
        .execute()
    
    if not doc_res.data:
        raise HTTPException(status_code=404, detail="Document not found or access denied")
        
    # Delete from documents table (chunks will be deleted via ON DELETE CASCADE in the database)
    supabase.table("documents").delete().eq("id", doc_id).execute()
    return {"message": "Document deleted successfully"}

