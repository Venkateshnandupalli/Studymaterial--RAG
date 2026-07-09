<div align="center">

# 🎓 StudyAI — Student Study Assistant

**An AI-powered RAG (Retrieval-Augmented Generation) application that lets students upload their study materials and get instant, context-aware answers — powered by OpenAI and Supabase.**

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Supabase-pgvector-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?style=flat&logo=openai&logoColor=white)](https://openai.com)

</div>

---

## 📖 About the Project

**StudyAI** is a full-stack Retrieval-Augmented Generation (RAG) application built specifically for students. Instead of searching through entire documents manually, you can upload your study materials — PDFs, Word documents, or plain text files — and simply **ask questions in plain English**. The AI reads your documents, finds the most relevant sections, and generates a precise answer grounded in your own content.

### 🔑 Key Highlights

- 🧠 **RAG Pipeline** — Questions are answered using *your* uploaded documents, not the internet
- 🔐 **Secure Auth** — JWT-based authentication with bcrypt password hashing
- ☁️ **Cloud-Native** — Supabase handles both the database and vector similarity search (pgvector)
- 📄 **Multi-Format** — Upload PDF, DOCX, or TXT files
- ⚡ **Background Processing** — Documents are chunked & embedded asynchronously — no waiting
- 🎨 **Premium UI** — Dark glassmorphism design with animated chat interface

---

## 🖼️ How It Works

```
  You upload a PDF/DOCX/TXT
          │
          ▼
  Text is extracted
          │
          ▼
  Text is split into chunks (500 chars, 100 overlap)
          │
          ▼
  Each chunk is embedded → OpenAI text-embedding-3-small (1536 dimensions)
          │
          ▼
  Embeddings stored in Supabase (pgvector)
          │
          ▼
  You ask a question
          │
          ▼
  Question is embedded → pgvector finds top-5 similar chunks
          │
          ▼
  GPT-4o-mini generates answer using those chunks as context
          │
          ▼
  Answer displayed in chat UI ✅
```

---

## 🗂️ Project Structure

```
rag_app/
├── backend/                        # FastAPI Python backend
│   ├── main.py                     # App entry point, CORS, router registration
│   ├── config.py                   # Centralised environment variable loading
│   ├── supabase_client.py          # Supabase client singleton
│   ├── auth_utils.py               # JWT creation/verification + bcrypt
│   │
│   ├── api/                        # Route handlers
│   │   ├── auth.py                 # POST /auth/register, POST /auth/login
│   │   ├── upload.py               # POST /upload, GET /documents
│   │   └── query.py                # POST /ask
│   │
│   ├── services/                   # Business logic (no HTTP concerns)
│   │   ├── pdf_loader.py           # Extract text from PDF files
│   │   ├── doc_loader.py           # Extract text from DOCX and TXT files
│   │   ├── chunker.py              # Split text into overlapping chunks
│   │   ├── embeddings.py           # OpenAI text-embedding-3-small wrapper
│   │   └── llm_service.py          # GPT-4o-mini answer generation
│   │
│   ├── uploads/                    # Temporary file storage (auto-cleaned)
│   └── requirements.txt            # Python dependencies
│
├── frontend/                       # React + Vite frontend
│   ├── index.html                  # HTML entry with Google Fonts
│   ├── vite.config.js              # Vite config with dev proxy to FastAPI
│   ├── package.json
│   └── src/
│       ├── main.jsx                # React DOM entry
│       ├── App.jsx                 # Router with protected routes
│       ├── index.css               # Full design system (dark glassmorphism)
│       ├── pages/
│       │   ├── Signup.jsx          # Registration page with validation
│       │   ├── Login.jsx           # Login page with JWT storage
│       │   └── Dashboard.jsx       # Main app: upload + chat interface
│       └── services/
│           └── api.js              # Axios instance with auto JWT injection
│
├── .env                            # Your secret keys (never committed)
├── .env.example                    # Template for environment variables
└── README.md
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Backend Framework** | FastAPI + Uvicorn | High-performance async API server |
| **Database** | Supabase (PostgreSQL) | User, document & chunk storage |
| **Vector Search** | Supabase pgvector | Semantic similarity search |
| **Embeddings** | OpenAI `text-embedding-3-small` | Convert text → 1536-dim vectors |
| **LLM** | OpenAI `gpt-4o-mini` | Answer generation from context |
| **Authentication** | JWT (python-jose) + bcrypt | Secure stateless auth |
| **PDF Parsing** | pypdf | Extract text from PDF files |
| **DOCX Parsing** | python-docx | Extract text from Word documents |
| **Frontend** | React 18 + Vite | Fast, modern UI framework |
| **Routing** | react-router-dom v6 | Client-side navigation |
| **HTTP Client** | Axios | API calls with interceptors |
| **Design** | Vanilla CSS | Dark glassmorphism design system |

---

## ⚙️ Prerequisites

Before you begin, make sure you have:

- **Python 3.10+** — [Download](https://python.org/downloads)
- **Node.js 18+** — [Download](https://nodejs.org)
- **Supabase account** — [Create free account](https://supabase.com) (with pgvector enabled)
- **OpenAI API key** — [Get one here](https://platform.openai.com/api-keys)

---

## 🗄️ Supabase Database Setup

Run the following SQL in your **Supabase SQL Editor** (`project → SQL Editor → New query`):

```sql
-- Step 1: Enable pgvector extension
create extension if not exists vector;

-- Step 2: Users table
create table users (
  id         uuid primary key default gen_random_uuid(),
  name       text,
  email      text unique not null,
  password   text not null,
  created_at timestamptz default now()
);

-- Step 3: Documents table (tracks uploaded files)
create table documents (
  id         uuid primary key,
  file_name  text,
  user_email text,
  status     text default 'PROCESSING',  -- PROCESSING | READY | FAILED
  created_at timestamptz default now()
);

-- Step 4: Document chunks table (stores text + embeddings)
create table document_chunks (
  id          uuid primary key,
  document_id uuid references documents(id) on delete cascade,
  chunk_number int,
  content     text,
  embedding   vector(1536),              -- OpenAI text-embedding-3-small dimensions
  created_at  timestamptz default now()
);

-- Step 5: Vector similarity search function
create or replace function match_document_chunks(
  query_embedding    vector(1536),
  match_count        int   default 5,
  similarity_threshold float default 0.1
)
returns table (
  id          uuid,
  document_id uuid,
  content     text,
  similarity  float
)
language sql stable
as $$
  select
    id,
    document_id,
    content,
    1 - (embedding <=> query_embedding) as similarity
  from document_chunks
  where 1 - (embedding <=> query_embedding) > similarity_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;
```

---

## 🚀 Setup & Run

### 1. Clone the repository

```bash
git clone https://github.com/Venkateshnandupalli/Studymaterial--RAG.git
cd Studymaterial--RAG/rag_app
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=sk-proj-...
SECRET_KEY=any-long-random-string-for-jwt
```

### 3. Start the Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

> 🔗 API docs auto-generated at: **http://localhost:8000/docs**

### 4. Start the Frontend

Open a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

> 🌐 App runs at: **http://localhost:5173**

---

## 🧪 Using the App

1. **Sign Up** — Create an account at `/signup`
2. **Log In** — Sign in at `/login` (JWT token stored in browser)
3. **Upload a Document** — Click the upload zone on the dashboard, select a PDF / DOCX / TXT
4. **Wait for Processing** — Status changes from `PROCESSING` → `READY` automatically (polls every 5 seconds)
5. **Ask a Question** — Type your question in the chat panel and press Enter
6. **Get an Answer** — GPT-4o-mini responds using only your uploaded documents as context

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | ❌ | Create a new account |
| `POST` | `/auth/login` | ❌ | Login and get JWT token |
| `POST` | `/upload` | ✅ | Upload PDF / DOCX / TXT file |
| `GET` | `/documents` | ✅ | List your uploaded documents |
| `POST` | `/ask` | ✅ | Ask a question about your documents |
| `GET` | `/docs` | ❌ | Swagger interactive API docs |
| `GET` | `/health` | ❌ | Health check |

---

## 🔒 Security Notes

- Passwords are **bcrypt-hashed** — never stored in plain text
- JWTs expire after **60 minutes**
- The `.env` file is **git-ignored** — your API keys are never committed
- CORS is configured to allow the local dev frontend and can be locked down for production

---

## 🧰 Development Notes

### Running backend tests manually
```bash
# Test the API is alive
curl http://localhost:8000/health

# View interactive API docs
open http://localhost:8000/docs
```

### Project origins
This project was built by merging two earlier prototypes:
- **RAG prototype** — a minimal local RAG pipeline using SQLite + FAISS + sentence-transformers
- **Student Study Assistant** — a layered FastAPI + React app using Supabase

The final version takes the best of both: cloud Supabase pgvector, OpenAI embeddings, multi-format document support, and a fully functional React frontend.

---

## 📄 License

This project is for educational purposes. Feel free to use and modify it for your own learning projects.

---

<div align="center">

Built with ❤️ by **Venkatesh Nandupalli**

</div>
