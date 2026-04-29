/**
 * Ping Command - Verifica se o bot está online
 */
module.exports = {
    name: 'ping',
    aliases: ['p', 'pong', 'pingar'],
    description: 'Verifica se o bot está respondendo',
    usage: '!ping',
    category: 'misc',

    async execute(whatsapp, remoteJid, args, context) {
        const start = Date.now();
        await whatsapp.sendMessage(remoteJid, '🏓 Pong! Bot está online e respondendo!');
        const latency = Date.now() - start;

        // Em development, mostra latência
        if (context.config.nodeEnv === 'development') {
            await whatsapp.sendMessage(remoteJid,
                `⏱️ Latência: ${latency}ms`
            );
        }
    }
};
