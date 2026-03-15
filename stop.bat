@echo off
echo Stopping 4uPDF servers...
taskkill /FI "WINDOWTITLE eq 4uPDF*" /F >nul 2>&1
echo Done.
