require('dotenv').config();

/**
 * Configuração Centralizada do Bot
 * Todas as variáveis de ambiente são carregadas aqui com valores padrão
 */

module.exports = {
    // 🤖 Bot Identity
    botName: process.env.BOT_NAME || 'WhatsApp Lottie Bot',
    sessionFolder: process.env.SESSION_FOLDER || 'auth_info_baileys',

    // ⚙️ Operação
    prefix: process.env.PREFIX || '!',
    logLevel: process.env.LOG_LEVEL || 'info',
    nodeEnv: process.env.NODE_ENV || 'production',

    // 🔧 WhatsApp Connection
    defaultWAVersion: process.env.WA_VERSION
        ? JSON.parse(process.env.WA_VERSION)
        : [2, 3000, 1033893291], // Versão estável testada

    browser: process.env.BROWSER
        ? JSON.parse(process.env.BROWSER)
        : ['Chrome', 'Windows', '110.0.5481.177'],

    connectTimeout: parseInt(process.env.CONNECT_TIMEOUT) || 60000,
    reconnectDelay: parseInt(process.env.RECONNECT_DELAY) || 15000,
    maxRetries: parseInt(process.env.MAX_RETRIES) || 5,

    // 📁 Paths
    tmpDir: process.env.TMP_DIR || 'tmp',
    logsDir: process.env.LOGS_DIR || 'logs',

    // 🔐 Security
    adminNumbers: process.env.ADMIN_NUMBERS
        ? process.env.ADMIN_NUMBERS.split(',').map(s => s.trim())
        : [],

    // 🎯 Features
    enableMediaProcessing: process.env.ENABLE_MEDIA !== 'false',
    autoDownloadMedia: process.env.AUTO_DOWNLOAD_MEDIA === 'true',
};
