---
title: Web Search
description: Web search routing, configuration, and usage within OpenMarketing.
section: Tools
order: 7
---

OpenMarketing's web search tool retrieves current information for market research, customer evidence, category changes, pricing, distribution, regulations, and platform behavior. It supports multiple simultaneous queries, domain filtering, recency filtering, and full-page retrieval.

## Routing modes

Web search comes from the core `pi-web-access` package. It supports three backends. You can pick one or let it choose automatically:

| Mode | Description |
| --- | --- |
| `auto` | Default. Try Perplexity, then Exa, then the Gemini API, then Gemini in the browser |
| `perplexity` | Use Perplexity for all web searches |
| `exa` | Use Exa for all web searches |
| `gemini` | Use the Gemini API or Gemini in the browser |

## Default behavior

Without API keys, `auto` falls through to Gemini in the browser, which uses a signed-in Chromium profile. This works where a Chromium-based browser is installed and signed in to a Google account.

For headless environments, CI pipelines, or servers without a browser, configure an API key for Perplexity, Exa, or Gemini.

## Configuration

Check the current search configuration:

```bash
openmarketing search status
```

Set a provider and save its key:

```bash
openmarketing search set perplexity <api-key>
openmarketing search set exa <api-key>
openmarketing search set gemini <api-key>
```

`openmarketing search clear` resets the provider to `auto` and keeps saved keys.

The settings live in `~/.openmarketing/agent/web-search.json`:

```json
{
  "route": "auto",
  "perplexityApiKey": "pplx-...",
  "exaApiKey": "...",
  "geminiApiKey": "AIza..."
}
```

## Search features

The web search tool supports several capabilities that the researcher agent leverages automatically:

- **Multiple queries** -- Send 2-4 varied-angle queries simultaneously for broader coverage of a topic
- **Domain filtering** -- Restrict results to official product sites, documentation, regulatory sources, review platforms, communities, or other relevant domains
- **Recency filtering** -- Filter by date for fast-moving categories, prices, policies, platforms, and competitors
- **Full content retrieval** -- Fetch complete page content for the most important results rather than relying on snippets

## When it runs

Web search is used automatically when a workflow needs current external evidence. Discovery snippets are leads, not proof: important claims should be checked against the underlying page, dated, and preserved with a direct URL. Customer reviews and community discussions remain directional samples unless the evidence supports a broader claim.
