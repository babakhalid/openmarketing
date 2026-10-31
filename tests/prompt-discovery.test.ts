import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";

import { loadPromptTemplates } from "../node_modules/@earendil-works/pi-coding-agent/dist/core/prompt-templates.js";
import { prioritizeMarketingWorkflows } from "../extensions/core-tools/header.js";

const repoRoot = resolve(import.meta.dirname, "..");

test("guided start and next prompts load as Pi slash commands with argument hints", () => {
	const { templates } = loadPromptTemplates({
		cwd: repoRoot,
		agentDir: resolve(repoRoot, ".test-agent"),
		promptPaths: [resolve(repoRoot, "prompts")],
		includeDefaults: false,
	});
	const guided = new Map(
		templates
			.filter((template) => template.name === "start" || template.name === "next")
			.map((template) => [template.name, template]),
	);

	assert.deepEqual([...guided.keys()].sort(), ["next", "start"]);
	assert.equal(guided.get("start")?.argumentHint, "<product-or-startup>");
	assert.equal(guided.get("next")?.argumentHint, "<slug>");
});

test("startup workflow suggestions put start and next first", () => {
	const prioritized = prioritizeMarketingWorkflows([
		{ name: "/strategy", description: "Strategy" },
		{ name: "/next", description: "Next" },
		{ name: "/context", description: "Context" },
		{ name: "/start", description: "Start" },
	]);

	assert.deepEqual(prioritized.map((workflow) => workflow.name), ["/start", "/next", "/context", "/strategy"]);
});
