---
title: Slash Commands
description: Complete reference for OpenMarketing workflow commands.
section: Reference
order: 2
---

Slash commands are available inside the OpenMarketing REPL. Every top-level workflow can also be launched from the shell as `openmarketing <command> ...` or `om <command> ...`. Type `/help` inside the REPL for the live list, including commands supplied by installed Pi packages.

## Guided marketing

| Command | Description |
| --- | --- |
| `/start <product-or-startup>` | Establish or resume shared context, assess readiness, and choose one justified next action |
| `/context <product-or-slug>` | Create or update the canonical product, customer, offer, funnel, proof, and constraint record |
| `/diagnose <slug>` | Identify the binding full-funnel bottleneck and readiness gaps from saved evidence |
| `/next <slug>` | Select one highest-leverage action, with at most two conditional alternatives |
| `/strategy <slug>` | Choose a focused full-funnel strategy, explicit non-bets, measurement, and approval gates |
| `/plan <slug>` | Convert approved strategy into a sequenced 90-day plan with owners and decision rules |

`/start` is the recommended front door for a technical founder who is unsure what marketing task should happen first. The other commands are available when the desired deliverable is already clear.

## Research and strategy

| Command | Description |
| --- | --- |
| `/customer-research <topic-or-slug>` | Analyze supplied evidence or permitted public voice-of-customer evidence with quote provenance |
| `/research <topic-or-slug>` | Research competitors, alternatives, demand, category movement, distribution, and constraints |
| `/persona <topic-or-slug>` | Build evidence-grounded user, buyer, champion, and technical-evaluator profiles |
| `/psychology <topic-or-slug>` | Map JTBD, awareness, friction, and ethical persuasion to concrete messaging directions |

## Execute and launch

| Command | Description |
| --- | --- |
| `/creative <slug> [--variants <N>] [--format <format>]` | Generate readiness-gated ad variants through Higgsfield and save assets with provenance |
| `/video <brief-or-slug> [--format <F1\|F2\|F3\|F4>] [--platform <reels\|tiktok\|shorts\|pinterest\|all>]` | Make a short vertical video, guided step by step, and deliver `outputs/latest.mp4` after an automated QA gate |

Public publishing, outbound messages, external uploads, live-account changes, and spend always require explicit approval. The creative workflow may prepare assets but never launches ads. The video workflow never uploads or publishes.

## Measure and improve

| Command | Description |
| --- | --- |
| `/track <slug> [--window <days>]` | Pull and verify Meta Ads evidence for the paid-acquisition specialist branch |
| `/weekly-review <slug> [--period <range>]` | Validate full-funnel inputs, record learning, and make continue/change/stop/investigate decisions |
| `/loop <slug> <purpose>` | Design a bounded recurring process with state, self-checks, stop conditions, and a kill switch |
| `/report <slug>` | Create a decision-focused marketing report with missing coverage labeled |

## Utilities

| Command | Description |
| --- | --- |
| `/summarize <source>` | Summarize a URL, file, or PDF using the RLM windowing pattern |
| `/log` | Write a durable session log with completed work, findings, open questions, and next steps |
| `/jobs` | Inspect active background work, scheduled follow-ups, and watches |

## Project and session

| Command | Description |
| --- | --- |
| `/help` | Show grouped OpenMarketing commands and prefill a selected command |
| `/commands` | Browse all slash commands, including built-in and package commands |
| `/tools` | Browse all callable tools with their source and parameter summary |
| `/capabilities` | Show installed packages, discovery entrypoints, and capability counts |
| `/openmarketing-model` | Open the model picker for the main model and per-subagent overrides |
| `/service-tier` | View or set the provider service tier override for supported models |
| `/init` | Bootstrap `AGENTS.md` and session-log folders for a marketing workspace |
| `/outputs` | Browse context, campaign, creative, report, and note artifacts |
| `/preview` | Render a Markdown artifact as HTML or PDF |

`/search` came from the session-search package, which is no longer bundled. See [Session Search](/docs/tools/session-search).

## Package commands

Bundled packages add their own commands, such as `/agents`, `/run <agent> <task>`, `/chain`, `/parallel` (subagents), `/ps` (processes), `/schedule-prompt`, `/btw`, and `/hotkeys`. Run `/commands` for the live list.

## Running workflows from the CLI

The shell form is useful for one-shot tasks and scripts:

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
```

This is equivalent to entering the REPL and typing the corresponding slash command.
