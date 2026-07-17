import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy all backend routes to FastAPI during local development
      "/upload":    "http://localhost:8000",
      "/documents": "http://localhost:8000",
      "/ask":       "http://localhost:8000",
      "/auth":      "http://localhost:8000",
    },
  },
  build: {
    sourcemap: false,
  },
});
