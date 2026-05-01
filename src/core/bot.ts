import type { Logger } from 'pino';

import type { AppConfig } from '../config/env';
import { createWhatsappClient } from '../infrastructure/whatsapp/create-client';
import {
  getMessageId,
  isNotificationMessage
} from '../infrastructure/whatsapp/message';
import type { WhatsAppClient, WhatsAppMessage } from '../infrastructure/whatsapp/types';
import {
  resolveIncomingRequest,
  STICKER_HELP_MESSAGE,
  STICKER_MISSING_SOURCE_MESSAGE
} from '../features/sticker/sticker-command';
import { StickerService } from '../features/sticker/sticker-service';

export async function startBot(config: AppConfig, logger: Logger): Promise<WhatsAppClient> {
  const client = await createWhatsappClient(config, logger);
  const stickerService = new StickerService(config, logger);

  logger.info(
    {
      session: config.sessionName,
      autoStickerOnMedia: config.autoStickerOnMedia,
      headless: config.headless
    },
    'Bot initialized'
  );

  client.onMessage((message) => {
    void handleIncomingMessage({
      client,
      config,
      logger,
      stickerService,
      message
    });
  });

  return client;
}

interface HandleIncomingMessageContext {
  client: WhatsAppClient;
  config: AppConfig;
  logger: Logger;
  stickerService: StickerService;
  message: WhatsAppMessage;
}

async function handleIncomingMessage(context: HandleIncomingMessageContext): Promise<void> {
  const { client, config, logger, stickerService, message } = context;

  if (message.fromMe || isNotificationMessage(message)) {
    return;
  }

  try {
    const request = await resolveIncomingRequest(message, {
      prefix: config.prefix,
      autoStickerOnMedia: config.autoStickerOnMedia,
      resolveQuotedMessage: async (quotedMessageId) => {
        if (message.quotedMsgObj && message.quotedMsgId === quotedMessageId) {
          return message.quotedMsgObj;
        }

        if (!client.getMessageById) {
          return null;
        }

        try {
          return (await client.getMessageById(quotedMessageId)) ?? null;
        } catch (error) {
          logger.warn(
            { error, quotedMessageId, chatId: message.from },
            'Unable to load quoted message'
          );
          return null;
        }
      }
    });

    if (!request) {
      return;
    }

    if (request.kind === 'help') {
      await sendReplySafely(client, request.chatId, STICKER_HELP_MESSAGE, request.replyToMessageId, logger);
      return;
    }

    if (request.kind === 'sticker-missing-source') {
      logger.warn(
        {
          chatId: message.from,
          messageId: getMessageId(message.id),
          type: message.type,
          mimetype: message.mimetype,
          isMedia: message.isMedia,
          caption: message.caption,
          body: message.body,
          content: message.content,
          quotedMsgId: message.quotedMsgId
        },
        'Sticker command received without a recognized media source'
      );

      await sendReplySafely(
        client,
        request.chatId,
        STICKER_MISSING_SOURCE_MESSAGE,
        request.replyToMessageId,
        logger
      );
      return;
    }

    await stickerService.sendSticker(client, request);
  } catch (error) {
    logger.error(
      { error, chatId: message.from, messageId: getMessageId(message.id) },
      'Failed to process incoming message'
    );

    await sendReplySafely(
      client,
      message.from,
      'Nao consegui criar a figurinha. Tente uma imagem ou video valido.',
      getMessageId(message.id),
      logger
    );
  }
}

async function sendReplySafely(
  client: WhatsAppClient,
  chatId: string,
  content: string,
  quotedMessageId: string,
  logger: Logger
): Promise<void> {
  try {
    await client.reply(chatId, content, quotedMessageId);
  } catch (error) {
    logger.warn({ error, chatId, quotedMessageId }, 'Failed to send reply');
  }
}
