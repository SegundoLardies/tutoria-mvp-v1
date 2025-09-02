import { useAIChat } from './hooks/useAIChat';
import { useWebSocket } from './hooks/useWebSocket';
import { useEffect, useRef } from 'react';
import CanvasComponent from './components/canvas';
import type { CanvasComponentRef } from './components/canvas';
import './App.css';

function App() {
  // WebSocket para comunicación en tiempo real - use ref to keep sessionId stable
  const sessionIdRef = useRef<string>('');
  if (!sessionIdRef.current) {
    sessionIdRef.current = 'session_' + Date.now();
  }
  const { lastMessage, isConnected: wsConnected, error: wsError, isMockMode, disconnect: wsDisconnect, enableMockMode, sendMessage } = useWebSocket(sessionIdRef.current);
  
  const {
    isConnected,
    isProcessing,
    error,
    response,
    isListening,
    isSpeaking,
    isSessionActive,
    connect,
    startSession,
    endSession,
    startListening,
  } = useAIChat(sendMessage);
  
  const canvasRef = useRef<CanvasComponentRef>(null);
  
  // Inicializar AudioContext con interacción del usuario
  useEffect(() => {
    // Función para inicializar el AudioContext
    const initAudioContext = () => {
      // Crear un AudioContext temporal para inicializarlo
      const tempAudioContext = new AudioContext();
      console.log('🔊 AudioContext inicializado por interacción del usuario:', tempAudioContext.state);
      
      // Reproducir un sonido silencioso para activar el AudioContext
      const silentBuffer = tempAudioContext.createBuffer(1, 1, 22050);
      const source = tempAudioContext.createBufferSource();
      source.buffer = silentBuffer;
      source.connect(tempAudioContext.destination);
      source.start();
      
      // Eliminar los event listeners después de la inicialización
      document.removeEventListener('click', initAudioContext);
      document.removeEventListener('touchstart', initAudioContext);
    };
    
    // Agregar event listeners para la interacción del usuario
    document.addEventListener('click', initAudioContext);
    document.addEventListener('touchstart', initAudioContext);
    
    // Limpiar event listeners al desmontar
    return () => {
      document.removeEventListener('click', initAudioContext);
      document.removeEventListener('touchstart', initAudioContext);
    };
  }, []);
  
  // Escuchar mensajes WebSocket y ejecutar comandos de dibujo
  useEffect(() => {
    if (lastMessage && canvasRef.current) {
      const { cmd, args } = lastMessage;
      console.log('🎨 Ejecutando comando de dibujo:', cmd, args);
      
      if (cmd === 'drawCircle') {
        canvasRef.current.drawCircle(args);
      } else if (cmd === 'writeText') {
        canvasRef.current.writeText(args);
      } else if (cmd === 'clearCanvas') {
        canvasRef.current.clearCanvas();
      }
    }
  }, [lastMessage]);
  
  // Log para depuración
  console.log('App render - isSpeaking:', isSpeaking, 'isListening:', isListening, 'isConnected:', isConnected, 'isSessionActive:', isSessionActive, 'wsConnected:', wsConnected);

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>TutorIA - Chat de Voz</h1>
      
      {/* Errores */}
      {error && (
        <div style={{ color: 'red', marginBottom: '20px', padding: '10px', backgroundColor: '#ffebee', borderRadius: '5px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      {wsError && (
        <div style={{ color: 'orange', marginBottom: '20px', padding: '10px', backgroundColor: '#fff3e0', borderRadius: '5px' }}>
          <strong>WebSocket Error:</strong> {wsError}
        </div>
      )}
      
      {/* Indicador de estado de voz */}
      <div style={{
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        backgroundColor: isSpeaking ? '#2196F3' : isListening ? '#4CAF50' : '#9E9E9E',
        margin: '20px auto',
        transition: 'background-color 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '24px',
        fontWeight: 'bold'
      }}>  
        {isSpeaking ? '🤖' : isListening ? '🎤' : '⏸️'}
      </div>
      
      {/* Estados */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '18px', marginBottom: '10px' }}>
          {isSpeaking ? '🤖 TutorIA hablando...' : isListening ? '🎤 Escuchando...' : isSessionActive ? '⏳ Esperando...' : '⏸️ Detenido'}
        </p>
        
        <div style={{ fontSize: '14px', color: '#666' }}>
          <p>Sesión: {isSessionActive ? '🟢 Activa' : '🔴 Inactiva'}</p>
          <p>Micrófono: {isListening ? '✅ Activo' : '❌ Inactivo'}</p>
          <p>AI: {isConnected ? '✅ Conectado' : '❌ Desconectado'}</p>
          <p>WebSocket: {wsConnected ? '✅ Conectado' : isMockMode ? '🎭 Modo Mock' : '🔄 Conectando...'}</p>
          {isProcessing && <p style={{ color: '#FF9800' }}>🤖 Procesando...</p>}
        </div>
      </div>
      
      {/* Respuesta de IA */}
      {response && (
        <div style={{
          padding: '15px',
          backgroundColor: '#e3f2fd',
          borderRadius: '10px',
          border: '1px solid #2196F3',
          textAlign: 'left',
          maxWidth: '600px',
          margin: '20px auto'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#1976D2' }}>🤖 TutorIA responde:</h3>
          <p style={{ margin: 0, lineHeight: '1.5' }}>{response}</p>
        </div>
      )}
      
      {/* Botones de control */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button 
          onClick={connect}
          disabled={isConnected}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: isConnected ? '#ccc' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isConnected ? 'not-allowed' : 'pointer'
          }}
        >
          {isConnected ? '✅ Conectado' : '🔌 Conectar AI'}
        </button>
        
        {!isSessionActive ? (
          <button 
            onClick={startSession}
            disabled={!isConnected}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: !isConnected ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: !isConnected ? 'not-allowed' : 'pointer'
            }}
          >
            🚀 Iniciar Sesión
          </button>
        ) : (
          <button 
            onClick={endSession}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🛑 Terminar Sesión
          </button>
        )}
        
        <button 
          onClick={startListening}
          disabled={!isConnected || isListening || !isSessionActive}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: (!isConnected || isListening || !isSessionActive) ? '#ccc' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: (!isConnected || isListening || !isSessionActive) ? 'not-allowed' : 'pointer'
          }}
        >
          🎤 Hablar Ahora
        </button>
        
        {/* WebSocket Connection Button */}
        <button 
          onClick={wsConnected ? wsDisconnect : undefined}
          disabled={!wsConnected && !!wsError}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: wsConnected ? '#f44336' : wsError ? '#ccc' : '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: wsConnected ? 'pointer' : 'not-allowed'
          }}
        >
          {wsConnected ? '🔌 Desconectar WS' : wsError ? '❌ WS Error' : '🔄 Conectando WS...'}
        </button>
        
        {/* Mock Mode Button */}
        <button 
          onClick={enableMockMode}
          disabled={isMockMode}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: isMockMode ? '#ccc' : '#9C27B0',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isMockMode ? 'not-allowed' : 'pointer'
          }}
        >
          {isMockMode ? '🎭 Modo Mock Activo' : '🎭 Activar Modo Mock'}
        </button>
      </div>
      
      {/* Canvas de Dibujo */}
      <div style={{ marginTop: '30px' }}>
        <h3>🎨 Canvas Interactivo</h3>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '10px' }}>
          <button 
            onClick={() => canvasRef.current?.drawCircle({ x: 150, y: 150, radius: 50, color: '#ff0000' })}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🔴 Círculo Rojo
          </button>
          <button 
            onClick={() => canvasRef.current?.writeText({ x: 300, y: 100, text: 'Hola TutorIA!', fontSize: 24, color: '#0000ff' })}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4444ff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            📝 Texto Azul
          </button>
          <button 
            onClick={() => canvasRef.current?.clearCanvas()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🗑️ Limpiar
          </button>
        </div>
        <CanvasComponent ref={canvasRef} />
      </div>
      
      {/* Instrucciones */}
      <div style={{ marginTop: '30px', fontSize: '14px', color: '#666', maxWidth: '500px', margin: '30px auto 0' }}>
        <h3>📋 Instrucciones:</h3>
        <ol style={{ textAlign: 'left', lineHeight: '1.6' }}>
          <li>Conecta con AI (Groq gratuito o OpenAI)</li>
          <li>Inicia una sesión continua con "🚀 Iniciar Sesión"</li>
          <li>Habla tu pregunta - el micrófono se activará automáticamente</li>
          <li>El tutor responderá y luego reactivará el micrófono</li>
          <li>Continúa la conversación naturalmente</li>
          <li>Termina con "🛑 Terminar Sesión" cuando acabes</li>
        </ol>
      </div>
    </div>
  );
}

export default App;
