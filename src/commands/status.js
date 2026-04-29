/**
 * Status Command - Mostra status detalhado do bot
 */
module.exports = {
    name: 'status',
    aliases: ['s', 'info', 'stats', 'stat'],
    description: 'Mostra status e estatísticas do bot',
    usage: '!status',
    category: 'admin',

    async execute(whatsapp, remoteJid, args, context) {
        const status = whatsapp.getStatus();
        const uptime = process.uptime();

        // Verificar se é admin (se configurado)
        if (context.config.adminNumbers.length > 0) {
            const userJid = remoteJid.split('@')[0];
            const isAdmin = context.config.adminNumbers.includes(userJid);

            if (!isAdmin) {
                await whatsapp.sendMessage(remoteJid,
                    '⛔ Acesso negado. Este comando é apenas para administradores.'
                );
                return;
            }
        }

        const info = [
            '*📊 STATUS DO BOT*',
            '',
            `🟢 Conectado: ${status.connected ? '✅ Sim' : '🔴 Não'}`,
            `⏱️ Uptime: ${this.formatUptime(uptime)}`,
            `🔄 Conexões tentadas: ${status.attempts}`,
            '',
            `*🔧 Configuração*`,
            `• Sessão: ${context.config.sessionFolder}`,
            `• Prefixo: ${context.config.prefix}`,
            `• Versão WA: Fixa (${context.config.defaultWAVersion.join('.')})`,
            `• Browser: ${context.config.browser.join(' ')}`,
            `• Log Level: ${context.config.logLevel}`,
            '',
            `*💻 Sistema*`,
            `• Node: ${process.version}`,
            `• PID: ${process.pid}`,
            `• Memória: ${(process.memoryUsage().rss / 1024 / 1024).toFixed(1)}MB`,
            `• CPU: ${((process.cpuUsage().user + process.cpuUsage().system) / 1000 / 1000).toFixed(1)}ms`,
            '',
            `🤖 Bot funcionando perfeitamente!`
        ].join('\n');

        await whatsapp.sendMessage(remoteJid, info);
    },

    /**
     * Formata tempo de uptime legível
     */
    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        parts.push(`${secs}s`);

        return parts.join(' ');
    }
};
