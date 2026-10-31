import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const bannedPromotionalPatterns = [/ValiChord/i, /Harmony Record/i, /harmony_record_/i];

const SPECIALIST_WORKFLOW_PROMPTS = [
	"research.md",
	"plan.md",
	"psychology.md",
	"persona.md",
	"creative.md",
	"track.md",
	"report.md",
];

const FOUNDER_WORKFLOW_PROMPTS = [
	"start.md",
	"context.md",
	"customer-research.md",
	"diagnose.md",
	"next.md",
	"strategy.md",
	"weekly-review.md",
	"loop.md",
];

const BUNDLED_MARKETING_AGENTS = [
	"market-researcher.md",
	"customer-researcher.md",
	"strategist.md",
	"psych-analyst.md",
	"persona-builder.md",
	"creative-director.md",
	"video-editor.md",
	"tracker.md",
	"reporter.md",
];

function collectMarkdownFiles(root: string): string[] {
	const files: string[] = [];
	for (const entry of readdirSync(root, { withFileTypes: true })) {
		const fullPath = join(root, entry.name);
		if (entry.isDirectory()) {
			files.push(...collectMarkdownFiles(fullPath));
			continue;
		}
		if (entry.isFile() && fullPath.endsWith(".md")) {
			files.push(fullPath);
		}
	}
	return files;
}

test("package uses the unscoped openmarketing name and exposes only openmarketing and om", () => {
	const packageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")) as {
		name?: string;
		bin?: Record<string, string>;
	};

	assert.equal(packageJson.name, "openmarketing");
	assert.deepEqual(packageJson.bin, {
		om: "bin/openmarketing.js",
		openmarketing: "bin/openmarketing.js",
	});
	assert.equal(existsSync(join(repoRoot, "bin", "openmarketing.js")), true);
	assert.equal(existsSync(join(repoRoot, "bin", "adsagents.js")), false);
});

test("runtime packer and launcher use the same prune schema version", () => {
	const packer = readFileSync(join(repoRoot, "scripts", "prepare-runtime-workspace.mjs"), "utf8");
	const launcher = readFileSync(join(repoRoot, "scripts", "patch-embedded-pi.mjs"), "utf8");
	const packerVersion = packer.match(/const PRUNE_VERSION = (\d+);/)?.[1];
	const launcherVersion = launcher.match(/const PRUNE_VERSION = (\d+);/)?.[1];

	assert.ok(packerVersion, "runtime packer must declare PRUNE_VERSION");
	assert.equal(launcherVersion, packerVersion, "runtime launcher must accept the packaged prune schema");
});

test("bundled prompts and skills do not contain blocked promotional product content", () => {
	for (const filePath of [...collectMarkdownFiles(join(repoRoot, "prompts")), ...collectMarkdownFiles(join(repoRoot, "skills"))]) {
		const content = readFileSync(filePath, "utf8");
		for (const pattern of bannedPromotionalPatterns) {
			assert.doesNotMatch(content, pattern, `${filePath} contains blocked promotional pattern ${pattern}`);
		}
	}
});

test("system prompt enforces marketing evidence integrity guardrails", () => {
	const systemPrompt = readFileSync(join(repoRoot, ".openmarketing", "SYSTEM.md"), "utf8");

	assert.match(systemPrompt, /Never (invent|fabricate)/i, "system prompt must explicitly forbid invented or fabricated results");
	assert.match(systemPrompt, /(metric|CTR|ROAS|conversion|impression|benchmark)/i, "system prompt must cover ad-metric provenance");
	assert.match(systemPrompt, /(provenance|source|artifact|export|tool output)/i, "system prompt must require traceable support");
	assert.match(systemPrompt, /Do not claim you are only a static model/i);
	assert.match(systemPrompt, /write the requested durable artifact/i);
});

test("system prompt implements a context-first founder workflow with human approval gates", () => {
	const systemPrompt = readFileSync(join(repoRoot, ".openmarketing", "SYSTEM.md"), "utf8");

	assert.match(systemPrompt, /<slug>-context\.md/);
	assert.match(systemPrompt, /context, problem, message, conversion, measurement, and scale/i);
	assert.match(systemPrompt, /acquisition, activation, retention, referral, and revenue/i);
	assert.match(systemPrompt, /Explicit user approval is required/i);
	assert.match(systemPrompt, /cadence, action condition, purpose/i);
	assert.match(systemPrompt, /kill switch/i);
});

test("system prompt forbids unverified launch / fix claims", () => {
	const systemPrompt = readFileSync(join(repoRoot, ".openmarketing", "SYSTEM.md"), "utf8");

	assert.match(systemPrompt, /Do not say `verified`, `confirmed`, `checked`, or `launched`/i);
	assert.match(systemPrompt, /relevant tool call succeeded/i);
});

test("research workflows reference real web-search tool names and avoid bogus aliases", () => {
	const systemPrompt = readFileSync(join(repoRoot, ".openmarketing", "SYSTEM.md"), "utf8");
	const researchPrompt = readFileSync(join(repoRoot, "prompts", "research.md"), "utf8");

	assert.match(systemPrompt, /call `web_search`/i);
	assert.match(systemPrompt, /do not call non-existent aliases such as `google:search`/i);
	assert.match(researchPrompt, /web_search/);
	assert.doesNotMatch(researchPrompt, /google_search|google:search|search_google/i);
});

test("market-researcher subagent grants the real evidence tools", () => {
	const researcherPrompt = readFileSync(join(repoRoot, ".openmarketing", "agents", "market-researcher.md"), "utf8");
	assert.match(researcherPrompt, /^tools: .*web_search/m, "market-researcher must grant web_search");
	assert.match(researcherPrompt, /^tools: .*fetch_content/m, "market-researcher must grant fetch_content");
	assert.match(researcherPrompt, /^tools: .*get_search_content/m, "market-researcher must grant get_search_content");
});

test("specialist workflow prompts produce a verifiable on-disk artifact", () => {
	for (const fileName of SPECIALIST_WORKFLOW_PROMPTS) {
		const content = readFileSync(join(repoRoot, "prompts", fileName), "utf8");
		assert.match(content, /Verify the (file|doc) (exists|and every referenced)/i, `${fileName} must verify its output exists on disk`);
		assert.match(content, /outputs\//i, `${fileName} must save to outputs/`);
	}
});

test("founder workflow prompts are discoverable and preserve durable context", () => {
	for (const fileName of FOUNDER_WORKFLOW_PROMPTS) {
		const content = readFileSync(join(repoRoot, "prompts", fileName), "utf8");
		assert.match(content, /^topLevelCli: true$/m, `${fileName} must be available from the CLI`);
		assert.match(content, /outputs\//i, `${fileName} must save a durable artifact`);
		assert.match(content, /verif(?:y|ies|ied|ication)/i, `${fileName} must require output verification`);
	}
});

test("all nine marketing subagents are bundled", () => {
	for (const fileName of BUNDLED_MARKETING_AGENTS) {
		assert.equal(existsSync(join(repoRoot, ".openmarketing", "agents", fileName)), true, `${fileName} must be bundled`);
	}
});

test("context, diagnosis, strategy, research, and loop skills are bundled", () => {
	for (const skillName of ["marketing-context", "startup-diagnosis", "marketing-strategy", "customer-research", "marketing-loops"]) {
		const content = readFileSync(join(repoRoot, "skills", skillName, "SKILL.md"), "utf8");
		assert.match(content, /^name: [a-z0-9-]+$/m);
		assert.match(content, /^description: .+$/m);
	}
});

test("creative workflow forbids launching ads without explicit user confirmation", () => {
	const creativePrompt = readFileSync(join(repoRoot, "prompts", "creative.md"), "utf8");
	const creativeAgent = readFileSync(join(repoRoot, ".openmarketing", "agents", "creative-director.md"), "utf8");

	assert.match(creativePrompt, /DO NOT launch ads without an explicit/i);
	assert.match(creativeAgent, /Never launch/i);
});

test("tracker subagent persists raw insights with provenance", () => {
	const trackerAgent = readFileSync(join(repoRoot, ".openmarketing", "agents", "tracker.md"), "utf8");
	assert.match(trackerAgent, /Meta API response/i);
	assert.match(trackerAgent, /outputs\/reports\/\.notes\//i);
	assert.match(trackerAgent, /Do not invent or smooth metrics/i);
});

test("reporter subagent never fabricates missing campaign data", () => {
	const reporterAgent = readFileSync(join(repoRoot, ".openmarketing", "agents", "reporter.md"), "utf8");
	assert.match(reporterAgent, /Coverage gaps/i);
	assert.match(reporterAgent, /No usable data available/i);
	assert.match(reporterAgent, /labeled gap/i);
});
