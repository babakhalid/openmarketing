---
title: Meta Ads CLI
description: Meta Ads campaign, ad set, ad, insights, and creative-upload tooling — Pi extension wrapping a Meta Ads CLI.
section: Tools
order: 2
---

OpenMarketing wraps a Meta Ads CLI as Pi tools. The `tracker` and `creative-director` subagents use these for insights and creative upload.

## Tools registered

| Tool | What it does |
| --- | --- |
| `meta_list_campaigns` | List Meta Ads campaigns for an account |
| `meta_list_adsets` | List ad sets for a campaign |
| `meta_list_ads` | List ads under a campaign or ad set |
| `meta_insights` | Pull metrics (spend, CTR, CPC, CPM, conversions, ROAS, frequency) over a window |
| `meta_upload_creative` | Upload a local image/video as a creative asset — does not launch ads |
| `meta_pause_ad` | Pause an ad or adset (use only when user has explicitly authorized) |
| `meta_update_budget` | Update daily / lifetime budget (use only when user has explicitly authorized) |

## Configuration

The extension shells out to a `meta` binary. Set `META_BIN` to override:

```bash
export META_BIN=/path/to/meta
```

## Safety

`creative-director` may upload assets but **never launches ads** without explicit user confirmation. `tracker` returns refinement recommendations by default; pause / scale / budget changes apply only when the user explicitly authorizes the action.
