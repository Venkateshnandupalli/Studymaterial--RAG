@echo off
echo Starting RAG backend...
cd /d "%~dp0rag_app\backend"
call "%~dp0.venv\Scripts\activate.bat"
"%~dp0.venv\Scripts\uvicorn.exe" main:app --reload
pause
