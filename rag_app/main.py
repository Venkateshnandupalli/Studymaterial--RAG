from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, BackgroundTasks
import shutil, uuid
from database import engine, SessionLocal
from models import Base, Document, Chunk, User
from pdf_utils import extract_text, chunk_text
from embedding import embed_text
from vector_store import add_vectors, search_vector
from llm import generate_answer
from auth_dependency import get_current_user
from security import hash_password, verify_password
from jwt_utils import create_access_token

app = FastAPI()
Base.metadata.create_all(bind=engine)

@app.post("/upload")
def upload_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    file_id = str(uuid.uuid4())
    path = f"storage/{file_id}.pdf"

    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    db = SessionLocal()
    doc = Document(
        id=file_id,
        filename=file.filename,
        user_id=current_user.id,
        status="PROCESSING"
    )
    db.add(doc)
    db.commit()

    background_tasks.add_task(
        process_pdf,
        file_id,
        path,
        current_user.id
    )

    return {
        "message": "PDF uploaded. Processing in background",
        "document_id": file_id
    }

@app.post("/ask")
def ask_question(
    question: str,
    current_user: User = Depends(get_current_user)
):
    q_vector = embed_text([question])[0]

    ids = search_vector(q_vector)

    db = SessionLocal()
    texts = (
        db.query(Chunk)
        .join(Document)
        .filter(
            Chunk.id.in_(ids),
            Document.user_id == current_user.id
        )
        .all()
    )

    if not texts:
        return {"answer": "No relevant data found"}

    context = "\n".join([t.text for t in texts])

    answer = generate_answer(context, question)

    return {
        "user": current_user.email,
        "answer": answer
    }
"""Authentication endpoints"""
@app.post("/auth/register")
def register(email: str, password: str):
    db = SessionLocal()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="User already exists")

    user = User(
        email=email,
        password_hash=hash_password(password)
    )
    db.add(user)
    db.commit()

    return {"message": "User registered successfully"}
@app.post("/auth/login")
def login(email: str, password: str):
    db = SessionLocal()
    user = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(user.id)
    return {"access_token": token}

def process_pdf(document_id: str, path: str, user_id: str):
    db = SessionLocal()

    try:
        text = extract_text(path)
        chunks = chunk_text(text)
        vectors = embed_text(chunks)

        for i, chunk in enumerate(chunks):
            c = Chunk(
                id=str(uuid.uuid4()),
                document_id=document_id,
                text=chunk
            )
            db.add(c)
            db.commit()
            add_vectors([vectors[i]], [c.id])

        doc = db.query(Document).filter(Document.id == document_id).first()
        doc.status = "READY"
        db.commit()

    except Exception as e:
        doc = db.query(Document).filter(Document.id == document_id).first()
        doc.status = "FAILED"
        db.commit()
