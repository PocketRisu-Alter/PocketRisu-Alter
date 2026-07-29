import { describe, expect, test } from 'vitest'
import { getChatBodyReloadKey } from './chatRenderKey'

describe('getChatBodyReloadKey', () => {
    test('keeps the ChatBody instance stable across a global GUI refresh', () => {
        const localReload = 3

        expect(getChatBodyReloadKey(10, localReload)).toBe(localReload)
        expect(getChatBodyReloadKey(11, localReload)).toBe(localReload)
    })

    test('changes only for an explicit per-message reload', () => {
        expect(getChatBodyReloadKey(10, undefined)).toBe(0)
        expect(getChatBodyReloadKey(10, 1)).toBe(1)
    })
})
