# PocketRisu-Alter — modular patch set (targeting upstream v1.8.1)

This is the fork's work re-based onto **upstream PocketRisu v1.8.1**, sliced into
the same feature modules as the original capture so it can be applied as an
overlay on top of the current upstream.

## Base

| | |
|---|---|
| Upstream base | **`upstream/main`** — `PocketRisu/PocketRisu`, **v1.8.1** (`63832a13`) |
| Fork origin | PocketRisu v1.7.3 (`d6b0ce43`), 67 commits |
| Conflicts resolved | 6 files (see below) |
| Build verified | `pnpm install --frozen-lockfile && vite build` ✅ |

Every file that differs between v1.8.1 and the ported tree is assigned to exactly
one module (a **disjoint partition**). Applying all modules on a clean v1.8.1
checkout reproduces the ported tree **byte-for-byte** (verified). Each module
touches a non-overlapping set of files, so any subset applies independently.

## Modules (feature-grouped)

| # | Module | What it is | +/- |
|---|--------|------------|-----|
| 01 | **backend-jobs** | Node backend job runner + multi-agent server, client `backendJob.ts`, presets-as-backend-jobs, capability detection/tags. | +4932 / -63 |
| 02 | **chat-rendering** | Streaming/scroll/image fixes + **floating composer** (`DefaultChatScreen.svelte`, fork's design kept over upstream's fixed-textarea revert). | +447 / -398 |
| 03 | **design-system** | AlterRisu design system + settings workbench styling, colorscheme, bubble editor. | +1192 / -281 |
| 04 | **settings-selects** | Constrain overflowing `<select>` menus in setting lists. | +111 / -21 |
| 05 | **sidebar-nav** | Sidebar related-links + mobile header/chat-list (merged with upstream's recent-chats list). | +262 / -88 |
| 06 | **remove-update-telemetry** | Strip auto-update popup, public-stats telemetry, dev panel, patch-note feed. | +22 / -485 |
| 07 | **ci-docker** | Docker workflow (build + publish to GHCR **on push to `main`**), Dockerfile, docker-compose. | +52 / -68 |
| 08 | **docs-readme** | Korean-only docs, drop multilingual docs/i18n, English README. | +249 / -3422 |
| 09 | **i18n-strings** | In-app translation strings (capability/settings keys + rebrand). | +147 / -139 |
| 10 | **branding-registry** | `PocketRisu` → `PocketRisu-Alter` in bundled provider notes. | +20 / -20 |
| 11 | **build-tooling** | package.json, pnpm, vite, opencode config, test artifact. | +1374 / -1349 |
| 12 | **core-misc** | Cross-cutting core edits: `styles.css` (scrollbar), bootstrap/polyfill, storage, misc UI. | +533 / -157 |

## Conflicts resolved when porting v1.7.3 → v1.8.1

These 6 files needed a manual merge because upstream changed the same region:

- **`DefaultChatScreen.svelte`** — kept the fork's **floating composer** (upstream
  reverted to a fixed textarea in v1.8.0). Trade-off: upstream's chat-panel plugin
  rendering and dynamic load-pages helper are not present in this file.
- **`Sidebar.svelte`** — kept both the fork's related-links buttons **and**
  upstream's new recent-chats list + hide toggle.
- **`styles.css`** — kept the fork's 10px always-visible scrollbar with the
  `.n-scroll` opt-in auto-hide (over upstream's 4px global auto-hide).
- **`src/lang/en.ts`** — kept upstream's new `showInputActionBar` key + the fork's
  `PocketRisu-Alter` rebrand.
- **`bootstrap.ts`** — kept upstream's new `chatDraft` import, dropped the fork-removed
  `update`/`publicStats` imports.
- **`Dockerfile`** — kept upstream's pinned `pnpm@10.34.1` base stage (matches
  `packageManager`); fork's other Dockerfile changes applied cleanly.

## Applying

```bash
# on a clean checkout of upstream/main (v1.8.1)
./patches/apply.sh                # all modules
./patches/apply.sh 01 02 06       # only selected modules
THREEWAY=0 ./patches/apply.sh     # exact apply (no fuzzy merge)
```
