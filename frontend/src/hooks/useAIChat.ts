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
  connect: () => Promise<void>;
  disconnect: () => void;
  sendText: (text: string) => Promise<void>;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
}

export const useAIChat = (): UseAIChatReturn => {
  // Estados principales
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  
  // Estados de Web Speech API
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  // Referencias
  const aiClientRef = useRef<OpenAI | null>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

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
    stopListening();
    stopSpeaking();
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
      
      const { provider, config, systemMessage } = getCurrentConfig();
      
      console.log(`🤖 Enviando texto a ${provider.toUpperCase()}:`, text);
      
      // Generar respuesta
      const completion = await aiClientRef.current.chat.completions.create({
        model: config.model,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: text }
        ],
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        stream: true,
      });
      
      let fullResponse = '';
      
      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullResponse += content;
        setResponse(fullResponse);
      }
      
      console.log(`🤖 Respuesta de ${provider.toUpperCase()}:`, fullResponse);
      
      // Reproducir respuesta con TTS
      if (fullResponse) {
        speak(fullResponse);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al procesar texto';
      setError(errorMessage);
      console.error('Error al enviar texto a AI:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [isConnected]);

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

  // Hablar texto (Speech Synthesis)
  const speak = useCallback((text: string) => {
    try {
      if (!('speechSynthesis' in window)) {
        setError('Speech Synthesis no está soportado en este navegador');
        return;
      }

      if (!synthRef.current) {
        synthRef.current = window.speechSynthesis;
      }

      // Cancelar cualquier síntesis en curso
      synthRef.current.cancel();

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
        console.log('🔊 Síntesis de voz terminada');
        setIsSpeaking(false);
      };

      utterance.onerror = (event) => {
        console.error('❌ Error en síntesis de voz:', event.error);
        setError(`Error de síntesis: ${event.error}`);
        setIsSpeaking(false);
      };

      synthRef.current.speak(utterance);
    } catch (err) {
      console.error('Error al sintetizar voz:', err);
      setError('Error al reproducir la voz');
    }
  }, []);

  // Detener síntesis
  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    isConnected,
    isProcessing,
    error,
    response,
    isListening,
    isSpeaking,
    transcript,
    connect,
    disconnect,
    sendText,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  };
};
