from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.auth import router as auth_router
from api.upload import router as upload_router
from api.query import router as query_router
from api.study import router as study_router

app = FastAPI(
    title="Student Study Assistant API",
    description="RAG-powered study assistant — upload documents, ask questions, get answers.",
    version="2.0.0",
)

# ── CORS (allow the Vite dev server + any deployed frontend) ──────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(upload_router)
app.include_router(query_router)
app.include_router(study_router)


@app.get("/")
def root():
    return {
        "message": "🎓 Student Study Assistant API is running!",
        "docs": "/docs",
        "version": "2.0.0",
    }


@app.get("/health")
def health():
    # Reload trigger comment
    return {"status": "ok"}

