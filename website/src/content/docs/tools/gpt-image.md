---
title: GPT Image
description: image_generate — create or edit images with GPT image generation through a ChatGPT/Codex account or an OpenAI API key.
section: Tools
order: 4
---

`image_generate` creates or edits an image with OpenAI's built-in GPT image generation. It runs through the connected ChatGPT/Codex account (OAuth) or an OpenAI API key. The image is saved as a PNG with a provenance sidecar and returned to the agent so it can review the result.

The `creative-director` uses it for stills (strongest for in-image text, product edits from reference photos, and layout). The `/video` workflow uses it for mood frames and for the *GPT image + motion* generation path.

## Parameters

| Parameter | Description |
| --- | --- |
| `prompt` | Full art-direction brief: subject, composition, framing, lighting, palette, exact text in quotes, style references |
| `size` | `1024x1024`, `1024x1536` (portrait), `1536x1024` (landscape), or `auto` (default) |
| `quality` | `low`, `medium`, `high` (default), or `auto` |
| `background` | `transparent`, `opaque`, or `auto` |
| `references` | Image paths to edit or match: product shots, brand marks, previous outputs |
| `slug` | Campaign slug; output goes to `outputs/creatives/<slug>/` |
| `variantId` | File name without extension, e.g. `v1-hero`. Defaults to a timestamp |
| `output` | Explicit `.png` path; overrides `slug` and `variantId` |
| `backend` | `openai-codex` (ChatGPT account) or `openai` (API key). Default: whichever is connected, Codex first |
| `hostModel` | OpenAI chat model that drives the image tool. Default: newest connected |

To iterate, pass the previous output in `references` with a precise change request.

## Output

- `outputs/creatives/<slug>/<variant-id>.png`
- `outputs/creatives/<slug>/<variant-id>.json` — backend, host model, prompt, revised prompt, size, quality, background, reference paths, duration, timestamp

## Setup

Connect an OpenAI Codex (ChatGPT) account or an OpenAI API key. In the CLI, use `openmarketing model login` (or `/login` in the REPL). In the desktop app, use the Accounts settings. If both are connected and one fails, the tool falls back to the other. An expired sign-in shows an error asking you to sign in again.

## Source

[`extensions/ads-tools/models.ts`](https://github.com/babakhalid/openmarketing/blob/main/extensions/ads-tools/models.ts).
