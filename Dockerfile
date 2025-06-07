FROM atendai/evolution-api:latest

# Configurar porta do Render
ENV PORT=10000
ENV SERVER_PORT=10000

# Expor porta
EXPOSE 10000

# Comando de inicialização
CMD ["npm", "start"] 