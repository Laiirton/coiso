const fs = require('fs');
const path = require('path');
const config = require('../config');
const WhatsAppService = require('../services/WhatsAppService');

/**
 * MessageHandler - Processa todas as mensagens recebidas
 * Responsabilidades:
 * - Carregar comandos dinamicamente
 * - Parsing de mensagens
 * - Roteamento de comandos
 * - Tratamento de erros
 */
class MessageHandler {
    constructor() {
        this.commands = new Map();
        this.logger = require('../utils/logger').child({ service: 'MessageHandler' });
        this.loadCommands();
    }

    /**
     * Carrega automaticamente todos os comandos da pasta ./commands
     */
    loadCommands() {
        const commandsPath = __dirname;
        const commandFiles = fs.readdirSync(commandsPath)
            .filter(file => file.endsWith('.js') && file !== 'index.js');

        for (const file of commandFiles) {
            try {
                const command = require(path.join(commandsPath, file));

                if (command.name && typeof command.execute === 'function') {
                    this.commands.set(command.name, command);

                    // Log dos aliases também
                    const aliases = command.aliases ? ` (aliases: ${command.aliases.join(', ')})` : '';
                    this.logger.debug(`✓ Command loaded: ${command.name}${aliases}`);
                }
            } catch (error) {
                this.logger.error(`✗ Failed to load command ${file}:`, error.message);
            }
        }

        this.logger.info(`📦 ${this.commands.size} command(s) loaded`);
    }

    /**
     * Handler principal de mensagens
     * @param {Object} event - Evento de mensagem do Baileys
     */
    async handle(event) {
        const msg = event.messages[0];

        // Validações
        if (!msg?.message || msg.key?.fromMe) {
            return;
        }

        const remoteJid = msg.key.remoteJid;
        const text = this.extractText(msg.message);

        // Verifica se é comando
        if (!text || !text.startsWith(config.prefix)) {
            return;
        }

        await this.routeCommand(text, remoteJid, msg);
    }

    /**
     * Extrai texto limpo da mensagem
     */
    extractText(message) {
        if (message.conversation) {
            return message.conversation.trim();
        }

        if (message.extendedTextMessage?.text) {
            return message.extendedTextMessage.text.trim();
        }

        if (message.imageMessage || message.videoMessage) {
            return (message.caption || '').trim();
        }

        return '';
    }

    /**
     * Roteia comando para o handler apropriado
     */
    async routeCommand(rawMessage, remoteJid, originalMsg) {
        const args = rawMessage.slice(config.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = this.commands.get(commandName);

        if (!command) {
            // Comando não existe - silenciosamente ignora
            this.logger.debug(`Unknown command: ${commandName} from ${remoteJid}`);
            return;
        }

        // Contexto para o comando
        const context = {
            rawMessage,
            config,
            isGroup: remoteJid.endsWith('@g.us'),
            isReply: !!originalMsg.message?.extendedTextMessage?.contextInfo?.quotedMessage
        };

        try {
            this.logger.info(`Executing: ${commandName} from ${remoteJid}`);

            await command.execute(
                WhatsAppService,
                remoteJid,
                args,
                context
            );

        } catch (error) {
            this.logger.error(`Command ${commandName} failed:`, error);

            // Mensagem de erro amigável
            const errorMsg = command.errorMessage ||
                '❌ Oops! Algo deu errado ao executar este comando.';

            await WhatsAppService.sendMessage(remoteJid, errorMsg);

            // Debug em desenvolvimento
            if (config.nodeEnv === 'development' && error.stack) {
                await WhatsAppService.sendMessage(
                    remoteJid,
                    `🐛 [DEBUG] ${error.message}`
                );
            }
        }
    }

    /**
     * Lista todos os comandos disponíveis
     */
    getCommands() {
        return Array.from(this.commands.keys());
    }

    /**
     * Obtém metadados de um comando
     */
    getCommandInfo(name) {
        return this.commands.get(name) || null;
    }
}

module.exports = new MessageHandler();
