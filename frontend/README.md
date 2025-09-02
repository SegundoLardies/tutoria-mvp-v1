# TutorIA - Chat de Voz con IA

Una aplicación de chat de voz que utiliza Web Speech API y AI (Groq/OpenAI) para crear un tutor de programación conversacional completamente gratuito.

## 🚀 Configuración

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar API Key (GRATUITO con Groq)

**OPCIÓN 1: Groq (GRATUITO - Recomendado)**
1. Ve a [Groq Console](https://console.groq.com/)
2. Crea una cuenta gratuita
3. Genera una API key gratuita
4. Crea un archivo `.env` en la raíz del proyecto frontend
5. Agrega tu API key:
```
VITE_GROQ_API_KEY=tu_groq_api_key_aqui
```

**OPCIÓN 2: OpenAI (PAGO - Alternativa)**
1. Ve a [OpenAI Platform](https://platform.openai.com/api-keys)
2. Crea una nueva API key
3. Agrega tu API key al archivo `.env`:
```
VITE_OPENAI_API_KEY=tu_openai_api_key_aqui
```

### 3. Ejecutar la aplicación
```bash
npm run dev
```

## 🎯 Funcionalidades

- **Speech-to-Text (STT)**: Convierte tu voz a texto usando Web Speech API (GRATUITO)
- **Text-to-Speech (TTS)**: Convierte las respuestas a voz usando Web Speech API (GRATUITO)
- **Integración con IA**: Usa Groq (gratuito) o OpenAI para respuestas inteligentes
- **Chat Conversacional**: Mantiene el contexto de la conversación
- **Interfaz Visual**: Indicadores de estado para escucha, procesamiento y respuesta

## 🎮 Cómo usar

1. **Conectar AI**: Haz clic en "🔌 Conectar AI"
2. **Hablar**: Haz clic en "🎤 Hablar" para activar el micrófono
3. **Hacer Pregunta**: Habla tu pregunta cuando veas el círculo verde
4. **Escuchar Respuesta**: El tutor responderá automáticamente (círculo azul)

## 🔧 Tecnologías

- **React + TypeScript**: Frontend framework
- **Vite**: Build tool
- **Web Speech API**: Speech-to-Text y Text-to-Speech nativos del navegador
- **Groq API**: IA gratuita con modelos Llama 3.1
- **OpenAI SDK**: Alternativa de pago con GPT-4

## 📁 Estructura del proyecto

```
frontend/
├── src/
│   ├── hooks/
│   │   ├── useAIChat.ts       # Hook principal unificado (STT + TTS + AI)
│   │   ├── useVAD.ts          # Hook para detección de voz (legacy)
│   │   └── useOpenAI.ts       # Hook para OpenAI (legacy)
│   ├── config/
│   │   └── openai.ts          # Configuración de AI (Groq + OpenAI)
│   ├── types/
│   │   └── webSpeech.d.ts     # Tipos para Web Speech API
│   └── App.tsx                # Componente principal
└── .env                       # Variables de entorno (crear manualmente)
```

## 🐛 Solución de problemas

### Error: "VITE_GROQ_API_KEY no está configurada"
- Asegúrate de crear el archivo `.env` en la raíz del proyecto
- Obtén una API key gratuita en [Groq Console](https://console.groq.com/)
- Reinicia el servidor de desarrollo

### El micrófono no funciona
- Acepta los permisos del navegador para el micrófono
- Verifica que el micrófono esté funcionando en otras aplicaciones
- Usa HTTPS o localhost (requerido por Web Speech API)

### No se reciben respuestas de IA
- Verifica tu API key de Groq o OpenAI
- Revisa la consola del navegador para errores
- Asegúrate de tener conexión a internet

### La síntesis de voz no funciona
- Verifica que el navegador soporte Web Speech API
- Prueba en Chrome o Edge (mejor compatibilidad)
- Ajusta el volumen del sistema