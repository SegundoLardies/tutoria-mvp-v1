import { useState, useEffect, useRef } from 'react';

interface WebSocketMessage {
  cmd?: string;
  args?: any;
  echo?: string;
  [key: string]: any;
}

export const useWebSocket = (sessionId: string) => {
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const connectWebSocket = () => {
      try {
        const wsUrl = `ws://localhost:8000/ws/${sessionId}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log(`🔌 WebSocket conectado para sesión: ${sessionId}`);
          setIsConnected(true);
          setError(null);
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('📨 Mensaje recibido:', message);
            setLastMessage(message);
          } catch (e) {
            console.error('❌ Error parseando mensaje WebSocket:', e);
          }
        };

        ws.onclose = () => {
          console.log('🔌 WebSocket desconectado');
          setIsConnected(false);
        };

        ws.onerror = (error) => {
          console.error('❌ Error WebSocket:', error);
          setError('Error de conexión WebSocket');
          setIsConnected(false);
        };
      } catch (e) {
        console.error('❌ Error creando WebSocket:', e);
        setError('No se pudo crear la conexión WebSocket');
      }
    };

    connectWebSocket();

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [sessionId]);

  const sendMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ WebSocket no está conectado');
    }
  };

  return {
    lastMessage,
    isConnected,
    error,
    sendMessage,
  };
};
