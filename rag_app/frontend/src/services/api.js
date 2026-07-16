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

// Handle response errors.
// IMPORTANT: Do NOT auto-logout on 401. A 401 from the backend can happen
// for many transient reasons (slow session init, CORS preflight, network blip).
// Auto-logout was causing OAuth users to be kicked back to /login immediately
// after the dashboard loaded. Instead, just reject the promise so the caller
// can handle it gracefully.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Only sign out if it's a confirmed 401 AND the user truly has no session.
    if (error.response && error.response.status === 401) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Genuinely not logged in — clean up and redirect
        localStorage.removeItem("userName");
        window.location.href = "/login";
      }
      // If session exists, the 401 was a backend/token issue — don't logout,
      // just let the error propagate so the UI can show a message.
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
