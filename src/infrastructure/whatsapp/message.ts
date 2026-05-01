import { MessageType } from '@wppconnect-team/wppconnect';

import type { WhatsAppMessage, WhatsAppMessageId } from './types';

export function getMessageText(message: WhatsAppMessage): string {
  const candidate = [message.caption, message.body, message.content].find((value) => {
    return typeof value === 'string' && value.trim().length > 0;
  });

  return candidate?.trim() ?? '';
}

export function getMessageId(messageId: string | WhatsAppMessageId): string {
  if (typeof messageId === 'string') {
    return messageId;
  }

  if (typeof messageId._serialized === 'string' && messageId._serialized.trim().length > 0) {
    return messageId._serialized;
  }

  if (typeof messageId.id === 'string' && messageId.id.trim().length > 0) {
    return messageId.id;
  }

  throw new Error('Unable to serialize WhatsApp message id.');
}

export function getMediaKind(message: WhatsAppMessage): 'image' | 'video' | null {
  const mimetype = normalizeMimeType(message.mimetype);

  if (mimetype?.startsWith('image/')) {
    return 'image';
  }

  if (mimetype?.startsWith('video/')) {
    return 'video';
  }

  if (message.type === MessageType.IMAGE) {
    return 'image';
  }

  if (message.type === MessageType.VIDEO) {
    return 'video';
  }

  return null;
}

export function isImageMessage(message: WhatsAppMessage): boolean {
  return getMediaKind(message) === 'image';
}

export function isVideoMessage(message: WhatsAppMessage): boolean {
  return getMediaKind(message) === 'video';
}

export function isStickerSourceMessage(message: WhatsAppMessage): boolean {
  return getMediaKind(message) !== null;
}

export function isNotificationMessage(message: WhatsAppMessage): boolean {
  return Boolean(message.isNotification);
}

function normalizeMimeType(mimetype: string | undefined): string | null {
  if (typeof mimetype !== 'string') {
    return null;
  }

  const trimmed = mimetype.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}
