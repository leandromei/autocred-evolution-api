FROM node:18-alpine

# Instalar dependências básicas
RUN apk add --no-cache git curl

# Clonar Evolution API
WORKDIR /app
RUN git clone https://github.com/EvolutionAPI/evolution-api.git .

# Instalar dependências
RUN npm install --production

# Criar arquivos de configuração mínima
RUN mkdir -p instances store

# Configurar variáveis básicas
ENV NODE_ENV=production
ENV PORT=10000
ENV DATABASE_ENABLED=false
ENV AUTHENTICATION_TYPE=apikey
ENV AUTHENTICATION_API_KEY=autocred-key-2024

# Expor porta
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:10000/manager/fetchInstances || exit 1

# Comando de inicialização
CMD ["npm", "start"] 