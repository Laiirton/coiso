/**
 * Help Command - Lista todos os comandos disponíveis
 */
const MessageHandler = require('../handlers/MessageHandler');

module.exports = {
    name: 'help',
    aliases: ['h', 'ajuda', 'menu', 'comandos'],
    description: 'Mostra todos os comandos disponíveis ou detalhes de um comando',
    usage: '!help [comando]',
    category: 'misc',

    async execute(whatsapp, remoteJid, args, context) {
        const commands = MessageHandler.getCommands();

        // Comando específico solicitado
        if (args.length > 0) {
            const cmdName = args[0].toLowerCase();
            const command = MessageHandler.getCommandInfo(cmdName);

            if (!command) {
                await whatsapp.sendMessage(remoteJid,
                    `❌ Comando \`${cmdName}\` não encontrado.\n` +
                    `Use \`${context.config.prefix}help\` para ver todos.`
                );
                return;
            }

            const info = this.formatCommandDetails(command, context.config);
            await whatsapp.sendMessage(remoteJid, info);
            return;
        }

        // Lista geral de comandos
        const message = this.formatCommandsList(commands, context.config);
        await whatsapp.sendMessage(remoteJid, message);
    },

    /**
     * Formata detalhes de um comando
     */
    formatCommandDetails(command, config) {
        const lines = [
            `*${command.name.toUpperCase()}*`,
            '',
            `📝 ${command.description || 'Sem descrição'}`,
            `🔧 Uso: \`${command.usage || config.prefix + command.name}\``,
        ];

        if (command.aliases && command.aliases.length > 0) {
            lines.push(`🔀 Aliases: ${command.aliases.map(a => `${config.prefix}${a}`).join(', ')}`);
        }

        if (command.category) {
            lines.push(`📁 Categoria: ${command.category}`);
        }

        return lines.join('\n');
    },

    /**
     * Formata lista completa de comandos
     */
    formatCommandsList(commands, config) {
        const categories = {};

        // Agrupar comandos por categoria
        commands.forEach(cmdName => {
            const cmd = MessageHandler.getCommandInfo(cmdName);
            const cat = (cmd.category || 'misc').toLowerCase();
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(cmd);
        });

        const lines = [
            `*🤖 ${config.botName}*`,
            '',
            `✅ Bot online`,
            `🔧 Prefixo: \`${config.prefix}\``,
            `📦 ${commands.length} comando(s) disponível(is)`,
            '',
            `*📋 COMANDOS:*`,
            ''
        ];

        // Ordenar categorias alfabeticamente
        const sortedCats = Object.keys(categories).sort();

        sortedCats.forEach(cat => {
            lines.push(`${this.getCategoryEmoji(cat)} *${cat.toUpperCase()}*`);

            categories[cat].forEach(cmd => {
                const aliasStr = cmd.aliases ? `(${cmd.aliases.join(', ')})` : '';
                lines.push(`  • \`${config.prefix}${cmd.name}\` - ${cmd.description} ${aliasStr}`);
            });
            lines.push('');
        });

        lines.push(`💡 Dica: \`${config.prefix}help <comando>\` para detalhes.`);

        return lines.join('\n');
    },

    /**
     * Emoji por categoria
     */
    getCategoryEmoji(category) {
        const emojis = {
            misc: '🔧',
            admin: '👮',
            fun: '🎮',
            util: '🛠️',
            media: '🎬',
            sticker: '🖼️'
        };
        return emojis[category] || '📌';
    }
};
