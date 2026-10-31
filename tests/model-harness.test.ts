import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { appendWorkflowFlagPositionals, resolveInitialPrompt, resolvePiPromptOptions, resolveThinkingConfig, shouldRunInteractiveSetup } from "../src/cli.js";
import { buildModelStatusSnapshotFromRecords, chooseRecommendedModel, getAvailableModelRecords } from "../src/model/catalog.js";
import { resolveModelProviderForCommand, setDefaultModelSpec } from "../src/model/commands.js";
import { createModelRuntime } from "../src/model/registry.js";

function createAuthPath(contents: Record<string, unknown>): string {
	const root = mkdtempSync(join(tmpdir(), "openmarketing-auth-"));
	const authPath = join(root, "auth.json");
	writeFileSync(authPath, JSON.stringify(contents, null, 2) + "\n", "utf8");
	return authPath;
}

test("chooseRecommendedModel prefers the strongest authenticated research model", async () => {
	const authPath = createAuthPath({
		openai: { type: "api_key", key: "openai-test-key" },
		anthropic: { type: "api_key", key: "anthropic-test-key" },
	});

	const recommendation = await chooseRecommendedModel(authPath);

	assert.equal(recommendation?.spec, "anthropic/claude-opus-5-5");
});

// Pi refreshes an expired OAuth access token on the next request, so a login
// with a refresh token is still usable.
test("getAvailableModelRecords keeps OAuth logins whose access token has expired", async () => {
	const authPath = createAuthPath({
		anthropic: {
			type: "oauth",
			access: "expired-access-token",
			refresh: "expired-refresh-token",
			expires: Date.now() - 1000,
		},
	});

	const available = await getAvailableModelRecords(authPath);

	assert.equal(available.some((model) => model.provider === "anthropic"), true);
});

test("getAvailableModelRecords keeps unexpired OAuth credentials available", async () => {
	const authPath = createAuthPath({
		anthropic: {
			type: "oauth",
			access: "current-access-token",
			refresh: "current-refresh-token",
			expires: Date.now() + 60_000,
		},
	});

	const available = await getAvailableModelRecords(authPath);

	assert.equal(available.some((model) => model.provider === "anthropic"), true);
});

test("Pi runtime ships Claude Opus 5.5 with adaptive-only request compatibility", async () => {
	const authPath = createAuthPath({
		anthropic: { type: "api_key", key: "anthropic-test-key" },
	});

	const runtime = await createModelRuntime(authPath);
	const opus = runtime.getModel("anthropic", "claude-opus-5-5") as
		| { contextWindow: number; maxTokens: number; compat?: { forceAdaptiveThinking?: boolean; supportsTemperature?: boolean } }
		| undefined;

	assert.ok(opus);
	// Opus 5.5 rejects budget_tokens, thinking: disabled, and sampling params with a 400.
	assert.equal(opus.compat?.forceAdaptiveThinking, true);
	assert.equal(opus.compat?.supportsTemperature, false);
	assert.equal(opus.contextWindow, 1_000_000);
	assert.equal(opus.maxTokens, 128_000);
	assert.equal((await runtime.getAvailable()).some((model) => model.provider === "anthropic" && model.id === "claude-opus-5-5"), true);
});

test("setDefaultModelSpec accepts a unique bare model id from authenticated models", async () => {
	const authPath = createAuthPath({
		openai: { type: "api_key", key: "openai-test-key" },
	});
	const settingsPath = join(mkdtempSync(join(tmpdir(), "openmarketing-settings-")), "settings.json");

	await setDefaultModelSpec(settingsPath, authPath, "gpt-5.4");

	const settings = JSON.parse(readFileSync(settingsPath, "utf8")) as {
		defaultProvider?: string;
		defaultModel?: string;
	};
	assert.equal(settings.defaultProvider, "openai");
	assert.equal(settings.defaultModel, "gpt-5.4");
});

test("setDefaultModelSpec accepts provider:model syntax for authenticated models", async () => {
	const authPath = createAuthPath({
		google: { type: "api_key", key: "google-test-key" },
	});
	const settingsPath = join(mkdtempSync(join(tmpdir(), "openmarketing-settings-")), "settings.json");

	const googleModel = (await getAvailableModelRecords(authPath)).find((model) => model.provider === "google");
	assert.ok(googleModel);
	await setDefaultModelSpec(settingsPath, authPath, `google:${googleModel.id}`);

	const settings = JSON.parse(readFileSync(settingsPath, "utf8")) as {
		defaultProvider?: string;
		defaultModel?: string;
	};
	assert.equal(settings.defaultProvider, "google");
	assert.equal(settings.defaultModel, googleModel.id);
});

test("resolveModelProviderForCommand falls back to API-key providers when OAuth is unavailable", async () => {
	const authPath = createAuthPath({});

	const resolved = await resolveModelProviderForCommand(authPath, "google");

	assert.equal(resolved?.kind, "api-key");
	assert.equal(resolved?.id, "google");
});

test("resolveModelProviderForCommand supports LM Studio as a first-class local provider", async () => {
	const authPath = createAuthPath({});

	const resolved = await resolveModelProviderForCommand(authPath, "lm-studio");

	assert.equal(resolved?.kind, "api-key");
	assert.equal(resolved?.id, "lm-studio");
});

test("resolveModelProviderForCommand supports LiteLLM as a first-class proxy provider", async () => {
	const authPath = createAuthPath({});

	const resolved = await resolveModelProviderForCommand(authPath, "litellm");

	assert.equal(resolved?.kind, "api-key");
	assert.equal(resolved?.id, "litellm");
});

test("resolveModelProviderForCommand prefers OAuth when a provider supports both auth modes", async () => {
	const authPath = createAuthPath({});

	const resolved = await resolveModelProviderForCommand(authPath, "anthropic");

	assert.equal(resolved?.kind, "oauth");
	assert.equal(resolved?.id, "anthropic");
});

test("setDefaultModelSpec prefers the explicitly configured provider when a bare model id is ambiguous", async () => {
	const authPath = createAuthPath({
		openai: { type: "api_key", key: "openai-test-key" },
	});
	const settingsPath = join(mkdtempSync(join(tmpdir(), "openmarketing-settings-")), "settings.json");

	await setDefaultModelSpec(settingsPath, authPath, "gpt-5.4");

	const settings = JSON.parse(readFileSync(settingsPath, "utf8")) as {
		defaultProvider?: string;
		defaultModel?: string;
	};
	assert.equal(settings.defaultProvider, "openai");
	assert.equal(settings.defaultModel, "gpt-5.4");
});

test("buildModelStatusSnapshotFromRecords flags an invalid current model and suggests a replacement", async () => {
	const snapshot = buildModelStatusSnapshotFromRecords(
		[
			{ provider: "anthropic", id: "claude-opus-4-6" },
			{ provider: "openai", id: "gpt-5.4" },
		],
		[{ provider: "openai", id: "gpt-5.4" }],
		"anthropic/claude-opus-4-6",
	);

	assert.equal(snapshot.currentValid, false);
	assert.equal(snapshot.recommended, "openai/gpt-5.4");
	assert.ok(snapshot.guidance.some((line) => line.includes("Configured default model is unavailable")));
});

test("chooseRecommendedModel prefers MiniMax M3 when that is the authenticated provider", async () => {
	const envKeys = ["ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GOOGLE_API_KEY", "GEMINI_API_KEY", "OPENROUTER_API_KEY"];
	const savedEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));

	for (const key of envKeys) {
		delete process.env[key];
	}

	try {
		const authPath = createAuthPath({
			minimax: { type: "api_key", key: "minimax-test-key" },
		});

		const recommendation = await chooseRecommendedModel(authPath);

		assert.equal(recommendation?.spec, "minimax/MiniMax-M3");
	} finally {
		for (const [key, value] of Object.entries(savedEnv)) {
			if (value === undefined) {
				delete process.env[key];
			} else {
				process.env[key] = value;
			}
		}
	}
});

test("resolveInitialPrompt maps top-level marketing commands to Pi slash workflows", async () => {
	const workflows = new Set([
		"start",
		"context",
		"customer-research",
		"research",
		"diagnose",
		"next",
		"strategy",
		"plan",
		"creative",
		"track",
		"weekly-review",
		"loop",
		"report",
		"jobs",
		"summarize",
		"log",
	]);
	assert.equal(resolveInitialPrompt("start", ["API", "observability"], undefined, workflows), "/start API observability");
	assert.equal(resolveInitialPrompt("context", ["api-observability"], undefined, workflows), "/context api-observability");
	assert.equal(resolveInitialPrompt("customer-research", ["api-observability"], undefined, workflows), "/customer-research api-observability");
	assert.equal(resolveInitialPrompt("diagnose", ["api-observability"], undefined, workflows), "/diagnose api-observability");
	assert.equal(resolveInitialPrompt("strategy", ["api-observability"], undefined, workflows), "/strategy api-observability");
	assert.equal(resolveInitialPrompt("weekly-review", ["api-observability"], undefined, workflows), "/weekly-review api-observability");
	assert.equal(resolveInitialPrompt("jobs", [], undefined, workflows), "/jobs");
	assert.equal(resolveInitialPrompt("summarize", ["README.md"], undefined, workflows), "/summarize README.md");
	assert.equal(resolveInitialPrompt("log", [], undefined, workflows), "/log");
	assert.equal(resolveInitialPrompt("chat", ["hello"], undefined, workflows), "hello");
	assert.equal(resolveInitialPrompt("unknown", ["topic"], undefined, workflows), "unknown topic");
});

test("appendWorkflowFlagPositionals preserves summarize CLI flags parsed after positionals", async () => {
	assert.deepEqual(
		appendWorkflowFlagPositionals("summarize", ["paper.md"], {
			"window-size": "2000",
			overlap: "200",
			"tier1-threshold": "8000",
			"tier2-threshold": "20000",
		}),
		["paper.md", "--window-size", "2000", "--overlap", "200", "--tier1-threshold", "8000", "--tier2-threshold", "20000"],
	);
	assert.deepEqual(appendWorkflowFlagPositionals("track", ["api-observability"], { "window-size": "2000" }), ["api-observability"]);
});

test("resolveThinkingConfig only passes launch thinking when explicitly configured", async () => {
	assert.deepEqual(resolveThinkingConfig(undefined), {
		defaultThinkingLevel: "medium",
		launchThinkingLevel: undefined,
	});
	assert.deepEqual(resolveThinkingConfig("high"), {
		defaultThinkingLevel: "high",
		launchThinkingLevel: "high",
	});
	assert.deepEqual(resolveThinkingConfig("not-a-level"), {
		defaultThinkingLevel: "medium",
		launchThinkingLevel: undefined,
	});
});

test("resolvePiPromptOptions keeps top-level workflows interactive when stdin is a tty", async () => {
	const workflows = new Set(["strategy", "summarize"]);

	assert.deepEqual(resolvePiPromptOptions("strategy", ["api-observability"], undefined, workflows), {
		initialPrompt: "/strategy api-observability",
	});
	assert.deepEqual(resolvePiPromptOptions("chat", ["hello"], undefined, workflows), {
		initialPrompt: "hello",
	});
	assert.deepEqual(resolvePiPromptOptions(undefined, [], "hello", workflows), {
		oneShotPrompt: "hello",
	});
	assert.deepEqual(resolvePiPromptOptions(undefined, [], undefined, workflows), {});
});

test("shouldRunInteractiveSetup triggers on first run when no default model is configured", async () => {
	const authPath = createAuthPath({});

	assert.equal(await shouldRunInteractiveSetup(undefined, undefined, true, authPath), true);
});

test("shouldRunInteractiveSetup triggers when the configured default model is unavailable", async () => {
	const authPath = createAuthPath({
		openai: { type: "api_key", key: "openai-test-key" },
	});

	assert.equal(await shouldRunInteractiveSetup(undefined, "anthropic/claude-opus-4-6", true, authPath), true);
});

test("shouldRunInteractiveSetup skips onboarding when the configured default model is available", async () => {
	const authPath = createAuthPath({
		openai: { type: "api_key", key: "openai-test-key" },
	});

	assert.equal(await shouldRunInteractiveSetup(undefined, "openai/gpt-5.4", true, authPath), false);
});

test("shouldRunInteractiveSetup skips onboarding for explicit model overrides or non-interactive terminals", async () => {
	const authPath = createAuthPath({
		openai: { type: "api_key", key: "openai-test-key" },
	});

	assert.equal(await shouldRunInteractiveSetup("openai/gpt-5.4", undefined, true, authPath), false);
	assert.equal(await shouldRunInteractiveSetup(undefined, undefined, false, authPath), false);
});
