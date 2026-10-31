---
title: Video Editor
description: Produces short-form vertical video with Remotion + ffmpeg and gates delivery on automated QA. Never publishes.
section: Agents
order: 7
---

The `video-editor` subagent runs brief → workspace → reference analysis → brand page → storyboard → SpecAd JSON → frame preview → render → finish → QA-gated delivery at `outputs/latest.mp4`. It follows the `video-editing` skill and its `references/master-prompt.md`; numbers come from `references/style-bible.md`.

Tools granted: `video_workspace`, `video_analyze_reference`, `video_transcribe`, `video_still`, `video_render`, `video_finish`, `video_setup`, `image_generate`, `higgsfield_balance`, `higgsfield_generate_image`, `higgsfield_generate_video`, `higgsfield_job_status`, `higgsfield_show_medias`, plus filesystem tools.

**Hard rules:**
- Decisions are the user's. The subagent cannot ask questions. It follows `branding/decisions-<slug>.json` from the lead agent, and returns the open question with a recommendation when a needed decision is missing.
- Call `video_workspace` first. Read only from `references/`; write only to `branding/` and `outputs/`.
- Look at the hook strip, contact sheets and keyframes before describing a reference. Ignore transcripts flagged `likelyMusicOnly`.
- `branding/brand.html` is the brand reference. Its `#brand-tokens` palette is copied into the spec's `brand` field.
- The storyboard and SpecAd JSON exist before any `video_render`. Every file the spec uses is in `branding/assets/<slug>/`.
- `video_still` frames 0, 6, 45, each transition and the last frame before a full render.
- `video_finish` QA gates delivery. FAIL → fix and re-render. PASS_WITH_WARNINGS → fix or justify each warning in the storyboard.
- On-screen numbers, prices and results trace to a source, or are removed or labelled illustrative.
- Generated media: spec first, confirm credits for batches over 2, sidecar JSON per asset, no text baked into media, no real person's likeness without approval.
- **Never publish.** No uploads, no ads.

Output: `branding/storyboard-<slug>.md` with sections A–G from the master prompt and a Delivery section (path to `outputs/latest.mp4`, platform files, QA verdict per check, inferred/unverified list).

Source: [`.openmarketing/agents/video-editor.md`](https://github.com/babakhalid/openmarketing/blob/main/.openmarketing/agents/video-editor.md).
