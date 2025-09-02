🎓 TutorIA - Tutor de Programación por Voz con IA
Una aplicación de chat de voz que utiliza Web Speech API y AI (Groq/OpenAI) para crear un tutor de programación conversacional completamente gratuito.
✨ Características Principales
TutorIA ofrece una experiencia interactiva y accesible para aprender programación gracias a sus funcionalidades clave:
• 🎤 Speech-to-Text: Reconocimiento de voz nativo del navegador, lo que lo hace GRATUITO.
• 🔊 Text-to-Speech: Síntesis de voz nativa del navegador, también GRATUITA.
• 🤖 IA Conversacional: Integrado con la API gratuita de Groq, utilizando modelos Llama 3.1, con OpenAI como alternativa.
• 💬 Chat por Voz: Permite una interacción natural y hablada, facilitando el aprendizaje.
• 🎨 Interfaz Visual: Incluye indicadores de estado en tiempo real para una mejor experiencia de usuario.
🚀 Inicio Rápido
Para poner en marcha TutorIA en tu entorno local, sigue estos sencillos pasos:
1. Clonar el repositorio:
3. Configurar el Backend:
5. Configurar el Frontend:
7. Usar la Aplicación:
    1. Abrí tu navegador y andá a http://localhost:5173.
    2. Hacé clic en "🔌 Conectar AI".
    3. Hacé clic en "🎤 Hablar".
    4. Hacé tu pregunta de programación al tutor.
    5. Escuchá la respuesta que te brinda el tutor.
📋 Configuración de API Keys
Es crucial seguir las instrucciones detalladas en el archivo GROQ_SETUP.md dentro del repositorio para obtener y configurar tu API key gratuita de Groq.
🏗️ Arquitectura del Proyecto
El proyecto tutoria-mvp-v1 se estructura de la siguiente manera:
tutoria-mvp-v1/
├── backend/                  # Backend con FastAPI
│   ├── main.py               # Servidor API principal
│   └── .env                  # Variables de entorno para el backend
├── frontend/                 # Frontend con React + TypeScript
│   ├── src/
│   │   ├── hooks/            # Hooks personalizados
│   │   ├── config/           # Archivos de configuración
│   │   └── types/            # Definiciones de tipos TypeScript
│   └── .env                  # Variables de entorno para el frontend
└── GROQ_SETUP.md             # Guía de configuración para Groq
🔧 Tecnologías Utilizadas
TutorIA está construida con un stack moderno y eficiente:
• Frontend: React, TypeScript, Vite, Web Speech API.
• Backend: FastAPI, Python, uvicorn.
• Inteligencia Artificial: Groq API (con Llama 3.1) y OpenAI (como fallback).
• Audio: Web Speech API nativa del navegador.
Las tecnologías predominantes en el proyecto incluyen: TypeScript (86.2%), Python (6.5%), JavaScript (4.6%), CSS (2.2%) y HTML (0.5%).
📊 Límites de Uso (Groq Gratuito)
Es importante tener en cuenta los límites del servicio gratuito de Groq para evitar interrupciones:
• 30 requests/minuto.
• 14,400 requests/día.
• 6,000 tokens/minuto.
• 2,880,000 tokens/día.
🤝 Contribuir al Proyecto
¡Tus contribuciones son bienvenidas! Para colaborar con TutorIA, seguí estos pasos:
1. Hacé un "Fork" del proyecto.
2. Creá una rama para tu nueva funcionalidad (por ejemplo, git checkout -b feature/nueva-funcionalidad).
3. Hacé "Commit" de tus cambios (por ejemplo, git commit -am 'Agregar nueva funcionalidad').
4. Hacé "Push" a tu rama (por ejemplo, git push origin feature/nueva-funcionalidad).
5. Abrí un "Pull Request".
📄 Licencia
Este proyecto está bajo la Licencia MIT. Para más detalles, por favor, consulta el archivo LICENSE