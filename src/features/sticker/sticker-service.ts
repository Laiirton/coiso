import type { Logger } from 'pino';

import type { AppConfig } from '../../config/env';
import { getMediaKind } from '../../infrastructure/whatsapp/message';
import type { WhatsAppClient } from '../../infrastructure/whatsapp/types';
import type { StickerRequest } from './sticker-command';
import { downloadMediaToTempFile, removeTempDir } from './media-source';
import { convertVideoToAnimatedSticker } from './video-to-animated-sticker';

export class StickerService {
  constructor(
    private readonly config: AppConfig,
    private readonly logger: Logger
  ) {}

  async sendSticker(client: WhatsAppClient, request: StickerRequest): Promise<void> {
    const mediaFile = await downloadMediaToTempFile(client, request.sourceMessage);
    const mediaKind = getMediaKind(request.sourceMessage);

    try {
      if (mediaKind === 'image') {
        await client.sendImageAsSticker(request.chatId, mediaFile.inputPath, {
          quotedMsg: request.replyToMessageId
        });

        this.logger.info(
          { chatId: request.chatId, source: request.source },
          'Sticker sent from image'
        );
        return;
      }

      if (mediaKind === 'video') {
        const animatedSticker = await convertVideoToAnimatedSticker(
          mediaFile.inputPath,
          mediaFile.tempDir,
          {
            ffmpegPath: this.config.ffmpegPath,
            maxSeconds: this.config.maxVideoSeconds,
            fps: this.config.maxVideoFps,
            size: this.config.maxStickerSize
          }
        );

        await client.sendImageAsStickerGif(request.chatId, animatedSticker.outputPath, {
          quotedMsg: request.replyToMessageId
        });

        this.logger.info(
          {
            chatId: request.chatId,
            source: request.source,
            format: animatedSticker.format,
            sizeBytes: animatedSticker.sizeBytes
          },
          'Sticker sent from video'
        );
        return;
      }

      throw new Error(`Unsupported media type: ${request.sourceMessage.type ?? 'unknown'}`);
    } finally {
      try {
        await removeTempDir(mediaFile.tempDir);
      } catch (error) {
        this.logger.warn(
          { error, tempDir: mediaFile.tempDir },
          'Failed to clean up temporary sticker files'
        );
      }
    }
  }
}
