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
  
  // QR Code simulado mais realista - um QR Code SVG simples
  const qrcodeSvg = `data:image/svg+xml;base64,${Buffer.from(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="white"/>
      <rect x="10" y="10" width="20" height="20" fill="black"/>
      <rect x="40" y="10" width="20" height="20" fill="black"/>
      <rect x="70" y="10" width="20" height="20" fill="black"/>
      <rect x="100" y="10" width="20" height="20" fill="black"/>
      <rect x="130" y="10" width="20" height="20" fill="black"/>
      <rect x="160" y="10" width="20" height="20" fill="black"/>
      
      <rect x="10" y="40" width="20" height="20" fill="black"/>
      <rect x="40" y="40" width="20" height="20" fill="white"/>
      <rect x="70" y="40" width="20" height="20" fill="black"/>
      <rect x="100" y="40" width="20" height="20" fill="white"/>
      <rect x="130" y="40" width="20" height="20" fill="black"/>
      <rect x="160" y="40" width="20" height="20" fill="black"/>
      
      <rect x="10" y="70" width="20" height="20" fill="black"/>
      <rect x="40" y="70" width="20" height="20" fill="black"/>
      <rect x="70" y="70" width="20" height="20" fill="white"/>
      <rect x="100" y="70" width="20" height="20" fill="black"/>
      <rect x="130" y="70" width="20" height="20" fill="white"/>
      <rect x="160" y="70" width="20" height="20" fill="black"/>
      
      <rect x="10" y="100" width="20" height="20" fill="white"/>
      <rect x="40" y="100" width="20" height="20" fill="black"/>
      <rect x="70" y="100" width="20" height="20" fill="black"/>
      <rect x="100" y="100" width="20" height="20" fill="white"/>
      <rect x="130" y="100" width="20" height="20" fill="black"/>
      <rect x="160" y="100" width="20" height="20" fill="white"/>
      
      <rect x="10" y="130" width="20" height="20" fill="black"/>
      <rect x="40" y="130" width="20" height="20" fill="white"/>
      <rect x="70" y="130" width="20" height="20" fill="black"/>
      <rect x="100" y="130" width="20" height="20" fill="black"/>
      <rect x="130" y="130" width="20" height="20" fill="white"/>
      <rect x="160" y="130" width="20" height="20" fill="black"/>
      
      <rect x="10" y="160" width="20" height="20" fill="black"/>
      <rect x="40" y="160" width="20" height="20" fill="black"/>
      <rect x="70" y="160" width="20" height="20" fill="black"/>
      <rect x="100" y="160" width="20" height="20" fill="black"/>
      <rect x="130" y="160" width="20" height="20" fill="black"/>
      <rect x="160" y="160" width="20" height="20" fill="black"/>
      
      <!-- Canto superior esquerdo -->
      <rect x="15" y="15" width="50" height="50" fill="white" stroke="black" stroke-width="2"/>
      <rect x="25" y="25" width="30" height="30" fill="black"/>
      <rect x="35" y="35" width="10" height="10" fill="white"/>
      
      <!-- Canto superior direito -->
      <rect x="135" y="15" width="50" height="50" fill="white" stroke="black" stroke-width="2"/>
      <rect x="145" y="25" width="30" height="30" fill="black"/>
      <rect x="155" y="35" width="10" height="10" fill="white"/>
      
      <!-- Canto inferior esquerdo -->
      <rect x="15" y="135" width="50" height="50" fill="white" stroke="black" stroke-width="2"/>
      <rect x="25" y="145" width="30" height="30" fill="black"/>
      <rect x="35" y="155" width="10" height="10" fill="white"/>
      
      <text x="100" y="195" font-family="Arial" font-size="8" text-anchor="middle" fill="gray">AutoCred QR Code Simulado</text>
    </svg>
  `).toString('base64')}`;
  
  res.json({
    qrcode: qrcodeSvg,
    instance: instanceName,
    message: `QR Code gerado para ${instanceName}. Escaneie com seu WhatsApp.`,
    status: 'generated',
    type: 'simulation',
    instructions: [
      '1. Abra o WhatsApp no seu celular',
      '2. Vá em Configurações > Aparelhos conectados',
      '3. Toque em "Conectar um aparelho"',
      '4. Escaneie este QR Code',
      '5. Aguarde a conexão ser estabelecida'
    ]
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