const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes básicos Evolution API
app.get('/', (req, res) => {
  res.json({ 
    message: 'AutoCred Evolution API', 
    status: 'online',
    version: '1.0.0'
  });
});

app.get('/manager/fetchInstances', (req, res) => {
  res.json([]);
});

app.post('/instance/create', (req, res) => {
  const { instanceName } = req.body;
  res.json({
    instance: {
      instanceName: instanceName || 'autocred-instance',
      status: 'created'
    }
  });
});

app.get('/instance/qrcode/:instanceName', (req, res) => {
  const { instanceName } = req.params;
  res.json({
    qrcode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
    instance: instanceName
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AutoCred Evolution API rodando na porta ${PORT}`);
  console.log(`📱 WhatsApp API simulado funcionando!`);
}); 