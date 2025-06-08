const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Store instances in memory (will be replaced with real WhatsApp connections)
const instances = new Map();

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'AutoCred Evolution API - Preparado para Baileys',
    version: '4.1.0-STABLE',
    message: 'API funcionando e pronta para implementar Baileys',
    timestamp: new Date().toISOString()
  });
});

// Create WhatsApp instance
app.post('/instance/create', async (req, res) => {
  try {
    const { instanceName } = req.body;
    
    if (!instanceName) {
      return res.status(400).json({ 
        error: 'instanceName é obrigatório',
        example: { instanceName: 'meu-whatsapp' }
      });
    }
    
    // Create instance placeholder (ready for Baileys integration)
    const instance = {
      name: instanceName,
      status: 'created',
      created: new Date().toISOString(),
      connectionStatus: 'disconnected',
      qrGenerated: false,
      ready: false
    };
    
    instances.set(instanceName, instance);
    
    res.json({
      success: true,
      instance: instanceName,
      status: 'created',
      message: 'Instância criada com sucesso - Pronta para QR Code',
      data: instance
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

// Generate QR Code (placeholder for real Baileys QR)
app.get('/instance/qrcode/:name', async (req, res) => {
  try {
    const instanceName = req.params.name;
    
    if (!instances.has(instanceName)) {
      return res.status(404).json({ 
        error: 'Instância não encontrada',
        message: `Instância '${instanceName}' não existe. Crie primeiro com POST /instance/create`
      });
    }
    
    // This will be replaced with real Baileys QR generation
    // For now, generate a structured QR that looks like WhatsApp format
    const timestamp = Date.now();
    const sessionId = Math.random().toString(36).substring(2, 15);
    
    // WhatsApp-like QR structure (will be real when Baileys is added)
    const qrData = JSON.stringify({
      instanceName: instanceName,
      timestamp: timestamp,
      sessionId: sessionId,
      server: 'autocred-evolution-api',
      type: 'whatsapp-auth',
      // This structure matches what Baileys would generate
      ref: `${instanceName}_${sessionId}`,
      clientId: `AutoCred_${timestamp}`
    });
    
    // Generate actual QR code image
    const qrCodeImage = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    });
    
    // Update instance status
    const instance = instances.get(instanceName);
    instance.qrGenerated = true;
    instance.lastQR = new Date().toISOString();
    instance.status = 'waiting-for-qr-scan';
    
    res.json({
      success: true,
      instanceName: instanceName,
      qrcode: qrCodeImage,
      qrData: qrData,
      status: 'qr-generated',
      message: 'QR Code gerado - Escaneie com WhatsApp',
      timestamp: new Date().toISOString(),
      note: 'Estrutura preparada para Baileys - QR real será implementado em seguida'
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao gerar QR Code',
      details: error.message 
    });
  }
});

// Get instance status
app.get('/instance/status/:name', (req, res) => {
  try {
    const instanceName = req.params.name;
    
    if (!instances.has(instanceName)) {
      return res.status(404).json({ 
        error: 'Instância não encontrada' 
      });
    }
    
    const instance = instances.get(instanceName);
    
    res.json({
      success: true,
      instanceName: instanceName,
      status: instance.status,
      connectionStatus: instance.connectionStatus,
      created: instance.created,
      qrGenerated: instance.qrGenerated,
      ready: instance.ready,
      lastUpdate: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao verificar status',
      details: error.message 
    });
  }
});

// List all instances
app.get('/instance/list', (req, res) => {
  try {
    const instanceList = Array.from(instances.entries()).map(([name, data]) => ({
      name,
      status: data.status,
      connectionStatus: data.connectionStatus,
      created: data.created,
      qrGenerated: data.qrGenerated,
      ready: data.ready
    }));
    
    res.json({
      success: true,
      count: instanceList.length,
      instances: instanceList,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao listar instâncias',
      details: error.message 
    });
  }
});

// Delete instance
app.delete('/instance/delete/:name', (req, res) => {
  try {
    const instanceName = req.params.name;
    
    if (!instances.has(instanceName)) {
      return res.status(404).json({ 
        error: 'Instância não encontrada' 
      });
    }
    
    instances.delete(instanceName);
    
    res.json({
      success: true,
      message: `Instância '${instanceName}' removida com sucesso`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao remover instância',
      details: error.message 
    });
  }
});

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '4.1.0-STABLE',
    instances: instances.size
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 AutoCred Evolution API v4.1.0-STABLE`);
  console.log(`📡 Servidor rodando na porta ${port}`);
  console.log(`🌐 Pronto para receber conexões WhatsApp`);
  console.log(`⚡ API estável e preparada para Baileys`);
});

module.exports = app; 