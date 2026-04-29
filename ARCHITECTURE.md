# 🏗️ Arquitetura do Bot

Diagrama de componentes e fluxo de dados.

## Fluxo de Inicialização

```
┌─────────────────────────────────────────────────────────────────┐
│                         src/bot.js                               │
│  ├─ Carrega config (src/config)                                 │
│  ├─ Inicializa WhatsAppService                                  │
│  ├─ Anexa MessageHandler ao socket                              │
│  └─ Configura graceful shutdown                                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  WhatsAppService (src/services/)                │
│  ├─ useMultiFileAuthState → Sessão                              │
│  ├─ makeWASocket({version, browser}) → Socket                   │
│  ├─ ev.on('connection.update') → Eventos                        │
│  ├─ QR code display                                              │
│  └─ Reconexão automática (backoff)                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                ┌──────────┴──────────┐
                │                     │
                ▼                     ▼
    ┌───────────────────┐   ┌────────────────────┐
    │  creds.update     │   │ messages.upsert    │
    │  → saveCreds()    │   │  → MessageHandler  │
    └───────────────────┘   └─────────┬──────────┘
                                      │
                                      ▼
                    ┌──────────────────────────────────┐
                    │    MessageHandler                │
                    │  src/handlers/MessageHandler.js  │
                    │  ├─ loadCommands()               │
                    │  ├─ handle(m)                    │
                    │  ├─ parseCommand()               │
                    │  └─ routeToCommand()             │
                    └──────────────┬───────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────────┐
                    │    Commands (src/commands/)      │
                    │  ├─ ping.js                      │
                    │  ├─ help.js                      │
                    │  ├─ status.js                    │
                    │  └─ ...                          │
                    │                                  │
                    │  Cada comando exporta:           │
                    │  { name, aliases, execute() }    │
                    └──────────────────────────────────┘
```

## Separação de Responsabilidades

| Camada | Responsabilidade | Local |
|--------|------------------|-------|
| **Entry Point** | Inicialização, wiring, shutdown | `src/bot.js` |
| **Service** | Conexão WhatsApp, eventos, reconexão | `src/services/WhatsAppService.js` |
| **Handler** | Parse de mensagens, roteamento | `src/handlers/MessageHandler.js` |
| **Commands** | Lógica de negócio, respostas | `src/commands/*.js` |
| **Config** | Variáveis de ambiente, defaults | `src/config/index.js` |
| **Utils** | Logger, shutdown helpers | `src/utils/*.js` |

## Eventos Baileys

```
Connection Flow:
  connected to WA
    ↓
  not logged in, attempting registration...
    ↓
  ┌─────────────────┐
  │   QR available  │ ──→ Exibe QR no terminal
  └─────────────────┘
    ↓ (usuário escaneia)
  pair success → creds.update → connection: close (restartRequired)
    ↓
  Reconecta automaticamente (sem QR)
    ↓
  connection: open → Bot online! ✅
```

## Ciclo de Vida de uma Mensagem

```
1. WhatsApp → Baileys → events.messages.upsert
2. MessageHandler.handle(event)
   ├─ Valida: fromMe? Ignora
   ├─ Extrai texto (conversation, caption, etc)
   ├─ Verifica prefixo (!)
   └─ Parse: !comando arg1 arg2
3. MessageHandler.routeCommand()
   └─ Procura command no Map (por name)
4. Command.execute(whatsapp, jid, args, context)
   ├─ whatsapp.sendMessage(jid, reply)
   ├─ context.config → acessa configuração
   └─ context.isGroup / isReply → metadados
5. Resposta enviada via Baileys → WhatsApp
```

## Configuração por Ambiente

```
.env (desenvolvimento local)
  ├─ NODE_ENV=development
  ├─ LOG_LEVEL=debug
  └─ CONNECT_TIMEOUT=60000

.env.production (produção)
  ├─ NODE_ENV=production
  ├─ LOG_LEVEL=info
  ├─ ADMIN_NUMBERS="5511999999999"
  └─ SESSION_FOLDER=/var/lib/bot/auth
```

## Extensibilidade

### Adicionar Novo Comando

1. Criar `src/commands/meucomando.js`
2. Exportar objeto com `{ name, execute }`
3. Reiniciar bot (hot-reload futuro)

### Adicionar Novo Serviço

1. Criar `src/services/NovoServico.js`
2. Importar em `src/bot.js` ou injetar via injeção de dependência
3. Usar onde necessário

### Modificar Tratamento de Mensagens

Editar `src/handlers/MessageHandler.js`:
- `handle()` - entrada principal
- `extractText()` - como extrair texto
- `routeCommand()` - como achar comandos

## Padrões Utilizados

- **Singleton** - MessageHandler instance única
- **Factory** - WhatsAppService.init() cria socket
- **Observer** - Baileys events (connection.update, creds.update)
- **Strategy** - Comandos como estratégias de resposta
- **Dependency Injection** - Commands recebem whatsapp, jid, args, context

## Performance Considerations

- `msgRetryCounterCache` → Map em memória
- Logs → rotação diária em arquivos
- Conexões → TCP keep-alive (30s)
- Comandos → carregados uma vez no init

## Segurança

- `.env` ignorado no git
- Admin numbers configuráveis
- Logs não expõem credenciais
- Sessões em diretório seguro (fora do web root)

## Monitoramento (futuro)

- Métricas Prometheus em `/metrics`
- Health check endpoint `/health`
- Alertas para desconexão prolongada
