import axios from "axios";
import { supabase } from "./supabase";

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({ baseURL: BASE_URL });

// Inject JWT token into every request automatically
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Automatically logout user if token expires (401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      await supabase.auth.signOut();
      localStorage.removeItem("userName");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);


// ── Documents ─────────────────────────────────────────────────────────────────
export const uploadFile = (file, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
    },
  });
};

export const listDocuments = () => api.get("/documents");

// ── Query ─────────────────────────────────────────────────────────────────────
export const askQuestion = (question, documentIds = null) => 
  api.post("/ask", { question, document_ids: documentIds });

// ── Study Aids ────────────────────────────────────────────────────────────────
export const generateFlashcards = (docId) => api.post(`/documents/${docId}/flashcards`);
export const generateQuiz = (docId) => api.post(`/documents/${docId}/quiz`);
export const deleteDocument = (docId) => api.delete(`/documents/${docId}`);

