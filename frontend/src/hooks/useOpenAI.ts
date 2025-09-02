import { useState, useRef, useCallback } from 'react';
import OpenAI from 'openai';
import { OPENAI_CONFIG, isOpenAIConfigured } from '../config/openai';

interface UseOpenAIReturn {
  isConnected: boolean;
  isProcessing: boolean;
  error: string | null;
  response: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  sendAudio: (audioBlob: Blob) => Promise<void>;
  onResponseComplete: () => void;
}

export const useOpenAI = (): UseOpenAIReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  
  // Callback para cuando se completa la respuesta
  const onResponseCompleteRef = useRef<() => void>(() => {});
  
  const openaiRef = useRef<OpenAI | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef<boolean>(false);

  // Función para reproducir audio
  const playAudioQueue = useCallback(async () => {
    if (!audioContextRef.current || audioQueueRef.current.length === 0 || isPlayingRef.current) {
      return;
    }

    // Asegurarse de que el AudioContext esté en estado 'running'
    if (audioContextRef.current.state === 'suspended') {
      try {
        await audioContextRef.current.resume();
        console.log('🔊 AudioContext resumido');
      } catch (err) {
        console.error('Error al resumir AudioContext:', err);
        return;
      }
    }

    isPlayingRef.current = true;
    console.log('🔊 Reproduciendo audio, elementos en cola:', audioQueueRef.current.length);

    while (audioQueueRef.current.length > 0) {
      const audioBuffer = audioQueueRef.current.shift();
      if (audioBuffer) {
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        
        console.log('🔊 Reproduciendo fragmento de audio, duración:', audioBuffer.duration);
        
        await new Promise<void>((resolve) => {
          source.onended = () => {
            console.log('🔊 Fragmento de audio terminado');
            resolve();
          };
          source.start();
        });
      }
    }

    isPlayingRef.current = false;
    console.log('🔊 Reproducción de audio completada');
  }, []);

  const connect = useCallback(async () => {
    try {
      setError(null);
      
      // Primero intentamos obtener la API key del backend
      try {
        const response = await fetch('http://localhost:8000/api/v1/session/initiate');
        const data = await response.json();
        
        if (data.api_key) {
          console.log('✅ API key obtenida del backend');
          
          const openai = new OpenAI({
            apiKey: data.api_key,
            dangerouslyAllowBrowser: true, // Solo para desarrollo
          });
          
          // Inicializar AudioContext
          audioContextRef.current = new AudioContext();
          
          openaiRef.current = openai;
          setIsConnected(true);
          console.log('✅ Conectado a OpenAI usando API key del backend');
          return;
        }
      } catch (backendErr) {
        console.warn('No se pudo obtener la API key del backend, intentando con la configuración local', backendErr);
      }
      
      // Si no se pudo obtener del backend, usamos la configuración local
      if (!isOpenAIConfigured()) {
        throw new Error('VITE_OPENAI_API_KEY no está configurada. Crea un archivo .env con tu API key de OpenAI.');
      }
      
      const openai = new OpenAI({
        apiKey: OPENAI_CONFIG.apiKey,
        dangerouslyAllowBrowser: true, // Solo para desarrollo
      });
      
      // Inicializar AudioContext
      audioContextRef.current = new AudioContext();
      
      openaiRef.current = openai;
      setIsConnected(true);
      console.log('✅ Conectado a OpenAI usando configuración local');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al conectar con OpenAI';
      setError(errorMessage);
      console.error('Error al conectar con OpenAI:', err);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    openaiRef.current = null;
    audioQueueRef.current = [];
    setIsConnected(false);
    setIsProcessing(false);
    setError(null);
    setResponse(null);
    console.log('🔌 Desconectado de OpenAI');
  }, []);

  const sendAudio = useCallback(async (audioBlob: Blob) => {
    if (!openaiRef.current || !isConnected) {
      console.error('No hay conexión con OpenAI');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      
      console.log('🎤 Enviando audio a OpenAI...');
      
      // Convertir el blob a un formato que OpenAI pueda procesar
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');
      
      // Transcribir el audio
      const transcription = await openaiRef.current.audio.transcriptions.create({
        file: new File([audioBlob], 'audio.webm', { type: 'audio/webm' }),
        model: 'whisper-1',
      });
      
      console.log('📝 Transcripción:', transcription.text);
      
      // Generar respuesta usando el modelo de chat
      const completion = await openaiRef.current.chat.completions.create({
        model: OPENAI_CONFIG.model,
        messages: [
          { role: 'system', content: OPENAI_CONFIG.systemMessage },
          { role: 'user', content: transcription.text }
        ],
        stream: true,
      });
      
      let fullResponse = '';
      
      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullResponse += content;
        setResponse(fullResponse);
      }
      
      // Convertir la respuesta a voz
      const speechResponse = await openaiRef.current.audio.speech.create({
        model: 'tts-1',
        voice: 'alloy',
        input: fullResponse,
      });
      
      // Convertir el stream de audio a AudioBuffer
      const arrayBuffer = await speechResponse.arrayBuffer();
      
      try {
        // Asegurarse de que el AudioContext esté inicializado
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
          console.log('🔊 AudioContext inicializado');
        }
        
        // Decodificar el audio
        console.log('🔊 Decodificando audio recibido, tamaño:', arrayBuffer.byteLength);
        const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
        console.log('🔊 Audio decodificado correctamente, duración:', audioBuffer.duration);
        
        // Agregar a la cola de reproducción
        audioQueueRef.current.push(audioBuffer);
        
        // Intentar reproducir inmediatamente
        await playAudioQueue();
      } catch (audioErr) {
        console.error('Error al procesar el audio:', audioErr);
        setError('Error al procesar el audio: ' + (audioErr instanceof Error ? audioErr.message : 'Error desconocido'));
      }
      
      console.log('🤖 Respuesta de OpenAI procesada y lista para reproducir');
      
      // Llamar al callback cuando termine de procesar
      onResponseCompleteRef.current();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al procesar audio';
      setError(errorMessage);
      console.error('Error al enviar audio:', err);
      
      // Llamar al callback incluso en caso de error
      onResponseCompleteRef.current();
    } finally {
      setIsProcessing(false);
    }
  }, [isConnected, playAudioQueue]);

  return {
    isConnected,
    isProcessing,
    error,
    response,
    connect,
    disconnect,
    sendAudio,
    set onResponseComplete(callback: () => void) {
      onResponseCompleteRef.current = callback;
    },
    get onResponseComplete() {
      return onResponseCompleteRef.current;
    }
  };
};
