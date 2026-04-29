const client = require('./src/core/WhatsappClient');
const messageHandler = require('./src/handlers/MessageHandler');

async function start() {
    try {
        console.log('Initializing Bot...');
        const sock = await client.init();

        sock.ev.on('messages.upsert', (m) => {
            messageHandler.handle(m);
        });

        console.log('Bot is running. Waiting for messages...');
    } catch (error) {
        console.error('Critical error starting the bot:', error);
        process.exit(1);
    }
}

start();
