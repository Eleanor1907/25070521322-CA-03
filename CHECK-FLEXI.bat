@echo off
title FLEXI check
cd /d "%~dp0server"
echo Checking FLEXI. This takes about 30 seconds...
echo.
node diagnose.js
echo.
echo Finished. The results are saved in diagnostics.txt in the FLEXI folder.
echo You can close this window.
pause
