import { useState, useRef, useCallback } from 'react';
import '../types/webSpeech';

interface UseWebSpeechReturn {
  // STT (Speech-to-Text)
  isListening: boolean;
  transcript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  
  // TTS (Text-to-Speech)
  isSpeaking: boolean;
  speak: (text: string) => void;
  stopSpeaking: () => void;
}

export const useWebSpeech = (): UseWebSpeechReturn => {
  // STT States
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // TTS States
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Initialize Speech Recognition
  const initializeRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech Recognition no está soportado en este navegador');
      return null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-ES'; // Español
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('🎤 Speech Recognition iniciado');
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        }
      }
      
      if (finalTranscript) {
        console.log('📝 Transcripción final:', finalTranscript);
        setTranscript(finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error('❌ Error en Speech Recognition:', event.error);
      setError(`Error de reconocimiento: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log('🛑 Speech Recognition terminado');
      setIsListening(false);
    };

    return recognition;
  }, []);

  // Start listening
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

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  // Initialize Speech Synthesis
  const initializeSynthesis = useCallback(() => {
    if (!('speechSynthesis' in window)) {
      setError('Speech Synthesis no está soportado en este navegador');
      return null;
    }
    
    return window.speechSynthesis;
  }, []);

  // Speak text
  const speak = useCallback((text: string) => {
    try {
      if (!synthRef.current) {
        synthRef.current = initializeSynthesis();
      }

      if (!synthRef.current) return;

      // Cancel any ongoing speech
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

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    // STT
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    
    // TTS
    isSpeaking,
    speak,
    stopSpeaking,
  };
};
