@echo off
echo ========================================
echo    Iniciando Proyecto TutorIA
echo ========================================
echo.

echo Iniciando Backend (WebSocket)...
start "Backend WebSocket" cmd /k "cd /d "%~dp0backend" && python websocket_server.py"

echo Esperando 3 segundos para que el backend se inicie...
timeout /t 3 /nobreak > nul

echo Iniciando Frontend...
start "Frontend React" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ========================================
echo    Servicios iniciados!
echo ========================================
echo.
echo Backend WebSocket: ws://127.0.0.1:8004
echo Frontend: http://localhost:5173
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause > nul
