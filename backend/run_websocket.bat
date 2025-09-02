@echo off
echo Iniciando servidor WebSocket...
cd /d "%~dp0"
python websocket_server.py
pause
