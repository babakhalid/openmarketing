---
title: Release Notes
description: User-facing changelog for OpenMarketing releases.
section: Reference
order: 5
---

GitHub releases use the matching version section from the repository's `RELEASES.md` file.

## v0.1.1 — 2026-10-31

### Fixes

- The standalone installer works: the native bundle builds again (its self-check now verifies Node's built-in SQLite, which the memory package uses), and a bundled install no longer needs Node.js or npm on the machine to start a chat.
- With only a Gemini key, the default model is now the newest Gemini Flash model instead of a deep-research agent model; specialized Gemini variants (computer use, live, image) are no longer picked automatically.
- Package-manager output is written to stderr, so it can't interfere with the desktop app's connection to the agent.
- `undici` is declared as a dependency instead of being borrowed from Pi.

### Project

- The README shows the product in motion and documents the desktop app, the `/video` workflow and all nine agents; CONTRIBUTING has a project map and the full set of checks.
- Unused code, dependencies and leftover assets were removed, and `npm run unused` keeps it that way.

## v0.1.0 — 2026-07-22

Initial release of OpenMarketing: an open-source marketing operating system for technical founders.

### Founder-first workflow

- `/start`, `/context`, `/diagnose`, and `/next` provide a guided front door and one justified next action.
- `/customer-research` and `/research` gather traceable customer, alternatives, demand, category, and distribution evidence.
- `/strategy` chooses focused bets and explicit non-bets; `/plan` turns them into a sequenced 90-day execution plan.
- `/weekly-review` makes continue/change/stop/investigate decisions; `/loop` designs safe, stateful recurring work.
- `/persona`, `/psychology`, `/creative`, `/track`, `/report`, and `/summarize` remain available as specialist workflows.

Paid advertising is readiness-gated rather than the default recommendation.

### Agents and integrity

OpenMarketing bundles eight specialists: market researcher, customer researcher, strategist, psychology analyst, persona builder, creative director, tracker, and reporter.

Important claims and metrics must trace to source URLs, saved artifacts, raw platform responses, or tool outputs. Publishing, outreach, external uploads, live-account changes, and spend require explicit user approval. The creative director never launches ads.

### Identity and migration

- Package: `openmarketing`
- Commands: `openmarketing` and `om`
- User state: `~/.openmarketing`
- Project package state: `.openmarketing/npm`
- Environment namespace: `OPENMARKETING_*`

On first launch, legacy `~/.adsagents` or `~/.feynman` state is atomically migrated only when the new home is absent. Conflicting old/new directories are both preserved. Deprecated `ADSAGENTS_*` variables remain temporary fallback aliases.

### Lineage

OpenMarketing was forked from [Feynman](https://github.com/getcompanion-ai/feynman) (MIT). Its context-first skills, full-funnel workflow handoffs, and recurring-loop contract were inspired by [Corey Haines' Marketing Skills](https://github.com/coreyhaines31/marketingskills) (MIT) and adapted for durable local artifacts, strict provenance, and human approval gates.

See the repository [release notes](https://github.com/babakhalid/openmarketing/blob/main/RELEASES.md) for the canonical release entry and validation gate.
