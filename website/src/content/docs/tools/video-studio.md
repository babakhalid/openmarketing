---
title: Video Studio
description: The video_* tools — workspace, reference analysis, transcription, frame stills, Remotion render, finishing and QA.
section: Tools
order: 3
---

OpenMarketing renders video with an agent-managed stack: Remotion, ffmpeg and whisper.cpp. You never run Remotion yourself. The `video_*` tools install the stack on first use under `~/.openmarketing/video-studio` and re-sync the bundled Remotion components before each render.

## Tools registered

| Tool | What it does |
| --- | --- |
| `video_workspace` | Create `references/`, `branding/` and `outputs/` in the current folder (idempotent) and list reference videos waiting to be analysed. Called first in every video task |
| `video_setup` | Install or verify the stack (ffmpeg, whisper.cpp + model, Remotion with headless Chrome). `video_render` calls it automatically; use it to pre-warm or diagnose |
| `video_analyze_reference` | Measure a reference video: cuts and shot lengths, pacing, hook frames (first 3 s), keyframes, contact sheets, luma/saturation, motion energy, loudness, BPM/onsets, cut-on-beat share, and a whisper transcript. Writes `metrics.json` and images to `branding/analysis/<ref>/` |
| `video_transcribe` | Transcribe a voice-over with whisper.cpp into word-level caption JSON for the spec's `captions` field |
| `video_still` | Render single frames of a spec as PNGs, much faster than a full render |
| `video_render` | Render an AdSpec JSON to MP4 (1080×1920, 30 fps). `draft: true` renders at half resolution for review. Default output: `outputs/videos/<slug>/<slug>-master.mp4` |
| `video_finish` | Two-pass loudness normalisation (−14 LUFS, −1 dBTP), H.264 platform encodes (`pinterest`, `reels`, `tiktok`, `shorts`, or `all`), a cover JPG, and the QA gate |

## Workspace folders

| Folder | Owner | Contents |
| --- | --- | --- |
| `references/` | you | Reference videos (ads, Reels, TikToks, Pins). Read-only for agents |
| `branding/` | agent | `brand.html`, `analysis/<ref>/`, `storyboard-<slug>.md`, `specs/<slug>.json`, `assets/<slug>/`, `decisions-<slug>.json` |
| `outputs/` | agent | `videos/<slug>/` (master, platform files, cover, QA) and `latest.mp4` / `latest-cover.jpg` / `latest.json` |

## QA gate

`video_finish` measures the delivered file and returns `PASS`, `PASS_WITH_WARNINGS`, `FAIL`, or `UNVERIFIED` (no metrics). Only a result that is not `FAIL` is copied to `outputs/latest.mp4`.

| Check | Rule | Severity |
| --- | --- | --- |
| Resolution | 1080×1920 | fail |
| Frame rate | 30 fps | fail |
| Codec | H.264 | fail |
| Integrated loudness | −15 to −13 LUFS | fail |
| True peak | ≤ −0.5 dBTP | fail |
| Audio present | voice-over and/or music | warn |
| Loudness range | ≤ 6 LU | warn |
| Silence | ≤ 5% silent | warn |
| Hook motion | something moves in the first second | warn |
| Dead seconds | every second has motion (end card excepted) | warn |
| Mean saturation | ≤ 20 (one accent hue) | warn |
| Bitrate | ≥ 2000 kbps | warn |

The verdict and every check are written to `<base>-qa/verdict.json` next to the master.

## Configuration

| Variable | Description |
| --- | --- |
| `OPENMARKETING_VIDEO_STUDIO` | Override the Remotion studio directory (default `~/.openmarketing/video-studio`) |
| `WHISPER_MODEL` | Path to a whisper.cpp model file. Non-English transcription needs a multilingual model |
| `WHISPER_MODEL_NAME` | Model downloaded by setup (default `base.en`, saved under `~/.cache/whisper`) |

Setup installs ffmpeg and whisper.cpp with Homebrew, or ffmpeg with apt-get. Without Homebrew, install whisper.cpp yourself and put `whisper-cli` on `PATH`. Node.js 20 or newer is required.

## Source

[`extensions/ads-tools/video.ts`](https://github.com/babakhalid/openmarketing/blob/main/extensions/ads-tools/video.ts) and the [`video-editing`](https://github.com/babakhalid/openmarketing/blob/main/skills/video-editing/SKILL.md) skill.
