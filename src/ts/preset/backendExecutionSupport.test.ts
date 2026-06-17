import { describe, expect, it } from 'vitest'
import { getAdapterBackendExecutionSupport } from './backendExecutionSupport'

describe('adapter capability matrix', () => {
    it('marks compatible adapters available', () => {
        expect(getAdapterBackendExecutionSupport('openai-compatible').supported).toBe(true)
    })

    it('marks other adapters unavailable', () => {
        expect(getAdapterBackendExecutionSupport('anthropic-messages').supported).toBe(false)
        expect(getAdapterBackendExecutionSupport('google-gemini').supported).toBe(false)
    })
})
