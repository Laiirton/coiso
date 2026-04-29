#!/usr/bin/env node

/**
 * WhatsApp Lottie Bot - Entry Point
 * Clean Architecture, Production Ready
 */

const config = require('./config');
const WhatsAppService = require('./services/WhatsAppService');
const Logger = require('./utils/logger');

// Global instances
let messageHandler;

/**
 * Initialize and start the bot
 */
async function startBot() {
    try {
        Logger.info('🚀 Starting WhatsApp Lottie Bot...');
        Logger.info(`📛 Bot: ${config.botName}`);
        Logger.debug(`Environment: ${config.nodeEnv}`);
        Logger.debug(`PID: ${process.pid}`);

        // 1. Connect WhatsApp
        const sock = await WhatsAppService.init();

        // 2. Load message handler (deferred to avoid circular deps)
        messageHandler = require('./handlers/MessageHandler');

        // 3. Wire up message listener
        sock.ev.on('messages.upsert', async (m) => {
            try {
                await messageHandler.handle(m);
            } catch (error) {
                Logger.error('Error processing message:', error);
            }
        });

        // 4. Configure graceful shutdown
        setupShutdownHandlers();

        Logger.info('✅ Bot ready! Waiting for messages...');
        Logger.info(`📝 Prefix: ${config.prefix}`);
        Logger.info(`📂 Session: ${config.sessionFolder}`);

        // Log admin info if configured
        if (config.adminNumbers.length > 0) {
            Logger.info(`👮 Admins: ${config.adminNumbers.join(', ')}`);
        }

    } catch (error) {
        Logger.fatal('❌ Failed to start bot:', error);
        process.exit(1);
    }
}

/**
 * Graceful shutdown handlers
 */
function setupShutdownHandlers() {
    const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];

    signals.forEach(signal => {
        process.on(signal, async () => {
            Logger.info(`📍 Received ${signal}, shutting down gracefully...`);

            try {
                if (WhatsAppService) {
                    await WhatsAppService.disconnect();
                }
                cleanExit(0);
            } catch (err) {
                Logger.error('Shutdown error:', err);
                cleanExit(1);
            }
        });
    });

    // Unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
        Logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // Uncaught exceptions
    process.on('uncaughtException', (error) => {
        Logger.fatal('Uncaught Exception:', error);
        cleanExit(1);
    });
}

/**
 * Clean exit helper
 */
function cleanExit(code) {
    Logger.info('🧹 Cleaning up resources...');

    setTimeout(() => {
        Logger.info('👋 Bot stopped.');
        process.exit(code);
    }, 300);
}

// Development mode warnings
if (config.nodeEnv === 'development') {
    Logger.warn('⚠️  Running in DEVELOPMENT mode');
    Logger.warn('⚠️  Debug logs are ENABLED');
}

// Start the bot
startBot().catch(err => {
    Logger.fatal('Critical failure:', err);
    process.exit(1);
});
