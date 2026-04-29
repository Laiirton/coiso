# Dockerfile
FROM node:18-alpine

# Diretório de trabalho
WORKDIR /app

# Copiar dependências primeiro (cache layer)
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copiar código fonte
COPY src/ ./src/
COPY .env.example ./.env

# Criar diretórios necessários
RUN mkdir -p logs tmp auth_info_baileys

# Expôr porta caso adicione API no futuro
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('./src/services/WhatsAppService').getStatus().connected || process.exit(1)"

# Comando de início
CMD ["node", "src/bot.js"]
