---
title: Package Stack
description: Core and optional Pi packages bundled with OpenMarketing.
section: Reference
order: 4
---

OpenMarketing is built on the Pi runtime and uses curated Pi packages for evidence gathering, durable context, delegation, scheduling, preview, and long-running work. Packages are managed through `openmarketing packages` commands and configured in `~/.openmarketing/agent/settings.json`.

## Core packages

These are installed by default with every OpenMarketing installation. The list matches `CORE_PACKAGE_SOURCES` in [`src/pi/package-presets.ts`](https://github.com/babakhalid/openmarketing/blob/main/src/pi/package-presets.ts).

| Package | Purpose |
| --- | --- |
| `@companion-ai/alpha-hub` | alphaXiv access, carried over from Feynman. Login state lives in `~/.ahub` |
| `pi-subagents` | Dispatch bundled marketing specialists and independent verification passes |
| `pi-btw` | Fast side-thread `/btw` conversations without interrupting the main workflow |
| `pi-docparser` | Parse PDFs, Office documents, spreadsheets, and images for content extraction |
| `pi-web-access` | Web search, browsing, GitHub access, PDF fetching, and media retrieval |
| `pi-markdown-preview` | Render Markdown artifacts as HTML or PDF (`/preview`) |
| `@walterra/pi-charts` | Generate charts and quantitative visualizations from data |
| `pi-mermaid` | Render Mermaid diagrams in the terminal UI |
| `@aliou/pi-processes` | Manage long-running jobs, background tasks, and log tailing |
| `pi-zotero` | Retrieve evidence from a configured Zotero library |
| `pi-schedule-prompt` | Schedule explicitly approved recurring work designed through `/loop` |
| `@samfp/pi-memory` | Preference and correction memory across sessions |
| `@tmustier/pi-ralph-wiggum` | Bounded iterative agent runs for long-running work |

`@samfp/pi-memory` contains native code. On Node majors newer than 24 it is left out automatically.

These packages are updated together when you run `openmarketing update`. You do not need to install them individually.

### Removed: session search

`@kaiserlich-dev/pi-session-search` is no longer bundled. It crashes the agent process on Pi 1.x after a session switch, so OpenMarketing removes it from existing configurations on launch. Session history is native in Pi and in the desktop app. See [Session Search](/docs/tools/session-search).

## Optional packages

Install on demand with `openmarketing packages install <preset>`.

| Package | Preset | Purpose |
| --- | --- | --- |
| `pi-generative-ui` | `generative-ui` (alias `ui`) | Interactive Glimpse UI widgets. macOS only |

`all-extras` installs every optional preset available on your platform.

## Installing and managing packages

List all available packages and their install status:

```bash
openmarketing packages list
```

Install a specific optional preset:

```bash
openmarketing packages install generative-ui
```

On Linux and Windows, `generative-ui` is hidden from `openmarketing packages list` and explicit installs print a platform message instead of attempting an npm install. In the standalone macOS bundle the preset is also unavailable, because its native dependency does not compile reliably there; install OpenMarketing through npm if you need it.

## Updating packages

Update all installed packages to their latest versions:

```bash
openmarketing update
```

Update a specific package:

```bash
openmarketing update pi-subagents
```

Running `openmarketing update` without arguments updates everything. Pass a specific package name to update just that one. Updates preserve your configuration.

This command updates Pi packages inside OpenMarketing's environment. To upgrade the standalone OpenMarketing app itself, rerun the installer from the [Installation guide](/docs/getting-started/installation).
