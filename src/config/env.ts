import { resolve } from 'node:path';
import { z } from 'zod';

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim().toLowerCase();

  if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'no', 'n', 'off'].includes(normalized)) {
    return false;
  }

  return value;
}, z.boolean());

const envSchema = z.object({
  SESSION_NAME: z.string().trim().min(1).default('sticker-bot'),
  BOT_PREFIX: z.string().trim().min(1).default('!'),
  AUTO_STICKER_ON_MEDIA: booleanFromEnv.default(false),
  HEADLESS: booleanFromEnv.default(true),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  TOKEN_STORE_DIR: z.string().trim().min(1).default('./tokens'),
  TOKEN_STORE: z.string().trim().min(1).default('file'),
  MAX_VIDEO_SECONDS: z.coerce.number().int().min(1).max(30).default(8),
  MAX_VIDEO_FPS: z.coerce.number().int().min(1).max(60).default(12),
  MAX_STICKER_SIZE: z.coerce.number().int().min(128).max(1024).default(512)
});

export interface AppConfig {
  sessionName: string;
  prefix: string;
  autoStickerOnMedia: boolean;
  headless: boolean;
  logLevel: z.infer<typeof envSchema>['LOG_LEVEL'];
  tokenStoreDir: string;
  tokenStore: string;
  maxVideoSeconds: number;
  maxVideoFps: number;
  maxStickerSize: number;
  ffmpegPath?: string;
}

export function loadConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.parse(source);
  const ffmpegPath = normalizeOptionalPath(source.FFMPEG_PATH);

  return {
    sessionName: parsed.SESSION_NAME,
    prefix: parsed.BOT_PREFIX,
    autoStickerOnMedia: parsed.AUTO_STICKER_ON_MEDIA,
    headless: parsed.HEADLESS,
    logLevel: parsed.LOG_LEVEL,
    tokenStoreDir: resolve(parsed.TOKEN_STORE_DIR),
    tokenStore: parsed.TOKEN_STORE,
    maxVideoSeconds: parsed.MAX_VIDEO_SECONDS,
    maxVideoFps: parsed.MAX_VIDEO_FPS,
    maxStickerSize: parsed.MAX_STICKER_SIZE,
    ffmpegPath: ffmpegPath ? resolve(ffmpegPath) : undefined
  };
}

function normalizeOptionalPath(value: string | undefined): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
