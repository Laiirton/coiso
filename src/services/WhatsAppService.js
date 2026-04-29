const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const config = require('../config');
const Logger = require('../utils/logger');

/**
 * WhatsAppService - Gerenciamento completo da conexão WhatsApp
 * Responsável por:
 * - Inicialização da conexão
 * - Gerenciamento de QR Code
 * - Reconexão automática
 * - Eventos de conexão
 */
class WhatsAppService {
    constructor() {
        this.sock = null;
        this.isConnected = false;
        this.connectionAttempts = 0;
        this.maxRetries = 5;
        this.retryDelay = 15000; // 15 seconds
        this.logger = Logger.child({ service: 'WhatsApp' });
    }

    /**
     * Inicializa o socket WhatsApp com configurações otimizadas
     */
    async init() {
        try {
            this.logger.info('Inicializando conexão WhatsApp...');

            // Carregar estado de autenticação
            const { state, saveCreds } = await useMultiFileAuthState(config.sessionFolder);
            this.saveCreds = saveCreds;

            // Verificar se já temos credenciais válidas
            const hasValidSession = state.creds && Object.keys(state.creds).length > 0;

            // Obter versão do WhatsApp (com fallback)
            let waVersion = config.defaultWAVersion;
            if (!hasValidSession) {
                try {
                    const { version } = await fetchLatestBaileysVersion();
                    waVersion = version;
                    this.logger.debug(`Usando versão mais recente do WA: ${version.join('.')}`);
                } catch (err) {
                    this.logger.warn('Falha ao buscar versão mais recente, usando fallback');
                }
            }

            // Criar socket com configurações otimizadas
            this.sock = makeWASocket({
                auth: state,
                version: waVersion,
                browser: config.browser,
                printQRInTerminal: false,
                logger: pino({ level: config.logLevel }),
                connectTimeoutMs: config.connectTimeout,
                keepAliveIntervalMs: 30000,
                msgRetryCounterCache: new Map(),
                generateHighQualityLinkPreview: true
            });

            this.setupEventListeners();
            this.logger.info('Socket criado, aguardando conexão...');

            return this.sock;

        } catch (error) {
            this.logger.error('Erro ao inicializar WhatsApp:', error);
            throw error;
        }
    }

    /**
     * Configura listeners de eventos da conexão
     */
    setupEventListeners() {
        // Evento de atualização de conexão
        this.sock.ev.on('connection.update', (update) => {
            this.handleConnectionUpdate(update);
        });

        // Evento de atualização de credenciais
        this.sock.ev.on('creds.update', (creds) => {
            this.saveCreds(creds);
            this.logger.debug('Credenciais atualizadas e salvas');
        });

        // Evento de erro
        this.sock.ev.on('connection.error', (error) => {
            this.logger.error('Erro de conexão:', error);
        });

        // Evento de mensagens (para health check)
        this.sock.ev.on('messages.upsert', (m) => {
            // Pode ser usado para health check ou processamento adicional
        });
    }

    /**
     * Manipula atualizações de conexão
     */
    handleConnectionUpdate(update) {
        const { connection, lastDisconnect, qr } = update;

        this.logger.debug('Atualização de conexão:', { connection, hasQR: !!qr });

        // QR Code recebido - exibir para autenticação
        if (qr) {
            this.logger.info('═'.repeat(50));
            this.logger.info('🔐 ESCOANEIE O QR CODE ABAIXO NO SEU CELULAR:');
            this.logger.info('═'.repeat(50));
            qrcode.generate(qr, { small: true });
            this.logger.info('═'.repeat(50));
            this.connectionAttempts = 0;
            return;
        }

        // Conexão estabelecida
        if (connection === 'open') {
            this.isConnected = true;
            this.connectionAttempts = 0;
            this.logger.info('✅ WhatsApp conectado com sucesso!');
            return;
        }

        // Conexão fechada - gerenciar reconexão
        if (connection === 'close') {
            this.isConnected = false;
            const disconnectError = lastDisconnect?.error;
            const statusCode = (disconnectError instanceof Boom)?.output?.statusCode;

            // Não reconectar se foi logout intencional
            if (statusCode === DisconnectReason.loggedOut) {
                this.logger.fatal('❌ Sessão encerrada. Faça login novamente.');
                this.connectionAttempts = this.maxRetries; // Evita reconexão
                return;
            }

            this.connectionAttempts++;
            this.logger.warn(
                `⚠️ Conexão perdida (tentativa ${this.connectionAttempts}/${this.maxRetries}). ` +
                `Erro: ${disconnectError?.message || ' desconhecido'}`
            );

            if (this.connectionAttempts < this.maxRetries) {
                this.scheduleReconnect();
            } else {
                this.logger.error('❌ Máximo de tentativas atingido. Reiniciando...');
                setTimeout(() => {
                    this.connectionAttempts = 0;
                    this.init().catch(console.error);
                }, 30000);
            }
        }

        // Conectando
        if (connection === 'connecting') {
            this.logger.info('🔄 Conectando ao WhatsApp...');
        }
    }

    /**
     * Agenda reconexão com backoff
     */
    scheduleReconnect() {
        const delay = this.retryDelay * Math.min(this.connectionAttempts, 3);
        this.logger.info(`🕐 Reconectando em ${delay / 1000}s...`);

        setTimeout(async () => {
            try {
                await this.init();
            } catch (err) {
                this.logger.error('Erro na reconexão:', err);
                this.scheduleReconnect();
            }
        }, delay);
    }

    /**
     * Envia mensagem de texto
     */
    async sendMessage(jid, text) {
        if (!this.sock) {
            throw new Error('WhatsApp socket não inicializado');
        }
        return await this.sock.sendMessage(jid, { text });
    }

    /**
     * Encerra conexão gracefulmente
     */
    async disconnect() {
        if (this.sock) {
            await this.sock.logout();
            this.isConnected = false;
            this.logger.info('✅ WhatsApp desconectado');
        }
    }

    /**
     * Verifica se está conectado
     */
    getStatus() {
        return {
            connected: this.isConnected,
            attempts: this.connectionAttempts
        };
    }
}

module.exports = new WhatsAppService();
