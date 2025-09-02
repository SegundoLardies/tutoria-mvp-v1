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
  const [isMockMode, setIsMockMode] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;
  const isConnectingRef = useRef(false);
  const lastSessionIdRef = useRef<string>('');

  const connectWebSocket = () => {
    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current || wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log('🔄 Ya hay una conexión en progreso, esperando...');
      return;
    }

    // If sessionId changed, close existing connection
    if (lastSessionIdRef.current && lastSessionIdRef.current !== sessionId) {
      console.log('🔄 SessionId cambió, cerrando conexión anterior');
      if (wsRef.current) {
        wsRef.current.close(1000, 'SessionId changed');
      }
    }

    try {
      const wsUrl = `ws://127.0.0.1:8001/ws/${sessionId}`;
      console.log(`🔌 Intentando conectar WebSocket a: ${wsUrl}`);
      
      isConnectingRef.current = true;
      lastSessionIdRef.current = sessionId;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      // Set a timeout for connection
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          console.log('⏰ Timeout de conexión WebSocket, activando modo mock');
          ws.close();
          setIsMockMode(true);
          setError('Backend no disponible - Modo Mock activado');
        }
      }, 5000);

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log(`🔌 WebSocket conectado para sesión: ${sessionId}`);
        setIsConnected(true);
        setError(null);
        setIsMockMode(false);
        reconnectAttempts.current = 0;
        isConnectingRef.current = false;
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

      ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        console.log('🔌 WebSocket desconectado', event.code, event.reason);
        setIsConnected(false);
        
        // Only attempt to reconnect if it wasn't a manual close and not in mock mode
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts && !isMockMode) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
          console.log(`🔄 Reintentando conexión en ${delay}ms... (intento ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connectWebSocket();
          }, delay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts && !isMockMode) {
          console.log('🔄 Máximo de reintentos alcanzado, activando modo mock');
          setIsMockMode(true);
          setError('Backend no disponible - Modo Mock activado');
        }
        isConnectingRef.current = false;
      };

      ws.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.error('❌ Error WebSocket:', error);
        setError('Error de conexión WebSocket');
        setIsConnected(false);
        isConnectingRef.current = false;
      };
    } catch (e) {
      console.error('❌ Error creando WebSocket:', e);
      setError('No se pudo crear la conexión WebSocket');
      setIsMockMode(true);
      isConnectingRef.current = false;
    }
  };

  useEffect(() => {
    if (!sessionId) return;

    connectWebSocket();

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
        wsRef.current = null;
      }
    };
  }, [sessionId]);

  const sendMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else if (isMockMode) {
      console.log('🎭 Modo Mock: Simulando envío de mensaje:', message);
      // Simulate receiving an echo message
      setTimeout(() => {
        setLastMessage({ echo: message, mock: true });
      }, 100);
    } else {
      console.warn('⚠️ WebSocket no está conectado');
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    setIsConnected(false);
    setError(null);
    setIsMockMode(false);
  };

  const enableMockMode = () => {
    setIsMockMode(true);
    setError('Modo Mock activado manualmente');
    if (wsRef.current) {
      wsRef.current.close(1000, 'Enabling mock mode');
      wsRef.current = null;
    }
  };

  return {
    lastMessage,
    isConnected,
    error,
    isMockMode,
    sendMessage,
    disconnect,
    enableMockMode,
  };
};
