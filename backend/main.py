from fastapi import FastAPI

# Crear la instancia de FastAPI
app = FastAPI(title="Tutoria MVP", description="API básica para el MVP de tutoria")

@app.get("/")
async def root():
    """Endpoint raíz que devuelve un mensaje de bienvenida"""
    return {"message": "Hola Mundo"}

@app.get("/api/health")
async def health_check():
    """Endpoint de health check que devuelve el estado de la API"""
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)