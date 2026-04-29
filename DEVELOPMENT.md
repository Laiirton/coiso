# 🛠️ Development Guide

Guia rápido para desenvolver novos recursos no WhatsApp Lottie Bot.

## Setup Inicial

```bash
# Clone e instale
git clone <repo>
cd coiso
npm install

# Copie configuração
cp .env.example .env
# Edite .env conforme necessário

# Execute em desenvolvimento
npm run dev
```

## Estrutura de Pastas

```
src/
├── bot.js                    # Entry point (inicializa serviço e handlers)
├── config/
│   └── index.js              # Todas as configs + env vars
├── services/
│   └── WhatsAppService.js    # Conexão WhatsApp, eventos, reconnect
├── handlers/
│   └── MessageHandler.js     # Processa mensagens,路由 comandos
├── commands/                 # Comandos modulares (auto-carregados)
│   ├── ping.js
│   ├── help.js
│   ├── status.js
│   └── seucomando.js         # 👈 Crie aqui
├── utils/
│   ├── logger.js             # Logger estruturado (pino)
│   └── shutdown.js           # Graceful shutdown
└── media/                    # (futuro) Processamento de mídia
```

## Criando um Novo Comando

1. **Crie o arquivo** em `src/commands/minhacommand.js`:

```javascript
/**
 * MeuComando - Faz algo útil
 */
module.exports = {
    name: 'meucomando',          // Nome (obrigatório)
    aliases: ['mc', 'cmd'],      // Alternativas (opcional)
    description: 'Faz algo legal',
    usage: '!meucomando <arg1> <arg2>',  // Como usar
    category: 'util',            // misc | admin | fun | util | media

    /**
     * @param {Object} whatsapp - Instância do WhatsAppService
     * @param {string} remoteJid - ID do chat (usuário ou grupo)
     * @param {Array} args - Argumentos do comando
     * @param {Object} context - { rawMessage, config, isGroup, isReply }
     */
    async execute(whatsapp, remoteJid, args, context) {
        // Sua lógica aqui
        await whatsapp.sendMessage(remoteJid, `Você passou: ${args.join(', ')}`);
    }
};
```

2. **Reinicie o bot** (em desenvolvimento com `--watch` futuro, ou manual):

```bash
# O comando será carregado automaticamente na próxima inicialização
npm run dev
```

3. **Teste** no WhatsApp:
```
!meucomando arg1 arg2
```

## Padrões de Código

### Nomes de Arquivos
- Use `kebab-case.js` (minúsculas, hífens)
- Ex: `download-media.js`, `send-sticker.js`

### Exportação
- Sempre `module.exports = { name, aliases, description, usage, category, execute }`

### Logging
```javascript
const Logger = require('../utils/logger');
const logger = Logger.child({ service: 'MeuComando' });

logger.info('Mensagem informativa');
logger.debug('Detalhes debug');
logger.warn('Aviso');
logger.error('Erro completo', error);
```

### Tratamento de Erros
- Sempre wrap em `try/catch` dentro de `execute`
- Mensagens de erro amigáveis para o usuário
- Stack trace apenas em `NODE_ENV=development`

### Configurações
- Acesse via `context.config` ou `require('../config')`
- Valores padrão já definidos em `src/config/index.js`

### WhatsAppService API

```javascript
// Enviar mensagem
await whatsapp.sendMessage(jid, 'texto');

// Obter status
const { connected, attempts } = whatsapp.getStatus();

// Desconectar (graceful)
await whatsapp.disconnect();
```

## Debugging

### Logs em Tempo Real

```bash
# Development com logs verbosos
LOG_LEVEL=debug NODE_ENV=development npm run dev

# Ver logs arquivados
tail -f logs/bot-$(date +%Y-%m-%d).log
```

### Inspect Debugger

```bash
node --inspect src/bot.js
# Abra chrome://inspect no Chrome
```

### Baileys Debug

Ative logs do Baileys (muito verboso):

```env
LOG_LEVEL=trace
```

## Testando

### Teste Manual (WhatsApp)

1. Execute o bot
2. Escaneie o QR code (primeira vez)
3. Envie comandos para seu próprio número ou grupo

### Teste Automatizado (futuro)

```bash
npm test
```

## Deploy

### Local (systemd)

```bash
# Copie para produção
sudo cp src/bot.js /opt/whatsapp-bot/
sudo cp .env /opt/whatsapp-bot/.env

# Configure service
sudo nano /etc/systemd/system/whatsapp-bot.service
```

```ini
[Unit]
Description=WhatsApp Bot
After=network.target

[Service]
Type=simple
User=botuser
WorkingDirectory=/opt/whatsapp-bot
Environment=NODE_ENV=production
ExecStart=/usr/bin/node src/bot.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable whatsapp-bot
sudo systemctl start whatsapp-bot
sudo systemctl status whatsapp-bot
```

### Docker (em breve)

## Boas Práticas

1. **Nunca bloqueie o event loop** - Use `async/await`
2. **Valide inputs** - Args podem ser vazios
3. **Use categories** - Organize comandos por função
4. **Documente** - Adicione JSDoc nos métodos complexos
5. **Teste** - Teste local antes de commit
6. **Commits claros** - Mensagens descritivas

## Exemplos Úteis

### Comando que requer resposta (reply)

```javascript
module.exports = {
    name: 'quote',
    async execute(whatsapp, remoteJid, args, context) {
        if (!context.isReply) {
            return await whatsapp.sendMessage(
                remoteJid,
                '⚠️ Responda a uma mensagem para usar este comando.'
            );
        }
        // Lógica com a mensagem quotada...
    }
};
```

### Comando admin only

```javascript
if (!context.config.adminNumbers.includes(remoteJid.split('@')[0])) {
    return; // Silenciosamente ignora
}
```

### Comando com rate limit (simples)

```javascript
const lastUsed = new Map();

module.exports = {
    async execute(whatsapp, remoteJid, args, context) {
        const now = Date.now();
        const last = lastUsed.get(remoteJid) || 0;

        if (now - last < 5000) { // 5s cooldown
            return await whatsapp.sendMessage(remoteJid, '⏳ Aguarde 5s.');
        }

        lastUsed.set(remoteJid, now);
        // ...
    }
};
```

---

**Dúvidas?** Abra uma issue no repositório.
