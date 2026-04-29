const fs = require('fs');
const path = require('path');
const pino = require('pino');

/**
 * Logger profissional com rotação de logs
 * Usa pino nativo (sem pino-pretty) + pretty-print manual opcional
 */

const LOG_DIR = path.join(__dirname, '../../logs');

// Criar diretório de logs se não existir
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Determinar nível de log
const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info');

// Transport para arquivo (sempre ativo)
const fileTransport = pino.destination(
    path.join(LOG_DIR, 'bot-%Y-%m-%d.log'),
    { destructure: true, mkdir: true }
);

// Criar logger
const logger = pino(
    {
        level,
        timestamp: pino.stdTimeFunctions.isoTime,
        // Em desenvolvimento, imprimir cores no console
        transport: process.env.NODE_ENV === 'development' ? {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname'
            }
        } : undefined
    },
    fileTransport
);

// Metadados base
logger.sharedMeta = {
    service: 'whatsapp-bot',
    pid: process.pid,
    env: process.env.NODE_ENV || 'development'
};

module.exports = logger;
