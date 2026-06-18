// Dev-only markdown re-parse tracer.
//
// Markdown parsing is one of the heaviest per-message operations (markdown +
// sanitize). If a message's `markParsing` re-runs on unrelated/idle reactive
// updates, EVERY visible message re-parses on each tick — a plausible cause of
// the device heating up during normal use.
//
// This tracer counts parses in a rolling window so you can SEE whether idle,
// scrolling, or unrelated UI actions trigger a re-parse storm.
//
//   Enable:  localStorage.setItem('risu-parse-debug','1')  then reload
//   Disable: localStorage.removeItem('risu-parse-debug')
//
// When disabled it costs a single cached boolean check, so it can stay wired in
// production without measurable overhead.

let enabled: boolean | null = null

function isEnabled(): boolean {
    if (enabled === null) {
        try {
            enabled = localStorage.getItem('risu-parse-debug') === '1'
        } catch {
            enabled = false
        }
    }
    return enabled
}

const WINDOW_MS = 1000
let windowStart = 0
let count = 0
const seenIdx = new Set<number>()

export function reportMarkdownParse(idx: number): void {
    if (!isEnabled()) return
    const now = Date.now()
    if (windowStart === 0) windowStart = now
    count++
    seenIdx.add(idx)
    if (now - windowStart >= WINDOW_MS) {
        const idxList = [...seenIdx].sort((a, b) => a - b)
        console.info(
            `[parse-debug] ${count} markdown parse(s) in ${now - windowStart}ms ` +
            `across ${seenIdx.size} message(s): idx [${idxList.join(',')}]`
        )
        windowStart = now
        count = 0
        seenIdx.clear()
    }
}
