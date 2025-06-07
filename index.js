const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());

// Simular banco de dados em memória
let instances = [];
let messages = [];

// Routes básicos Evolution API
app.get('/', (req, res) => {
  res.json({ 
    message: 'AutoCred Evolution API', 
    status: 'online',
    version: '1.0.0'
  });
});

// Página de informações WhatsApp
app.get('/whatsapp', (req, res) => {
  res.json({
    title: '📱 AutoCred WhatsApp API',
    status: 'online',
    version: '2.0.0',
    description: 'Sistema completo de mensagens WhatsApp para AutoCred',
    features: [
      '✅ Criação de instâncias WhatsApp',
      '✅ Envio de mensagens',
      '✅ Geração de QR Code',
      '✅ Webhooks para receber mensagens',
      '✅ Dashboard de estatísticas'
    ],
    endpoints: {
      'GET /': 'Status da API',
      'GET /whatsapp': 'Informações WhatsApp (esta página)',
      'GET /manager/fetchInstances': 'Listar instâncias',
      'POST /instance/create': 'Criar instância',
      'GET /instance/qrcode/:name': 'Gerar QR Code',
      'GET /instance/status/:name': 'Status da instância',
      'POST /message/sendText/:name': 'Enviar mensagem',
      'GET /messages/:name': 'Listar mensagens',
      'GET /health': 'Health check'
    },
    statistics: {
      uptime: `${Math.floor(process.uptime())} segundos`,
      instances: instances.length,
      messages: messages.length,
      memory_usage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`
    },
    integration: {
      autocred_app: 'Integrado com sistema AutoCred',
      webhook_url: '/webhook/:instanceName',
      supported_formats: ['text', 'image', 'document']
    },
    last_updated: new Date().toISOString()
  });
});

app.get('/manager/fetchInstances', (req, res) => {
  res.json(instances);
});

// Criar instância WhatsApp
app.post('/instance/create', (req, res) => {
  const { instanceName } = req.body;
  const instance = {
    instanceName: instanceName || 'autocred-instance',
    status: 'created',
    connectionStatus: 'disconnected',
    qrcode: null,
    created_at: new Date().toISOString()
  };
  
  instances.push(instance);
  
  res.json({
    instance: instance
  });
});

// Gerar QR Code
app.get('/instance/qrcode/:instanceName', (req, res) => {
  const { instanceName } = req.params;
  
  // QR Code simulado (base64 de uma imagem pequena)
  const qrcode = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  
  res.json({
    qrcode: qrcode,
    instance: instanceName,
    message: `QR Code gerado para ${instanceName}. Escaneie com seu WhatsApp.`
  });
});

// Enviar mensagem texto
app.post('/message/sendText/:instanceName', (req, res) => {
  const { instanceName } = req.params;
  const { number, text } = req.body;
  
  if (!number || !text) {
    return res.status(400).json({
      error: 'Number e text são obrigatórios'
    });
  }
  
  // Simular envio de mensagem
  const message = {
    id: `msg_${Date.now()}`,
    instanceName: instanceName,
    number: number,
    text: text,
    status: 'sent',
    timestamp: new Date().toISOString()
  };
  
  messages.push(message);
  
  console.log(`📤 Mensagem enviada: ${instanceName} -> ${number}: ${text}`);
  
  res.json({
    success: true,
    message: 'Mensagem enviada com sucesso',
    data: message
  });
});

// Listar mensagens
app.get('/messages/:instanceName', (req, res) => {
  const { instanceName } = req.params;
  const instanceMessages = messages.filter(msg => msg.instanceName === instanceName);
  
  res.json({
    instanceName: instanceName,
    messages: instanceMessages,
    total: instanceMessages.length
  });
});

// Status da instância
app.get('/instance/status/:instanceName', (req, res) => {
  const { instanceName } = req.params;
  const instance = instances.find(inst => inst.instanceName === instanceName);
  
  if (!instance) {
    return res.status(404).json({
      error: 'Instância não encontrada'
    });
  }
  
  res.json({
    instanceName: instanceName,
    status: 'connected',
    connectionStatus: 'open',
    qrcode: null
  });
});

// Webhook simulado (receber mensagens)
app.post('/webhook/:instanceName', (req, res) => {
  const { instanceName } = req.params;
  const data = req.body;
  
  console.log(`📱 Webhook recebido: ${instanceName}`, data);
  
  res.json({ status: 'received' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    uptime: process.uptime(),
    instances: instances.length,
    messages: messages.length
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`�� AutoCred Evolution API rodando na porta ${PORT}`);
  console.log(`📱 WhatsApp API simulado funcionando!`);
  console.log(`🔗 Endpoints disponíveis:`);
  console.log(`   GET  /                               - Status da API`);
  console.log(`   GET  /manager/fetchInstances         - Listar instâncias`);
  console.log(`   POST /instance/create                - Criar instância`);
  console.log(`   GET  /instance/qrcode/:name          - Gerar QR Code`);
  console.log(`   POST /message/sendText/:name         - Enviar mensagem`);
  console.log(`   GET  /messages/:name                 - Listar mensagens`);
  console.log(`   GET  /health                         - Health check`);
}); 