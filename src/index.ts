import 'dotenv/config';

import { createLogger } from './config/logger';
import { loadConfig } from './config/env';
import { startBot } from './core/bot';
import type { WhatsAppClient } from './infrastructure/whatsapp/types';

async function main(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger(config);
  let client: WhatsAppClient | null = null;
  let shuttingDown = false;

  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    logger.info({ signal }, 'Shutdown requested');

    if (client) {
      try {
        await client.close();
        logger.info('WhatsApp client closed');
      } catch (error) {
        logger.warn({ error }, 'Failed to close WhatsApp client cleanly');
      }
    }

    process.exit(0);
  };

  process.once('SIGINT', () => {
    void shutdown('SIGINT');
  });

  process.once('SIGTERM', () => {
    void shutdown('SIGTERM');
  });

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled promise rejection');
  });

  process.on('uncaughtException', (error) => {
    logger.fatal({ error }, 'Uncaught exception');
    process.exit(1);
  });

  client = await startBot(config, logger);
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
