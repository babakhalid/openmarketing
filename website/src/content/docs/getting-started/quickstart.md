---
title: Quick Start
description: Start a guided marketing workflow in under five minutes.
section: Getting Started
order: 2
---

This guide assumes you have [installed OpenMarketing](/docs/getting-started/installation) and run `openmarketing setup`.

## Start with your product

From the product repository or a dedicated marketing workspace, run:

```bash
openmarketing start "An API observability product for small platform teams"
```

You can use the short alias too:

```bash
om start "An API observability product for small platform teams"
```

`start` inspects available project material, asks only for decision-changing gaps, creates `outputs/campaigns/<slug>-context.md`, assesses six readiness gates, and recommends one next action. It does not assume paid advertising is the right starting point.

## Continue in the REPL

Launch the interactive session:

```bash
openmarketing
```

The typical founder flow is:

```text
/customer-research <slug>
/research <slug>
/diagnose <slug>
/strategy <slug>
/plan <slug>
/weekly-review <slug>
/next <slug>
```

This is not a rigid wizard. OpenMarketing reads the saved context and skips or revisits stages based on evidence, startup stage, capacity, and the current funnel constraint.

## Use one-shot commands

Every top-level workflow is available directly from the shell:

```bash
om customer-research api-observability
om research api-observability
om diagnose api-observability
om strategy api-observability
om plan api-observability
```

Important work is written to `outputs/` so later workflows can reuse the evidence and decisions.

## Review and repeat

After execution produces real evidence, run:

```bash
om weekly-review api-observability
om next api-observability
```

The review checks data freshness and definitions, records learning, and assigns continue/change/stop/investigate decisions. `/loop` can turn a proven recurring task into a stateful process, but OpenMarketing will not schedule it unless you explicitly request recurrence.

## Make a video

To produce a short vertical video, run `/video` with a brief:

```bash
om video "15-second launch teaser for the API dashboard"
```

The agent stops at each decision (brand, references, style, storyboard, review) and recommends an option. See the [Video workflow](/docs/workflows/video). The [desktop app](/docs/getting-started/desktop-app) shows these checkpoints as cards with previews.

## Human approval

Analysis and drafts can run autonomously. Publishing, outreach, creative uploads, live-account changes, and spending require explicit user approval. Missing data remains marked unknown; OpenMarketing does not manufacture benchmarks or results.

See the [Slash Commands reference](/docs/reference/slash-commands) for the full list.
