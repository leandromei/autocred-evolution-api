# 🚀 AutoCred Evolution API REAL

Evolution API verdadeira para integração WhatsApp com AutoCred SaaS.

## ✅ Configuração Crucial

**WhatsApp Version:** `2.3000.1023204200` (obrigatório para funcionamento)

## 🔧 Deploy no Render (GRATUITO)

### 1. Fazer Deploy
1. Entre no [Render](https://render.com)
2. Conecte seu repositório GitHub
3. Crie um novo **Web Service**
4. Configure as variáveis de ambiente:
   - `CONFIG_SESSION_PHONE_VERSION` = `2.3000.1023204200`
   - `NODE_ENV` = `production`

### 2. Comandos Build
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Health Check Path:** `/health`

### 3. Verificar Deploy
Acesse sua URL do Render e verifique se aparece:
```json
{
  "message": "🚀 AutoCred Evolution API REAL",
  "status": "online",
  "whatsapp_version": "2.3000.1023204200"
}
```

## 📱 Como Usar

### 1. Criar Instância
```bash
POST /instance/create
{
  "instanceName": "autocred"
}
```

### 2. Gerar QR Code REAL
```bash
GET /instance/qrcode/autocred
```

### 3. Enviar Mensagem REAL
```bash
POST /message/sendText/autocred
{
  "number": "5511999999999",
  "text": "Olá! Mensagem enviada via Evolution API REAL!"
}
```

## 🔗 Endpoints Disponíveis

- `GET /` - Status da API
- `GET /health` - Health check
- `GET /manager/fetchInstances` - Listar instâncias
- `POST /instance/create` - Criar instância
- `GET /instance/qrcode/:name` - Gerar QR Code REAL
- `POST /message/sendText/:name` - Enviar mensagem REAL
- `GET /instance/status/:name` - Status da instância

## 🎯 Diferenças da Versão Simulada

✅ **QR Codes REAIS** - Gerados pelo Baileys
✅ **Mensagens REAIS** - Enviadas via WhatsApp
✅ **Sessões PERSISTENTES** - Mantém conexão
✅ **Webhooks FUNCIONAIS** - Recebe mensagens
✅ **Versão CORRETA** - `2.3000.1023204200`

## 💡 Suporte

Caso tenha dúvidas, verifique os logs no Render ou entre em contato. 