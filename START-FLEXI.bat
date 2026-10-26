@echo off
setlocal
title Pine launcher
cd /d "%~dp0"

echo.
echo  Pine launcher
echo  ==============
echo.

rem ---------- 1. Node.js must be installed (20.19+ or 22.12+) ----------
where node >nul 2>nul
if errorlevel 1 goto :no_node
node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>=23||(a===22&&b>=12)||(a===20&&b>=19)?0:1)"
if errorlevel 1 goto :old_node

rem ---------- 2. Settings files (.env), created from the examples the first time ----------
rem The server copy gets a random JWT_SECRET so login tokens can't be forged.
if not exist "server\.env" node -e "const fs=require('fs');const t=fs.readFileSync('server/.env.example','utf8');fs.writeFileSync('server/.env',t.replace(/^JWT_SECRET=.*$/m,'JWT_SECRET='+require('crypto').randomBytes(24).toString('hex')))"
if not exist "client\.env" copy "client\.env.example" "client\.env" >nul
if not exist "server\.env" goto :env_failed

rem ---------- 3. Packages (the first time, and again when the client's packages change) ----------
if not exist "server\node_modules" (
  echo Installing server packages. This takes a minute the first time...
  pushd server
  call npm install
  popd
)
rem The client's font package changed (now Archivo), so older copies install once more.
if not exist "client\node_modules\@fontsource-variable\archivo\wdth.css" (
  echo Installing client packages. This takes a minute...
  pushd client
  call npm install
  popd
)
if not exist "server\node_modules" goto :install_failed
if not exist "client\node_modules\@fontsource-variable\archivo\wdth.css" goto :install_failed

rem ---------- 4. MongoDB must be running (only checked for a local database) ----------
findstr /c:"MONGODB_URI=mongodb://127.0.0.1" /c:"MONGODB_URI=mongodb://localhost" "server\.env" >nul
if errorlevel 1 goto :db_ok
node -e "const s=require('net').connect(27017,'127.0.0.1');s.on('connect',()=>process.exit(0));s.on('error',()=>process.exit(1));setTimeout(()=>process.exit(1),3000)"
if errorlevel 1 goto :no_mongo
:db_ok

rem ---------- 5. Demo data (the first time, and once more after an update) ----------
rem The seed never deletes data. Version 2 renames the old demo spaces in place
rem (same _id, so every booking keeps pointing to its space).
if not exist "server\.seeded-v2" (
  echo Adding or updating the demo spaces, bookings and accounts...
  pushd server
  call npm run seed
  if not errorlevel 1 echo seeded> .seeded-v2
  popd
)

rem ---------- 6. Start the API and the React app in two windows ----------
echo.
echo Starting the Pine API and the React app in two new windows.
echo Keep both windows open while you use Pine. Close them to stop it.
start "Pine server (API)" /D "%~dp0server" cmd /k npm run dev
start "Pine client (React)" /D "%~dp0client" cmd /k npm run dev

echo Opening http://localhost:5173 in your browser...
timeout /t 8 /nobreak >nul
start "" http://localhost:5173
echo.
echo Done. Demo logins: admin@flexi.com / Admin@123   and   riya@flexi.com / Member@123
echo.
pause
exit /b 0

:no_node
echo Node.js is not installed, or this window can't find it.
echo Install the LTS version from https://nodejs.org , restart your computer, then run this again.
echo.
pause
exit /b 1

:old_node
for /f %%v in ('node -v') do set NODEVER=%%v
echo Your Node.js is %NODEVER%. Pine needs Node.js 20.19 or newer, or 22.12 or newer.
echo Install the current LTS version from https://nodejs.org , then run this again.
echo.
pause
exit /b 1

:env_failed
echo Could not create server\.env. Copy server\.env.example to server\.env by hand, then run this again.
echo.
pause
exit /b 1

:install_failed
echo.
echo npm install did not finish. Check your internet connection and run this again.
echo If it keeps failing, copy the red error text above and ask for help.
echo.
pause
exit /b 1

:no_mongo
echo.
echo MongoDB is not running on this computer, so Pine has nowhere to save data.
echo.
echo   1. Download MongoDB Community Server: https://www.mongodb.com/try/download/community
echo      Version: current, Platform: Windows x64, Package: msi
echo   2. Run the installer, choose "Complete", keep "Install MongoD as a Service" ticked,
echo      and keep "Install MongoDB Compass" ticked.
echo   3. When it finishes, double-click START-FLEXI.bat again.
echo.
echo Already installed? Press Win+R, type services.msc, find "MongoDB Server" and click Start.
echo.
pause
exit /b 1
