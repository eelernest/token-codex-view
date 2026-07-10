@echo off
cd /d "%~dp0..\local-server"
echo [token-codex] Starting local server...
start /B node src/index.js
timeout /t 3 /nobreak >nul
echo [token-codex] Opening browser...
start https://token-codex.vercel.app
