#!/usr/bin/env python3
"""
Servidor simple que combina HTTP y WebSocket para TutorIA
"""
import asyncio
import websockets
import json
import logging
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading
import os

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Almacenar conexiones WebSocket activas
active_connections = {}

class SimpleHTTPHandler(BaseHTTPRequestHandler):
    """Manejador HTTP simple"""
    
    def do_GET(self):
        """Manejar peticiones GET"""
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            html = """
            <!DOCTYPE html>
            <html>
            <head>
                <title>TutorIA - Servidor Simple</title>
                <meta charset="utf-8">
            </head>
            <body>
                <h1>🚀 TutorIA - Servidor Simple</h1>
                <p>✅ Backend funcionando correctamente</p>
                <p>🔌 WebSocket: ws://127.0.0.1:8001/ws/</p>
                <p>📱 Frontend: <a href="http://localhost:5173">http://localhost:5173</a></p>
                <hr>
                <h2>Estado de Conexiones WebSocket:</h2>
                <div id="connections"></div>
                <script>
                    // Mostrar conexiones activas
                    function updateConnections() {
                        fetch('/api/connections')
                            .then(response => response.json())
                            .then(data => {
                                document.getElementById('connections').innerHTML = 
                                    '<p>🔌 Conexiones activas: ' + data.count + '</p>';
                            });
                    }
                    updateConnections();
                    setInterval(updateConnections, 5000);
                </script>
            </body>
            </html>
            """
            self.wfile.write(html.encode())
            
        elif self.path == '/api/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = {"status": "ok", "timestamp": datetime.now().isoformat()}
            self.wfile.write(json.dumps(response).encode())
            
        elif self.path == '/api/connections':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = {"count": len(active_connections), "connections": list(active_connections.keys())}
            self.wfile.write(json.dumps(response).encode())
            
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'Not Found')
    
    def log_message(self, format, *args):
        """Log de mensajes HTTP"""
        logger.info(f"HTTP: {format % args}")

async def handle_websocket(websocket, path):
    """Manejar conexión WebSocket"""
    session_id = path.split('/')[-1] if path.startswith('/ws/') else 'default'
    logger.info(f"🔌 Cliente conectando para sesión: {session_id}")
    
    # Aceptar conexión
    await websocket.accept()
    active_connections[session_id] = websocket
    logger.info(f"✅ WebSocket conectado para sesión: {session_id}")
    
    try:
        # Enviar mensaje de confirmación
        await websocket.send(json.dumps({
            "type": "connection",
            "status": "connected",
            "session_id": session_id,
            "timestamp": datetime.now().isoformat()
        }))
        
        # Mantener conexión activa
        async for message in websocket:
            try:
                data = json.loads(message)
                logger.info(f"📨 Mensaje recibido de {session_id}: {data}")
                
                # Echo del mensaje
                response = {
                    "type": "echo",
                    "data": data,
                    "session_id": session_id,
                    "timestamp": datetime.now().isoformat()
                }
                await websocket.send(json.dumps(response))
                
            except json.JSONDecodeError:
                logger.warning(f"⚠️ Mensaje no válido de {session_id}: {message}")
                # Enviar mensaje de error
                await websocket.send(json.dumps({
                    "type": "error",
                    "message": "Mensaje no válido",
                    "session_id": session_id,
                    "timestamp": datetime.now().isoformat()
                }))
                
    except websockets.exceptions.ConnectionClosed:
        logger.info(f"🔌 Conexión cerrada para sesión: {session_id}")
    except Exception as e:
        logger.error(f"❌ Error en WebSocket para sesión {session_id}: {e}")
    finally:
        # Limpiar conexión
        if session_id in active_connections:
            del active_connections[session_id]
        logger.info(f"🔌 WebSocket desconectado para sesión: {session_id}")

async def websocket_server():
    """Servidor WebSocket"""
    logger.info("🔌 Iniciando servidor WebSocket...")
    server = await websockets.serve(
        handle_websocket,
        "127.0.0.1",
        8001,
        ping_interval=20,
        ping_timeout=10
    )
    logger.info("✅ Servidor WebSocket iniciado en ws://127.0.0.1:8001")
    await server.wait_closed()

def http_server():
    """Servidor HTTP"""
    logger.info("🌐 Iniciando servidor HTTP...")
    server = HTTPServer(('127.0.0.1', 8002), SimpleHTTPHandler)
    logger.info("✅ Servidor HTTP iniciado en http://127.0.0.1:8002")
    server.serve_forever()

async def main():
    """Función principal"""
    logger.info("🚀 Iniciando servidor TutorIA simple...")
    
    # Iniciar servidor HTTP en un hilo separado
    http_thread = threading.Thread(target=http_server, daemon=True)
    http_thread.start()
    
    # Iniciar servidor WebSocket
    await websocket_server()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("🛑 Servidor detenido por el usuario")
    except Exception as e:
        logger.error(f"❌ Error en servidor: {e}")
        raise
