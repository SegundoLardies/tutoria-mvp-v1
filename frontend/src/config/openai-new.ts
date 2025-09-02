// Configuración de AI (OpenAI y Groq) con herramientas de dibujo
// Para usar esta aplicación, puedes usar:
// OPCIÓN 1 - Groq (GRATUITO):
// 1. Crear un archivo .env en la raíz del proyecto frontend
// 2. Agregar: VITE_GROQ_API_KEY=tu_groq_api_key_aqui
// 3. Obtener tu API key gratuita desde: https://console.groq.com/
//
// OPCIÓN 2 - OpenAI (PAGO):
// 1. Crear un archivo .env en la raíz del proyecto frontend
// 2. Agregar: VITE_OPENAI_API_KEY=tu_openai_api_key_aqui
// 3. Obtener tu API key desde: https://platform.openai.com/api-keys

export type AIProvider = 'groq' | 'openai';

export const AI_CONFIG = {
  // Configuración de Groq (GRATUITO)
  groq: {
    apiKey: import.meta.env.VITE_GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
    model: 'llama-3.1-8b-instant',
    maxTokens: 500,
    temperature: 0.7,
  },
  
  // Configuración de OpenAI (PAGO)
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4o',
    maxTokens: 500,
    temperature: 0.7,
  },
  
  // Herramientas disponibles para el tutor
  tools: [
    {
      type: "function",
      function: {
        name: "writeText",
        description: "Escribe un texto en el pizarrón en una coordenada específica.",
        parameters: {
          type: "object",
          properties: {
            text: {
              type: "string",
              description: "El texto a escribir."
            },
            x: { type: "number", description: "Coordenada X." },
            y: { type: "number", description: "Coordenada Y." },
            size: { type: "number", description: "Tamaño de la fuente, ej: 24." }
          },
          required: ["text", "x", "y"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "drawCircle",
        description: "Dibuja un círculo en el pizarrón.",
        parameters: {
          type: "object",
          properties: {
            x: { type: "number", description: "Coordenada X del centro." },
            y: { type: "number", description: "Coordenada Y del centro." },
            radius: { type: "number", description: "Radio del círculo." },
            color: { type: "string", description: "Color del borde, ej: '#FFFFFF'." }
          },
          required: ["x", "y", "radius"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "clearCanvas",
        description: "Borra todo el contenido del pizarrón.",
        parameters: {
          type: "object",
          properties: {}
        }
      }
    }
  ],
  
  // Mensaje del sistema para el tutor
  systemMessage: `Eres TutorIA, un tutor de programación amigable y paciente. 
  Tu objetivo es ayudar a los estudiantes a aprender programación de manera clara y comprensible.
  Responde de forma conversacional y amigable, como si estuvieras hablando directamente con el estudiante.
  Mantén tus respuestas concisas pero informativas. Si no entiendes algo, pide aclaraciones de manera amable.
  
  IMPORTANTE: Tienes acceso a herramientas de dibujo para crear diagramas y explicaciones visuales:
  - writeText: Para escribir texto en el pizarrón
  - drawCircle: Para dibujar círculos (útil para diagramas de flujo, nodos, etc.)
  - clearCanvas: Para limpiar el pizarrón
  
  Cuando sea apropiado, usa estas herramientas para crear diagramas, explicar conceptos visualmente,
  o dibujar ejemplos de código. Por ejemplo:
  - Para explicar un bucle, dibuja un diagrama de flujo
  - Para mostrar la estructura de datos, dibuja nodos conectados
  - Para explicar un algoritmo, usa texto y formas para ilustrar los pasos
  
  Siempre que uses una herramienta, explica qué estás dibujando y por qué es útil para la explicación.`
};

// Configuración legacy para compatibilidad
export const OPENAI_CONFIG = AI_CONFIG.openai;

// Función para obtener el proveedor preferido
export const getPreferredProvider = (): AIProvider => {
  // Preferir Groq si está configurado (es gratuito)
  if (AI_CONFIG.groq.apiKey && AI_CONFIG.groq.apiKey !== 'tu_groq_api_key_aqui') {
    return 'groq';
  }
  
  // Fallback a OpenAI si está configurado
  if (AI_CONFIG.openai.apiKey && AI_CONFIG.openai.apiKey !== 'tu_openai_api_key_aqui') {
    return 'openai';
  }
  
  // Por defecto, usar Groq (el usuario puede configurar la API key después)
  return 'groq';
};

// Función para obtener la configuración actual
export const getCurrentConfig = () => {
  const provider = getPreferredProvider();
  return {
    provider,
    config: AI_CONFIG[provider],
    tools: AI_CONFIG.tools,
    systemMessage: AI_CONFIG.systemMessage,
  };
};

// Función para verificar si hay alguna API key configurada
export const isAIConfigured = (): boolean => {
  const groqConfigured = !!AI_CONFIG.groq.apiKey && AI_CONFIG.groq.apiKey !== 'tu_groq_api_key_aqui';
  const openaiConfigured = !!AI_CONFIG.openai.apiKey && AI_CONFIG.openai.apiKey !== 'tu_openai_api_key_aqui';
  
  console.log('🔍 Verificando configuración de AI...');
  console.log('🔍 Groq configurado:', groqConfigured);
  console.log('🔍 OpenAI configurado:', openaiConfigured);
  console.log('🔍 Proveedor preferido:', getPreferredProvider());
  
  return groqConfigured || openaiConfigured;
};

// Función legacy para compatibilidad
export const isOpenAIConfigured = (): boolean => {
  return !!AI_CONFIG.openai.apiKey && AI_CONFIG.openai.apiKey !== 'tu_openai_api_key_aqui';
};
