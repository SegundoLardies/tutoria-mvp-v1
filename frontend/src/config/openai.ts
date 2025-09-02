// Configuración de AI (OpenAI y Groq)
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
  
  // Mensaje del sistema para el tutor
  systemMessage: `Eres TutorIA, un tutor de programación amigable y paciente. 
  Tu objetivo es ayudar a los estudiantes a aprender programación de manera clara y comprensible.
  Responde de forma conversacional y amigable, como si estuvieras hablando directamente con el estudiante.
  Mantén tus respuestas concisas pero informativas. Si no entiendes algo, pide aclaraciones de manera amable.`
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
