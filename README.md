# 🚀 WhatsApp Lottie Bot

Bot profissional para WhatsApp usando Baileys v7 com envio de stickers Lottie (.was) e arquitetura limpa.

## ✨ Features

- ✅ Conexão estável com WhatsApp Web via Baileys v7
- ✅ Geração automática de QR code no terminal
- ✅ Reconexão automática com backoff exponencial
- ✅ Sistema de comandos modular e extensível
- ✅ Logs profissionais com rotação diária
- ✅ Suporte a múltiplos comandos com aliases
- ✅ Graceful shutdown (SIGINT, SIGTERM)
- ✅ Configuração via variáveis de ambiente
- ✅ Pronto para produção

## 📦 Estrutura do Projeto

```
whatsapp-bot/
├── src/
│   ├── bot.js                    # Ponto de entrada principal
│   ├── config/
│   │   └── index.js              # Configurações centralizadas
│   ├── services/
│   │   └── WhatsAppService.js    # Serviço de conexão WhatsApp
│   ├── handlers/
│   │   └── MessageHandler.js     # Processador de mensagens
│   ├── commands/
│   │   ├── ping.js               # Comando de exemplo
│   │   ├── help.js               # Lista de comandos
│   │   ├── status.js             # Status do bot
│   │   └── index.js              # Index (auto-descoberta)
│   ├── utils/
│   │   ├── logger.js             # Logger profissional
│   │   └── shutdown.js           # Utilitários de shutdown
│   └── media/                    # (opcional) Processamento de mídia
├── .env.example                  # Template de variáveis de ambiente
├── .gitignore
├── package.json
└── README.md
```

## 🚦 Quick Start

### 1. Instalar Dependências

```bash
npm install
```

Dependências principais:
- `baileys@^7.0.0-rc.9` - WhatsApp API
- `qrcode-terminal` - QR no terminal
- `pino` - Logging
- `dotenv` - Variáveis de ambiente

### 2. Configurar Variáveis de Ambiente

```bash
cp .env.example .env
```

Edite `.env` conforme necessário:

```env
BOT_NAME="My WhatsApp Bot"
PREFIX="!"
LOG_LEVEL=info
WA_VERSION="[2,3000,1000000000]"  # Opcional
SESSION_FOLDER="auth_info_baileys"
```

### 3. Executar

```bash
# Modo produção
npm start

# Modo desenvolvimento (com logs debug)
NODE_ENV=development LOG_LEVEL=debug npm start
```

### 4. Autenticar

Na primeira execução, um QR code aparecerá no terminal:

```
═══════════════════════════════════════════
🔐 ESCANEIE O QR CODE ABAIXO NO SEU CELULAR:
═══════════════════════════════════════════
[QR ASCII]
═══════════════════════════════════════════
```

Abra o WhatsApp → **Dispositivos vinculados** → **Vincular um dispositivo** e escaneie.

Após o primeiro login, a sessão é salva em `auth_info_baileys/` e não será necessário escanear novamente (a menos que a sessão expires).

## 🎯 Comandos

| Comando | Aliases | Descrição |
|---------|---------|-----------|
| `!ping` | `p`, `pong` | Verifica se o bot está online |
| `!help` | `h`, `ajuda` | Lista todos os comandos |
| `!status` | `s`, `info` | Mostra status detalhado |

### Criando Novos Comandos

Crie um arquivo em `src/commands/`:

```javascript
// src/commands/meucomando.js
module.exports = {
    name: 'meucomando',
    aliases: ['mc', 'cmd'],
    description: 'Descrição do comando',
    usage: '!meucomando <argumentos>',
    category: 'util',  // misc | admin | fun | util

    async execute(whatsapp, remoteJid, args, context) {
        // whatsapp.sendMessage(remoteJid, 'Olá!');
        // remoteJid: número/grupo que enviou
        // args: array de argumentos
        // context: { rawMessage, config }
    }
};
```

O comando será carregado automaticamente.

## ⚙️ Configuração Avançada

### Versão do WhatsApp

Problemas de conexão? Use uma versão específica:

```env
WA_VERSION="[2,3000,1033893291]"  # Estável (recomendado)
```

### Browser Simulation

Evite bloqueios:

```env
BROWSER='["Chrome","Windows","110.0.5481.177"]'
```

### Timeouts

```env
CONNECT_TIMEOUT=60000       # 60s para conectar
RECONNECT_DELAY=15000      # 15s entre reconexões
MAX_RETRIES=5              # Máximo de tentativas
```

### Admin Only

Restrinja comandos sensíveis:

```env
ADMIN_NUMBERS="5511999999999,5511888888888"
```

No comando, adicione:

```javascript
if (!config.adminNumbers.includes(userJid)) {
    return; // Ignora não-admins
}
```

## 🧪 Desenvolvimento

### Logs

- Development: `LOG_LEVEL=debug`
- Production: `LOG_LEVEL=info`

Os logs são salvos em `logs/bot-YYYY-MM-DD.log`.

### Debug

```bash
# Ver eventos brutos do Baileys
DEBUG=* npm start

# Logs estruturados
NODE_ENV=development npm start
```

### Testando Comandos

Basta enviar mensagens no WhatsApp com o prefixo configurado:

```
!ping
!help
!status
```

## 🏗️ Arquitetura

### WhatsAppService
- Gerencia conexão e reconexão
- Emite eventos de conexão
- Encapsula lógica de autenticação

### MessageHandler
- Recebe todas as mensagens
- Faz parsing de comandos
- Roteia para handlers apropriados

### Comandos
- Módulos independentes
- Interface única `execute(whatsapp, jid, args, context)`
- Autodescoberta via `require()`

## 🐛 Troubleshooting

### QR code não aparece

1. Verifique logs em `logs/`
2. Tente versão fixa: `WA_VERSION="[2,3000,1033893291]"`
3. Aumente timeout: `CONNECT_TIMEOUT=60000`

### Erro 405 Connection Failure

Esse erro é causado por versão incompatível do WhatsApp. Use a versão fixa acima.

### Bot desconecta frequentemente

- Use `browser` configurado
- Evite muitas reconexões rápidas
- Verifique sua conexão de internet

### Comando não funciona

1. Verifique se o arquivo está em `src/commands/`
2. Verifique se tem `name` e `execute` exportados
3. Confira o prefixo correto no `.env`

## 📦 Deploy

### Systemd Service (Linux)

```ini
# /etc/systemd/system/whatsapp-bot.service
[Unit]
Description=WhatsApp Bot
After=network.target

[Service]
Type=simple
User=seuuser
WorkingDirectory=/caminho/para/bot
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

## 🔄 Atualizações

```bash
git pull
npm install
npm restart # ou systemctl restart whatsapp-bot
```

## 📄 Licença

MIT

## 🙋 Suporte

Issues: https://github.com/seusuario/whatsapp-bot/issues

---

**Feito com ❤️ e baileys.**
