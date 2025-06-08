const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Global state management
const whatsappInstances = new Map();
const connectionStates = new Map();

// Try to load Baileys if available (local environment)
let baileys;
let useMultiFileAuthState;
let DisconnectReason;
let makeWASocket;

try {
    baileys = require('@whiskeysockets/baileys');
    useMultiFileAuthState = baileys.useMultiFileAuthState;
    DisconnectReason = baileys.DisconnectReason;
    makeWASocket = baileys.makeWASocket;
    console.log('✅ Baileys loaded - REAL WhatsApp mode enabled');
} catch (error) {
    console.log('⚠️  Baileys not available - Using compatibility mode for Railway');
}

// Real Baileys WhatsApp connection (when available)
async function createRealWhatsAppConnection(instanceId) {
    if (!baileys) {
        throw new Error('Baileys not available in this environment');
    }

    const { state, saveCreds } = await useMultiFileAuthState(`./auth_info_${instanceId}`);
    
    const socket = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        generateHighQualityLinkPreview: true,
    });

    return new Promise((resolve, reject) => {
        socket.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                try {
                    const qrCodeDataURL = await QRCode.toDataURL(qr);
                    whatsappInstances.set(instanceId, {
                        qrCode: qrCodeDataURL,
                        status: 'qr_ready',
                        socket: socket,
                        isReal: true,
                        createdAt: new Date()
                    });
                    resolve({ qrCode: qrCodeDataURL, instanceId, isReal: true });
                } catch (error) {
                    reject(error);
                }
            }
            
            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                if (shouldReconnect) {
                    console.log(`🔄 Instance ${instanceId} reconnecting...`);
                    setTimeout(() => createRealWhatsAppConnection(instanceId), 3000);
                }
            } else if (connection === 'open') {
                console.log(`✅ Instance ${instanceId} connected successfully!`);
                connectionStates.set(instanceId, 'connected');
            }
        });

        socket.ev.on('creds.update', saveCreds);
    });
}

// High-fidelity simulation for Railway deployment
async function createSimulatedWhatsAppConnection(instanceId) {
    const qrData = `2@${Math.random().toString(36).substring(2, 15)},${Math.random().toString(36).substring(2, 15)},${Date.now()}`;
    
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        width: 256,
        margin: 2,
        color: {
            dark: '#000000',
            light: '#FFFFFF'
        }
    });

    whatsappInstances.set(instanceId, {
        qrCode: qrCodeDataURL,
        status: 'qr_ready',
        socket: null,
        isReal: false,
        createdAt: new Date(),
        qrData: qrData
    });

    return { qrCode: qrCodeDataURL, instanceId, isReal: false };
}

// Routes
app.get('/', (req, res) => {
    const mode = baileys ? 'REAL' : 'COMPATIBILITY';
    res.json({
        service: 'AutoCred Evolution API',
        version: '3.1.0-RAILWAY-LITE',
        mode: mode,
        status: 'online',
        timestamp: new Date().toISOString(),
        instances: whatsappInstances.size,
        environment: process.env.NODE_ENV || 'development'
    });
});

app.post('/instance/create/:instanceId', async (req, res) => {
    const { instanceId } = req.params;
    
    try {
        console.log(`🚀 Creating WhatsApp instance: ${instanceId}`);
        
        let result;
        if (baileys) {
            // Use real Baileys if available
            result = await createRealWhatsAppConnection(instanceId);
        } else {
            // Use simulation for Railway
            result = await createSimulatedWhatsAppConnection(instanceId);
        }
        
        res.json({
            success: true,
            instanceId,
            qrCode: result.qrCode,
            message: `Instance ${instanceId} created successfully`,
            mode: result.isReal ? 'REAL' : 'COMPATIBILITY',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error(`❌ Error creating instance ${instanceId}:`, error);
        res.status(500).json({
            success: false,
            error: error.message,
            instanceId,
            timestamp: new Date().toISOString()
        });
    }
});

app.get('/instance/qr/:instanceId', async (req, res) => {
    const { instanceId } = req.params;
    const instance = whatsappInstances.get(instanceId);
    
    if (!instance) {
        return res.status(404).json({
            success: false,
            error: 'Instance not found',
            instanceId
        });
    }
    
    res.json({
        success: true,
        instanceId,
        qrCode: instance.qrCode,
        status: instance.status,
        isReal: instance.isReal,
        timestamp: new Date().toISOString()
    });
});

app.get('/instance/status/:instanceId', (req, res) => {
    const { instanceId } = req.params;
    const instance = whatsappInstances.get(instanceId);
    
    if (!instance) {
        return res.status(404).json({
            success: false,
            error: 'Instance not found',
            instanceId
        });
    }
    
    res.json({
        success: true,
        instanceId,
        status: instance.status,
        isReal: instance.isReal,
        connected: connectionStates.get(instanceId) === 'connected',
        createdAt: instance.createdAt,
        timestamp: new Date().toISOString()
    });
});

app.post('/instance/send/:instanceId', async (req, res) => {
    const { instanceId } = req.params;
    const { number, message } = req.body;
    const instance = whatsappInstances.get(instanceId);
    
    if (!instance) {
        return res.status(404).json({
            success: false,
            error: 'Instance not found',
            instanceId
        });
    }
    
    try {
        if (instance.isReal && instance.socket) {
            // Send real message via Baileys
            const jid = `${number}@s.whatsapp.net`;
            await instance.socket.sendMessage(jid, { text: message });
        } else {
            // Simulate message sending
            console.log(`📱 [SIMULATED] Sending to ${number}: ${message}`);
        }
        
        res.json({
            success: true,
            instanceId,
            message: 'Message sent successfully',
            to: number,
            isReal: instance.isReal,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error(`❌ Error sending message:`, error);
        res.status(500).json({
            success: false,
            error: error.message,
            instanceId,
            timestamp: new Date().toISOString()
        });
    }
});

app.get('/instances', (req, res) => {
    const instances = Array.from(whatsappInstances.entries()).map(([id, instance]) => ({
        instanceId: id,
        status: instance.status,
        isReal: instance.isReal,
        connected: connectionStates.get(id) === 'connected',
        createdAt: instance.createdAt
    }));
    
    res.json({
        success: true,
        instances,
        total: instances.length,
        timestamp: new Date().toISOString()
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    const mode = baileys ? '🔥 REAL BAILEYS' : '⚡ COMPATIBILITY';
    console.log(`🚀 AutoCred Evolution API v3.1.0-RAILWAY-LITE`);
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🎯 Mode: ${mode}`);
    console.log(`✨ QR Code generation ready!`);
    console.log(`🔗 Frontend integration enabled!`);
}); 