import { useState, useRef, useCallback } from 'react';
import OpenAI from 'openai';
import { getCurrentConfig } from '../config/openai';

interface UseAIChatReturn {
  isConnected: boolean;
  isProcessing: boolean;
  error: string | null;
  response: string | null;
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  isSessionActive: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendText: (text: string) => Promise<void>;
  startSession: () => void;
  endSession: () => void;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
}

export const useAIChat = (sendMessage?: (message: any) => void): UseAIChatReturn => {
  // Estados principales
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  
  // Estados de Web Speech API
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  
  // Referencias
  const aiClientRef = useRef<OpenAI | null>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const isSessionActiveRef = useRef<boolean>(false);
  const conversationHistoryRef = useRef<Array<{role: 'user' | 'assistant', content: string}>>([]);
  
  // Sincronizar los refs con los estados
  isSessionActiveRef.current = isSessionActive;
  conversationHistoryRef.current = conversationHistory;

  // Conectar con AI (Groq o OpenAI)
  const connect = useCallback(async () => {
    try {
      setError(null);
      
      // Obtener configuración actual
      const { provider, config } = getCurrentConfig();
      
      // Primero intentamos obtener la API key del backend
      try {
        const response = await fetch('http://localhost:8000/api/v1/session/initiate');
        const data = await response.json();
        
        if (data.api_key && data.provider) {
          console.log(`✅ API key obtenida del backend para ${data.provider.toUpperCase()}`);
          
          const clientConfig = data.provider === 'groq' 
            ? {
                apiKey: data.api_key,
                baseURL: 'https://api.groq.com/openai/v1',
                dangerouslyAllowBrowser: true,
              }
            : {
                apiKey: data.api_key,
                dangerouslyAllowBrowser: true,
              };
          
          const aiClient = new OpenAI(clientConfig);
          aiClientRef.current = aiClient;
          setIsConnected(true);
          console.log(`✅ Conectado a ${data.provider.toUpperCase()} usando API key del backend`);
          return;
        }
      } catch (backendErr) {
        console.warn('No se pudo obtener la API key del backend, intentando con configuración local', backendErr);
      }
      
      // Si no hay backend, usar configuración local
      if (!config.apiKey) {
        const envVar = provider === 'groq' ? 'VITE_GROQ_API_KEY' : 'VITE_OPENAI_API_KEY';
        const url = provider === 'groq' ? 'https://console.groq.com/' : 'https://platform.openai.com/api-keys';
        
        throw new Error(`${envVar} no está configurada. Obtén una API key ${provider === 'groq' ? 'gratuita' : ''} en ${url}`);
      }
      
      const clientConfig = provider === 'groq' 
        ? {
            apiKey: config.apiKey,
            baseURL: config.baseURL,
            dangerouslyAllowBrowser: true,
          }
        : {
            apiKey: config.apiKey,
            dangerouslyAllowBrowser: true,
          };
      
      const aiClient = new OpenAI(clientConfig);
      aiClientRef.current = aiClient;
      setIsConnected(true);
      console.log(`✅ Conectado a ${provider.toUpperCase()} usando configuración local`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al conectar con AI';
      setError(errorMessage);
      console.error('Error al conectar con AI:', err);
    }
  }, []);

  // Desconectar
  const disconnect = useCallback(() => {
    aiClientRef.current = null;
    setIsConnected(false);
    setIsProcessing(false);
    setError(null);
    setResponse(null);
    setIsSessionActive(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    console.log('🔌 Desconectado de AI');
  }, []);

  // Enviar texto a AI
  const sendText = useCallback(async (text: string) => {
    if (!aiClientRef.current || !isConnected) {
      console.error('No hay conexión con AI');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      
      const { provider, config, systemMessage, tools } = getCurrentConfig();
      
      console.log(`🤖 Enviando texto a ${provider.toUpperCase()}:`, text);
      console.log(`🔧 Herramientas disponibles:`, tools);
      
      // Usar el ref para obtener el historial más actualizado
      const currentHistory = conversationHistoryRef.current;
      console.log(`📚 Historial actual (ref): ${currentHistory.length} mensajes`);
      
      // Agregar mensaje del usuario al historial
      const newUserMessage = { role: 'user' as const, content: text };
      
      // Construir mensajes con historial completo
      const messages = [
        { role: 'system' as const, content: systemMessage },
        ...currentHistory,
        newUserMessage
      ];
      
      // Generar respuesta con herramientas
      const completion = await aiClientRef.current.chat.completions.create({
        model: config.model,
        messages: messages,
        tools: tools,
        tool_choice: 'auto',
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        stream: true,
      });
      
      let fullResponse = '';
      let toolCalls: any[] = [];
      
      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || '';
        const deltaToolCalls = chunk.choices[0]?.delta?.tool_calls || [];
        
        fullResponse += content;
        
        // Acumular tool calls
        if (deltaToolCalls.length > 0) {
          toolCalls = [...toolCalls, ...deltaToolCalls];
        }
        
        setResponse(fullResponse);
      }
      
      console.log(`🤖 Respuesta de ${provider.toUpperCase()}:`, fullResponse);
      console.log(`🔧 Tool calls detectados:`, toolCalls);
      
      // Ejecutar tool calls si existen
      if (toolCalls.length > 0) {
        console.log('🎨 Ejecutando herramientas de dibujo...');
        
        for (const toolCall of toolCalls) {
          if (toolCall.type === 'function') {
            const functionName = toolCall.function?.name;
            const functionArgs = toolCall.function?.arguments;
            
            if (functionName && functionArgs) {
              try {
                const args = JSON.parse(functionArgs);
                console.log(`🎨 Ejecutando ${functionName} con args:`, args);
                
                // Enviar comando al WebSocket para que se ejecute en el canvas
                if (sendMessage) {
                  sendMessage({ cmd: functionName, args });
                  console.log(`📡 Comando ${functionName} enviado al WebSocket`);
                } else {
                  console.log(`⚠️ sendMessage no disponible, no se puede ejecutar ${functionName}`);
                }
                
              } catch (parseError) {
                console.error(`❌ Error parseando argumentos de ${functionName}:`, parseError);
              }
            }
          }
        }
      }
      
      // Actualizar historial con ambos mensajes
      const updatedHistory = [
        ...currentHistory,
        newUserMessage,
        { role: 'assistant' as const, content: fullResponse }
      ];
      setConversationHistory(updatedHistory);
      console.log(`💾 Historial actualizado: ${updatedHistory.length} mensajes`);
      
      // Reproducir respuesta con TTS
      if (fullResponse) {
        console.log('🔊 Llamando speak() - Estado actual de sesión:', isSessionActiveRef.current);
        speak(fullResponse);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al procesar texto';
      setError(errorMessage);
      console.error('Error al enviar texto a AI:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [isConnected, sendMessage]);

  // Iniciar escucha (Speech Recognition)
  const startListening = useCallback(() => {
    try {
      // Verificar soporte
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        setError('Speech Recognition no está soportado en este navegador');
        return;
      }

      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'es-ES';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('🎤 Speech Recognition iniciado');
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        const result = event.results[0];
        if (result.isFinal) {
          const finalTranscript = result[0].transcript;
          console.log('📝 Transcripción:', finalTranscript);
          setTranscript(finalTranscript);
          
          // Enviar automáticamente a AI
          if (finalTranscript.trim()) {
            sendText(finalTranscript);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error('❌ Error en Speech Recognition:', event.error);
        setError(`Error de reconocimiento: ${event.error}`);
        setIsListening(false);
      };

      recognition.onend = () => {
        console.log('🛑 Speech Recognition terminado');
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      setTranscript('');
      recognition.start();
      
    } catch (err) {
      console.error('Error al iniciar reconocimiento:', err);
      setError('Error al iniciar el reconocimiento de voz');
    }
  }, [sendText]);

  // Detener escucha
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  // Inicializar SpeechSynthesis
  if (typeof window !== 'undefined' && !synthRef.current) {
    synthRef.current = window.speechSynthesis;
  }

  // Síntesis de voz (Text-to-Speech)
  const speak = useCallback((text: string) => {
    // Usar el ref para obtener el estado más actualizado
    const currentSessionActive = isSessionActiveRef.current;
    console.log('🔊 Iniciando speak() - Estado actual de sesión (ref):', currentSessionActive);
    
    try {
      if (!synthRef.current) {
        console.error('❌ SpeechSynthesis no disponible');
        return;
      }

      // Cancelar cualquier síntesis anterior
      synthRef.current.cancel();
      
      // Esperar un poco para que se cancele completamente
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onstart = () => {
          console.log('🔊 Iniciando síntesis de voz');
          setIsSpeaking(true);
        };

        utterance.onend = () => {
          console.log('🔊 Síntesis de voz terminada correctamente');
          console.log('🔍 Estado de sesión al momento de speak():', currentSessionActive);
          setIsSpeaking(false);
          
          // Usar el estado capturado al momento de speak()
          if (currentSessionActive) {
            console.log('🔄 Reactivando micrófono para continuar conversación');
            setTimeout(() => {
              console.log('🔄 Ejecutando startListening después de TTS');
              startListening();
            }, 1000);
          } else {
            console.log('❌ Sesión no activa, no se reactiva el micrófono');
          }
        };

        utterance.onerror = (event) => {
          console.error('❌ Error en síntesis de voz:', event.error);
          setError(`Error de síntesis: ${event.error}`);
          setIsSpeaking(false);
          
          // IMPORTANTE: Si hay error (como 'interrupted'), aún así reactivar micrófono
          if (currentSessionActive) {
            console.log('🔄 Error en TTS, pero reactivando micrófono por sesión activa');
            setTimeout(() => {
              startListening();
            }, 1000);
          }
        };

        // Agregar listener adicional para detectar interrupciones
        utterance.onpause = () => {
          console.log('⏸️ Síntesis pausada');
        };

        utterance.onresume = () => {
          console.log('▶️ Síntesis reanudada');
        };

        synthRef.current?.speak(utterance);
        
        // Fallback: Si después de 10 segundos no hay respuesta, reactivar micrófono
        setTimeout(() => {
          if (currentSessionActive && !isListening) {
            console.log('⏰ Timeout de TTS - Reactivando micrófono por seguridad');
            setIsSpeaking(false);
            startListening();
          }
        }, 10000);
        
      }, 100); // Pequeña pausa para evitar conflictos
      
    } catch (err) {
      console.error('Error al sintetizar voz:', err);
      setError('Error al reproducir la voz');
      setIsSpeaking(false);
      
      // En caso de excepción, también reactivar
      if (currentSessionActive) {
        setTimeout(() => {
          startListening();
        }, 500);
      }
    }
  }, [startListening, isListening]);

  // Detener síntesis
  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Iniciar sesión continua
  const startSession = useCallback(() => {
    console.log('🚀 Iniciando sesión continua de conversación');
    setIsSessionActive(true);
    setConversationHistory([]); // Limpiar historial al iniciar nueva sesión
    console.log('🧹 Historial de conversación limpiado');
    startListening();
  }, [startListening]);

  // Terminar sesión
  const endSession = useCallback(() => {
    console.log('🛑 Terminando sesión de conversación');
    console.log(`📊 Conversación terminada con ${conversationHistory.length} mensajes`);
    setIsSessionActive(false);
    stopListening();
    stopSpeaking();
  }, [stopListening, stopSpeaking, conversationHistory.length]);

  return {
    isConnected,
    isProcessing,
    error,
    response,
    isListening,
    isSpeaking,
    transcript,
    isSessionActive,
    connect,
    disconnect,
    sendText,
    startSession,
    endSession,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
};
