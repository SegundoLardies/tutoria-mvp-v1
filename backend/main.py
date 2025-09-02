from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Crear la instancia de FastAPI
app = FastAPI(title="Tutoria MVP", description="API básica para el MVP de tutoria")

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

@app.get("/api/v1/session/initiate")
async def initiate_session():
    """Endpoint para iniciar una sesión y obtener la API key de OpenAI"""
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        return {"error": "API key no configurada en el servidor"}, 500
    return {"api_key": openai_api_key}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)