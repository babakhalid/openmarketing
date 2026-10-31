---
title: Session Search
description: Find prior OpenMarketing sessions to resume context, decisions, and evidence.
section: Tools
order: 8
---

Every OpenMarketing conversation is saved as a session transcript. The `session-search` skill helps the agent recover past context, decisions, evidence, and artifacts without restarting discovery.

## Package status

The `@kaiserlich-dev/pi-session-search` package and its `/search` command are no longer bundled. On Pi 1.x the package crashes the agent process after a session switch, so OpenMarketing removes it from existing configurations on launch. Session history is native in Pi and in the [desktop app](/docs/getting-started/desktop-app), which lists past sessions per workspace in the sidebar.

## Where sessions live

Transcripts are JSONL files in `~/.openmarketing/sessions/` by default. Use `--session-dir` to point a run somewhere else, for example per project:

```bash
openmarketing --session-dir ~/myproject/.openmarketing/sessions
```

Each line is a JSON record with a `type` (session, message, model_change) and `message.content`.

## Searching

Reference prior work in conversation, for example "resume the onboarding diagnosis from last week". The agent searches the session files directly:

```bash
grep -ril "onboarding diagnosis" ~/.openmarketing/sessions/
```

For durable, easy-to-find records, prefer the artifacts workflows write to `outputs/` and the session logs written by `/log` to `notes/`.

## Source

Skill: [`skills/session-search/SKILL.md`](https://github.com/babakhalid/openmarketing/blob/main/skills/session-search/SKILL.md).
