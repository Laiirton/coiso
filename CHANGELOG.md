# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-04-29

### 🎉 Major Refactor - Professional Architecture

This release completely reorganizes the bot with a clean, production-ready architecture.

### ✨ Added

- **Professional project structure** with separation of concerns:
  - `src/services/WhatsAppService.js` - Core WhatsApp connection management
  - `src/handlers/MessageHandler.js` - Message processing and command routing
  - `src/utils/logger.js` - Professional logging with daily rotation
  - `src/utils/shutdown.js` - Graceful shutdown utilities

- **Enhanced command system**:
  - Dynamic command loading from `src/commands/`
  - Support for aliases (e.g., `!ping` / `!p` / `!pong`)
  - Command categories (misc, admin, fun, util)
  - Built-in `!help` command with detailed info
  - Built-in `!status` command with system metrics

- **Improved configuration**:
  - Centralized config in `src/config/index.js`
  - Environment-based via `.env`
  - `.env.example` template included
  - Support for admin-only commands

- **Production features**:
  - Graceful shutdown (SIGINT, SIGTERM)
  - Reconnection with exponential backoff
  - QR code detection and display
  - Session persistence (auth_info_baileys)
  - Log rotation (daily files in `logs/`)
  - Configurable timeouts and retries

- **Documentation**:
  - Comprehensive README.md
  - Code comments and JSDoc
  - Professional .gitignore

### 🔧 Changed

- **Baileys v7 migration**:
  - Updated to `baileys@7.0.0-rc.9` (official package name)
  - Fixed QR code not showing (issue #2370)
  - Explicit `version` and `browser` configuration
  - Fixed version: `[2, 3000, 1033893291]`

- **Entry point**: Moved from `index.js` → `src/bot.js`
- **Package.json**: Updated scripts and main entry
- **Config**: Split from single file to modular `src/config/`
- **Logging**: Switched to structured pino with file output

### 🐛 Fixed

- QR code generation failure on startup
- Connection 405 errors due to missing version config
- Implicit dependencies causing runtime errors
- Log formatting in development mode

### 🗑️ Removed

- Deprecated `@whiskeysockets/baileys` package (now `baileys`)
- Legacy `index.js` in root
- Unused `src/core/` directory
- Duplicate config files

### 📚 Documentation

- Complete README with setup instructions
- Architecture diagram in code comments
- Command development guide
- Troubleshooting section

## [1.0.0] - 2026-04-15

### 🎉 Initial Release

- Basic WhatsApp connection via Baileys
- Ping command
- QR code authentication
- Session persistence
