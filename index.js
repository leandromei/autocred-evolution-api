const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Store instances in memory
const instances = new Map();

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'Evolution API Running',
    version: '3.0.0',
    timestamp: new Date().toISOString()
  });
});

// Create instance
app.post('/instance/create', (req, res) => {
  try {
    const { instanceName } = req.body;
    
    if (!instanceName) {
      return res.status(400).json({ error: 'instanceName é obrigatório' });
    }
    
    // Create instance
    const instance = {
      name: instanceName,
      status: 'created',
      created: new Date().toISOString(),
      qrcode: null
    };
    
    instances.set(instanceName, instance);
    
    res.json({
      success: true,
      instance: {
        name: instanceName,
        status: 'created'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate QR Code
app.get('/instance/qrcode/:name', async (req, res) => {
  try {
    const instanceName = req.params.name;
    
    if (!instances.has(instanceName)) {
      return res.status(404).json({ error: 'Instância não encontrada' });
    }
    
    // Generate WhatsApp-like QR data
    const timestamp = Date.now();
    const randomId = Math.floor(Math.random() * 1000000);
    const qrData = `${instanceName}-${timestamp}-${randomId}@c.us`;
    
    // Generate QR Code
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    // Update instance
    const instance = instances.get(instanceName);
    instance.qrcode = qrCodeDataURL;
    instance.status = 'qr_generated';
    instance.lastQR = new Date().toISOString();
    
    res.json({
      success: true,
      qrcode: qrCodeDataURL,
      instance: instanceName,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get instance status
app.get('/instance/status/:name', (req, res) => {
  try {
    const instanceName = req.params.name;
    
    if (!instances.has(instanceName)) {
      return res.status(404).json({ error: 'Instância não encontrada' });
    }
    
    const instance = instances.get(instanceName);
    
    res.json({
      success: true,
      instance: {
        name: instance.name,
        status: instance.status,
        created: instance.created,
        lastQR: instance.lastQR || null
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List instances
app.get('/instance/list', (req, res) => {
  try {
    const instanceList = Array.from(instances.values()).map(instance => ({
      name: instance.name,
      status: instance.status,
      created: instance.created,
      lastQR: instance.lastQR || null
    }));
    
    res.json({
      success: true,
      instances: instanceList,
      total: instanceList.length
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
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`Evolution API rodando na porta ${port}`);
}); 