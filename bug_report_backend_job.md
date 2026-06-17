# Backend Chat Job Recovery Bug

## Overview
The application supports running chat generation jobs on the Node.js backend (`useBackendChatJobs`). The goal is to allow the generation to continue even if the client disconnects, and for the UI to seamlessly reconnect and stream the ongoing generation when the user refreshes or reopens the page.

Currently, **the generation does not visually resume upon page refresh.** The user reports: "It quietly shows the previous messages as if no request was ever made."

## What Has Been Fixed So Far
1. **Missing `chat.id`**: Default chats in PocketRisu often lack an explicit `chat.id`. The function `applyPendingBackendChatResults` used to abort silently (`if (!chat?.id) return 0;`). This was fixed to fallback to `char.chatPage.toString()`.
2. **Missing Auto-Scroll**: After a successful UI recovery, the chat screen did not auto-scroll to the new message. This was fixed by adding a `setTimeout(() => get(ChatReloadAction)?.(), 50)` inside `globalApi.svelte.ts`.

## Outstanding Suspects & Areas to Investigate

### 1. Svelte 5 Reactivity in `Chats.svelte`
The chat UI uses Svelte 5's manual `mount` API inside `Chats.svelte` (`updateChatBody`). 
- When `backendJob.ts` streams chunks, it mutates the message directly: `chat.message[targetIndex].data = text;`
- Svelte 5 might not propagate this deep array mutation to the manually mounted `Chat` instances, causing the UI text bubble to stay completely blank or frozen, even though the backend stream is actively receiving data.
- **Action**: Check if a reactive trigger (like `$ReloadGUIPointer`) needs to be fired per chunk, or if the `Chat.svelte` props binding needs refactoring to properly track `$state` mutations.

### 2. Local Database Save Debouncing (Race Condition)
When a user hits "Send":
1. The user message is pushed locally.
2. The backend job is requested (saving `target.messageIndex`).
3. An empty `char` message is pushed locally.
- If the user refreshes the page **immediately** after hitting "Send", the local IndexedDB save may not have fired yet. 
- Upon reload, `chat.message.length` is too short. `upsertRecoveredMessage` checks `targetIndex === chat.message.length` or `targetIndex < chat.message.length`. If the local DB missed saving the last 2 messages, `targetIndex` will be greater than `chat.message.length`, causing the recovery to return `false` and silently drop the job.

### 3. Missing Global Generating State Lock
During a normal generation, PocketRisu locks the text input and shows a "Stop" button.
- `applyPendingBackendChatResults` sets `chat.isStreaming = true`, but this might not correctly toggle the global UI states (e.g., locking the bottom chat input bar).

### 4. Target Index Offset on "Continue"
If the user clicks "Continue" instead of sending a new prompt, the system appends to the last message. Check if `target.messageIndex` is computed correctly in `backendJob.ts` for the `continue` case.

## Next Steps for the Agent
1. Reproduce or logically trace the execution flow of `applyPendingBackendChatResults` -> `upsertRecoveredMessage` -> `resumeBackendJobIntoChat`.
2. Ensure that Svelte 5 DOM updates properly reflect the `message.data` stream in real-time.
3. Handle the DB race condition by pushing placeholder messages if `targetIndex > chat.message.length`.
