---
title: Configuration
description: Understand OpenMarketing's configuration files and environment variables.
section: Getting Started
order: 5
---

OpenMarketing stores all configuration and state under `~/.openmarketing/`. This directory is created on first run and contains settings, authentication tokens, session history, and installed packages.

## Directory structure

```
~/.openmarketing/
├── agent/
│   ├── settings.json   # Core Pi configuration
│   ├── auth.json       # OAuth and configured provider credentials
│   ├── models.json     # Custom/local model providers
│   ├── web-search.json # Web search routing config
│   ├── agents/         # Synced bundled subagents
│   ├── skills/         # Synced OpenMarketing skills
│   └── themes/         # Synced terminal theme
├── video-studio/       # Agent-managed Remotion studio (installed on first video render)
├── sessions/           # Persisted conversation history
├── memory/             # Durable preferences and corrections
├── npm-global/         # Installed Pi package prefix
└── .state/             # Bootstrap and migration state
```

The `agent/settings.json` file is the primary configuration file. It is created by `openmarketing setup` and can be edited manually. A typical configuration looks like:

```json
{
  "defaultProvider": "anthropic",
  "defaultModel": "claude-sonnet-4-20250514",
  "defaultThinkingLevel": "medium"
}
```

## Model configuration

The `defaultProvider` and `defaultModel` fields set which model is used when you launch OpenMarketing without the `--model` flag. You can change them via the CLI:

```bash
openmarketing model set anthropic/claude-opus-4-20250514
```

To see all models you have configured:

```bash
openmarketing model list
```

Only authenticated/configured providers appear in `openmarketing model list`. If you only see OpenAI models, it usually means only OpenAI auth is configured so far.

To add another provider, authenticate it first:

```bash
openmarketing model login anthropic
openmarketing model login google
openmarketing model login amazon-bedrock
```

Then switch the default model:

```bash
openmarketing model set anthropic/claude-opus-4-6
```

The `model set` command accepts both `provider/model` and `provider:model` formats. `openmarketing model login google` opens the API-key flow directly, while `openmarketing model login amazon-bedrock` verifies the AWS credential chain that Pi uses for Bedrock access.

## Subagent model overrides

OpenMarketing's bundled subagents inherit the main default model unless you override them explicitly. Inside the REPL, run:

```bash
/openmarketing-model
```

This opens an interactive picker where you can either:

- change the main default model for the session environment
- assign a different model to a bundled subagent such as `market-researcher`, `customer-researcher`, `strategist`, `creative-director`, `video-editor`, or `tracker`

Per-subagent overrides are persisted in the synced agent files under `~/.openmarketing/agent/agents/` with a `model:` frontmatter field. Removing that field makes the subagent inherit the main default model again.

## Thinking levels

The `thinkingLevel` field controls how much reasoning the model does before responding. Available levels are `off`, `minimal`, `low`, `medium`, `high`, and `xhigh`. Higher levels produce more thorough analysis at the cost of latency and token usage. You can override per-session:

```bash
openmarketing --thinking high
```

## Environment variables

OpenMarketing respects the following environment variables, which take precedence over `settings.json`:

| Variable | Description |
| --- | --- |
| `OPENMARKETING_MODEL` | Override the default model |
| `OPENMARKETING_HOME` | Override the parent home directory; state is stored in `<value>/.openmarketing` |
| `OPENMARKETING_THINKING` | Override the thinking level |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `OPENAI_API_KEY` | OpenAI API key |
| `GEMINI_API_KEY` | Google Gemini API key |
| `AWS_PROFILE` | Preferred AWS profile for Amazon Bedrock |
| `OPENMARKETING_VIDEO_STUDIO` | Override the video studio directory (default `~/.openmarketing/video-studio`) |

The former `ADSAGENTS_*` variable names are accepted only as deprecated fallbacks. Prefer the `OPENMARKETING_*` names in every new shell profile, CI secret, and deployment configuration.

## Session storage

Each conversation is persisted as a JSON file in `~/.openmarketing/sessions/`. To start a fresh session:

```bash
openmarketing --new-session
```

To point sessions at a different directory (useful for per-project session isolation):

```bash
openmarketing --session-dir ~/myproject/.openmarketing/sessions
```

## Diagnostics

Run `openmarketing doctor` to verify your configuration is valid, check authentication status for all configured providers, and detect missing optional dependencies. The doctor command outputs a checklist showing what is working and what needs attention.
