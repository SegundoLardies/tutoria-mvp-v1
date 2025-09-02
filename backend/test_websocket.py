#!/usr/bin/env python3
"""
Script de prueba para verificar WebSocket
"""
import asyncio
import websockets
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_websocket():
    """Prueba básica de WebSocket"""
    try:
        logger.info("🧪 Probando WebSocket...")
        
        # Crear un servidor WebSocket simple
        async def echo(websocket, path):
            logger.info("🔌 Cliente conectado")
            try:
                async for message in websocket:
                    logger.info(f"📨 Mensaje recibido: {message}")
                    await websocket.send(f"Echo: {message}")
            except websockets.exceptions.ConnectionClosed:
                logger.info("🔌 Cliente desconectado")
        
        # Iniciar servidor
        server = await websockets.serve(echo, "127.0.0.1", 8002)
        logger.info("✅ Servidor WebSocket iniciado en puerto 8002")
        
        # Mantener el servidor ejecutándose
        await asyncio.Future()  # Ejecutar indefinidamente
        
    except Exception as e:
        logger.error(f"❌ Error en prueba WebSocket: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(test_websocket())
