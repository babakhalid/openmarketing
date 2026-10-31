---
title: Skills
description: Every skill bundled in skills/ and what it is for.
section: Reference
order: 3
---

Skills are instruction packs the agent loads when a task matches. They are synced into `~/.openmarketing/agent/skills/` on launch. You can also install them without the runtime; see [Installation](/docs/getting-started/installation#skills-only).

| Skill | Purpose |
| --- | --- |
| `ad-tracking` | Pull and verify Meta Ads evidence for a running campaign and stage decisions against plan-defined rules |
| `contributing` | Contribute changes to the OpenMarketing repository itself |
| `creative` | Generate ad creative variants via Higgsfield and prepare Meta-compatible assets |
| `customer-research` | Plan, gather, and synthesize customer evidence: interviews, voice of customer, win/loss, churn, reviews |
| `eli5` | Explain technical ideas in plain English with concrete analogies |
| `jobs` | Inspect running processes, recurring loops, scheduled follow-ups, and pending tasks |
| `market-research` | Source-grounded market, competitor, audience, demand, and distribution research |
| `marketing-context` | Create or update the shared product, audience, offer, funnel, proof, and constraint record |
| `marketing-loops` | Design safe recurring workflows with state, self-checks, stop conditions, and approval gates |
| `marketing-plan` | Turn an approved strategy into a 90-day plan with owners, dependencies, and decision gates |
| `marketing-reporting` | Write a decision-focused report from saved artifacts without fabricated metrics |
| `marketing-strategy` | Build a focused, stage-aware full-funnel strategy and decide what not to do |
| `persona-business` | Build evidence-grounded user, buyer, champion, and evaluator profiles plus business understanding |
| `preview` | Render Markdown, LaTeX, PDF, or code artifacts in the browser or as PDF |
| `psychology-analytics` | Apply behavioral science to messaging, offers, conversion, and onboarding without dark patterns |
| `session-log` | Write a durable session log: work done, evidence, decisions, approvals, open questions, next action |
| `session-search` | Search past session transcripts to recover prior work |
| `startup-diagnosis` | Find the current marketing bottleneck and recommend the next highest-leverage action |
| `video-editing` | Produce short-form vertical video with the Remotion + ffmpeg stack, from workspace to QA-gated delivery |
| `video-reference-analysis` | Reverse-engineer reference videos into measurable editing patterns and a reproducible style spec |

## Source

[`skills/`](https://github.com/babakhalid/openmarketing/tree/main/skills) — each skill's `SKILL.md` is canonical.
