# OpenMarketing Desktop

A desktop app over the same OpenMarketing runtime the `om` CLI uses. Pick a folder; the agent works inside it — built around the `/video` workflow.

- **Workspaces** — every folder you open gets its own agent process (`openmarketing --mode rpc --cwd <folder>`), so agents, skills, extensions, models and the video tools behave exactly as in the terminal.
- **Chat log as a timeline** — tool calls render as clips on a track, each with a card built for that tool: workspace folders, reference analysis (hook strip + pacing/loudness metrics), voice-over transcription, preview frames, render (player + facts), finish & QA (verdict + every check), terminal, file write/edit diffs, subagents, web search, Higgsfield generations.
- **Inspector** — three tabs: **Outputs** (`outputs/latest.mp4` with its QA verdict, all renders), **References** (portrait video previews that play on hover, with analysis status; drag & drop to add) and **Branding**.
- **Brand page** — the agent writes `branding/brand.html` from the skill's `references/brand-template.html` (palette tokens, type, voice, hooks, storyboard strip, reference strips) and uses it as the reference for every storyboard and render (its `#brand-tokens` palette is copied into the spec's `brand` field). The Branding tab previews it live and reloads when the agent edits it. **Edit with agent** → click any element in the page → type the change → the agent edits that element in place (`electron/picker.js` is injected through `media://inspect/…`; the page runs in a sandboxed iframe).
- **Design** — follows Cursor's desktop patterns: a sidebar a step lighter than the editor area (collapse, search, back/forward through workspace history; New Video, New Chat, Automations, Customize; Workspaces with sort + open folder; a Getting Started card that tracks real progress; user row with settings), an empty state that is just the context row (folder ▾ · branch ▾ · This Mac ▾) above a centred composer with one contextual action and a bottom tip, a composer with a + menu, a tinted Video mode chip and one combined model/thinking picker, top-right Finder ↗ · ⋯ · panel toggle, and a Customize settings sheet. Dark by default, light from Customize; system font (SF Pro), JetBrains Mono for code and numbers. Agent work renders as work blocks (grouped step rows, no rails).
- **Accounts & onboarding** — first launch without a connected provider opens onboarding; Customize → Accounts afterwards. Sign in with a subscription (OAuth: browser opens automatically, device codes and pasted codes supported) or paste an API key for any of the providers Pi supports. The same credential store as `om model login`. Connected accounts are listed above the profile in the sidebar. Served by `openmarketing desktop-bridge` (`src/desktop/bridge.ts`), a JSON-lines service the app keeps running (`electron/bridge-host.mjs`).
- **Session history** — every conversation is saved by the runtime; the active workspace lists its past sessions in the sidebar (title + age). Clicking one switches the live agent to it and restores the full log; New Chat starts a fresh session.
- **Approval gates** — extension confirm/select/input requests open as modals; nothing is approved silently.

## Run

```sh
cd apps/desktop
npm install
npm run dev     # Vite + Electron with hot reload
npm start       # production build, then launch
```

Requirements: Node 22.19+, and the OpenMarketing CLI — the app uses this repo's `bin/openmarketing.js`, or the globally linked `openmarketing` (`npm link` at the repo root). Override with `OM_CLI_PATH` / `OM_NODE`.

## Verify without clicking

`scripts/screenshot.mjs` renders the app headlessly (throwaway profile) and saves a PNG:

```sh
npm run build
node scripts/screenshot.mjs --out shot.png                                   # empty state
node scripts/screenshot.mjs --out shot.png --open ~/some/folder              # live: real agent connection
node scripts/screenshot.mjs --out shot.png --open ~/some/folder \
  --autoprompt "Set up the video workspace" --delay 60000                    # live: sends one real prompt
node scripts/screenshot.mjs --out shot.png --fixture events.jsonl \
  --cwd ~/some/folder --prompt "…" --size 1480x3000                          # replay a recorded RPC event stream
# add --tab outputs|references|branding, --view <file> or --theme dark|light to capture a specific panel, the large viewer or a theme
```

## Layout

| Path | Role |
|---|---|
| `electron/agent-host.mjs` | Spawns one runtime per workspace; JSONL framing, request/response ids, extension UI responses |
| `electron/main.mjs` | Window, `media://` protocol for workspace files (`media://inspect/…` injects the picker into HTML pages), recent workspaces, workspace listing, IPC |
| `electron/picker.js` | Element picker injected into brand pages; posts the picked selector/text/markup to the app |
| `electron/preload.cjs` | The `window.om` bridge (context-isolated) |
| `src/lib/session.ts` | Pure reducer: RPC events / saved history → chat-log items |
| `src/components/cards/` | `CardShell` (a step row inside a work block) + per-tool cards |
| `src/components/` | Sidebar, Composer (slash commands, model + thinking pickers), ChatLog, Inspector, BrandPreview (live page + edit with agent), overlays |

Terminals inside VS Code export `ELECTRON_RUN_AS_NODE=1`; `scripts/electron.mjs` clears it so the app starts as an app, not as plain Node.
