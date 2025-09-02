#!/usr/bin/env python3
"""
Script simple para ejecutar el servidor backend con mejor logging
"""
import uvicorn
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    logger.info("🚀 Iniciando servidor backend...")
    try:
        uvicorn.run(
            "main:app",
            host="127.0.0.1",
            port=8001,
            reload=True,
            log_level="info"
        )
    except Exception as e:
        logger.error(f"❌ Error iniciando servidor: {e}")
        raise
