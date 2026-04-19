@echo off
title Cai dat moi truong (FastAPI + Ollama + MySQL)
cd /d "%~dp0"
color 0A

echo ==========================================
echo       BAT DAU THIET LAP MOI TRUONG
echo ==========================================

:: 1. Kiem tra Python co ton tai khong
python --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [LOI] Khong tim thay Python! Vui long cai dat Python va them vao PATH.
    pause
    exit
)

:: 2. Kiem tra venv
if exist venv goto :VenvDaCo

:TaoVenv
echo [BUOC 1] Dang tao moi truong ao (venv)...
python -m venv venv
if %errorlevel% neq 0 (
    color 0C
    echo [LOI] Khong the tao venv. Kiem tra lai phien ban Python.
    pause
    exit
)
goto :KichHoat

:VenvDaCo
echo [BUOC 1] Moi truong ao da ton tai. Bo qua tao moi.

:KichHoat
:: 3. Kich hoat venv
echo [BUOC 2] Dang kich hoat venv...
call venv\Scripts\activate

:: 4. Cap nhat pip
echo [BUOC 3] Dang cap nhat pip...
python -m pip install --upgrade pip

:: 5. Cai dat thu vien Python
echo [BUOC 4] Dang cai dat thu vien Python...
echo          - FastAPI, Uvicorn
echo          - Ollama (Library), MySQL Connector
echo          - Tzdata, Python-multipart
echo.

pip install fastapi uvicorn ollama tzdata python-multipart requests mysql-connector-python

if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [LOI] Qua trinh cai dat thu vien Python that bai!
    pause
    exit
)

:: 6. Pull Model Ollama (MOI THEM)
echo.
echo [BUOC 5] Kiem tra va tai Model Llama 3.2...

:: Kiem tra xem app Ollama da cai tren Windows chua
ollama --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0E
    echo [CANH BAO] Ban chua cai dat phan mem Ollama tren may tinh!
    echo Vui long tai tai: https://ollama.com/download
    echo Sau do chay lai lenh: ollama pull llama3.2:latest
    echo.
    echo (Bo qua buoc tai model va tiep tuc...)
) else (
    echo Dang tai model 'llama3.2:latest'... (Vui long cho)
    ollama pull llama3.2:latest
    
    if %errorlevel% neq 0 (
        echo [LOI] Khong the tai model. Hay dam bao App Ollama dang chay.
    ) else (
        echo [OK] Da tai xong model Llama 3.2!
    )
)

echo.
echo ==========================================
echo        CAI DAT HOAN TAT THANH CONG
echo ==========================================
echo De chay server, hay dung file run.bat hoac go: uvicorn main:app --reload
echo.
pause