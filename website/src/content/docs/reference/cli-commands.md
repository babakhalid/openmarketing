---
title: CLI Commands
description: Complete reference for all OpenMarketing CLI commands and flags.
section: Reference
order: 1
---

This page covers the dedicated OpenMarketing CLI commands and flags. Workflow commands like `openmarketing start` and `om strategy` are also documented in the [Slash Commands](/docs/reference/slash-commands) reference since they map directly to REPL slash commands.

## Core commands

| Command | Description |
| --- | --- |
| `openmarketing` | Launch the interactive REPL |
| `om` | Launch the interactive REPL with the short alias |
| `openmarketing chat [prompt]` | Start chat explicitly, optionally with an initial prompt |
| `openmarketing help` | Show CLI help |
| `openmarketing setup` | Run the guided setup wizard |
| `openmarketing setup preview` | Install or verify preview dependencies |
| `openmarketing doctor` | Diagnose config, auth, Pi runtime, and preview dependencies |
| `openmarketing status` | Show the current setup summary (model, auth, packages) |

## Model management

| Command | Description |
| --- | --- |
| `openmarketing model list` | List available models in Pi auth storage |
| `openmarketing model login [id]` | Authenticate a model provider with OAuth or API-key setup |
| `openmarketing model logout [id]` | Clear stored auth for a model provider |
| `openmarketing model set <provider/model>` | Set the default model for all sessions |
| `openmarketing model tier [value]` | View or set the request service tier override |

These commands manage your model provider configuration. The `model set` command updates `~/.openmarketing/agent/settings.json` with the new default. It accepts either `provider/model-name` or `provider:model-name`. Running `openmarketing model login google` or `openmarketing model login amazon-bedrock` routes directly into the relevant API-key setup flow instead of requiring the interactive picker.

## Package management

| Command | Description |
| --- | --- |
| `openmarketing packages list` | List all available packages and their install status |
| `openmarketing packages install <preset>` | Install an optional package preset |
| `openmarketing update [package]` | Update installed packages, or a specific package by name |

Use `openmarketing packages list` to see which optional packages are available on your platform and which are already installed. See [Package Stack](/docs/reference/package-stack) for the core set.

## Web search & utility

| Command | Description |
| --- | --- |
| `openmarketing search status` | Show Pi web-access status and config path |
| `openmarketing search set <provider> [api-key]` | Set the web search provider and optionally save its API key |
| `openmarketing search clear` | Reset web search provider to auto while preserving API keys |

## REPL hotkeys

Inside the interactive REPL, use `/hotkeys` to show the live keyboard map. The default reasoning controls are:

| Hotkey | Action |
| --- | --- |
| `Shift+Tab` | Cycle thinking/reasoning level |
| `Ctrl+T` | Toggle thinking block visibility |

## Workflow commands

All top-level workflow slash commands can also be invoked directly from the CLI:

```bash
openmarketing start "API observability for small platform teams"
om customer-research api-observability
om research api-observability
om diagnose api-observability
om strategy api-observability
om plan api-observability
om weekly-review api-observability
om next api-observability
om video "15-second launch teaser for the API dashboard"
openmarketing summarize https://example.com/article
```

These are equivalent to launching the REPL and typing the corresponding slash command.

## Flags

| Flag | Description |
| --- | --- |
| `--prompt "<text>"` | Run one prompt and exit (one-shot mode) |
| `--model <provider/model\|provider:model>` | Force a specific model for this session |
| `--service-tier <tier>` | Override request service tier for this run |
| `--thinking <level>` | Set thinking level: `off`, `minimal`, `low`, `medium`, `high`, `xhigh` |
| `--cwd <path>` | Set the working directory for all file operations |
| `--session-dir <path>` | Set the session storage directory |
| `--new-session` | Start a new persisted session |
| `--doctor` | Alias for `openmarketing doctor` |
| `--setup-preview` | Alias for `openmarketing setup preview` |

## Environment variables

| Variable | Description |
| --- | --- |
| `OPENMARKETING_HOME` | Override the parent home directory; state is stored in `<value>/.openmarketing` |
| `OPENMARKETING_MODEL` | Default model for sessions |
| `OPENMARKETING_THINKING` | Default thinking level |
| `OPENMARKETING_SERVICE_TIER` | Provider service-tier override where supported |
| `HIGGSFIELD_BIN` | Path to the `higgsfield` CLI binary |
| `META_BIN` | Path to the Meta Ads CLI binary |

Former `ADSAGENTS_*` names remain deprecated fallback aliases for one transition period. Use `OPENMARKETING_*` for all new configuration.
