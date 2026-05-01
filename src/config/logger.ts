import pino, { type Logger } from 'pino';

import type { AppConfig } from './env';

export function createLogger(config: Pick<AppConfig, 'logLevel'>): Logger {
  return pino({
    level: config.logLevel,
    base: {
      service: 'whatsapp-sticker-bot'
    }
  });
}
