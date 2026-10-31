---
title: Guided Checkpoints
description: ask_user — put a decision in front of the user with options, a recommendation, and previews.
section: Tools
order: 6
---

`ask_user` is a decision checkpoint. The agent proposes options, marks one as recommended with a reason, attaches previews, and waits. You pick an option, answer in your own words, or skip and accept the recommendation. The `/video` workflow uses it for every decision: brief, brand, references, style, storyboard, and review.

## Parameters

| Parameter | Description |
| --- | --- |
| `title` | Checkpoint name, e.g. "Validate the brand" |
| `stage` | Workflow stage id, e.g. `brand`, `references`, `style`, `storyboard`, `review` |
| `context` | Short Markdown shown above the questions |
| `questions` | 1–4 questions. Each has an `id`, the `question`, an optional `header` chip, optional `multiSelect`, and 1–6 options |
| `record` | Workspace-relative JSON log to append the answers to, e.g. `branding/decisions-<slug>.json` |

Each option has an `id`, a short `label`, an optional `description` with its trade-off, `recommended`, `why` (the reason for the recommendation), and `preview` (workspace files: images, a short video, or an HTML page).

## How it looks

- **Desktop app:** a decision card in the chat log, with preview thumbnails, the recommended option preselected with its reason, a field for your own words, and a way to defer.
- **Terminal:** a plain list per question, with "(recommended)" next to the recommendation and a "Something else…" entry for a written answer.
- **Non-interactive runs:** nobody can answer, so the recommendation is taken and the result marks it `inferred`.

The tool returns your decisions to the agent with an instruction to act on exactly those decisions. Your own words override option details.

## Decision log

With `record`, each checkpoint is appended to the JSON log with a timestamp, title, stage, whether the run was interactive, and every answer. Long workflows read this log on resume and skip checkpoints already decided. Subagents, which cannot ask questions, receive the log and follow it.

## Source

[`extensions/ads-tools/ask.ts`](https://github.com/babakhalid/openmarketing/blob/main/extensions/ads-tools/ask.ts).
