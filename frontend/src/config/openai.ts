// Configuración de OpenAI
// Para usar esta aplicación, necesitas:
// 1. Crear un archivo .env en la raíz del proyecto frontend
// 2. Agregar: VITE_OPENAI_API_KEY=tu_api_key_aqui
// 3. Obtener tu API key desde: https://platform.openai.com/api-keys

export const OPENAI_CONFIG = {
  // La API key se obtiene de las variables de entorno
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  
  // Configuración del modelo
  model: 'gpt-4o',
  maxTokens: 500,
  temperature: 0.7,
  
  // Mensaje del sistema para el tutor
  systemMessage: `Eres TutorIA, un tutor de programación amigable y paciente. 
  Tu objetivo es ayudar a los estudiantes a aprender programación de manera clara y comprensible.
  Responde de forma conversacional y amigable, como si estuvieras hablando directamente con el estudiante.
  Si no entiendes algo, pide aclaraciones de manera amable.`
};

// Función para verificar si la API key está configurada
export const isOpenAIConfigured = (): boolean => {
  console.log('🔍 Verificando configuración de OpenAI...');
  console.log('🔍 API Key encontrada:', !!OPENAI_CONFIG.apiKey);
  console.log('🔍 API Key valor:', OPENAI_CONFIG.apiKey ? `${OPENAI_CONFIG.apiKey.substring(0, 10)}...` : 'undefined');
  console.log('🔍 Variables de entorno:', import.meta.env);
  
  return !!OPENAI_CONFIG.apiKey && OPENAI_CONFIG.apiKey !== 'tu_api_key_aqui';
};
