import { useState, useRef, useCallback } from 'react';
import OpenAI from 'openai';
import '../types/webSpeech';

interface UseGroqWebSpeechReturn {
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

export const useGroqWebSpeech = (): UseGroqWebSpeechReturn => {
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
  const groqClientRef = useRef<OpenAI | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Conectar con Groq
  const connect = useCallback(async () => {
    try {
      setError(null);
      
      // Primero intentamos obtener la API key del backend
      try {
        const response = await fetch('http://localhost:8000/api/v1/session/initiate');
        const data = await response.json();
        
        if (data.api_key) {
          console.log('✅ API key obtenida del backend');
          
          const groqClient = new OpenAI({
            apiKey: data.api_key,
            baseURL: 'https://api.groq.com/openai/v1',
            dangerouslyAllowBrowser: true,
          });
          
          groqClientRef.current = groqClient;
          setIsConnected(true);
          console.log('✅ Conectado a Groq usando API key del backend');
          return;
        }
      } catch (backendErr) {
        console.warn('No se pudo obtener la API key del backend, intentando con configuración local', backendErr);
      }
      
      // Si no hay backend, usar configuración local (necesitarías configurar VITE_GROQ_API_KEY)
      const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
      
      if (!groqApiKey) {
        throw new Error('VITE_GROQ_API_KEY no está configurada. Obtén una API key gratuita en https://console.groq.com/');
      }
      
      const groqClient = new OpenAI({
        apiKey: groqApiKey,
        baseURL: 'https://api.groq.com/openai/v1',
        dangerouslyAllowBrowser: true,
      });
      
      groqClientRef.current = groqClient;
      setIsConnected(true);
      console.log('✅ Conectado a Groq usando configuración local');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al conectar con Groq';
      setError(errorMessage);
      console.error('Error al conectar con Groq:', err);
    }
  }, []);

  // Desconectar
  const disconnect = useCallback(() => {
    groqClientRef.current = null;
    setIsConnected(false);
    setIsProcessing(false);
    setError(null);
    setResponse(null);
    stopListening();
    stopSpeaking();
    console.log('🔌 Desconectado de Groq');
  }, []);

  // Enviar texto a Groq
  const sendText = useCallback(async (text: string) => {
    if (!groqClientRef.current || !isConnected) {
      console.error('No hay conexión con Groq');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      
      console.log('🤖 Enviando texto a Groq:', text);
      
      // Generar respuesta usando Groq
      const completion = await groqClientRef.current.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { 
            role: 'system', 
            content: `Eres TutorIA, un tutor de programación amigable y paciente. 
            Tu objetivo es ayudar a los estudiantes a aprender programación de manera clara y comprensible.
            Responde de forma conversacional y amigable, como si estuvieras hablando directamente con el estudiante.
            Mantén tus respuestas concisas pero informativas. Si no entiendes algo, pide aclaraciones de manera amable.`
          },
          { role: 'user', content: text }
        ],
        max_tokens: 500,
        temperature: 0.7,
        stream: true,
      });
      
      let fullResponse = '';
      
      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullResponse += content;
        setResponse(fullResponse);
      }
      
      console.log('🤖 Respuesta de Groq:', fullResponse);
      
      // Reproducir respuesta con TTS
      if (fullResponse) {
        speak(fullResponse);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al procesar texto';
      setError(errorMessage);
      console.error('Error al enviar texto a Groq:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [isConnected]);

  // Inicializar Speech Recognition
  const initializeRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech Recognition no está soportado en este navegador');
      return null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
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

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[0];
      if (result.isFinal) {
        const finalTranscript = result[0].transcript;
        console.log('📝 Transcripción:', finalTranscript);
        setTranscript(finalTranscript);
        
        // Enviar automáticamente a Groq
        if (finalTranscript.trim()) {
          sendText(finalTranscript);
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('❌ Error en Speech Recognition:', event.error);
      setError(`Error de reconocimiento: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log('🛑 Speech Recognition terminado');
      setIsListening(false);
    };

    return recognition;
  }, [sendText]);

  // Iniciar escucha
  const startListening = useCallback(() => {
    try {
      if (!recognitionRef.current) {
        recognitionRef.current = initializeRecognition();
      }
      
      if (recognitionRef.current) {
        setTranscript('');
        recognitionRef.current.start();
      }
    } catch (err) {
      console.error('Error al iniciar reconocimiento:', err);
      setError('Error al iniciar el reconocimiento de voz');
    }
  }, [initializeRecognition]);

  // Detener escucha
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  // Inicializar Speech Synthesis
  const initializeSynthesis = useCallback(() => {
    if (!('speechSynthesis' in window)) {
      setError('Speech Synthesis no está soportado en este navegador');
      return null;
    }
    
    return window.speechSynthesis;
  }, []);

  // Hablar texto
  const speak = useCallback((text: string) => {
    try {
      if (!synthRef.current) {
        synthRef.current = initializeSynthesis();
      }

      if (!synthRef.current) return;

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
  }, [initializeSynthesis]);

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
