require('dotenv').config();

module.exports = {
    botName: process.env.BOT_NAME || 'WhatsApp Bot',
    sessionFolder: process.env.SESSION_FOLDER || 'auth_info_baileys',
    logLevel: process.env.LOG_LEVEL || 'silent',
    prefix: process.env.PREFIX || '!',
};
