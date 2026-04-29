# Makefile - Atalhos para desenvolvimento

.PHONY: help setup start dev clean logs test lint

help:
	@echo "Comandos disponíveis:"
	@echo "  make setup    - Instala dependências e configura projeto"
	@echo "  make start    - Inicia o bot em produção"
	@echo "  make dev      - Inicia em modo desenvolvimento"
	@echo "  make logs     - Tail dos logs"
	@echo "  make clean    - Limpa logs, tmp e sessões"
	@echo "  make lint     - Executa ESLint"
	@echo "  make restart  - Reinicia o bot"

setup:
	@chmod +x setup.sh && ./setup.sh

start:
	@node src/bot.js

dev:
	@NODE_ENV=development LOG_LEVEL=debug node src/bot.js

logs:
	@tail -f logs/bot-$$(date +%Y-%m-%d).log

clean:
	@rm -rf logs/* tmp/* auth_info_baileys/*
	@echo "✅ Limpo!"

lint:
	@npx eslint src/**/*.js

restart:
	@echo "Reinicie manualmente com: npm start (ou make start)"

test:
	@echo "Teste manual: envie !ping no WhatsApp"
