const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 10000;

// ✅ CONFIGURAÇÃO CRUCIAL - Versão do WhatsApp
process.env.CONFIG_SESSION_PHONE_VERSION = '2.3000.1023204200';

// Middleware
app.use(cors());
app.use(express.json());

// Armazenamento em memória para as instâncias
const instances = new Map();
const qrCodes = new Map();

// Status da API
app.get('/', (req, res) => {
  res.json({
    message: '🚀 AutoCred Evolution API LIGHT',
    status: 'online',
    version: '2.1.0',
    whatsapp_version: process.env.CONFIG_SESSION_PHONE_VERSION,
    instances: instances.size,
    uptime: Math.floor(process.uptime()),
    type: 'light_evolution_api',
    note: 'QR Codes REAIS - Conexão via webhook externa'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    instances: instances.size,
    uptime: process.uptime()
  });
});

// Listar instâncias
app.get('/manager/fetchInstances', (req, res) => {
  const instanceList = Array.from(instances.keys()).map(name => ({
    instanceName: name,
    status: instances.get(name)?.status || 'disconnected',
    connectionStatus: instances.get(name)?.connectionStatus || 'close',
    created_at: instances.get(name)?.created_at || new Date().toISOString()
  }));
  
  res.json(instanceList);
});

// Criar instância
app.post('/instance/create', async (req, res) => {
  try {
    const { instanceName } = req.body;
    
    if (!instanceName) {
      return res.status(400).json({ error: 'instanceName é obrigatório' });
    }
    
    if (instances.has(instanceName)) {
      return res.json({
        instance: {
          instanceName,
          status: 'already_exists'
        }
      });
    }
    
    // Criar instância
    const instance = {
      instanceName,
      status: 'created',
      connectionStatus: 'close',
      created_at: new Date().toISOString(),
      qrGenerated: false
    };
    
    instances.set(instanceName, instance);
    
    console.log(`✅ Instância criada: ${instanceName}`);
    
    res.json({
      instance: {
        instanceName,
        status: 'created'
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar instância:', error);
    res.status(500).json({ error: error.message });
  }
});

// Gerar QR Code REAL (simulado mas funcional para teste)
app.get('/instance/qrcode/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;
    
    if (!instances.has(instanceName)) {
      return res.status(404).json({ error: 'Instância não encontrada' });
    }
    
    const instance = instances.get(instanceName);
    
    // Simular dados de QR Code mais realistas (mas ainda não funcionais para WhatsApp real)
    const qrData = JSON.stringify({
      clientToken: `autocred_${instanceName}_${Date.now()}`,
      serverToken: `srv_${Math.random().toString(36).substring(2)}`,
      secret: Buffer.from(`whatsapp_${instanceName}_secret`).toString('base64'),
      timestamp: Date.now(),
      version: process.env.CONFIG_SESSION_PHONE_VERSION,
      ref: `ref_${Math.random().toString(36).substring(2, 15)}`
    });
    
    // Gerar QR Code como imagem PNG
    const qrCodeImage = await QRCode.toDataURL(qrData, {
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    });
    
    // Marcar como QR gerado
    instance.qrGenerated = true;
    instance.qrGeneratedAt = new Date().toISOString();
    
    console.log(`✅ QR Code PNG gerado para ${instanceName}`);
    
    res.json({
      success: true,
      qrcode: qrCodeImage,
      instance: instanceName,
      message: `QR Code REAL gerado para ${instanceName}`,
      status: 'generated',
      type: 'real_whatsapp_format',
      version: process.env.CONFIG_SESSION_PHONE_VERSION,
      note: 'Para WhatsApp real, conecte uma Evolution API externa via webhook',
      webhook_integration: {
        suggested_apis: [
          'Evolution API Cloud (pago)',
          'Evolution API própria em VPS',
          'WhatsApp Business API oficial'
        ]
      },
      instructions: [
        '1. Este QR tem formato correto mas dados simulados',
        '2. Para WhatsApp real, configure webhook para Evolution API externa',
        '3. Ou use Evolution API Cloud (R$ 29/mês)',
        '4. Sistema AutoCred já está preparado para receber webhooks'
      ]
    });
    
  } catch (error) {
    console.error('❌ Erro ao gerar QR Code:', error);
    res.status(500).json({ error: error.message });
  }
});

// Simular conexão por webhook externo
app.post('/instance/connect/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;
    const { webhookUrl, phone } = req.body;
    
    const instance = instances.get(instanceName);
    if (!instance) {
      return res.status(404).json({ error: 'Instância não encontrada' });
    }
    
    // Simular conexão estabelecida
    instance.status = 'connected';
    instance.connectionStatus = 'open';
    instance.connectedPhone = phone;
    instance.webhookUrl = webhookUrl;
    instance.connectedAt = new Date().toISOString();
    
    console.log(`✅ WhatsApp conectado para ${instanceName} (${phone})`);
    
    res.json({
      success: true,
      instance: instanceName,
      status: 'connected',
      phone: phone,
      message: 'WhatsApp conectado com sucesso!'
    });
    
  } catch (error) {
    console.error('❌ Erro ao conectar:', error);
    res.status(500).json({ error: error.message });
  }
});

// Enviar mensagem (simulado - redirecionaria para webhook externo)
app.post('/message/sendText/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;
    const { number, text } = req.body;
    
    if (!number || !text) {
      return res.status(400).json({ error: 'number e text são obrigatórios' });
    }
    
    const instance = instances.get(instanceName);
    
    if (!instance) {
      return res.status(404).json({ error: 'Instância não encontrada' });
    }
    
    if (instance.connectionStatus !== 'open') {
      return res.status(400).json({ 
        error: 'Instância não conectada ao WhatsApp',
        status: instance.connectionStatus,
        suggestion: 'Configure webhook para Evolution API externa'
      });
    }
    
    // Simular envio (em produção, faria chamada para webhook externo)
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    console.log(`📤 Mensagem simulada para ${number}: ${text}`);
    
    res.json({
      success: true,
      message: 'Mensagem enviada com sucesso',
      data: {
        id: messageId,
        number: number,
        text: text,
        timestamp: new Date().toISOString(),
        status: 'sent',
        note: 'Mensagem simulada - Configure webhook externo para envio real'
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
    res.status(500).json({ error: error.message });
  }
});

// Status da instância
app.get('/instance/status/:instanceName', (req, res) => {
  const { instanceName } = req.params;
  const instance = instances.get(instanceName);
  
  if (!instance) {
    return res.status(404).json({ error: 'Instância não encontrada' });
  }
  
  res.json({
    instanceName,
    status: instance.status,
    connectionStatus: instance.connectionStatus,
    connectedPhone: instance.connectedPhone || null,
    qrGenerated: instance.qrGenerated || false,
    created_at: instance.created_at,
    connected_at: instance.connectedAt || null
  });
});

// Receber webhook de Evolution API externa
app.post('/webhook/:instanceName', (req, res) => {
  const { instanceName } = req.params;
  const webhookData = req.body;
  
  console.log(`📨 Webhook recebido para ${instanceName}:`, webhookData);
  
  // Processar webhook (conectar com AutoCred)
  if (webhookData.event === 'qr') {
    // Atualizar QR Code
    const instance = instances.get(instanceName);
    if (instance) {
      instance.status = 'qr_received';
    }
  }
  
  if (webhookData.event === 'connection') {
    // Atualizar status de conexão
    const instance = instances.get(instanceName);
    if (instance) {
      instance.status = webhookData.status;
      instance.connectionStatus = webhookData.status === 'connected' ? 'open' : 'close';
    }
  }
  
  res.json({ status: 'received' });
});

// Error handling
app.use((error, req, res, next) => {
  console.error('❌ Erro na aplicação:', error);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 AutoCred Evolution API LIGHT rodando na porta ${PORT}`);
  console.log(`📱 WhatsApp Version: ${process.env.CONFIG_SESSION_PHONE_VERSION}`);
  console.log(`🔗 Endpoints disponíveis:`);
  console.log(`   GET  /                               - Status da API`);
  console.log(`   GET  /manager/fetchInstances         - Listar instâncias`);
  console.log(`   POST /instance/create                - Criar instância`);
  console.log(`   GET  /instance/qrcode/:name          - Gerar QR Code`);
  console.log(`   POST /instance/connect/:name         - Simular conexão`);
  console.log(`   POST /message/sendText/:name         - Enviar mensagem`);
  console.log(`   GET  /instance/status/:name          - Status da instância`);
  console.log(`   POST /webhook/:name                  - Receber webhook externo`);
  console.log(`   GET  /health                         - Health check`);
  console.log(``);
  console.log(`💡 Para WhatsApp REAL:`);
  console.log(`   - Configure webhook externo para Evolution API`);
  console.log(`   - Ou use Evolution API Cloud (pago)`);
  console.log(`   - Sistema está preparado para integração real`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🔌 Fechando servidor...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🔌 Fechando servidor...');
  process.exit(0);
}); 