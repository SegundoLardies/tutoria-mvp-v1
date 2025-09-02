@echo off
echo Iniciando Backend WebSocket...
cd /d "%~dp0backend"
python websocket_server.py
pause
