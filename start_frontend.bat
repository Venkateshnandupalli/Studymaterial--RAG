@echo off
echo Starting RAG frontend...
cd /d "%~dp0rag_app\frontend"
npm run dev
pause
