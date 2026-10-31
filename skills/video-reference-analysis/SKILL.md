---
name: video-reference-analysis
description: Reverse-engineer reference videos (ads, Reels, TikToks, Pins, Shorts) into measurable editing patterns — cuts, pacing, hook, type, color, motion, sound, loudness — and turn them into a reproducible style spec. Use when the user shares reference videos, says "make it look like this", asks why a video performs, or wants a new video format/template derived from examples.
---

# Video Reference Analysis

Turn "make it look like this" into numbers an editor (human or agent) can hit.

## Pattern

1. **Collect.** Call `video_workspace`; references live in `references/` (the user drops them there). Deduplicate by hash (`md5 -r references/* | sort`) — scraped Pins are often re-uploads.
2. **Measure (deterministic).** For each new video call `video_analyze_reference` with the video path; output defaults to `branding/analysis/<video-slug>/`. It writes `metrics.json` (resolution, fps, shots + cuts/min + median shot length, per-second luma/saturation, motion energy, integrated LUFS / true peak, onset-based BPM, share of cuts landing on an onset, transcript flags) plus `hook/` (first 3 s at 4 fps), `keyframes/` (one per shot), `sheets/` (24-frame contact sheets), `waveform.png`, and a whisper `transcript.srt` when `whisper-cli` is installed.
3. **Look (visual).** View every image in `hook/`, `sheets/`, `keyframes/`. Numbers alone miss typography, lighting, and transitions.
4. **Break down** each reference into `branding/analysis/<slug>/analysis.md`: archetype, timestamped beat sheet, and every technique with evidence (file + timestamp) and a rebuild recipe in Remotion/ffmpeg terms with numbers (frames @30 fps, spring config, px at 1080×1920, hex colors).
5. **Synthesize** across references into `branding/analysis/_synthesis.md`: archetype catalogue, quality bar (measurable), component list, ffmpeg post chain, master prompt. Then run an adversarial pass that checks every number against `metrics.json`.
6. **Feed forward.** The synthesis drives `branding/brand.md` and the storyboard (see the `video-editing` skill). Recurring techniques that `SpecAd` cannot draw yet are produced as Higgsfield footage/stills.

For many references, fan out one analyst per video and one synthesizer (the lead agent delegates; analysts write files, not inline dumps).

## Known measurement traps

- **Scene cuts:** threshold 0.2 under-counts dark motion graphics (cross-dissolves, light sweeps) and over-counts flashy footage (glitches, flashes read as cuts — e.g. 86 "shots" with a 0.1 s median). Always confirm rhythm on the contact sheets; re-run `video_analyze_reference` with `sceneThreshold` 0.12 or 0.35 when they disagree.
- **Transcripts over music:** whisper hallucinates repeated lines on music-only tracks. `metrics.transcript.likelyMusicOnly: true` means ignore the text.
- **Loudness:** read the ebur128 *summary* (the script does). Social references sit around −14 LUFS integrated, −1…0 dBTP.
- **Resolution:** Pinterest downloads are often 720×1280 re-encodes at ~300 kbps; judge sharpness/grain with that in mind and deliver 1080×1920.

## Output contract

- `branding/analysis/<slug>/metrics.json` + `analysis.md` per reference.
- `branding/analysis/_synthesis.md` for the set, with a review log of what was verified against metrics and what is inferred from stills.
- Mark every claim as measured (metrics.json), observed (named frame file), or inferred.
