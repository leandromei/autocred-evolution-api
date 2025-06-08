const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const { DisconnectReason, useMultiFileAuthState, makeWASocket } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Store WhatsApp instances
const whatsappInstances = new Map();
const sessionData = new Map();

// Ensure sessions directory exists
const sessionsDir = path.join(__dirname, 'sessions');
if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir, { recursive: true });
}

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'AutoCred Evolution API - REAL WhatsApp Connection',
    version: '4.0.0-REAL',
    timestamp: new Date().toISOString(),
    instances: whatsappInstances.size
  });
});

// Create WhatsApp instance with REAL Baileys
app.post('/instance/create', async (req, res) => {
  try {
    const { instanceName } = req.body;
    
    if (!instanceName) {
      return res.status(400).json({ error: 'instanceName é obrigatório' });
    }

    if (whatsappInstances.has(instanceName)) {
      return res.status(409).json({ error: 'Instância já existe' });
    }

    console.log(`Creating REAL WhatsApp instance: ${instanceName}`);
    
    // Create session directory for this instance
    const sessionPath = path.join(sessionsDir, instanceName);
    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true });
    }

    // Initialize auth state
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    
    // Create Baileys socket
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: {
        level: 'silent',
        child: () => ({ level: 'silent' })
      },
      browser: ['AutoCred', 'Chrome', '1.0.0'],
      generateHighQualityLinkPreview: true,
      syncFullHistory: false,
      markOnlineOnConnect: true,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 30000,
      retryRequestDelayMs: 5000
    });

    // Store instance data
    const instanceData = {
      socket: sock,
      status: 'connecting',
      qrCode: null,
      sessionPath: sessionPath,
      created: new Date().toISOString(),
      connected: false
    };

    whatsappInstances.set(instanceName, instanceData);

    // Handle connection updates
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      console.log(`[${instanceName}] Connection update:`, { connection, hasQR: !!qr });

      if (qr) {
        try {
          // Generate REAL QR code
          const qrDataURL = await QRCode.toDataURL(qr, {
            width: 400,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          
          instanceData.qrCode = qrDataURL;
          instanceData.status = 'qr_ready';
          
          console.log(`[${instanceName}] QR Code generated - REAL WhatsApp QR!`);
        } catch (error) {
          console.error(`[${instanceName}] Error generating QR:`, error);
        }
      }

      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
        
        if (shouldReconnect) {
          console.log(`[${instanceName}] Reconnecting...`);
          instanceData.status = 'reconnecting';
          // Socket will auto-reconnect
        } else {
          console.log(`[${instanceName}] Logged out, cleaning up`);
          instanceData.status = 'disconnected';
          instanceData.connected = false;
          whatsappInstances.delete(instanceName);
        }
      } else if (connection === 'open') {
        console.log(`[${instanceName}] CONNECTED TO WHATSAPP!`);
        instanceData.status = 'connected';
        instanceData.connected = true;
        instanceData.qrCode = null; // Clear QR after connection
      }
    });

    // Handle credentials update
    sock.ev.on('creds.update', saveCreds);

    res.json({
      success: true,
      message: 'Real WhatsApp instance created',
      instance: {
        name: instanceName,
        status: 'connecting',
        type: 'REAL_WHATSAPP'
      }
    });

  } catch (error) {
    console.error('Error creating instance:', error);
    res.status(500).json({ 
      error: 'Failed to create WhatsApp instance',
      details: error.message 
    });
  }
});

// Get REAL QR Code for WhatsApp connection
app.get('/instance/qrcode/:name', async (req, res) => {
  try {
    const instanceName = req.params.name;
    
    if (!whatsappInstances.has(instanceName)) {
      return res.status(404).json({ error: 'Instância não encontrada' });
    }

    const instance = whatsappInstances.get(instanceName);
    
    if (!instance.qrCode) {
      return res.status(404).json({ 
        error: 'QR Code não disponível',
        status: instance.status,
        message: 'Aguarde a geração do QR ou instância já conectada'
      });
    }

    res.json({
      success: true,
      qrcode: instance.qrCode,
      instance: instanceName,
      status: instance.status,
      timestamp: new Date().toISOString(),
      type: 'REAL_WHATSAPP_QR'
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get instance status
app.get('/instance/status/:name', (req, res) => {
  try {
    const instanceName = req.params.name;
    
    if (!whatsappInstances.has(instanceName)) {
      return res.status(404).json({ error: 'Instância não encontrada' });
    }

    const instance = whatsappInstances.get(instanceName);
    
    res.json({
      success: true,
      instance: {
        name: instanceName,
        status: instance.status,
        connected: instance.connected,
        created: instance.created,
        hasQR: !!instance.qrCode,
        type: 'REAL_WHATSAPP'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send WhatsApp message (REAL)
app.post('/instance/message/send', async (req, res) => {
  try {
    const { instanceName, to, message } = req.body;
    
    if (!instanceName || !to || !message) {
      return res.status(400).json({ 
        error: 'instanceName, to, and message são obrigatórios' 
      });
    }

    if (!whatsappInstances.has(instanceName)) {
      return res.status(404).json({ error: 'Instância não encontrada' });
    }

    const instance = whatsappInstances.get(instanceName);
    
    if (!instance.connected) {
      return res.status(400).json({ 
        error: 'Instância não conectada ao WhatsApp' 
      });
    }

    // Format phone number for WhatsApp
    const phoneNumber = to.includes('@') ? to : `${to}@s.whatsapp.net`;
    
    // Send real WhatsApp message
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

// List instances
app.get('/instance/list', (req, res) => {
  try {
    const instanceList = Array.from(whatsappInstances.entries()).map(([name, instance]) => ({
      name: name,
      status: instance.status,
      connected: instance.connected,
      created: instance.created,
      hasQR: !!instance.qrCode,
      type: 'REAL_WHATSAPP'
    }));
    
    res.json({
      success: true,
      instances: instanceList,
      total: instanceList.length,
      type: 'REAL_WHATSAPP_INSTANCES'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete instance
app.delete('/instance/delete/:name', async (req, res) => {
  try {
    const instanceName = req.params.name;
    
    if (!whatsappInstances.has(instanceName)) {
      return res.status(404).json({ error: 'Instância não encontrada' });
    }

    const instance = whatsappInstances.get(instanceName);
    
    // Close socket connection
    if (instance.socket) {
      await instance.socket.logout();
      instance.socket.end();
    }
    
    // Remove from memory
    whatsappInstances.delete(instanceName);
    
    // Optional: Remove session files
    const sessionPath = instance.sessionPath;
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
    }

    res.json({
      success: true,
      message: `Instância ${instanceName} removida`,
      type: 'REAL_WHATSAPP_DELETE'
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    instances: whatsappInstances.size,
    type: 'REAL_WHATSAPP_API'
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  
  for (const [name, instance] of whatsappInstances) {
    try {
      console.log(`Closing instance: ${name}`);
      if (instance.socket) {
        await instance.socket.logout();
        instance.socket.end();
      }
    } catch (error) {
      console.error(`Error closing instance ${name}:`, error);
    }
  }
  
  process.exit(0);
});

app.listen(port, () => {
  console.log(`🚀 AutoCred Evolution API v4.0.0-REAL running on port ${port}`);
  console.log(`📱 REAL WhatsApp connections with Baileys`);
  console.log(`💾 Sessions saved to: ${sessionsDir}`);
}); 