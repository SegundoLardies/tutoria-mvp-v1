import { useAIChat } from './hooks/useAIChat';
import { useEffect } from 'react';
import './App.css';

function App() {
  const {
    isConnected,
    isProcessing,
    error,
    response,
    isListening,
    isSpeaking,
    connect,
    startListening,
    stopListening,
  } = useAIChat();
  
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
  
  // Log para depuración
  console.log('App render - isSpeaking:', isSpeaking, 'isListening:', isListening, 'isConnected:', isConnected);

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>TutorIA - Chat de Voz</h1>
      
      {/* Errores */}
      {error && (
        <div style={{ color: 'red', marginBottom: '20px', padding: '10px', backgroundColor: '#ffebee', borderRadius: '5px' }}>
          <strong>Error:</strong> {error}
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
          {isSpeaking ? '🤖 TutorIA hablando...' : isListening ? '🎤 Escuchando...' : '⏸️ Detenido'}
        </p>
        
        <div style={{ fontSize: '14px', color: '#666' }}>
          <p>Micrófono: {isListening ? '✅ Activo' : '❌ Inactivo'}</p>
          <p>AI: {isConnected ? '✅ Conectado' : '❌ Desconectado'}</p>
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
        
        <button 
          onClick={startListening}
          disabled={!isConnected || isListening}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: (!isConnected || isListening) ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: (!isConnected || isListening) ? 'not-allowed' : 'pointer'
          }}
        >
          🎤 Hablar
        </button>
        
        <button 
          onClick={stopListening}
          disabled={!isListening}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: !isListening ? '#ccc' : '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: !isListening ? 'not-allowed' : 'pointer'
          }}
        >
          🛑 Detener
        </button>
      </div>
      
      {/* Instrucciones */}
      <div style={{ marginTop: '30px', fontSize: '14px', color: '#666', maxWidth: '500px', margin: '30px auto 0' }}>
        <h3>📋 Instrucciones:</h3>
        <ol style={{ textAlign: 'left', lineHeight: '1.6' }}>
          <li>Primero, conecta con AI (Groq gratuito o OpenAI)</li>
          <li>Haz clic en "Hablar" para activar el micrófono</li>
          <li>Habla tu pregunta cuando veas el círculo verde</li>
          <li>Espera la respuesta del tutor (círculo azul)</li>
        </ol>
      </div>
    </div>
  );
}

export default App;
