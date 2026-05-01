import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import mimeTypes from 'mime-types';

import { getMessageId } from '../../infrastructure/whatsapp/message';
import type { WhatsAppClient, WhatsAppMessage } from '../../infrastructure/whatsapp/types';

export interface DownloadedMediaFile {
  tempDir: string;
  inputPath: string;
  mimeType: string;
  extension: string;
}

export async function downloadMediaToTempFile(
  client: WhatsAppClient,
  message: WhatsAppMessage
): Promise<DownloadedMediaFile> {
  const rawMedia = await client.downloadMedia(getMessageId(message.id));

  if (typeof rawMedia !== 'string' || rawMedia.trim().length === 0) {
    throw new Error('WPPConnect did not return media content.');
  }

  const normalizedMedia = normalizeDownloadedMedia(rawMedia, message.mimetype);
  const tempDir = await mkdtemp(join(tmpdir(), 'whatsapp-sticker-'));
  const extension = resolveExtension(normalizedMedia.mimeType, message.type);
  const inputPath = join(tempDir, `input.${extension}`);

  await writeFile(inputPath, normalizedMedia.buffer);

  return {
    tempDir,
    inputPath,
    mimeType: normalizedMedia.mimeType,
    extension
  };
}

export async function removeTempDir(tempDir: string): Promise<void> {
  await rm(tempDir, {
    recursive: true,
    force: true,
    maxRetries: 3,
    retryDelay: 100
  });
}

interface NormalizedMedia {
  buffer: Buffer;
  mimeType: string;
}

function normalizeDownloadedMedia(rawMedia: string, fallbackMimeType?: string): NormalizedMedia {
  const trimmedMedia = rawMedia.trim();
  const dataUrlMatch = /^data:([^;]+);base64,(.+)$/s.exec(trimmedMedia);

  if (dataUrlMatch) {
    return {
      mimeType: dataUrlMatch[1],
      buffer: Buffer.from(dataUrlMatch[2].replace(/\s+/g, ''), 'base64')
    };
  }

  return {
    mimeType: fallbackMimeType ?? 'application/octet-stream',
    buffer: Buffer.from(trimmedMedia.replace(/\s+/g, ''), 'base64')
  };
}

function resolveExtension(mimeType: string, messageType?: string): string {
  const extensionFromMime = mimeTypes.extension(mimeType);

  if (typeof extensionFromMime === 'string' && extensionFromMime.length > 0) {
    return extensionFromMime;
  }

  const normalizedMessageType = messageType?.toLowerCase() ?? '';

  if (normalizedMessageType.includes('video')) {
    return 'mp4';
  }

  if (normalizedMessageType.includes('image')) {
    return 'jpg';
  }

  return 'bin';
}
