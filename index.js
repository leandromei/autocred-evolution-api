const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Store instances in memory
const instances = new Map();

// Try to load Baileys - if fails, continue with placeholder
let Baileys = null;
try {
  Baileys = require('@whiskeysockets/baileys');
  console.log('✅ Baileys loaded successfully - REAL WhatsApp connections enabled');
} catch (error) {
  console.log('⚠️ Baileys not available - Using placeholder mode');
}

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'AutoCred Evolution API - REAL WhatsApp Ready',
    version: '5.0.0-BAILEYS',
    baileys: !!Baileys,
    message: Baileys ? 'REAL WhatsApp connections available' : 'Placeholder mode - Baileys not loaded',
    timestamp: new Date().toISOString()
  });
});

// Create WhatsApp instance with REAL Baileys
app.post('/instance/create', async (req, res) => {
  try {
    const { instanceName } = req.body;
    
    if (!instanceName) {
      return res.status(400).json({ 
        error: 'instanceName é obrigatório',
        example: { instanceName: 'meu-whatsapp' }
      });
    }
    
    if (instances.has(instanceName)) {
      return res.status(409).json({ 
        error: 'Instância já existe',
        message: `Instância '${instanceName}' já foi criada`
      });
    }
    
    console.log(`🚀 Creating WhatsApp instance: ${instanceName}`);
    
    // Create instance data
    const instance = {
      name: instanceName,
      status: 'connecting',
      created: new Date().toISOString(),
      connectionStatus: 'disconnected',
      qrGenerated: false,
      ready: false,
      baileys: !!Baileys,
      socket: null,
      qrCode: null
    };
    
    if (Baileys) {
      // REAL Baileys implementation
      try {
        const { DisconnectReason, useMultiFileAuthState, makeWASocket } = Baileys;
        
        // For Railway, we'll use in-memory auth (you can change to file-based later)
        const authState = { 
          creds: {},
          keys: {},
          saveCreds: () => {},
          state: { creds: {}, keys: {} }
        };
        
        // Create REAL WhatsApp socket
        const sock = makeWASocket({
          auth: authState.state,
          printQRInTerminal: false,
          logger: {
            level: 'silent',
            child: () => ({ level: 'silent' })
          },
          browser: ['AutoCred Evolution', 'Chrome', '1.0.0'],
          generateHighQualityLinkPreview: true,
          connectTimeoutMs: 60000,
          defaultQueryTimeoutMs: 60000,
          keepAliveIntervalMs: 30000
        });
        
        instance.socket = sock;
        
        // Handle connection updates
        sock.ev.on('connection.update', async (update) => {
          const { connection, lastDisconnect, qr } = update;
          
          console.log(`[${instanceName}] Connection update:`, { connection, hasQR: !!qr });
          
          if (qr) {
            try {
              // Generate REAL WhatsApp QR code
              const qrDataURL = await QRCode.toDataURL(qr, {
                width: 400,
                margin: 2,
                color: {
                  dark: '#000000',
                  light: '#FFFFFF'
                }
              });
              
              instance.qrCode = qrDataURL;
              instance.status = 'qr_ready';
              instance.qrGenerated = true;
              
              console.log(`[${instanceName}] ✅ REAL WhatsApp QR Code generated!`);
            } catch (error) {
              console.error(`[${instanceName}] Error generating QR:`, error);
            }
          }
          
          if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            
            if (shouldReconnect) {
              console.log(`[${instanceName}] Reconnecting...`);
              instance.status = 'reconnecting';
            } else {
              console.log(`[${instanceName}] Logged out`);
              instance.status = 'disconnected';
              instance.connectionStatus = 'disconnected';
              instance.ready = false;
            }
          } else if (connection === 'open') {
            console.log(`[${instanceName}] 🎉 CONNECTED TO REAL WHATSAPP!`);
            instance.status = 'connected';
            instance.connectionStatus = 'connected';
            instance.ready = true;
            instance.qrCode = null; // Clear QR after connection
          }
        });
        
        // Handle credentials update
        sock.ev.on('creds.update', authState.saveCreds);
        
        console.log(`[${instanceName}] ✅ REAL Baileys socket created`);
        
      } catch (error) {
        console.error(`[${instanceName}] Baileys error:`, error);
        instance.status = 'error';
        instance.connectionStatus = 'error';
      }
    } else {
      // Placeholder mode
      instance.status = 'created';
      console.log(`[${instanceName}] ⚠️ Created in placeholder mode`);
    }
    
    instances.set(instanceName, instance);
    
    res.json({
      success: true,
      instance: instanceName,
      status: instance.status,
      message: Baileys ? 'REAL WhatsApp instance created with Baileys' : 'Placeholder instance created',
      baileys: !!Baileys,
      data: {
        name: instance.name,
        status: instance.status,
        created: instance.created,
        baileys: instance.baileys
      }
    });
    
  } catch (error) {
    console.error('Error creating instance:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

// Generate QR Code (REAL or placeholder)
app.get('/instance/qrcode/:name', async (req, res) => {
  try {
    const instanceName = req.params.name;
    
    if (!instances.has(instanceName)) {
      return res.status(404).json({ 
        error: 'Instância não encontrada',
        message: `Instância '${instanceName}' não existe. Crie primeiro com POST /instance/create`
      });
    }
    
    const instance = instances.get(instanceName);
    
    if (Baileys && instance.qrCode) {
      // REAL Baileys QR Code
      res.json({
        success: true,
        instanceName: instanceName,
        qrcode: instance.qrCode,
        status: 'qr-ready',
        message: '🎉 QR Code REAL do WhatsApp - Escaneie para conectar!',
        timestamp: new Date().toISOString(),
        type: 'REAL_WHATSAPP_QR',
        baileys: true
      });
      
    } else if (Baileys && !instance.qrCode) {
      // Waiting for Baileys QR
      res.json({
        success: false,
        error: 'QR Code ainda não disponível',
        message: 'Aguarde alguns segundos para o QR ser gerado...',
        status: instance.status,
        instanceName: instanceName,
        baileys: true
      });
      
    } else {
      // Placeholder QR (structured like WhatsApp)
      const timestamp = Date.now();
      const sessionId = Math.random().toString(36).substring(2, 15);
      
      const qrData = JSON.stringify({
        instanceName: instanceName,
        timestamp: timestamp,
        sessionId: sessionId,
        server: 'autocred-evolution-api',
        type: 'whatsapp-auth-placeholder',
        ref: `${instanceName}_${sessionId}`,
        clientId: `AutoCred_${timestamp}`,
        note: 'Placeholder - Aguardando Baileys'
      });
      
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
      
      instance.qrGenerated = true;
      instance.lastQR = new Date().toISOString();
      instance.status = 'waiting-for-qr-scan';
      
      res.json({
        success: true,
        instanceName: instanceName,
        qrcode: qrCodeImage,
        qrData: qrData,
        status: 'qr-generated-placeholder',
        message: '⚠️ QR Code placeholder - Baileys será implementado em seguida',
        timestamp: new Date().toISOString(),
        type: 'PLACEHOLDER_QR',
        baileys: false
      });
    }
    
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
      baileys: instance.baileys,
      lastUpdate: new Date().toISOString(),
      type: instance.baileys ? 'REAL_WHATSAPP' : 'PLACEHOLDER'
    });
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao verificar status',
      details: error.message 
    });
  }
});

// Send message (only for REAL Baileys connections)
app.post('/instance/message/send', async (req, res) => {
  try {
    const { instanceName, to, message } = req.body;
    
    if (!instanceName || !to || !message) {
      return res.status(400).json({ 
        error: 'instanceName, to, and message são obrigatórios' 
      });
    }
    
    if (!instances.has(instanceName)) {
      return res.status(404).json({ error: 'Instância não encontrada' });
    }
    
    const instance = instances.get(instanceName);
    
    if (!instance.baileys) {
      return res.status(400).json({ 
        error: 'Baileys não disponível',
        message: 'Esta instância não tem Baileys ativo'
      });
    }
    
    if (!instance.ready || !instance.socket) {
      return res.status(400).json({ 
        error: 'Instância não conectada ao WhatsApp',
        status: instance.status
      });
    }
    
    // Format phone number for WhatsApp
    const phoneNumber = to.includes('@') ? to : `${to}@s.whatsapp.net`;
    
    // Send REAL WhatsApp message
    const result = await instance.socket.sendMessage(phoneNumber, { 
      text: message 
    });
    
    res.json({
      success: true,
      messageId: result.key.id,
      to: phoneNumber,
      message: message,
      timestamp: new Date().toISOString(),
      type: 'REAL_WHATSAPP_MESSAGE'
    });
    
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      error: 'Failed to send message',
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
      ready: data.ready,
      baileys: data.baileys,
      type: data.baileys ? 'REAL_WHATSAPP' : 'PLACEHOLDER'
    }));
    
    res.json({
      success: true,
      count: instanceList.length,
      instances: instanceList,
      baileys: !!Baileys,
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
app.delete('/instance/delete/:name', async (req, res) => {
  try {
    const instanceName = req.params.name;
    
    if (!instances.has(instanceName)) {
      return res.status(404).json({ 
        error: 'Instância não encontrada' 
      });
    }
    
    const instance = instances.get(instanceName);
    
    // Close Baileys socket if exists
    if (instance.socket && instance.baileys) {
      try {
        await instance.socket.logout();
        instance.socket.end();
        console.log(`[${instanceName}] ✅ Baileys socket closed`);
      } catch (error) {
        console.error(`[${instanceName}] Error closing socket:`, error);
      }
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
    version: '5.0.0-BAILEYS',
    instances: instances.size,
    baileys: !!Baileys
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Shutting down gracefully...');
  
  for (const [name, instance] of instances) {
    try {
      if (instance.socket && instance.baileys) {
        console.log(`Closing instance: ${name}`);
        await instance.socket.logout();
        instance.socket.end();
      }
    } catch (error) {
      console.error(`Error closing instance ${name}:`, error);
    }
  }
  
  process.exit(0);
});

// Start server
app.listen(port, () => {
  console.log(`🚀 AutoCred Evolution API v5.0.0-BAILEYS`);
  console.log(`📡 Servidor rodando na porta ${port}`);
  console.log(`📱 Baileys Status: ${Baileys ? '✅ DISPONÍVEL' : '⚠️ NÃO CARREGADO'}`);
  console.log(`🌐 ${Baileys ? 'REAL WhatsApp connections enabled!' : 'Placeholder mode - install Baileys'}`);
});

module.exports = app; 