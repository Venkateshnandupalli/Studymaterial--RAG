# 🎓 StudyAI — Student Study Assistant

A full-stack RAG-powered study assistant. Upload PDFs, DOCX, or TXT files and ask questions answered by GPT-4o-mini using your own documents.

---

## 🗂️ Project Structure

```
rag_app/
├── backend/        FastAPI backend (Supabase + OpenAI)
├── frontend/       React + Vite frontend
├── .env            Environment variables
└── .env.example    Template for environment variables
```

---

## ⚙️ Prerequisites

- Python 3.10+
- Node.js 18+
- A [Supabase](https://supabase.com) project with `pgvector` enabled
- An OpenAI API key

### Supabase tables required

Run the following SQL in your Supabase SQL editor:

```sql
-- Enable pgvector
create extension if not exists vector;

-- Users table
create table users (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text unique not null,
  password text not null,
  created_at timestamptz default now()
);

-- Documents table
create table documents (
  id uuid primary key,
  file_name text,
  user_email text,
  status text default 'PROCESSING',
  created_at timestamptz default now()
);

-- Document chunks table
create table document_chunks (
  id uuid primary key,
  document_id uuid references documents(id) on delete cascade,
  chunk_number int,
  content text,
  embedding vector(1536),
  created_at timestamptz default now()
);

-- Vector similarity search function
create or replace function match_document_chunks(
  query_embedding vector(1536),
  match_count int default 5,
  similarity_threshold float default 0.1
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  similarity float
)
language sql stable
as $$
  select
    id, document_id, content,
    1 - (embedding <=> query_embedding) as similarity
  from document_chunks
  where 1 - (embedding <=> query_embedding) > similarity_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;
```

---

## 🚀 Setup & Run

### 1. Environment variables

```bash
cp .env.example .env
# Fill in your SUPABASE_URL, SUPABASE_ANON_KEY, OPENAI_API_KEY, SECRET_KEY
```

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

---

## 🧪 Usage

1. **Sign Up** at `/signup`
2. **Log In** at `/login`
3. **Upload** a PDF, DOCX, or TXT on the dashboard
4. **Wait** for status to change from `PROCESSING` → `READY`
5. **Ask** a question in the chat panel

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI + Uvicorn |
| Database | Supabase (PostgreSQL + pgvector) |
| Embeddings | OpenAI `text-embedding-3-small` |
| LLM | OpenAI `gpt-4o-mini` |
| Auth | JWT (python-jose) + bcrypt |
| Frontend | React 18 + Vite |
| Routing | react-router-dom v6 |
| HTTP | Axios |
