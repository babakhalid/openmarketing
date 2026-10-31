---
title: Cross-Model Tools
description: The model roster and ask_model — the lead model knows which other models are connected and can consult them.
section: Tools
order: 5
---

OpenMarketing works with whichever providers you have connected. Two pieces let the lead model use the others.

## Model roster

Before every turn, a `model-roster` section is added to the system prompt. It names the current model and lists the other connected models by provider (up to six per provider, newest first). It also says whether [`image_generate`](/docs/tools/gpt-image) is available and through which account. When no other model is connected, the section is omitted.

## ask_model

`ask_model` sends a self-contained prompt to another connected model and returns its answer. Use it for a second opinion, adversarial critique, copy in another voice, or reviewing an image with a different model. The other model sees only what is passed in the call.

| Parameter | Description |
| --- | --- |
| `model` | `provider/id` (e.g. `openai-codex/gpt-6.1-sol`) or an alias: `codex`, `gpt`, `claude`, `gemini` |
| `prompt` | The full question or task, including all needed context |
| `system` | Optional system prompt for the other model |
| `images` | Optional image paths to show the other model |

An alias resolves to the newest connected model of that provider. `gpt` tries the Codex account first, then the OpenAI API key. If no connected model matches, the call fails and lists the available models.

The `creative-director` has `ask_model` for a second look at generated images.

## Source

[`extensions/ads-tools/models.ts`](https://github.com/babakhalid/openmarketing/blob/main/extensions/ads-tools/models.ts).
