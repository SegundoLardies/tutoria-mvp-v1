# TutorIA - Chat de Voz

Una aplicación de chat de voz que utiliza VAD (Voice Activity Detection) y OpenAI para crear un tutor de programación conversacional.

## 🚀 Configuración

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar OpenAI API Key

1. Ve a [OpenAI Platform](https://platform.openai.com/api-keys)
2. Crea una nueva API key
3. Crea un archivo `.env` en la raíz del proyecto frontend
4. Agrega tu API key:
```
VITE_OPENAI_API_KEY=tu_api_key_aqui
```

### 3. Ejecutar la aplicación
```bash
npm run dev
```

## 🎯 Funcionalidades

- **Detección de Voz (VAD)**: Detecta automáticamente cuando estás hablando
- **Grabación de Audio**: Graba tu voz cuando hablas
- **Integración con OpenAI**: Envía tu audio a GPT-4 para obtener respuestas
- **Chat Conversacional**: Mantiene el contexto de la conversación

## 🎮 Cómo usar

1. **Conectar OpenAI**: Haz clic en "🔌 Conectar OpenAI"
2. **Iniciar Chat**: Haz clic en "🚀 Iniciar Chat"
3. **Hablar**: Habla cuando veas el círculo verde
4. **Esperar Respuesta**: El tutor responderá automáticamente

## 🔧 Tecnologías

- **React + TypeScript**: Frontend framework
- **Vite**: Build tool
- **@ricky0123/vad-web**: Voice Activity Detection
- **OpenAI SDK**: Integración con GPT-4
- **Web Audio API**: Grabación y procesamiento de audio

## 📁 Estructura del proyecto

```
frontend/
├── src/
│   ├── hooks/
│   │   ├── useVAD.ts          # Hook para detección de voz
│   │   ├── useOpenAI.ts       # Hook para integración con OpenAI
│   │   └── useVoiceChat.ts    # Hook principal que combina VAD + OpenAI
│   ├── config/
│   │   └── openai.ts          # Configuración de OpenAI
│   └── App.tsx                # Componente principal
└── .env                       # Variables de entorno (crear manualmente)
```

## 🐛 Solución de problemas

### Error: "VITE_OPENAI_API_KEY no está configurada"
- Asegúrate de crear el archivo `.env` en la raíz del proyecto
- Verifica que la API key sea válida
- Reinicia el servidor de desarrollo

### El VAD no detecta voz
- Verifica que el micrófono esté funcionando
- Acepta los permisos del navegador
- Prueba en un entorno más silencioso

### No se reciben respuestas de OpenAI
- Verifica tu API key
- Asegúrate de tener créditos en tu cuenta de OpenAI
- Revisa la consola del navegador para errores