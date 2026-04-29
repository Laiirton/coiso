/**
 * LottieSticker Command - Envia sticker Lottie animado
 * NOTE: Este é um exemplo de comando que usaria a funcionalidade Lottie
 * Requer: buildLottieSticker() do módulo de mídia
 */

// Descomente quando tiver o módulo de mídia Lottie implementado:
// const { buildLottieSticker } = require('../media/lottie');

module.exports = {
    name: 'sticker',
    aliases: ['s', 'fig', 'figurinha'],
    description: 'Converte imagem em sticker Lottie animado',
    usage: '!sticker (responda a uma imagem)',
    category: 'sticker',
    replyRequired: true,

    async execute(whatsapp, remoteJid, args, context) {
        // TODO: Implementar quando tiver o módulo Lottie
        await whatsapp.sendMessage(remoteJid,
            '🖼️ Comando sticker em desenvolvimento!\n' +
            'Em breve: envie uma imagem como resposta a este comando para criar um sticker Lottie.'
        );

        // Exemplo de implementação futura:
        // const quotedMsg = context.rawMessage.message.extendedTextMessage.contextInfo.quotedMessage;
        // if (!quotedMsg?.imageMessage) {
        //     return await whatsapp.sendMessage(remoteJid, '⚠️ Responda a uma imagem.');
        // }
        // const lottieBuffer = await buildLottieSticker(quotedMsg);
        // await sendLottieSticker(whatsapp.sock, remoteJid, lottieBuffer);
    }
};
