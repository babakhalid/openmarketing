---
title: Creative Director
description: Produces ad creative variants with GPT image generation and Higgsfield, and can upload to Meta. Never launches ads.
section: Agents
order: 6
---

The `creative-director` subagent runs the spec → generate → verify → save → optionally upload pipeline.

Tools granted: `image_generate`, `ask_model`, `higgsfield_balance`, `higgsfield_generate_image`, `higgsfield_generate_video`, `higgsfield_job_status`, `higgsfield_show_medias`, `meta_upload_creative`, plus filesystem tools.

**Hard rules:**
- Spec before generate.
- Pick the engine: stills through [`image_generate`](/docs/tools/gpt-image) (strongest for in-image text, product edits from reference photos, and layout); motion, avatars, or Higgsfield-specific models through Higgsfield.
- Confirm credits with `higgsfield_balance` before batches >2 jobs.
- Wait for `higgsfield_job_status` to confirm success — don't assume. Inspect each `image_generate` result against the spec and iterate; use [`ask_model`](/docs/tools/cross-model) for a second look.
- Save assets with sidecar JSON metadata (prompt, model, seed, job ID, angle, lever). `image_generate` writes its sidecar automatically.
- Match Meta specs (resolution, file size, aspect ratio).
- External uploads require explicit user approval.
- **Never launch ads.** `meta_upload_creative` uploads assets only.

Source: [`.openmarketing/agents/creative-director.md`](https://github.com/babakhalid/openmarketing/blob/main/.openmarketing/agents/creative-director.md).
