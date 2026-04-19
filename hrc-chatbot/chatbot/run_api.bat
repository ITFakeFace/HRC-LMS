@echo off
title Server Chatbot API (FastAPI + Ollama)
cd /d "%~dp0"
echo --- KHOI DONG HE THONG ---

:: 1. Kiem tra venv
if not exist venv (
    color 0C
    echo [LOI] Khong tim thay thu muc 'venv'.
    echo Vui long chay file 'install.bat' truoc.
    pause
    exit
)

:: 2. Kích hoạt venv
call venv\Scripts\activate

:: --- CẤU HÌNH ---
set APP_FILE=api_chatbot2

:: 3. Khoi dong Ollama Serve (Chay song song)
echo [BUOC 1] Dang bat Ollama Server trong cua so moi...
:: Lenh start se mo mot cua so CMD rieng de chay ollama serve
start "Ollama Core Service" cmd /k "ollama serve"

:: Doi 3 giay de Ollama kip khoi dong
timeout /t 3 /nobreak >nul

:: 4. Chay Server Python
echo.
echo [BUOC 2] Dang chay server Python (FastAPI)...
echo Truy cap Swagger UI tai: http://127.0.0.1:8000/docs
echo.
echo ---------------------------------------------------
echo * Luu y: Ban se thay 2 cua so CMD (1 cai chay Ollama, 1 cai chay Python)
echo * Dung tat cua so Ollama, neu khong AI se khong tra loi duoc.
echo ---------------------------------------------------

uvicorn %APP_FILE%:app --reload

pause