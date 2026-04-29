const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const config = require('../config/config');

class WhatsappClient {
    constructor() {
        this.sock = null;
    }

    async init() {
        const { state, saveCreds } = await useMultiFileAuthState(config.sessionFolder);

        this.sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: config.logLevel })
        });

        this.sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log('--- SCAN THE QR CODE BELOW ---');
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log('Connection closed. Reconnecting:', shouldReconnect);
                if (shouldReconnect) {
                    this.init();
                }
            } else if (connection === 'open') {
                console.log('✅ WhatsApp Bot connected successfully!');
            }
        });

        this.sock.ev.on('creds.update', saveCreds);

        return this.sock;
    }

    async sendMessage(jid, text) {
        return await this.sock.sendMessage(jid, { text });
    }
}

module.exports = new WhatsappClient();
