from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import os
import json
from typing import Dict
from dotenv import load_dotenv
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cargar variables de entorno
load_dotenv()

# Crear la instancia de FastAPI
app = FastAPI(title="Tutoria MVP", description="API básica para el MVP de tutoria")

# Gestor de conexiones WebSocket
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        self.active_connections[session_id] = websocket
        logger.info(f"🔌 WebSocket conectado para sesión: {session_id}")
    
    def disconnect(self, session_id: str):
        if session_id in self.active_connections:
            del self.active_connections[session_id]
            logger.info(f"🔌 WebSocket desconectado para sesión: {session_id}")
    
    async def send_personal_message(self, message: dict, session_id: str):
        if session_id in self.active_connections:
            websocket = self.active_connections[session_id]
            try:
                await websocket.send_text(json.dumps(message))
                logger.info(f"📤 Mensaje enviado a sesión {session_id}: {message}")
            except Exception as e:
                logger.error(f"❌ Error enviando mensaje a {session_id}: {e}")
                self.disconnect(session_id)

manager = ConnectionManager()

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, restringe esto a tu dominio frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Endpoint raíz que devuelve un mensaje de bienvenida"""
    return {"message": "Hola Mundo"}

@app.get("/api/health")
async def health_check():
    """Endpoint de health check que devuelve el estado de la API"""
    return {"status": "ok"}

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """Endpoint WebSocket para comunicación en tiempo real"""
    logger.info(f"🔌 WebSocket conectando para sesión: {session_id}")
    await manager.connect(websocket, session_id)
    try:
        while True:
            data = await websocket.receive_text()
            logger.info(f"📨 Mensaje recibido: {data}")
            # Echo del mensaje recibido (para pruebas)
            await manager.send_personal_message({"echo": data}, session_id)
    except WebSocketDisconnect:
        logger.info(f"🔌 WebSocket desconectado para sesión: {session_id}")
        manager.disconnect(session_id)
    except Exception as e:
        logger.error(f"❌ Error en WebSocket: {e}")
        manager.disconnect(session_id)

@app.post("/api/v1/webhook/openai")
async def openai_webhook(request_data: dict):
    """Webhook para recibir tool calls de OpenAI y enviarlos al frontend"""
    try:
        # Extraer session_id y tool_call del request
        session_id = request_data.get("session_id")
        tool_call = request_data.get("tool_call")
        
        if not session_id or not tool_call:
            return {"error": "session_id y tool_call son requeridos"}, 400
        
        # Enviar el comando de dibujo al frontend
        await manager.send_personal_message({
            "cmd": tool_call.get("function", {}).get("name"),
            "args": json.loads(tool_call.get("function", {}).get("arguments", "{}"))
        }, session_id)
        
        return {"status": "success"}
    except Exception as e:
        logger.error(f"❌ Error en webhook: {e}")
        return {"error": str(e)}, 500

@app.post("/api/v1/test/draw")
async def test_draw_command(request_data: dict):
    """Endpoint de prueba para simular comandos de dibujo de la IA"""
    try:
        session_id = request_data.get("session_id")
        command = request_data.get("command")
        args = request_data.get("args", {})
        
        if not session_id or not command:
            return {"error": "session_id y command son requeridos"}, 400
        
        # Enviar comando al frontend
        await manager.send_personal_message({
            "cmd": command,
            "args": args
        }, session_id)
        
        return {"status": "success", "message": f"Comando {command} enviado a sesión {session_id}"}
    except Exception as e:
        logger.error(f"❌ Error en test draw: {e}")
        return {"error": str(e)}, 500

@app.get("/api/v1/session/initiate")
async def initiate_session():
    """Endpoint para iniciar una sesión y obtener la API key (Groq o OpenAI)"""
    # Preferir Groq si está configurado (es gratuito)
    groq_api_key = os.getenv("GROQ_API_KEY")
    if groq_api_key:
        return {"api_key": groq_api_key, "provider": "groq"}
    
    # Fallback a OpenAI
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if openai_api_key:
        return {"api_key": openai_api_key, "provider": "openai"}
    
    return {"error": "Ninguna API key configurada en el servidor (GROQ_API_KEY o OPENAI_API_KEY)"}, 500

if __name__ == "__main__":
    import uvicorn
    logger.info("🚀 Iniciando servidor backend corregido...")
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
