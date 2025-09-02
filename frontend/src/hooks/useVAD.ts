import { useState, useRef, useCallback } from 'react';
import { MicVAD, AudioNodeVAD } from '@ricky0123/vad-web';

interface UseVADReturn {
  isSpeaking: boolean;
  isListening: boolean;
  error: string | null;
  startVAD: () => Promise<void>;
  stopVAD: () => void;
}

export const useVAD = (): UseVADReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const vadRef = useRef<MicVAD | AudioNodeVAD | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startVAD = useCallback(async () => {
    try {
      setError(null);
      
      // Método alternativo: usar AudioNodeVAD directamente
      console.log('🔄 Intentando método alternativo con AudioNodeVAD...');
      
      // Obtener stream de micrófono
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      streamRef.current = stream;
      
      // Crear AudioContext
      const audioContext = new AudioContext();
      const sourceNode = new MediaStreamAudioSourceNode(audioContext, {
        mediaStream: stream,
      });
      
      // Crear AudioNodeVAD con configuración sensible desde el inicio
      const vad = await AudioNodeVAD.new(audioContext, {
        onSpeechStart: () => {
          console.log('🎤 Speech START detected!');
          setIsSpeaking(true);
        },
        onSpeechEnd: () => {
          console.log('🔇 Speech END detected!');
          setIsSpeaking(false);
        },
        onVADMisfire: () => {
          console.log('⚠️ VAD misfire detected');
        },
        onFrameProcessed: (probabilities, frame) => {
          // Log cada frame para debug
          console.log('🔄 Frame procesado:', probabilities);
          if (probabilities && probabilities.length > 0) {
            const speechProb = probabilities[0];
            console.log(`🎯 Speech probability: ${speechProb.toFixed(3)}`);
            if (speechProb > 0.1) {
              console.log(`🔥 ALTA probabilidad de voz: ${speechProb.toFixed(3)}`);
            }
          }
        },
        // Configuración muy sensible desde el inicio
        positiveSpeechThreshold: 0.2,
        negativeSpeechThreshold: 0.1,
        minSpeechFrames: 1,
        preSpeechPadFrames: 1,
      });
      
      // Conectar el source al VAD
      vad.receive(sourceNode);
      
      // Iniciar el VAD explícitamente
      vad.start();
      console.log('🚀 VAD iniciado con start()');
      
      vadRef.current = vad;
      setIsListening(true);
      console.log('✅ VAD iniciado correctamente con AudioNodeVAD');
      console.log('🔍 VAD instance:', vad);
      console.log('🔍 VAD options:', vad.options);
      console.log('🔍 Thresholds - positive:', vad.options.positiveSpeechThreshold, 'negative:', vad.options.negativeSpeechThreshold);
      console.log('🎵 AudioContext state:', audioContext.state);
      console.log('🎵 Stream tracks:', stream.getTracks().length);
      console.log('🎵 Stream active:', stream.active);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al acceder al micrófono';
      setError(errorMessage);
      console.error('Error al iniciar VAD:', err);
    }
  }, []);

  const stopVAD = useCallback(() => {
    try {
      if (vadRef.current) {
        vadRef.current.destroy();
        vadRef.current = null;
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      setIsListening(false);
      setIsSpeaking(false);
      setError(null);
      
    } catch (err) {
      console.error('Error al detener VAD:', err);
    }
  }, []);

  return {
    isSpeaking,
    isListening,
    error,
    startVAD,
    stopVAD,
  };
};
