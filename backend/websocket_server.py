#!/usr/bin/env python3
"""
Servidor WebSocket simple para el frontend
"""
import asyncio
import websockets
import json
import logging
from datetime import datetime

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Almacenar conexiones activas
active_connections = {}

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

async def main():
    """Función principal"""
    logger.info("🚀 Iniciando servidor WebSocket simple...")
    
    # Crear servidor WebSocket
    server = await websockets.serve(
        handle_websocket,
        "127.0.0.1",
        8004,
        ping_interval=20,
        ping_timeout=10
    )
    
    logger.info("✅ Servidor WebSocket iniciado en ws://127.0.0.1:8004")
    logger.info("📡 Esperando conexiones...")
    
    # Mantener servidor ejecutándose
    await server.wait_closed()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("🛑 Servidor detenido por el usuario")
    except Exception as e:
        logger.error(f"❌ Error en servidor: {e}")
        raise
