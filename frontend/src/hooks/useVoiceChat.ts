import { useState, useRef, useCallback, useEffect } from 'react';
import { useVAD } from './useVAD';
import { useOpenAI } from './useOpenAI';

interface UseVoiceChatReturn {
  // Estados del VAD
  isSpeaking: boolean;
  isListening: boolean;
  vadError: string | null;
  
  // Estados de OpenAI
  isConnected: boolean;
  isProcessing: boolean;
  openaiError: string | null;
  response: string | null;
  
  // Funciones de control
  startVoiceChat: () => Promise<void>;
  stopVoiceChat: () => void;
  startVAD: () => Promise<void>;
  stopVAD: () => void;
  connectOpenAI: () => Promise<void>;
  disconnectOpenAI: () => void;
}

export const useVoiceChat = (): UseVoiceChatReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Hooks existentes
  const vad = useVAD();
  const openai = useOpenAI();
  
  // Estado para el modo de tutor
  const [tutorState, setTutorState] = useState<'idle' | 'listening' | 'speaking'>('idle');

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000 // 128 kbps para mejor calidad
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        console.log('🎵 Audio grabado:', audioBlob.size, 'bytes');
        
        // Enviar audio a OpenAI
        if (openai.isConnected) {
          openai.sendAudio(audioBlob);
        }
        
        setAudioChunks([]);
      };
      
      mediaRecorder.start(100); // Grabar en chunks de 100ms
      setIsRecording(true);
      console.log('🎤 Grabación iniciada');
      
    } catch (err) {
      console.error('Error al iniciar grabación:', err);
    }
  }, [openai]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log('🛑 Grabación detenida');
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, [isRecording]);

  const startVoiceChat = useCallback(async () => {
    try {
      // Primero conectamos a OpenAI
      if (!openai.isConnected) {
        await openai.connect();
      }
      
      // Luego iniciamos el VAD
      await vad.startVAD();
      
      // Iniciamos la grabación
      await startRecording();
      
      // Establecemos el estado inicial del tutor
      setTutorState('listening');
      
      console.log('🚀 Voice Chat iniciado');
    } catch (err) {
      console.error('Error al iniciar Voice Chat:', err);
    }
  }, [vad, openai, startRecording]);

  const stopVoiceChat = useCallback(() => {
    stopRecording();
    vad.stopVAD();
    openai.disconnect();
    console.log('🛑 Voice Chat detenido');
  }, [vad, openai, stopRecording]);

  // Detectar cuando el usuario empieza a hablar
  const handleSpeechStart = useCallback(() => {
    console.log('🎤 Usuario empezó a hablar');
    startRecording();
  }, [startRecording]);

  // Detectar cuando el usuario para de hablar
  const handleSpeechEnd = useCallback(() => {
    console.log('🔇 Usuario paró de hablar');
    stopRecording();
    
    if (openai.isConnected && !openai.isProcessing) {
      setTutorState('speaking');
      // El audio se enviará cuando stopRecording termine
      // Cuando OpenAI termine de procesar, volveremos a 'listening'
      openai.onResponseComplete = () => setTutorState('listening');
    }
  }, [stopRecording, openai]);

  return {
    // Estados del VAD
    isSpeaking: vad.isSpeaking,
    isListening: vad.isListening,
    vadError: vad.error,
    
    // Estados de OpenAI
    isConnected: openai.isConnected,
    isProcessing: openai.isProcessing,
    openaiError: openai.error,
    response: openai.response,
    
    // Estado del tutor
    tutorState,
    
    // Funciones de control
    startVoiceChat,
    stopVoiceChat,
    startVAD: vad.startVAD,
    stopVAD: vad.stopVAD,
    connectOpenAI: openai.connect,
    disconnectOpenAI: openai.disconnect,
  };
};
