import { describe, expect, it } from 'vitest';

import {
  resolveIncomingRequest,
  STICKER_HELP_MESSAGE,
  STICKER_MISSING_SOURCE_MESSAGE
} from '../src/features/sticker/sticker-command';
import type { WhatsAppMessage } from '../src/infrastructure/whatsapp/types';

describe('resolveIncomingRequest', () => {
  it('resolves a current image message when the caption contains the sticker command', async () => {
    const message: WhatsAppMessage = {
      id: 'msg-1',
      from: '5511999999999@c.us',
      caption: '!sticker',
      isMedia: true,
      type: 'image',
      mimetype: 'image/jpeg'
    };

    const request = await resolveIncomingRequest(message, {
      prefix: '!',
      autoStickerOnMedia: false,
      resolveQuotedMessage: async () => null
    });

    expect(request).not.toBeNull();
    expect(request?.kind).toBe('sticker');

    if (request?.kind === 'sticker') {
      expect(request.source).toBe('current-media');
      expect(request.sourceMessage.id).toBe('msg-1');
    }
  });

  it('resolves a current image message when the caption contains the fig alias', async () => {
    const message: WhatsAppMessage = {
      id: 'msg-1b',
      from: '5511999999999@c.us',
      caption: '!fig',
      isMedia: true,
      type: 'image',
      mimetype: 'image/jpeg'
    };

    const request = await resolveIncomingRequest(message, {
      prefix: '!',
      autoStickerOnMedia: false,
      resolveQuotedMessage: async () => null
    });

    expect(request).not.toBeNull();
    expect(request?.kind).toBe('sticker');

    if (request?.kind === 'sticker') {
      expect(request.source).toBe('current-media');
      expect(request.sourceMessage.id).toBe('msg-1b');
    }
  });

  it('resolves a quoted video message when the user replies with the sticker command', async () => {
    const quotedMessage: WhatsAppMessage = {
      id: 'quoted-1',
      from: '5511999999999@c.us',
      isMedia: true,
      type: 'video',
      mimetype: 'video/mp4'
    };

    const message: WhatsAppMessage = {
      id: 'msg-2',
      from: '5511999999999@c.us',
      body: '!sticker',
      quotedMsgId: 'quoted-1'
    };

    const request = await resolveIncomingRequest(message, {
      prefix: '!',
      autoStickerOnMedia: false,
      resolveQuotedMessage: async (quotedMessageId) => {
        return quotedMessageId === 'quoted-1' ? quotedMessage : null;
      }
    });

    expect(request).not.toBeNull();
    expect(request?.kind).toBe('sticker');

    if (request?.kind === 'sticker') {
      expect(request.source).toBe('quoted-media');
      expect(request.sourceMessage.id).toBe('quoted-1');
    }
  });

  it('returns a missing source response when the sticker command has no media to use', async () => {
    const message: WhatsAppMessage = {
      id: 'msg-3',
      from: '5511999999999@c.us',
      body: '!sticker'
    };

    const request = await resolveIncomingRequest(message, {
      prefix: '!',
      autoStickerOnMedia: false,
      resolveQuotedMessage: async () => null
    });

    expect(request?.kind).toBe('sticker-missing-source');
    expect(STICKER_HELP_MESSAGE).toContain('Como usar:');
    expect(STICKER_MISSING_SOURCE_MESSAGE).toContain('Nao encontrei');
  });

  it('auto converts image and video messages when configured', async () => {
    const message: WhatsAppMessage = {
      id: 'msg-4',
      from: '5511999999999@c.us',
      isMedia: true,
      type: 'image',
      mimetype: 'image/png'
    };

    const request = await resolveIncomingRequest(message, {
      prefix: '!',
      autoStickerOnMedia: true,
      resolveQuotedMessage: async () => null
    });

    expect(request?.kind).toBe('sticker');
    if (request?.kind === 'sticker') {
      expect(request.source).toBe('auto-media');
    }
  });

  it('recognizes media by mimetype even when type is not image or video', async () => {
    const message: WhatsAppMessage = {
      id: 'msg-5',
      from: '5511999999999@c.us',
      body: '!sticker',
      type: 'chat',
      mimetype: 'image/jpeg'
    };

    const request = await resolveIncomingRequest(message, {
      prefix: '!',
      autoStickerOnMedia: false,
      resolveQuotedMessage: async () => null
    });

    expect(request?.kind).toBe('sticker');
    if (request?.kind === 'sticker') {
      expect(request.source).toBe('current-media');
    }
  });
});
