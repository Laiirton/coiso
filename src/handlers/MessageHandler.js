const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const client = require('../core/WhatsappClient');

class MessageHandler {
    constructor() {
        this.commands = new Map();
        this.loadCommands();
    }

    loadCommands() {
        const commandsPath = path.join(__dirname, '../commands');
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const command = require(path.join(commandsPath, file));
            if (command.name) {
                this.commands.set(command.name, command);
                console.log(`Loaded command: ${command.name}`);
            }
        }
    }

    async handle(m) {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const remoteJid = msg.key.remoteJid;
        const messageContent = msg.message.conversation || 
                               (msg.message.extendedTextMessage && msg.message.extendedTextMessage.text) || 
                               '';

        if (!messageContent.startsWith(config.prefix)) return;

        const args = messageContent.slice(config.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = this.commands.get(commandName);

        if (command) {
            try {
                await command.execute(client, remoteJid, args);
            } catch (error) {
                console.error(`Error executing command ${commandName}:`, error);
                await client.sendMessage(remoteJid, `❌ An error occurred while executing this command.`);
            }
        }
    }
}

module.exports = new MessageHandler();
