import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy all /api requests to FastAPI during development
      "/auth": "http://localhost:8000",
      "/upload": "http://localhost:8000",
      "/ask": "http://localhost:8000",
      "/documents": "http://localhost:8000",
    },
  },
});
