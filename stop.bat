@echo off
echo Stopping PDF Splitter servers...
taskkill /FI "WINDOWTITLE eq PDF-Split*" /F >nul 2>&1
echo Done.
