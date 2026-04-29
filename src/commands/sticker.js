/**
 * @command sticker
 * @description Converte imagem, vídeo ou GIF em sticker do WhatsApp
 * @usage Responda a uma mídia com !sticker ou /sticker
 * @examples
 *   !sticker
 *   /sticker
 *   !sticker 5  (vídeo recortado para 5s)
 *   !sticker 3  (vídeo recortado para 3s)
 * @admin false
 */

const fs = require('fs');
const path = require('path');
const { tmpdir } = require('tmp-promise');
const ffmpeg = require('fluent-ffmpeg');
const sharp = require('sharp');

// Limites WhatsApp
const STICKER_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const STICKER_MAX_DURATION = 5; // segundos
const STICKER_DIM = 512; // 512x512

module.exports = {
  name: 'sticker',
  aliases: ['figurinha', 'sticker', 'stickerer', 'stickerize'],
  description: 'Transforma imagem/vídeo/GIF em sticker (imagem <5MB | vídeo até 5s)',
  cooldown: 5,
  execute: async (message, client, args, context) => {
    const { quoted, from } = message;

    if (!quoted) {
      return context.reply(
        '📎 **COMO CRIAR STICKER**\n\n' +
        'Passo 1: Envie uma IMAGEM, VÍDEO ou GIF\n' +
        'Passo 2: Responda com `!sticker`\n\n' +
        '✅ **Formatos:** JPEG, PNG, GIF, MP4, WebM, MOV\n' +
        '⏱️ **Vídeos:** recorte automático para até 5 segundos\n' +
        '📦 **Tamanho:** imagem deve ter menos de 5MB'
      );
    }

    // Detectar tipo de mídia
    const mediaMsg = quoted.message;
    const msgType = Object.keys(mediaMsg).find(key => key.endsWith('Message'));

    if (!msgType) {
      return context.reply('❌ Responda a uma mensagem que contenha imagem ou vídeo!');
    }

    // Duração personalizada (opcional)
    const requestedDuration = args[0] ? parseInt(args[0], 10) : STICKER_MAX_DURATION;
    const targetDuration = Math.min(Math.max(requestedDuration, 1), STICKER_MAX_DURATION);

    await context.reply('⏳ **Processando mídia...** Aguarde ⏱️');

    const tmp = await tmpdir();
    let inputPath, outputPath, cleanedPaths = [];

    try {
      // ===== DOWNLOAD =====
      if (msgType === 'imageMessage') {
        context.reply('📥 Baixando imagem...');
        const buffer = await client.downloadMediaFromMessage(quoted);
        inputPath = path.join(tmp, `img_${Date.now()}.jpg`);
        fs.writeFileSync(inputPath, buffer);
        cleanedPaths.push(inputPath);

        // Redimensionar e converter para WebP
        outputPath = path.join(tmp, `sticker_${Date.now()}.webp`);
        await sharp(buffer)
          .resize(STICKER_DIM, STICKER_DIM, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .webp({ quality: 80, lossless: false })
          .toFile(outputPath);

        cleanedPaths.push(outputPath);

        const stat = fs.statSync(outputPath);
        if (stat.size > STICKER_MAX_SIZE) {
          throw new Error('Sticker muito grande (>5MB). Tente uma imagem menor.');
        }

        // Enviar como sticker
        const sticker = { url: outputPath };
        await client.sendMessage(from, sticker, { sendAsSticker: true });

        await context.react('✅');
        await context.reply('✅ Sticker criado com sucesso!');

      } else if (msgType === 'videoMessage') {
        context.reply('📥 Baixando vídeo...');
        const buffer = await client.downloadMediaFromMessage(quoted);
        inputPath = path.join(tmp, `vid_${Date.now()}.mp4`);
        fs.writeFileSync(inputPath, buffer);
        cleanedPaths.push(inputPath);

        // Verificar duração
        const videoDuration = await getVideoDuration(inputPath);
        context.reply(`⏱️ Duração original: ${videoDuration.toFixed(1)}s`);

        if (videoDuration <= 0) {
          throw new Error('Não foi possível ler a duração do vídeo.');
        }

        // Recortar
        const effectiveDuration = Math.min(videoDuration, targetDuration);
        outputPath = path.join(tmp, `vid_cut_${Date.now()}.mp4`);
        cleanedPaths.push(outputPath);

        await new Promise((resolve, reject) => {
          ffmpeg(inputPath)
            .setStartTime(0)
            .duration(effectiveDuration)
            .output(outputPath)
            .outputOptions([
              '-vf', `scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2`,
              '-c:v', 'libx264',
              '-preset', 'ultrafast',
              '-crf', '23',
              '-an',
              '-y'
            ])
            .on('start', () => {
              context.reply(`🎬 Recortando para ${effectiveDuration}s...`);
            })
            .on('end', resolve)
            .on('error', reject)
            .run();
        });

        // Converter para sticker WebP animado
        const stickerPath = path.join(tmp, `sticker_${Date.now()}.webp`);
        cleanedPaths.push(stickerPath);

        await new Promise((resolve, reject) => {
          ffmpeg(outputPath)
            .output(stickerPath)
            .outputOptions([
              '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2',
              '-loop', '0',
              '-vsync', '2',
              '-lossless', '0',
              '-qscale', '75',
              '-y'
            ])
            .on('start', () => {
              context.reply('🔄 Convertendo para sticker...');
            })
            .on('end', resolve)
            .on('error', reject)
            .run();
        });

        // Enviar
        const sticker = { url: stickerPath };
        await client.sendMessage(from, sticker, { sendAsSticker: true });

        await context.react('🎬');
        await context.reply(`✅ Sticker de vídeo criado com ${effectiveDuration}s!`);

      } else {
        return context.reply('❌ Tipo de mídia não suportado. Envie imagem (JPEG/PNG/GIF) ou vídeo (MP4/WebM/MOV).');
      }

    } catch (error) {
      console.error('Erro no sticker:', error);
      await context.react('❌');

      let errorMsg = '❌ Falha ao criar sticker.';
      if (error.message.includes('ENOENT')) {
        errorMsg += ' Arquivo temporário não encontrado.';
      } else if (error.message.includes('ffmpeg')) {
        errorMsg += ' Verifique se FFmpeg está instalado.';
      } else if (error.message.includes('memory')) {
        errorMsg += ' Arquivo muito grande.';
      } else {
        errorMsg += ` ${error.message}`;
      }
      await context.reply(errorMsg);

    } finally {
      // Limpeza (atrasada para envio)
      setTimeout(() => {
        cleanedPaths.forEach(p => {
          try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch (_) {}
        });
      }, 8000);
    }
  }
};

// Utilitário: duração do vídeo
function getVideoDuration(filepath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filepath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration || 0);
    });
  });
}
