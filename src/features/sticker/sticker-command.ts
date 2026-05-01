import type { WhatsAppMessage } from '../../infrastructure/whatsapp/types';
import {
  getMessageId,
  getMessageText,
  isStickerSourceMessage
} from '../../infrastructure/whatsapp/message';

const STICKER_ALIASES = new Set([
  'sticker',
  'stickers',
  'stickergif',
  's',
  'fig',
  'figura',
  'figurinha',
  'figurinhas'
]);
const HELP_ALIASES = new Set(['help', 'ajuda', '?']);

export const STICKER_HELP_MESSAGE = [
  'Bot de figurinhas',
  '',
  'Como usar:',
  '1. Envie uma imagem ou video com a legenda `!sticker` ou `!fig`',
  '2. Responda a uma imagem ou video com `!sticker` ou `!fig`',
  '3. Ative `AUTO_STICKER_ON_MEDIA=true` no `.env` para converter automaticamente qualquer midia recebida',
  '',
  'Aliases: `!sticker`, `!fig`, `!figura`, `!s`, `!help`'
].join('\n');

export const STICKER_MISSING_SOURCE_MESSAGE = [
  'Nao encontrei nenhuma imagem ou video para converter.',
  '',
  'Envie `!sticker` ou `!fig` na legenda da midia ou responda a uma imagem/video com `!sticker` ou `!fig`.'
].join('\n');

export type StickerRequest = {
  kind: 'sticker';
  chatId: string;
  replyToMessageId: string;
  sourceMessage: WhatsAppMessage;
  source: 'current-media' | 'quoted-media' | 'auto-media';
};

export type HelpRequest = {
  kind: 'help';
  chatId: string;
  replyToMessageId: string;
};

export type MissingSourceRequest = {
  kind: 'sticker-missing-source';
  chatId: string;
  replyToMessageId: string;
};

export type StickerResolution =
  | StickerRequest
  | HelpRequest
  | MissingSourceRequest;

export interface ResolveIncomingRequestOptions {
  prefix: string;
  autoStickerOnMedia: boolean;
  resolveQuotedMessage: (quotedMessageId: string) => Promise<WhatsAppMessage | null>;
}

export function parseCommand(text: string, prefix: string): 'sticker' | 'help' | null {
  const normalizedText = normalizeText(text);
  const normalizedPrefix = prefix.trim().toLowerCase();

  if (normalizedText.length === 0 || !normalizedText.startsWith(normalizedPrefix)) {
    return null;
  }

  const commandToken = normalizedText.slice(normalizedPrefix.length).trim().split(/\s+/, 1)[0];

  if (!commandToken) {
    return null;
  }

  if (STICKER_ALIASES.has(commandToken)) {
    return 'sticker';
  }

  if (HELP_ALIASES.has(commandToken)) {
    return 'help';
  }

  return null;
}

export async function resolveIncomingRequest(
  message: WhatsAppMessage,
  options: ResolveIncomingRequestOptions
): Promise<StickerResolution | null> {
  const command = parseCommand(getMessageText(message), options.prefix);
  const currentMedia = isStickerSourceMessage(message) ? message : null;

  if (command === 'help') {
    return {
      kind: 'help',
      chatId: message.from,
      replyToMessageId: getMessageId(message.id)
    };
  }

  if (command === 'sticker') {
    if (currentMedia) {
      return {
        kind: 'sticker',
        chatId: message.from,
        replyToMessageId: getMessageId(message.id),
        sourceMessage: currentMedia,
        source: 'current-media'
      };
    }

    const quotedMessage = await resolveQuotedStickerSource(message, options.resolveQuotedMessage);

    if (quotedMessage) {
      return {
        kind: 'sticker',
        chatId: message.from,
        replyToMessageId: getMessageId(message.id),
        sourceMessage: quotedMessage,
        source: 'quoted-media'
      };
    }

    return {
      kind: 'sticker-missing-source',
      chatId: message.from,
      replyToMessageId: getMessageId(message.id)
    };
  }

  if (options.autoStickerOnMedia && currentMedia) {
    return {
      kind: 'sticker',
      chatId: message.from,
      replyToMessageId: getMessageId(message.id),
      sourceMessage: currentMedia,
      source: 'auto-media'
    };
  }

  return null;
}

async function resolveQuotedStickerSource(
  message: WhatsAppMessage,
  resolveQuotedMessage: (quotedMessageId: string) => Promise<WhatsAppMessage | null>
): Promise<WhatsAppMessage | null> {
  if (message.quotedMsgObj && isStickerSourceMessage(message.quotedMsgObj)) {
    return message.quotedMsgObj;
  }

  if (!message.quotedMsgId) {
    return null;
  }

  const quotedMessage = await resolveQuotedMessage(message.quotedMsgId);
  return quotedMessage && isStickerSourceMessage(quotedMessage) ? quotedMessage : null;
}

function normalizeText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}
