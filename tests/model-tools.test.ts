import test from "node:test";
import assert from "node:assert/strict";

import { registerModelTools, resolveModel } from "../extensions/ads-tools/models.js";

const models = [
	{ provider: "anthropic", id: "claude-opus-5" },
	{ provider: "anthropic", id: "claude-sonnet-4-20250514" },
	{ provider: "anthropic", id: "claude-sonnet-5-5" },
	{ provider: "anthropic", id: "claude-opus-5-5" },
	{ provider: "openai-codex", id: "gpt-6-luna" },
	{ provider: "openai-codex", id: "gpt-6.1-sol" },
	{ provider: "openai-codex", id: "gpt-5.6-sol" },
];

function fakeRegistry(configured: string[] = ["anthropic", "openai-codex"]) {
	return {
		getAvailable: () => models,
		find: (provider: string, id: string) => models.find((m) => m.provider === provider && m.id === id),
		getProviderDisplayName: (provider: string) => ({ anthropic: "Anthropic", "openai-codex": "OpenAI Codex" })[provider] ?? provider,
		getProviderAuthStatus: (provider: string) => ({ configured: configured.includes(provider) }),
	} as any;
}

test("resolveModel picks the newest flagship for an alias", () => {
	const registry = fakeRegistry();
	assert.equal(resolveModel(registry, "codex")?.id, "gpt-6.1-sol");
	assert.equal(resolveModel(registry, "gpt")?.id, "gpt-6.1-sol");
	assert.equal(resolveModel(registry, "claude")?.id, "claude-opus-5-5");
});

test("resolveModel accepts provider/id and bare ids", () => {
	const registry = fakeRegistry();
	assert.equal(resolveModel(registry, "openai-codex/gpt-6-luna")?.id, "gpt-6-luna");
	assert.equal(resolveModel(registry, "claude-sonnet-5-5")?.provider, "anthropic");
	assert.equal(resolveModel(registry, "gemini"), undefined);
});

function captureRoster(configured: string[]) {
	const handlers: Record<string, Function> = {};
	const tools: string[] = [];
	registerModelTools({ on: (name: string, fn: Function) => (handlers[name] = fn), registerTool: (t: { name: string }) => tools.push(t.name) } as any);
	const event = { systemPromptOptions: { sections: {} as Record<string, string> } };
	handlers.before_agent_start(event, { modelRegistry: fakeRegistry(configured), model: models.find((m) => m.id === "claude-opus-5-5") });
	return { roster: event.systemPromptOptions.sections["model-roster"], tools };
}

test("the model roster tells the lead model about other models and image generation", () => {
	const { roster, tools } = captureRoster(["anthropic", "openai-codex"]);
	assert.deepEqual(tools, ["ask_model", "image_generate"]);
	assert.match(roster, /You are `anthropic\/claude-opus-5-5`/);
	assert.match(roster, /Anthropic \(`anthropic`\): claude-opus-5-5, claude-sonnet-5-5, claude-opus-5,/);
	assert.match(roster, /OpenAI Codex \(`openai-codex`\): gpt-6\.1-sol/);
	assert.match(roster, /image_generate.*ChatGPT\/Codex account/);
});

test("the roster says image generation is unavailable without an OpenAI credential", () => {
	const { roster } = captureRoster(["anthropic"]);
	assert.match(roster, /none is connected/);
});
