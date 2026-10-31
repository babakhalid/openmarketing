---
title: Preview
description: Render Markdown artifacts such as plans and reports as HTML or PDF.
section: Tools
order: 9
---

Preview renders a written artifact, such as a strategy, plan, or report, as HTML in your browser or exports it to PDF. It comes from the core `pi-markdown-preview` package and is described to the agent by the `preview` skill.

## Usage

Inside the REPL:

| Command | Description |
| --- | --- |
| `/preview` | Preview the most recent artifact in the browser |
| `/preview --file <path>` | Preview a specific file |
| `/preview-browser` | Force browser preview |
| `/preview-pdf` | Export to PDF via pandoc + LaTeX |
| `/preview-clear-cache` | Clear the rendered preview cache |

Example:

```
/preview --file outputs/reports/api-observability-report.md
```

If the preview commands are not available, the agent falls back to opening the file with the system viewer (`open <file>` on macOS).

## Requirements

PDF export needs `pandoc`. Install or verify the preview dependencies with:

```bash
openmarketing setup preview
```

On macOS with Homebrew, the setup command attempts to install pandoc automatically. If that does not work, install pandoc from [pandoc.org](https://pandoc.org/installing.html) and rerun `openmarketing setup preview`.

## Source

Skill: [`skills/preview/SKILL.md`](https://github.com/babakhalid/openmarketing/blob/main/skills/preview/SKILL.md).
