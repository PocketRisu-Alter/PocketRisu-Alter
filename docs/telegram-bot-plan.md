# Telegram Bot Integration Plan

## Overview
Connect PocketRisu characters and chat sessions to Telegram via a bot.

## Steps

### 1. Bot Creation Guide
- Add `docs/telegram-bot-setup.md` with step-by-step guide:
  1. Open @BotFather on Telegram
  2. `/newbot` → name → username → copy token
  3. Token format: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`

### 2. Database Schema
- Add to `Database` interface in `src/ts/storage/database.svelte.ts`:
  - `telegramToken?: string` — Bot token
  - `telegramEnabled?: boolean` — Master toggle
  - `telegramCharMapping?: TelegramCharMapping[]` — Character↔Telegram chat mapping
- Define `TelegramCharMapping`:
  ```ts
  interface TelegramCharMapping {
    telegramChatId: string    // Telegram chat/group ID
    chaId: string             // Character UUID
    enabled: boolean
  }
  ```

### 3. Backend: Telegram Bot Module
- Create `server/node/telegramBot.cjs`:
  - Polling-based (no webhook needed for self-hosted)
  - On incoming message: find matching character by `telegramChatId`, call `startChatJob` or direct API
  - Send responses back to Telegram
- API routes (`/api/telegram/*`):
  - `GET /api/telegram/status` — Bot running status
  - `POST /api/telegram/start` — Start bot with token
  - `POST /api/telegram/stop` — Stop bot
  - `GET /api/telegram/chats` — List linked chats

### 4. Frontend: Settings UI
- New settings page: `TelegramSettings.svelte` (SettingsMenuIndex 24)
  - Token input field (masked)
  - Enable/disable toggle
  - Character select + Telegram chat ID mapping section
  - Connection status indicator
- Register in `Settings.svelte` with Telegram icon

### 5. i18n
- Add keys to `en.ts` and `ko.ts`:
  - `telegram`
  - `telegramDesc`
  - `telegramToken`
  - `telegramEnable`
  - `telegramCharMapping`
  - `telegramStatus`
  - etc.

### 6. Verify
- Start server → connect bot → send message on Telegram → character responds
