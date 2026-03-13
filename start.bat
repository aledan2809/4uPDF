@echo off
title PDF Splitter
echo ============================================
echo   PDF Splitter - Starting...
echo ============================================
echo.

:: Kill any existing instances
taskkill /F /IM "python.exe" /FI "WINDOWTITLE eq PDF-Split*" >nul 2>&1

:: Check Python
where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python not found. Install Python 3.10+
    pause
    exit /b 1
)

:: Install Python dependencies if needed
echo [1/3] Checking Python dependencies...
pip show rapidocr-onnxruntime >nul 2>&1 || (
    echo Installing Python packages...
    pip install pymupdf rapidocr-onnxruntime fastapi uvicorn python-multipart numpy --quiet
)

:: Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js not found. Install Node.js 18+
    pause
    exit /b 1
)

:: Install Node dependencies if needed
if not exist "D:\Projects\PDF-split\web\node_modules\next" (
    echo Installing Node packages...
    cd /d "D:\Projects\PDF-split\web"
    npm install --silent
)

:: Create input/output folders
if not exist "D:\Projects\PDF-split\input" mkdir "D:\Projects\PDF-split\input"
if not exist "D:\Projects\PDF-split\output" mkdir "D:\Projects\PDF-split\output"

:: Start Python API (background)
echo [2/3] Starting Python API on port 3099...
cd /d "D:\Projects\PDF-split"
start "PDF-Split API" /min cmd /c "set PYTHONIOENCODING=utf-8 && python api.py"

:: Wait for API to be ready
timeout /t 3 /nobreak >nul

:: Start Next.js UI
echo [3/3] Starting Web UI on port 3098...
cd /d "D:\Projects\PDF-split\web"
start "PDF-Split UI" /min cmd /c "npm run dev"

:: Wait for UI to be ready
timeout /t 5 /nobreak >nul

echo.
echo ============================================
echo   PDF Splitter Ready!
echo   UI:  http://localhost:3098
echo   API: http://localhost:3099
echo ============================================
echo.
echo Opening browser...
start http://localhost:3098

echo.
echo Servers running in background. Close this window safely.
echo To stop servers, run: stop.bat
echo.
