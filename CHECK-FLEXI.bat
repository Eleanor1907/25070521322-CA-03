@echo off
title Pine check
cd /d "%~dp0server"
echo Checking Pine. This takes about 30 seconds...
echo.
node diagnose.js
echo.
echo Finished. The results are saved in diagnostics.txt in this folder.
echo You can close this window.
pause
