import { getCurrentCharacter, getCurrentChat, getDatabase, type character, type Chat } from "../../storage/database.svelte";
import type { ModelModeExtended } from "./shared";
import { requestChatData, type requestDataArgument, type requestDataResponse, type StreamResponseChunk } from "./request";
import { resolveChatModelBinding } from "./modelPresetBinding";
import { getModelPresetBackendExecutionSupport } from "../../preset/backendExecutionSupport";
const MULTIAGENT_VAULT_KEY = 'risu_multiagent_lite_config_vault_v1';

function readMultiagentConfig(): Record<string, any> | null {
    const db = getDatabase();
    // Native config first — no plugin install/setup required. The backend
    // (server/node/multiagent.cjs) supplies built-in agent prompts, so only
    // an apiKey is strictly required for the pipeline to run.
    const native = db.backendMultiagentConfig;
    if (native && native.apiKey) {
        return native;
    }
    // Backward compatibility: fall back to the MultiAgent browser plugin's
    // config vault for users who configured it before native settings existed.
    try {
        const raw = db.pluginCustomStorage?.[MULTIAGENT_VAULT_KEY];
        if (!raw) return null;
        const vault = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (!vault || vault.scope !== 'lite' || !vault.config) return null;
        const config = vault.config;
        if (!config.apiKey) return null;
        return config;
    } catch {
        return null;
    }
}

interface ChatJobTarget {
    chaId: string;
    chatIndex: number;
    chatId: string;
    messageIndex: number;
}

interface ChatJobDescriptor {
    url: string;
    body: Record<string, any>;
    headers: Record<string, string>;
    multiagent?: Record<string, any>;
}

type ChatJobState = 'pending' | 'running' | 'done' | 'error' | 'cancelled';

interface ChatJobStatus {
    id?: string;
    jobId?: string;
    status: ChatJobState;
    text: string;
    error: string | null;
    finishReason: string | null;
    target: ChatJobTarget;
    updatedAt?: number;
}

const STREAM_RENDER_INTERVAL_MS = 40;
const STREAM_RECONNECT_DELAY_MS = 500;
const resumingJobIds = new Set<string>();

function parseDescriptor(response: requestDataResponse): ChatJobDescriptor | null {
    if (response.type !== 'success') return null;
    try {
        const descriptor = JSON.parse(response.result) as ChatJobDescriptor;
        if (!descriptor?.url || !descriptor?.body || !descriptor?.headers) return null;
        return descriptor;
    } catch {
        return null;
    }
}

async function authenticatedBackendFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
    const { forageStorage } = await import('../../globalApi.svelte');
    return forageStorage.authenticatedFetch(input, init);
}

function sleep(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function acknowledgeTarget(target: ChatJobTarget) {
    await authenticatedBackendFetch('/api/chat-job/result/ack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chaId: target.chaId,
            chatId: target.chatId,
            messageIndex: target.messageIndex,
        }),
    }).catch(() => {});
}

/**
 * Runs a chat generation as a backend job.
 *
 * OpenAI-compatible model presets are prepared through the normal request path
 * in preview mode, then handed to the Node server. This includes providers such
 * as Vercel AI Gateway and OpenRouter because their presets use the same wire
 * format. Native Anthropic/Gemini adapters and presets with browser-side tool
 * execution continue on the foreground path instead of silently losing features.
 */
export async function requestChatDataBackend(
    arg: requestDataArgument,
    model: ModelModeExtended,
    abortSignal: AbortSignal = null
): Promise<requestDataResponse> {
    const db = getDatabase();
    if (!db.useBackendChatJobs) {
        return await requestChatData(arg, model, abortSignal);
    }

    const binding = resolveChatModelBinding(getCurrentChat(), model);
    let descriptorResponse: requestDataResponse;
    let descriptor: ChatJobDescriptor | null = null;

    if (binding.kind === 'modelPreset') {
        const support = getModelPresetBackendExecutionSupport(binding.preset);
        if (!support.supported) {
            console.info('[BackendJob] Model preset uses foreground execution', {
                preset: binding.preset.name,
                adapterKind: binding.preset.profileSnapshot.adapterKind,
                reason: support.code,
            });
            return await requestChatData(arg, model, abortSignal);
        }

        descriptorResponse = await requestChatData(
            { ...arg, previewBody: true, useStreaming: true, skipBeforeRequestHooks: true },
            model,
            abortSignal
        );
        descriptor = parseDescriptor(descriptorResponse);
        if (!descriptor) return descriptorResponse;

        const caps = binding.preset.profileSnapshot.capabilities;
        descriptor.body.stream = !caps || caps.includes('streaming');
    } else {
        descriptorResponse = await requestChatData(
            { ...arg, backendJob: true, useStreaming: true, skipBeforeRequestHooks: true },
            model,
            abortSignal
        );
        descriptor = parseDescriptor(descriptorResponse);
        if (!descriptor) return descriptorResponse;
    }

    if (db.useBackendMultiagent) {
        const multiagentConfig = readMultiagentConfig();
        if (multiagentConfig) {
            descriptor.multiagent = multiagentConfig;
        }
    }

    const currentChar = getCurrentCharacter();
    const currentChat = getCurrentChat();
    if (!currentChar || !currentChat) {
        return { type: 'fail', result: 'No active chat for backend job' };
    }

    const target: ChatJobTarget = {
        chaId: currentChar.chaId,
        chatIndex: currentChar.chatPage ?? 0,
        chatId: currentChat.id || (currentChar.chatPage ?? 0).toString(),
        // For "continue", the AI message being extended is the last one (length - 1).
        // For a new reply, the message will be pushed at the current length.
        messageIndex: arg.continue ? currentChat.message.length - 1 : currentChat.message.length,
    };

    const startRes = await authenticatedBackendFetch('/api/chat-job/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descriptor, target }),
        signal: abortSignal,
    });

    if (!startRes.ok) {
        const text = await startRes.text().catch(() => '');
        return { type: 'fail', result: `Backend job start failed: ${startRes.status} ${text}` };
    }

    const { jobId } = await startRes.json();
    if (!jobId) {
        return { type: 'fail', result: 'Backend job start returned no jobId' };
    }

    if (abortSignal?.aborted) {
        await authenticatedBackendFetch(`/api/chat-job/${jobId}/cancel`, { method: 'POST' }).catch(() => {});
        return { type: 'fail', result: 'Aborted' };
    }

    return {
        type: 'streaming',
        result: createBackendJobStream(jobId, target, abortSignal),
        model: descriptorResponse.model,
    };
}

function createBackendJobStream(
    jobId: string,
    target: ChatJobTarget,
    abortSignal: AbortSignal = null,
): ReadableStream<StreamResponseChunk> {
    return new ReadableStream<StreamResponseChunk>({
        start(controller) {
            let closed = false;
            let connectionController: AbortController | null = null;
            let flushTimer: ReturnType<typeof setTimeout> | null = null;
            let pendingText: string | null = null;
            let lastQueuedText = '';

            const clearFlushTimer = () => {
                if (flushTimer) {
                    clearTimeout(flushTimer);
                    flushTimer = null;
                }
            };

            const flushText = () => {
                clearFlushTimer();
                if (closed || pendingText === null || pendingText === lastQueuedText) return;
                lastQueuedText = pendingText;
                pendingText = null;
                controller.enqueue({ text: lastQueuedText });
            };

            const queueText = (text: string, immediate = false) => {
                if (closed || typeof text !== 'string' || text === lastQueuedText) return;
                pendingText = text;
                if (immediate) {
                    flushText();
                    return;
                }
                if (!flushTimer) {
                    flushTimer = setTimeout(flushText, STREAM_RENDER_INTERVAL_MS);
                }
            };

            const close = (acknowledge = true) => {
                if (closed) return;
                flushText();
                closed = true;
                clearFlushTimer();
                connectionController?.abort();
                if (acknowledge) void acknowledgeTarget(target);
                try { controller.close(); } catch { /* ignore */ }
            };

            const fail = (reason: string, acknowledge = true) => {
                if (closed) return;
                flushText();
                closed = true;
                clearFlushTimer();
                connectionController?.abort();
                if (acknowledge) void acknowledgeTarget(target);
                try { controller.error(new Error(reason)); } catch { /* ignore */ }
            };

            const handleEvent = (data: any) => {
                if (!data || closed) return;
                if (data.type === 'chunk' && typeof data.text === 'string') {
                    queueText(data.text);
                    return;
                }
                if (data.type !== 'status') return;
                // A status event can carry the authoritative final text — notably
                // when we (re)connect to a job that has *already* finished, the
                // server sends a single status event with `text` and no preceding
                // chunk. Apply it before closing so the message isn't frozen at
                // whatever partial text was recovered earlier.
                if (typeof data.text === 'string') queueText(data.text, true);
                if (data.status === 'done') {
                    flushText();
                    close(true);
                } else if (data.status === 'error') {
                    fail(data.error || 'Backend job failed', true);
                } else if (data.status === 'cancelled') {
                    fail('Aborted', true);
                }
            };

            const readSse = async (response: Response) => {
                if (!response.body) throw new Error('Backend stream returned no body');
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';
                try {
                    while (!closed) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
                        let splitIndex: number;
                        while ((splitIndex = buffer.indexOf('\n\n')) !== -1) {
                            const event = buffer.slice(0, splitIndex);
                            buffer = buffer.slice(splitIndex + 2);
                            const payload = event
                                .split('\n')
                                .filter((line) => line.startsWith('data:'))
                                .map((line) => line.slice(5).trimStart())
                                .join('\n');
                            if (!payload) continue;
                            try { handleEvent(JSON.parse(payload)); } catch { /* ignore malformed events */ }
                        }
                    }
                } finally {
                    try { reader.releaseLock(); } catch { /* ignore */ }
                }
            };

            const fetchStatus = async (): Promise<ChatJobStatus | null> => {
                const response = await authenticatedBackendFetch(`/api/chat-job/${jobId}`);
                if (response.status === 404) return null;
                if (!response.ok) throw new Error(`Backend job status failed: ${response.status}`);
                return response.json();
            };

            const run = async () => {
                while (!closed) {
                    connectionController = new AbortController();
                    try {
                        const response = await authenticatedBackendFetch(`/api/chat-job/${jobId}/stream`, {
                            headers: { Accept: 'text/event-stream' },
                            signal: connectionController.signal,
                        });
                        if (response.status === 404) {
                            fail('Backend job not found', false);
                            return;
                        }
                        if (!response.ok) {
                            throw new Error(`Backend stream failed: ${response.status}`);
                        }
                        await readSse(response);
                    } catch (error) {
                        if (closed || connectionController.signal.aborted) return;
                        console.warn('[BackendJob] Stream disconnected; reconnecting', error);
                    }

                    if (closed) return;
                    try {
                        const status = await fetchStatus();
                        if (!status) {
                            fail('Backend job not found', false);
                            return;
                        }
                        if (typeof status.text === 'string') queueText(status.text, true);
                        if (status.status === 'done') {
                            close(true);
                            return;
                        }
                        if (status.status === 'error') {
                            fail(status.error || 'Backend job failed', true);
                            return;
                        }
                        if (status.status === 'cancelled') {
                            fail('Aborted', true);
                            return;
                        }
                    } catch {
                        // Reconnect and retry after transient auth/network failures.
                    }
                    await sleep(STREAM_RECONNECT_DELAY_MS);
                }
            };

            const onAbort = () => {
                authenticatedBackendFetch(`/api/chat-job/${jobId}/cancel`, { method: 'POST' }).catch(() => {});
                fail('Aborted', false);
            };
            abortSignal?.addEventListener('abort', onAbort, { once: true });

            void run().finally(() => {
                abortSignal?.removeEventListener('abort', onAbort);
            });
        },
        cancel() {
            // Disconnecting the browser must not cancel the server-side job.
            // Explicit user aborts are handled by abortSignal above.
        },
    });
}

interface RecoveredResult {
    jobId: string;
    status: ChatJobState;
    text: string;
    error: string | null;
    updatedAt?: number;
    target: ChatJobTarget;
}

function upsertRecoveredMessage(char: character, chat: Chat, result: RecoveredResult) {
    const targetIndex = result.target.messageIndex;
    if (targetIndex < chat.message.length && chat.message[targetIndex]?.role === 'char') {
        chat.message[targetIndex].data = result.text ?? '';
        chat.message[targetIndex].chatId = chat.message[targetIndex].chatId || result.jobId;
        return true;
    }
    if (targetIndex >= chat.message.length) {
        // DB race condition: messages not yet persisted at page refresh time.
        // Pad with empty user messages if we're behind, then push the AI reply.
        while (chat.message.length < targetIndex) {
            chat.message.push({ role: 'user', data: '', saying: '', time: result.updatedAt ?? Date.now() });
        }
        chat.message.push({
            role: 'char',
            saying: char.chaId,
            time: result.updatedAt ?? Date.now(),
            data: result.text ?? '',
            chatId: result.jobId,
        });
        return true;
    }
    return false;
}

async function resumeBackendJobIntoChat(char: character, chat: Chat, result: RecoveredResult) {
    if (resumingJobIds.has(result.jobId)) return;
    resumingJobIds.add(result.jobId);
    const targetIndex = result.target.messageIndex;
    chat.isStreaming = true;

    const { doingChat, recoveryAbortController } = await import('../index.svelte');
    const abortController = new AbortController();
    recoveryAbortController.set(abortController);
    doingChat.set(true);

    try {
        const stream = createBackendJobStream(result.jobId, result.target, abortController.signal);
        const reader = stream.getReader();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = value?.[Object.keys(value)[0]];
            const message = chat.message[targetIndex];
            if (message?.role === 'char' && typeof text === 'string') {
                message.data = text;
                // Drive Svelte 5 reactivity per chunk, mirroring the normal streaming path.
                char.reloadKeys = (char.reloadKeys ?? 0) + 1;
            }
        }
    } catch (error) {
        console.error('[BackendJob] Failed to resume job', result.jobId, error);
    } finally {
        chat.isStreaming = false;
        resumingJobIds.delete(result.jobId);
        char.reloadKeys = (char.reloadKeys ?? 0) + 1;
        recoveryAbortController.set(null);
        doingChat.set(false);
    }
}

/**
 * Applies completed results and reconnects to jobs that are still running.
 * Called when a chat is opened, including immediately after a page refresh.
 */
export async function applyPendingBackendChatResults(char: character, chat: Chat): Promise<number> {
    const db = getDatabase();
    if (!db.useBackendChatJobs) return 0;
    if (!char?.chaId) return 0;
    
    const effectiveChatId = chat?.id || (char.chatPage ?? 0).toString();

    const res = await authenticatedBackendFetch(`/api/chat-job/results?chaId=${encodeURIComponent(char.chaId)}&chatId=${encodeURIComponent(effectiveChatId)}`).catch(() => null);
    if (!res?.ok) return 0;

    const results: RecoveredResult[] = await res.json();
    if (!Array.isArray(results) || results.length === 0) return 0;

    let applied = 0;
    for (const result of results) {
        if (!result?.target || !result.jobId) continue;

        if (result.status === 'pending' || result.status === 'running') {
            if (upsertRecoveredMessage(char, chat, result)) {
                applied++;
                void resumeBackendJobIntoChat(char, chat, result);
            }
            continue;
        }

        if (result.status === 'done') {
            if (upsertRecoveredMessage(char, chat, result)) applied++;
            await acknowledgeTarget(result.target);
            continue;
        }

        // Failed/cancelled jobs should not be offered again on every chat open.
        await acknowledgeTarget(result.target);
    }

    return applied;
}
