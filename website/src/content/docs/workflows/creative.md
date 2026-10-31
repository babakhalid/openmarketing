---
title: Creative
description: Generate ad creative variants via Higgsfield CLI and prepare Meta-compatible assets.
section: Workflows
order: 10
---

`/creative <slug> [--variants <N>] [--format <feed|story|reel|square>]` produces ad creative variants and prepares them for Meta.

## Pattern

1. **Spec before generate.** Each variant gets a one-line spec (angle from `/plan`, lever from `/psychology`, hook copy, visual direction, format, CTA) saved to `outputs/creatives/<slug>-spec.md`.
2. **Generate via Higgsfield.** `higgsfield_generate_image` for static, `higgsfield_generate_video` for motion. `higgsfield_balance` checks credits before large batches; `higgsfield_job_status` confirms completion.
3. **Save with provenance.** Assets go to `outputs/creatives/<slug>/<variant-id>.<ext>` with sidecar JSON (prompt, model, seed, job ID, intended angle, intended lever).
4. **Match Meta specs.** Resolution, max file size, aspect ratio per format.
5. **Optional Meta upload.** `meta_upload_creative` uploads as creative assets, only after explicit approval — never launches ads.

When the `creative-director` subagent runs the generation, it may use [`image_generate`](/docs/tools/gpt-image) (GPT image through a connected ChatGPT/Codex account or OpenAI API key) for stills instead of Higgsfield. For short-form video, use [`/video`](/docs/workflows/video).

## Defaults

- 4 variants unless `--variants` overrides.
- `feed` (1:1) format unless `--format` overrides.

## Output

`outputs/creatives/<slug>-set.md` — variant table, hooks, asset paths, Higgsfield job IDs, Meta upload status.

## Source

Canonical prompt: [`prompts/creative.md`](https://github.com/babakhalid/openmarketing/blob/main/prompts/creative.md).
