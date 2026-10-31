# Release Notes

This file is the public release history for OpenMarketing. Keep entries user-facing: what changed, why it matters, and anything users should do after upgrading.

GitHub release notes are generated from the matching `## vX.Y.Z` section in this file.

## v0.1.1 - 2026-10-31

### Fixes

- The standalone installer works: the native bundle builds again (its self-check now verifies Node's built-in SQLite, which the memory package uses), and a bundled install no longer needs Node.js or npm on the machine to start a chat.
- With only a Gemini key, the default model is now the newest Gemini Flash model instead of a deep-research agent model; specialized Gemini variants (computer use, live, image) are no longer picked automatically.
- Package-manager output is written to stderr, so it can't interfere with the desktop app's connection to the agent.
- `undici` is declared as a dependency instead of being borrowed from Pi.

### Project

- The README shows the product in motion and documents the desktop app, the `/video` workflow and all nine agents; CONTRIBUTING has a project map and the full set of checks.
- Unused code, dependencies and leftover assets were removed, and `npm run unused` keeps it that way.

## v0.1.0 - 2026-07-22

Initial release of OpenMarketing — an open-source marketing operating system for technical founders.

### Founder-first workflow

- `/start` — establish shared context, assess six readiness gates, and choose one justified next action.
- `/context` — maintain the source of truth for product, customer, positioning, offer, proof, funnel, constraints, and approvals.
- `/customer-research` — synthesize first-party or public voice-of-customer evidence with quote provenance and source limitations.
- `/research` — map competitors, substitutes, DIY alternatives, demand signals, category movement, distribution evidence, and constraints.
- `/diagnose` — identify the binding full-funnel constraint without turning missing data into a score.
- `/next` — select one highest-leverage action from current evidence, capacity, and prerequisite readiness.
- `/strategy` — choose no more than three near-term bets, explicit non-bets, measurement, and approval gates.
- `/plan` — convert strategy into a sequenced 90-day plan with owners, dependencies, signals, decision rules, and stop criteria.
- `/weekly-review` — validate evidence and assign continue, change, stop, or investigate decisions.
- `/loop` — design safe recurring marketing work with durable state, idempotency, self-checks, escalation, and a kill switch.

Existing specialist workflows remain available: `/persona`, `/psychology`, `/creative`, `/track`, `/report`, and `/summarize`. Paid advertising is a readiness-gated branch, not the default recommendation.

### Agents and integrity

Eight bundled subagents: `market-researcher`, `customer-researcher`, `strategist`, `psych-analyst`, `persona-builder`, `creative-director`, `tracker`, and `reporter`.

- Quantitative claims and important outcomes must trace to a source URL, saved artifact, raw platform response, or tool output.
- Missing evidence remains labeled unknown, unverified, inferred, or blocked.
- Meaningful spend and public launches receive an adversarial strategy review.
- Publishing, outreach, external uploads, live-account changes, and spending require explicit user approval.
- The creative director may prepare assets but never launches ads.

### Identity and migration

- npm package: `openmarketing`.
- Commands: `openmarketing` and the short alias `om`; no `adsagents` executable is installed.
- Runtime state: `~/.openmarketing`.
- Project-local package state: `.openmarketing/npm`.
- Canonical environment variables: `OPENMARKETING_*`.

On first launch, OpenMarketing atomically moves `~/.adsagents` to `~/.openmarketing` when the new directory is absent. A prior `~/.feynman` directory is also supported as a secondary legacy source. If the new and old directories both exist, both are preserved and the new directory is used. Deprecated `ADSAGENTS_*` variables remain fallback aliases for one transition period.

### Integrations

- Higgsfield CLI — image/video generation and job verification.
- Meta Ads CLI — campaigns, ad sets, ads, insights, creative upload, and explicitly approved account changes.
- Provider-agnostic web search configured through `openmarketing search set`.
- Markdown preview and PDF export for generated reports.

### Lineage

OpenMarketing was forked from [Feynman](https://github.com/getcompanion-ai/feynman) v0.2.40 (MIT). The Pi runtime, skills architecture, install pipeline, and runtime patches remain important upstream foundations.

The context-first capability model, workflow handoffs, full-funnel framing, and recurring-loop structure were inspired by [Corey Haines' Marketing Skills](https://github.com/coreyhaines31/marketingskills) (MIT), then adapted for a local multi-agent runtime with durable artifacts, strict provenance, and human approval gates.

### Validation

The release gate runs the root test suite, TypeScript typecheck and build, website build, installer syntax checks, CLI smoke tests for both commands, and npm package-content verification.
