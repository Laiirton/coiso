/**
 * Utilitários para shutdown graceful
 */

/**
 * Encerra o processo após limpeza
 */
function cleanExit(code) {
    Logger.info('🧹 Limpando recursos...');

    return new Promise((resolve) => {
        setTimeout(() => {
            Logger.info('👋 Bot encerrado.');
            process.exit(code);
        }, 500);
    });
}

module.exports = {
    cleanExit
};
