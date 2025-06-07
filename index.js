const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// ✅ CONFIGURAÇÃO CRUCIAL - Versão do WhatsApp
process.env.CONFIG_SESSION_PHONE_VERSION = '2.3000.1023204200';

// Middleware
app.use(cors());
app.use(express.json());

// Logger
const logger = pino({ level: 'info' });

// Armazenamento de instâncias
const instances = new Map();
const qrCodes = new Map();

// Garantir diretório de sessões (para ambiente sem filesystem persistente)
const sessionsDir = '/tmp/sessions';
if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir, { recursive: true });
}

// Status da API
app.get('/', (req, res) => {
  res.json({
    message: '🚀 AutoCred Evolution API REAL',
    status: 'online',
    version: '2.0.0',
    whatsapp_version: process.env.CONFIG_SESSION_PHONE_VERSION,
    instances: instances.size,
    uptime: Math.floor(process.uptime()),
    type: 'real_evolution_api'
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
      sock: null,
      qr: null,
      created_at: new Date().toISOString()
    };
    
    instances.set(instanceName, instance);
    
    logger.info(`✅ Instância criada: ${instanceName}`);
    
    res.json({
      instance: {
        instanceName,
        status: 'created'
      }
    });
    
  } catch (error) {
    logger.error('❌ Erro ao criar instância:', error);
    res.status(500).json({ error: error.message });
  }
});

// Conectar instância WhatsApp
async function connectWhatsApp(instanceName) {
  try {
    const sessionPath = path.join(sessionsDir, instanceName);
    
    // Criar diretório da sessão se não existir
    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true });
    }
    
    // Usar auth state para sessão persistente
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    
    // Versão mais recente do Baileys
    const { version, isLatest } = await fetchLatestBaileysVersion();
    logger.info(`📱 Usando WA v${version.join('.')}, É a mais recente: ${isLatest}`);
    
    // Criar socket WhatsApp
    const sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }), // Silent para reduzir logs
      printQRInTerminal: false,
      auth: state,
      browser: ['AutoCred', 'Chrome', '91.0.4472'],
      markOnlineOnConnect: false,
    });
    
    // Atualizar instância
    const instance = instances.get(instanceName);
    instance.sock = sock;
    instance.status = 'connecting';
    
    // Event: Connection update
    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        logger.info(`📱 QR Code REAL gerado para ${instanceName}`);
        instance.qr = qr;
        qrCodes.set(instanceName, qr);
      }
      
      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
        logger.info(`🔌 Conexão fechada para ${instanceName}, reconectar: ${shouldReconnect}`);
        
        instance.status = 'disconnected';
        instance.connectionStatus = 'close';
        
        if (shouldReconnect) {
          setTimeout(() => connectWhatsApp(instanceName), 5000);
        }
      } else if (connection === 'open') {
        logger.info(`✅ WhatsApp conectado para ${instanceName}!`);
        instance.status = 'connected';
        instance.connectionStatus = 'open';
        instance.qr = null;
        qrCodes.delete(instanceName);
      }
    });
    
    // Event: Salvar credenciais
    sock.ev.on('creds.update', saveCreds);
    
    return sock;
    
  } catch (error) {
    logger.error(`❌ Erro ao conectar ${instanceName}:`, error);
    throw error;
  }
}

// Gerar QR Code REAL
app.get('/instance/qrcode/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;
    
    if (!instances.has(instanceName)) {
      return res.status(404).json({ error: 'Instância não encontrada' });
    }
    
    const instance = instances.get(instanceName);
    
    // Se não está conectando, iniciar conexão
    if (!instance.sock) {
      logger.info(`🔄 Iniciando conexão WhatsApp para ${instanceName}`);
      await connectWhatsApp(instanceName);
    }
    
    // Aguardar QR Code ser gerado (timeout 30s)
    let attempts = 0;
    const maxAttempts = 30;
    
    while (!qrCodes.has(instanceName) && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
    
    const qrData = qrCodes.get(instanceName);
    
    if (!qrData) {
      return res.status(408).json({ 
        error: 'QR Code não gerado no tempo esperado',
        suggestion: 'Tente novamente em alguns segundos'
      });
    }
    
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
    
    logger.info(`✅ QR Code PNG gerado para ${instanceName}`);
    
    res.json({
      success: true,
      qrcode: qrCodeImage,
      instance: instanceName,
      message: `QR Code REAL gerado para ${instanceName}. Escaneie com WhatsApp!`,
      status: 'generated',
      type: 'real_whatsapp',
      instructions: [
        '1. Abra o WhatsApp no seu celular',
        '2. Vá em Configurações > Aparelhos conectados',
        '3. Toque em "Conectar um aparelho"',
        '4. Escaneie este QR Code',
        '5. Aguarde a conexão ser estabelecida'
      ]
    });
    
  } catch (error) {
    logger.error('❌ Erro ao gerar QR Code:', error);
    res.status(500).json({ error: error.message });
  }
});

// Enviar mensagem REAL
app.post('/message/sendText/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;
    const { number, text } = req.body;
    
    if (!number || !text) {
      return res.status(400).json({ error: 'number e text são obrigatórios' });
    }
    
    const instance = instances.get(instanceName);
    
    if (!instance || !instance.sock || instance.connectionStatus !== 'open') {
      return res.status(400).json({ 
        error: 'Instância não conectada ao WhatsApp',
        status: instance?.connectionStatus || 'not_found'
      });
    }
    
    // Formatar número
    let formattedNumber = number.replace(/\D/g, '');
    if (!formattedNumber.endsWith('@s.whatsapp.net')) {
      formattedNumber = `${formattedNumber}@s.whatsapp.net`;
    }
    
    // Enviar mensagem REAL
    const messageInfo = await instance.sock.sendMessage(formattedNumber, { text });
    
    logger.info(`✅ Mensagem REAL enviada para ${formattedNumber}: ${text}`);
    
    res.json({
      success: true,
      message: 'Mensagem enviada com sucesso',
      data: {
        id: messageInfo.key.id,
        number: formattedNumber,
        text,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('❌ Erro ao enviar mensagem:', error);
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
    hasQr: qrCodes.has(instanceName)
  });
});

// Webhook (receber mensagens)
app.post('/webhook/:instanceName', (req, res) => {
  const { instanceName } = req.params;
  logger.info(`📨 Webhook recebido para ${instanceName}:`, req.body);
  res.json({ status: 'received' });
});

// Error handling
app.use((error, req, res, next) => {
  logger.error('❌ Erro na aplicação:', error);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Iniciar servidor
app.listen(PORT, () => {
  logger.info(`🚀 AutoCred Evolution API REAL rodando na porta ${PORT}`);
  logger.info(`📱 WhatsApp Version: ${process.env.CONFIG_SESSION_PHONE_VERSION}`);
  logger.info(`🔗 Endpoints disponíveis:`);
  logger.info(`   GET  /                               - Status da API`);
  logger.info(`   GET  /manager/fetchInstances         - Listar instâncias`);
  logger.info(`   POST /instance/create                - Criar instância`);
  logger.info(`   GET  /instance/qrcode/:name          - Gerar QR Code REAL`);
  logger.info(`   POST /message/sendText/:name         - Enviar mensagem REAL`);
  logger.info(`   GET  /instance/status/:name          - Status da instância`);
  logger.info(`   GET  /health                         - Health check`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('🔌 Fechando servidor...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('🔌 Fechando servidor...');
  process.exit(0);
}); 