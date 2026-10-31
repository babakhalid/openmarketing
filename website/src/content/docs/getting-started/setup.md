---
title: Setup
description: Walk through the guided setup wizard to configure OpenMarketing.
section: Getting Started
order: 4
---

The `openmarketing setup` wizard configures your model provider, API keys, and optional packages. It runs automatically on first launch, but you can re-run it at any time to change your configuration.

## Running setup

```bash
openmarketing setup
```

The wizard walks you through three stages: model configuration, authentication, and optional package installation.

## Stage 1: Model selection

OpenMarketing supports multiple model providers. The setup wizard presents a list of available providers and models. Select your preferred default model using the arrow keys:

```
? Select your default model:
  anthropic:claude-sonnet-4-20250514
> anthropic:claude-opus-4-20250514
  openai:gpt-4o
  openai:o3
  google:gemini-2.5-pro
```

The model you choose here becomes the default for all sessions. You can override it per-session with the `--model` flag or change it later via `openmarketing model set <provider/model>` or `openmarketing model set <provider:model>`.

## Stage 2: Authentication

Depending on your chosen provider, setup prompts you for an API key or walks you through OAuth login. For providers that support Pi OAuth (like Anthropic and OpenAI), OpenMarketing opens a browser window to complete the sign-in flow. Your credentials are stored securely in the Pi auth storage at `~/.openmarketing/`.

For API key providers, you are prompted to paste your key directly:

```
? Enter your API key: sk-ant-...
```

Keys are stored in OpenMarketing's local Pi auth configuration and passed to the selected provider at runtime. Treat `~/.openmarketing/agent/auth.json` as sensitive and protect it with normal user-only filesystem permissions.

### Amazon Bedrock

For Amazon Bedrock, choose:

```text
Amazon Bedrock (AWS credential chain)
```

OpenMarketing verifies the same AWS credential chain Pi uses at runtime, including `AWS_PROFILE`, `~/.aws` credentials/config, SSO, ECS/IRSA, and EC2 instance roles. Once that check passes, Bedrock models become available in `openmarketing model list` without needing a traditional API key.

### Local models: LM Studio, LiteLLM, Ollama, vLLM

If you want to use LM Studio, start the LM Studio local server, load a model, choose the API-key flow, and then select:

```text
LM Studio (local OpenAI-compatible server)
```

The default settings are:

```text
Base URL: http://localhost:1234/v1
Authorization header: No
API key: lm-studio
```

OpenMarketing attempts to read LM Studio's `/models` endpoint and prefill the loaded model id.

For LiteLLM, start the proxy, choose the API-key flow, and then select:

```text
LiteLLM Proxy (OpenAI-compatible gateway)
```

The default settings are:

```text
Base URL: http://localhost:4000/v1
API mode: openai-completions
Master key: optional, read from LITELLM_MASTER_KEY
```

OpenMarketing attempts to read LiteLLM's `/models` endpoint and prefill model ids from the proxy config.

For Ollama, vLLM, or another OpenAI-compatible local server, choose:

```text
Custom provider (baseUrl + API key)
```

For Ollama, the typical settings are:

```text
API mode: openai-completions
Base URL: http://localhost:11434/v1
Authorization header: No
Model ids: llama3.1:8b
API key: local
```

After saving the provider, run:

```bash
openmarketing model list
openmarketing model set <provider>/<model-id>
```

to confirm the local model is available and make it the default.

## Stage 3: Optional packages

OpenMarketing's core package set ships with every install (see [Package Stack](/docs/reference/package-stack)). On platforms with supported optional presets, the wizard can offer extras:

- **generative-ui** -- Interactive Glimpse UI widgets (macOS only)

You can skip this step and install packages later with `openmarketing packages install <preset>`.

## Re-running setup

Configuration is stored in `~/.openmarketing/agent/settings.json`. Running `openmarketing setup` again updates the setup-managed values. If you only need to change a specific value, use a targeted command such as `openmarketing model set`, `openmarketing model login`, or `openmarketing search set`.
