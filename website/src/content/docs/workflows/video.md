---
title: Video
description: Guided short-form video production — brief, brand, references, style, storyboard approval, render, QA, review.
section: Workflows
order: 11
---

`/video <brief-or-slug> [--format <F1|F2|F3|F4>] [--platform <reels|tiktok|shorts|pinterest|all>]` makes a short vertical video and delivers `outputs/latest.mp4` after an automated QA gate.

The workflow is guided. The agent does the work between checkpoints and recommends an option at each one. You make the decisions. Checkpoints use the [`ask_user`](/docs/tools/checkpoints) tool. Every answer is appended to `branding/decisions-<slug>.json`.

## Stages

1. **Workspace and brief.** `video_workspace` creates `references/`, `branding/` and `outputs/` in the current folder. The agent reads `outputs/campaigns/<slug>-{context,persona,psychology,plan}.md` when present. It asks a "Shape the brief" checkpoint only if the subject, goal/CTA, length or platform is missing. A stated length is a hard limit; 8 seconds or less becomes a single-beat sting.
2. **Validate the brand.** The agent writes `branding/brand.html` from the skill's brand template. For a real company it starts from the actual identity, cites its sources in the page, and never invents a logo. You approve it, describe changes, or pick an alternative direction. In the desktop app you can click any element of the page to request a change.
3. **Choose the references.** Each new video in `references/` is analysed with `video_analyze_reference`, and the agent writes `branding/analysis/<ref>/analysis.md`. You pick which references shape the video (multi-select). If `references/` is empty, you can add videos, go without references, or ask for reference directions in words.
4. **Pick the style.** One checkpoint with up to three questions:
   - **Style direction:** 2–3 directions, each with a preview frame (a `video_still` from a draft spec, or an `image_generate` mood frame).
   - **Generation path:** only paths whose engines are connected are offered — *motion design* (Remotion type and shapes; fastest, free), *GPT image + motion* (`image_generate` key visuals with Ken Burns/parallax, about 1 minute per image), or *AI footage* (Higgsfield video models; slowest, costs credits, with an estimate against the balance).
   - **Quality:** a fast draft render first, or straight to the 1080×1920 master.

   Nothing that costs credits runs before this answer.
5. **Approve the storyboard.** The agent writes `branding/storyboard-<slug>.md` and `branding/specs/<slug>.json`, generates assets into `branding/assets/<slug>/`, transcribes any voice-over with `video_transcribe`, and renders hook, middle and last frames with `video_still`. You render, change something, or try another hook. The master is never rendered before this approval.
6. **Render, finish, QA.** `video_render`, then `video_finish`. A `FAIL` verdict is fixed and re-rendered without asking. Each `PASS_WITH_WARNINGS` warning is fixed or justified.
7. **Review the video.** You see `outputs/latest.mp4` and choose done, revise, or make a variation (another style, length or platform). Revisions loop back to the stage they touch.

## Resuming and non-interactive runs

On resume, the agent reads the decision log and skips checkpoints already decided, unless you ask to revisit one. If nobody is available to answer (a non-interactive run), the agent takes its recommendation and marks that decision `inferred` in the storyboard.

Subagents cannot talk to you. The lead agent runs every checkpoint itself and only delegates legs that need no decisions, such as reference analysis or the final render, passing the decision log to the [`video-editor`](/docs/agents/video-editor).

## Defaults

- Format from the brief: face + list → F1, face + thesis → F2, no face + pitch → F3, no face + direct-response copy → F4. Short stings for 8 seconds or less.
- Platform `all`: Reels, TikTok, Shorts and Pinterest encodes.
- The workflow never uploads a video or launches ads.

## Output

- `outputs/latest.mp4`, `outputs/latest-cover.jpg`, and `outputs/latest.json` with the QA verdict
- `outputs/videos/<slug>/` — master, platform files, QA folder
- `branding/decisions-<slug>.json` — every checkpoint and your answer
- `branding/storyboard-<slug>.md` — ends with a Delivery section: paths, verdict, and decisions taken (`inferred` ones marked)

See [Video Studio](/docs/tools/video-studio) for the tools and the QA checks.

## Source

Canonical prompt: [`prompts/video.md`](https://github.com/babakhalid/openmarketing/blob/main/prompts/video.md).
