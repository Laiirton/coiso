module.exports = {
    name: 'ping',
    description: 'Checks if the bot is alive',
    async execute(client, remoteJid, args) {
        await client.sendMessage(remoteJid, 'Pong! 🏓 Bot is online and modular!');
    }
};
