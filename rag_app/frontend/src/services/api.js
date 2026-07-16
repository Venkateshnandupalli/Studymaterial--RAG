import axios from "axios";

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({ baseURL: BASE_URL });

// Inject JWT token into every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Automatically logout user if token expires (401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("userName");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);


// ── Auth ──────────────────────────────────────────────────────────────────────
export const register = (data) => api.post("/auth/register", data);
export const login = (data) => api.post("/auth/login", data);

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

