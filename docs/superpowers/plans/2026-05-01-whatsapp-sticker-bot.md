# WhatsApp Sticker Bot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a maintainable WhatsApp bot with WPPConnect that converts image and video messages into stickers.

**Architecture:** A small TypeScript application with clear boundaries: configuration, WhatsApp adapter, message routing, sticker feature logic, and media processing. WPPConnect handles the WhatsApp session and message I/O, while a dedicated sticker pipeline normalizes media, converts videos to GIFs, and sends stickers back through the client.

**Tech Stack:** Node.js, TypeScript, `@wppconnect-team/wppconnect`, `zod`, `pino`, `ffmpeg-static`, `vitest`.

---

## File Map

- `package.json`: runtime and dev scripts, dependencies, and package metadata.
- `tsconfig.json`: compiler settings for a CommonJS Node runtime.
- `eslint.config.mjs`: lint rules for TypeScript source files.
- `.env.example`: documented runtime configuration.
- `README.md`: setup, session login, command usage, and maintenance notes.
- `src/index.ts`: process bootstrap and graceful shutdown.
- `src/config/env.ts`: environment parsing and validation.
- `src/config/logger.ts`: structured logging setup.
- `src/infrastructure/whatsapp/create-client.ts`: WPPConnect session creation and QR/status handling.
- `src/infrastructure/whatsapp/message.ts`: message helpers and media type guards.
- `src/features/sticker/sticker-command.ts`: command parsing and sticker target resolution.
- `src/features/sticker/sticker-service.ts`: high-level sticker orchestration.
- `src/features/sticker/video-to-gif.ts`: video conversion pipeline for animated stickers.
- `src/features/sticker/media-source.ts`: media download, decode, and temporary file creation.
- `src/core/bot.ts`: message event wiring and command dispatch.
- `tests/...`: unit tests for command parsing and media target resolution.

### Task 1: Scaffold the project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `eslint.config.mjs`
- Create: `.env.example`
- Create: `.gitignore`

- [ ] **Step 1: Define the package scripts and dependencies**

```json
{
  "name": "whatsapp-sticker-bot",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "lint": "eslint .",
    "test": "vitest run"
  }
}
```

- [ ] **Step 2: Add TypeScript and lint configuration**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

- [ ] **Step 3: Verify the files are in place**

Run: `Get-ChildItem -Recurse`
Expected: `package.json`, `tsconfig.json`, `eslint.config.mjs`, `.env.example`, `.gitignore`, and `src/` are present.

- [ ] **Step 4: Commit**

```bash
git add package.json tsconfig.json eslint.config.mjs .env.example .gitignore
git commit -m "chore: scaffold whatsapp sticker bot"
```

### Task 2: Bootstrap WPPConnect and message routing

**Files:**
- Create: `src/index.ts`
- Create: `src/core/bot.ts`
- Create: `src/infrastructure/whatsapp/create-client.ts`
- Create: `src/infrastructure/whatsapp/message.ts`
- Create: `src/config/env.ts`
- Create: `src/config/logger.ts`

- [ ] **Step 1: Write the client bootstrap**

```ts
import { create } from '@wppconnect-team/wppconnect';

export async function createWhatsappClient() {
  return create({
    session: env.SESSION_NAME,
    headless: env.HEADLESS,
    logQR: true,
    disableWelcome: true,
    folderNameToken: env.TOKEN_STORE_DIR,
    tokenStore: 'file',
  });
}
```

- [ ] **Step 2: Route messages into a command dispatcher**

```ts
client.onMessage(async (message) => {
  if (message.fromMe || message.isNotification) return;
  await handleIncomingMessage(client, message);
});
```

- [ ] **Step 3: Add graceful shutdown and logging**

```ts
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
```

- [ ] **Step 4: Verify the bootstrap compiles**

Run: `npm run build`
Expected: TypeScript emits `dist/index.js` with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/index.ts src/core/bot.ts src/infrastructure/whatsapp/create-client.ts src/infrastructure/whatsapp/message.ts src/config/env.ts src/config/logger.ts
git commit -m "feat: bootstrap whatsapp client and router"
```

### Task 3: Implement sticker commands and media resolution

**Files:**
- Create: `src/features/sticker/sticker-command.ts`
- Create: `src/features/sticker/sticker-service.ts`
- Create: `src/features/sticker/media-source.ts`
- Create: `src/features/sticker/video-to-gif.ts`
- Modify: `src/core/bot.ts`

- [ ] **Step 1: Parse sticker and help commands**

```ts
export function parseCommand(text: string, prefix: string) {
  const normalized = text.trim().toLowerCase();
  if (!normalized.startsWith(prefix)) return null;
  const command = normalized.slice(prefix.length).trim().split(/\s+/)[0];
  return command;
}
```

- [ ] **Step 2: Resolve current or quoted media**

```ts
if (message.isMedia && isImageOrVideo(message.type)) {
  return { kind: 'current', message };
}

if (message.quotedMsgObj && isImageOrVideo(message.quotedMsgObj.type)) {
  return { kind: 'quoted', message: message.quotedMsgObj };
}
```

- [ ] **Step 3: Build the media conversion pipeline**

```ts
const ffmpegArgs = [
  '-y',
  '-i',
  inputPath,
  '-t',
  String(maxSeconds),
  '-vf',
  `fps=${fps},scale=${size}:${size}:force_original_aspect_ratio=decrease`,
  outputPath,
];
```

- [ ] **Step 4: Send stickers back through WPPConnect**

```ts
await client.sendImageAsSticker(chatId, imagePath, { quotedMsg: sourceMessage.id });
await client.sendImageAsStickerGif(chatId, gifPath, { quotedMsg: sourceMessage.id });
```

- [ ] **Step 5: Add tests for the command and target resolution**

```ts
expect(parseCommand('!sticker', '!')).toBe('sticker');
expect(resolveStickerTarget(mediaMessage, null)).toEqual({ kind: 'current', ... });
```

- [ ] **Step 6: Commit**

```bash
git add src/core/bot.ts src/features/sticker/*
git commit -m "feat: add sticker command pipeline"
```

### Task 4: Document and verify the project

**Files:**
- Create: `README.md`
- Create: `tests/sticker-command.test.ts`
- Create: `tests/sticker-target.test.ts`

- [ ] **Step 1: Write setup and usage docs**

Include:
- dependency install
- `.env` configuration
- QR login flow
- caption-based usage: `!sticker`
- reply-based usage on image/video
- maintenance notes for `ffmpeg` and token storage

- [ ] **Step 2: Run lint, tests, and build**

Run:

```bash
npm run lint
npm test
npm run build
```

Expected:
- no lint errors
- tests pass
- build succeeds

- [ ] **Step 3: Commit**

```bash
git add README.md tests
git commit -m "docs: add usage and tests"
```

## Self-Review Checklist

- [ ] Every file has one clear responsibility.
- [ ] Sticker creation works from image captions and replied media.
- [ ] Video conversion is isolated behind a single service.
- [ ] The bot can be extended with more commands without touching the media pipeline.
- [ ] The README explains exactly how to run the bot and what the commands do.

