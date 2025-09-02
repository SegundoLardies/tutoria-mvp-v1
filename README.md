# 🎓 TutorIA - Voice-Activated AI Programming Tutor

Una aplicación de chat de voz que utiliza Web Speech API y AI (Groq/OpenAI) para crear un tutor de programación conversacional **completamente gratuito**.

## ✨ Características

- 🎤 **Speech-to-Text**: Reconocimiento de voz nativo del navegador (GRATUITO)
- 🔊 **Text-to-Speech**: Síntesis de voz nativa del navegador (GRATUITO)
- 🤖 **IA Conversacional**: Groq API gratuita con modelos Llama 3.1
- 💬 **Chat por Voz**: Interacción natural hablada
- 🎨 **Interfaz Visual**: Indicadores de estado en tiempo real

## 🚀 Inicio Rápido

### 1. Clonar el repositorio
```bash
git clone <tu-repo-url>
cd tutoria-mvp-v1
```

### 2. Configurar Backend
```bash
cd backend
cp .env.example .env
# Editar .env y agregar tu GROQ_API_KEY (ver GROQ_SETUP.md)
pip install fastapi uvicorn python-dotenv
python main.py
```

### 3. Configurar Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Editar .env y agregar tu VITE_GROQ_API_KEY (opcional)
npm run dev
```

### 4. Usar la Aplicación
1. Ve a http://localhost:5173
2. Haz clic en "🔌 Conectar AI"
3. Haz clic en "🎤 Hablar"
4. Haz tu pregunta de programación
5. Escucha la respuesta del tutor

## 📋 Configuración de API Keys

Sigue las instrucciones detalladas en [GROQ_SETUP.md](GROQ_SETUP.md) para obtener una API key gratuita de Groq.

## 🏗️ Arquitectura

```
tutoria-mvp-v1/
├── backend/          # FastAPI backend
│   ├── main.py       # Servidor API
│   └── .env          # Variables de entorno
├── frontend/         # React + TypeScript frontend
│   ├── src/
│   │   ├── hooks/    # Custom hooks
│   │   ├── config/   # Configuración
│   │   └── types/    # Tipos TypeScript
│   └── .env          # Variables de entorno
└── GROQ_SETUP.md     # Guía de configuración
```

## 🔧 Tecnologías

- **Frontend**: React, TypeScript, Vite, Web Speech API
- **Backend**: FastAPI, Python, uvicorn
- **IA**: Groq API (Llama 3.1), OpenAI (fallback)
- **Audio**: Web Speech API nativa del navegador

## 📊 Límites Gratuitos (Groq)

- 30 requests/minuto
- 14,400 requests/día
- 6,000 tokens/minuto
- 2,880,000 tokens/día

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para más detalles.
