---
title: Desktop App
description: The OpenMarketing desktop app — workspaces, accounts, the chat log, decision cards, and problem cards.
section: Getting Started
order: 3
---

The desktop app is an Electron app over the same runtime the `om` CLI uses. You pick a folder and the agent works inside it. It is built around the [`/video`](/docs/workflows/video) workflow, but every workflow, agent, skill and tool works the same as in the terminal.

## Run from source

The app is not packaged yet. Run it from a clone of the repository:

```bash
cd apps/desktop
npm install
npm start       # production build, then launch
```

For development with hot reload, use `npm run dev`.

Requirements: Node 22.19 or newer, and the OpenMarketing CLI. The app uses the repository's `bin/openmarketing.js`, or a globally linked `openmarketing` (`npm link` at the repo root). Override the paths with `OM_CLI_PATH` and `OM_NODE`.

## Accounts and sign-in

On first launch without a connected provider, onboarding opens. Later, manage accounts from Customize → Accounts.

- Sign in with a subscription (OAuth). The browser opens automatically; device codes and pasted codes are supported.
- Or paste an API key for any provider Pi supports.

Credentials go to the same store as `om model login`. Connected accounts are listed above your profile in the sidebar.

## Workspaces

Every folder you open gets its own agent process (`openmarketing --mode rpc --cwd <folder>`). Agents, skills, extensions, models and the video tools behave exactly as in the terminal.

Each conversation is saved. The sidebar lists the active workspace's past sessions with title and age. Clicking one switches the agent to it and restores the full log. New Chat starts a fresh session.

The inspector has three tabs:

- **Outputs** — `outputs/latest.mp4` with its QA verdict, and all renders.
- **References** — reference video previews that play on hover, with analysis status. Drag and drop to add videos.
- **Branding** — a live preview of `branding/brand.html`. Use **Edit with agent**, click any element, and type the change; the agent edits that element in place.

## Chat log cards

Tool calls render as cards, each built for its tool: workspace folders, reference analysis (hook strip, pacing and loudness metrics), voice-over transcription, preview frames, render (player and facts), finish and QA (verdict and every check), terminal, file write/edit diffs, subagents, web search, and Higgsfield generations.

## Decision cards

When the agent calls [`ask_user`](/docs/tools/checkpoints), the chat log shows a decision card. It has preview thumbnails (images, video, or HTML pages), the recommended option preselected with its reason, a field to answer in your own words, and a way to defer to the recommendation.

## Problem cards

When a turn fails, the app shows a problem card instead of a stack trace. It says what happened in plain words and offers fixes, recommended fix first:

| Problem | Fixes offered |
| --- | --- |
| Expired sign-in or invalid key | Sign in again, switch to another connected model, try again |
| Out of quota | Switch model, sign in, try again |
| Rate limited | Try again, switch model |
| Provider overloaded or down | Try again, switch model |
| Conversation too long for the model | Start a new chat, switch model |
| Network error or timeout | Try again, switch model |
| Any other error | Try again, switch model |

The raw error stays available under a details toggle. Once a fix works, the card collapses to a single line.

## Approval gates

Extension confirm, select and input requests open as dialogs. Nothing is approved silently.

## Source

[`apps/desktop/README.md`](https://github.com/babakhalid/openmarketing/blob/main/apps/desktop/README.md).
