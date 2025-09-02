#!/usr/bin/env python3
"""
Servidor FastAPI simple para probar WebSocket
"""
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Crear app
app = FastAPI(title="Test FastAPI")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Test FastAPI funcionando"}

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    logger.info(f"🔌 WebSocket conectando para sesión: {session_id}")
    await websocket.accept()
    logger.info(f"✅ WebSocket conectado para sesión: {session_id}")
    
    try:
        while True:
            data = await websocket.receive_text()
            logger.info(f"📨 Mensaje recibido: {data}")
            await websocket.send_text(f"Echo: {data}")
    except Exception as e:
        logger.error(f"❌ Error en WebSocket: {e}")
        logger.info(f"🔌 WebSocket desconectado para sesión: {session_id}")

if __name__ == "__main__":
    import uvicorn
    logger.info("🚀 Iniciando servidor FastAPI simple...")
    uvicorn.run(app, host="127.0.0.1", port=8003, log_level="info")
