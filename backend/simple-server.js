const express = require('express');
const cors = require('cors');

const app = express();

// CORS middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Node.js server is running' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Hola Mundo - Node.js Backend Simple' });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ status: 'success', timestamp: new Date().toISOString() });
});

const PORT = 8001;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Servidor Node.js simple ejecutándose en http://127.0.0.1:${PORT}`);
});
