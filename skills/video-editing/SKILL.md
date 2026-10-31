---
name: video-editing
description: Produce premium short-form vertical videos (Reels, TikTok, Shorts, Pinterest) with the agent-managed Remotion + ffmpeg stack — workspace folders, reference analysis, brand kit, storyboard, SpecAd JSON, frame previews, render, loudness/platform finishing and an automated QA gate. Use for "make/edit/render a video", "ad video", "reel", "motion graphics", "make it look like this reference", or any video deliverable.
---

# Video Editing

Agents drive Remotion; users never run it. All rendering goes through the `video_*` tools, which install and update the stack (ffmpeg, whisper.cpp, Remotion + headless Chrome) under `~/.openmarketing/video-studio` on first use.

## Workspace (always first)

Call `video_workspace` at the start of every video task. It creates, in the current folder:

| Folder | Owner | Contents |
|---|---|---|
| `references/` | user | Reference videos to analyse. Read-only for agents. |
| `branding/` | agent | `brand.html` (the brand reference page), `analysis/<ref>/` (metrics + `analysis.md`), `storyboard-<slug>.md`, `specs/<slug>.json`, `assets/<slug>/` (every file a spec uses) |
| `outputs/` | agent | `videos/<slug>/` (master, platform encodes, cover, QA), and `latest.mp4` / `latest-cover.jpg` / `latest.json` — always the newest finished video that passed QA |

If `references/` is empty and the user expects reference-driven work, ask them to drop videos there.

## Guided checkpoints

Video work is guided: the agent recommends and the user decides. In `/video` the lead agent stops at these `ask_user` checkpoints, logged to `branding/decisions-<slug>.json`: **brand** (approve `brand.html`) → **references** (which ones shape the video) → **style + generation path + quality** (2–3 previewed directions; motion design / GPT image + motion / AI footage, offered only when the engine is connected) → **storyboard** (approve key-frame stills before any master render) → **review**. Nothing that costs credits and no master render happens before the matching approval. Subagents cannot ask the user: they follow the decision log and return a question instead of guessing when a needed decision is missing. Full flow: `prompts/video.md`.

## Pattern

1. **Workspace** — `video_workspace`; note which references are new.
2. **Analyse references** — `video_analyze_reference` per new video (output defaults to `branding/analysis/<ref>/`). Look at `hook/`, `sheets/`, `keyframes/` and write `analysis.md` (archetype, timestamped beats, techniques with evidence and rebuild recipe). See the `video-reference-analysis` skill for measurement traps.
3. **Brand page** — create or update `branding/brand.html` from [`references/brand-template.html`](references/brand-template.html): palette (`:root` variables **and** the `#brand-tokens` JSON), type, voice, hooks, storyboard strip, reference strips. It is the visual reference for everything after it — read it before writing a storyboard or spec, and copy `#brand-tokens.palette` into the spec's `brand` field. The desktop app previews it live; when the user points at an element and asks for a change, edit that element in place and keep both token blocks in sync.
4. **Storyboard + spec** — follow [`references/master-prompt.md`](references/master-prompt.md): hook options, VO script, scene table, `SpecAd` JSON in `branding/specs/<slug>.json`, Higgsfield asset list. Numbers come from [`references/style-bible.md`](references/style-bible.md).
5. **Assets** — generate missing footage/props with Higgsfield (spec before generate; confirm credits; no text baked into media), record VO, then `video_transcribe` the VO into `branding/assets/<slug>/captions.json`.
6. **Preview** — `video_still` on frame 0, 6, 45, each transition and the last frame; view every PNG and fix the spec before rendering. Use `video_render` with `draft: true` for a fast full pass when timing is uncertain.
7. **Render + finish** — `video_render` then `video_finish`. The finish step normalises loudness (−14 LUFS, −1 dBTP target), encodes platform files, extracts a cover and runs the QA gate.
8. **QA verdict** — `FAIL` blocks publishing to `outputs/latest.mp4`: fix and re-render. `PASS_WITH_WARNINGS`: view the QA contact sheet (`<base>-qa/sheets/`) and fix or justify each warning. Only report success with the verdict and the `latest.mp4` path.

## SpecAd quick reference

Scene types: `punch` (lead / punch / tail kinetic type, light or dark), `chapter` (numbered badge), `counter` (glowing rolling number + light beam), `footage` (video clip, optional viewfinder), `still` (Ken Burns image), `endcard` (handle + CTA pill + logo). Transitions on scene entry: `cut`, `fade`, `slide-up`, `slide-left`, `wipe`, `flash`. Global: `palette` (`noir` / `creator` / `paper`) plus `brand` (palette overrides from `brand.html` tokens), `voiceover`, `captions` (word-level, from `video_transcribe`), `captionStyle`, `music` + `duckTo` (ducked under speech), `sfx[]`, `grain`. Full shape and defaults: [`references/master-prompt.md`](references/master-prompt.md) step 6.

## Formats (from the reference analysis)

| Format | Use when | Duration | Palette |
|---|---|---|---|
| F1 Chapter Listicle | face footage + "N ways/steps" | 45–60 s | `creator` |
| F2 Creator Breakdown | face footage + a thesis/story | 45–90 s | `creator` |
| F3 Dark Glass Explainer | no face, 3–6 sentence pitch, many paid variants | 15–30 s | `noir` |
| F4 Kinetic Collage | no face, punchy direct-response copy | 15–20 s | `paper` |

Beat skeletons with frame timings are in [`references/style-bible.md`](references/style-bible.md) §1.

## Guardrails

- Never upload or launch ads from a video task without explicit user confirmation (same rule as `creative-director`).
- Every claim on screen (numbers, results, prices) needs a source in the storyboard; unsourced numbers are removed or labelled illustrative.
- Do not say a video is rendered, finished or passed QA unless the tool call succeeded and the file exists.
