/**
 * A global GUI refresh must re-parse message variables without destroying every
 * ChatBody instance. Only an explicit per-message reload may change this key.
 */
export function getChatBodyReloadKey(
    _globalReloadPointer: number,
    messageReloadPointer: number | undefined,
): number {
    return messageReloadPointer ?? 0
}
