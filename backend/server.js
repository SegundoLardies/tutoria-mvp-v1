const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// CORS middleware
app.use(cors());
app.use(express.json());

// Store active connections
const connections = new Map();

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  const sessionId = req.url.split('/').pop();
  console.log(`🔌 WebSocket conectado para sesión: ${sessionId}`);
  
  connections.set(sessionId, ws);
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 Mensaje recibido:', data);
      
      // Echo the message back for testing
      ws.send(JSON.stringify({ echo: data }));
    } catch (e) {
      console.error('❌ Error parseando mensaje:', e);
    }
  });
  
  ws.on('close', () => {
    console.log(`🔌 WebSocket desconectado para sesión: ${sessionId}`);
    connections.delete(sessionId);
  });
  
  ws.on('error', (error) => {
    console.error('❌ Error WebSocket:', error);
    connections.delete(sessionId);
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', connections: connections.size });
});

// Test draw command endpoint
app.post('/api/v1/test/draw', (req, res) => {
  try {
    const { session_id, command, args } = req.body;
    
    if (!session_id || !command) {
      return res.status(400).json({ error: 'session_id y command son requeridos' });
    }
    
    const ws = connections.get(session_id);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ cmd: command, args: args || {} }));
      res.json({ status: 'success', message: `Comando ${command} enviado a sesión ${session_id}` });
    } else {
      res.status(404).json({ error: 'Sesión no encontrada o WebSocket cerrado' });
    }
  } catch (e) {
    console.error('❌ Error en test draw:', e);
    res.status(500).json({ error: e.message });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Hola Mundo - Node.js Backend' });
});

const PORT = 8001;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Servidor Node.js ejecutándose en http://127.0.0.1:${PORT}`);
  console.log(`🔌 WebSocket disponible en ws://127.0.0.1:${PORT}`);
});
