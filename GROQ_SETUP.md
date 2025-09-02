# 🚀 Configuración de Groq (GRATUITO)

## Paso 1: Crear cuenta en Groq

1. Ve a [https://console.groq.com/](https://console.groq.com/)
2. Haz clic en "Sign Up" o "Get Started"
3. Crea una cuenta gratuita con tu email

## Paso 2: Obtener API Key

1. Una vez logueado, ve a la sección "API Keys"
2. Haz clic en "Create API Key"
3. Dale un nombre a tu API key (ej: "TutorIA")
4. Copia la API key generada

## Paso 3: Configurar en el Backend

1. Ve a la carpeta `backend/`
2. Copia el archivo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```
3. Edita el archivo `.env` y reemplaza:
   ```
   GROQ_API_KEY=tu_groq_api_key_aqui
   ```
   Con tu API key real de Groq

## Paso 4: Configurar en el Frontend (Opcional)

Si quieres usar Groq directamente desde el frontend:

1. Ve a la carpeta `frontend/`
2. Copia el archivo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```
3. Edita el archivo `.env` y reemplaza:
   ```
   VITE_GROQ_API_KEY=tu_groq_api_key_aqui
   ```

## Paso 5: Probar la configuración

1. Inicia el backend:
   ```bash
   cd backend
   python main.py
   ```

2. Inicia el frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Ve a http://localhost:5173
4. Haz clic en "🔌 Conectar AI"
5. Si todo está bien configurado, verás "✅ Conectado"

## 🎉 ¡Listo!

Ahora puedes usar TutorIA completamente gratis con:
- ✅ Groq API (IA gratuita)
- ✅ Web Speech API (STT/TTS gratuito)
- ✅ Sin límites de uso (según los límites de Groq)

## 📊 Límites de Groq (Gratuitos)

- **Requests por minuto**: 30
- **Requests por día**: 14,400
- **Tokens por minuto**: 6,000
- **Tokens por día**: 2,880,000

¡Más que suficiente para uso personal y desarrollo!
