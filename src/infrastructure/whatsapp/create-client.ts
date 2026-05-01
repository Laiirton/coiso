import { create, tokenStore as wppTokenStore } from '@wppconnect-team/wppconnect';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Logger } from 'pino';

import type { AppConfig } from '../../config/env';
import type { WhatsAppClient } from './types';

export async function createWhatsappClient(
  config: AppConfig,
  logger: Logger
): Promise<WhatsAppClient> {
  const browserProfileDir = resolve(config.tokenStoreDir);
  const sessionTokenStoreDir = resolve(config.tokenStoreDir, 'session-store');

  await mkdir(browserProfileDir, { recursive: true });
  await mkdir(sessionTokenStoreDir, { recursive: true });

  const tokenStore =
    config.tokenStore === 'file'
      ? new wppTokenStore.FileTokenStore({ path: sessionTokenStoreDir })
      : config.tokenStore;

  logger.debug(
    {
      browserProfileDir,
      sessionTokenStoreDir,
      tokenStore: config.tokenStore
    },
    'Preparing WhatsApp persistence'
  );

  const client = await create({
    session: config.sessionName,
    headless: config.headless,
    logQR: true,
    disableWelcome: true,
    autoClose: 0,
    tokenStore,
    folderNameToken: browserProfileDir,
    catchQR: (_base64Qrimg, asciiQR, attempts, urlCode) => {
      logger.info({ attempts, urlCode }, 'QR code generated');
      process.stdout.write(`${asciiQR}\n`);
    },
    statusFind: (statusSession, session) => {
      logger.info({ session, statusSession }, 'Session status changed');
    }
  });

  return client as WhatsAppClient;
}
