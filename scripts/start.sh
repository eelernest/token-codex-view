#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/../local-server"
echo "[token-codex] Starting local server..."
node src/index.js &
sleep 3
echo "[token-codex] Opening browser..."
open https://token-codex.vercel.app 2>/dev/null || xdg-open https://token-codex.vercel.app
