---
title: Higgsfield CLI
description: Image and video generation for ad creative — Pi extension wrapping the Higgsfield CLI.
section: Tools
order: 1
---

OpenMarketing wraps the [Higgsfield CLI](https://higgsfield.ai/) as Pi tools. The `creative-director` subagent uses these to produce static and motion ad creative.

## Tools registered

| Tool | What it does |
| --- | --- |
| `higgsfield_balance` | Check available credits before launching jobs |
| `higgsfield_list_workspaces` | List authenticated workspaces |
| `higgsfield_select_workspace` | Switch active workspace |
| `higgsfield_generate_image` | Generate a still creative — returns a job ID |
| `higgsfield_generate_video` | Generate a motion creative — returns a job ID |
| `higgsfield_job_status` | Poll job completion |
| `higgsfield_show_medias` | Download finished assets to a local directory |
| `higgsfield_models_explore` | List models available in the current workspace |

## Configuration

The extension shells out to a `higgsfield` binary. Set `HIGGSFIELD_BIN` to override the binary path:

```bash
export HIGGSFIELD_BIN=/path/to/higgsfield
```

Authentication is handled by the Higgsfield CLI itself — see Higgsfield docs.
