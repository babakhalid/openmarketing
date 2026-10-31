import test from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { delimiter, dirname } from "node:path";

import { applyOpenMarketingPackageManagerEnv, buildPiArgs, buildPiEnv, resolvePiPaths, toNodeImportSpecifier } from "../src/pi/runtime.js";

test("buildPiArgs includes configured runtime paths and prompt", () => {
	const args = buildPiArgs({
		appRoot: "/repo/openmarketing",
		workingDir: "/workspace",
		sessionDir: "/sessions",
		openmarketingAgentDir: "/home/.openmarketing/agent",
		mode: "rpc",
		initialPrompt: "hello",
		explicitModelSpec: "openai:gpt-5.4",
		thinkingLevel: "medium",
	});

	assert.deepEqual(args, [
		"--session-dir",
		"/sessions",
		"--extension",
		"/repo/openmarketing/extensions/core-tools.ts",
		"--extension",
		"/repo/openmarketing/extensions/ads-tools.ts",
		"--prompt-template",
		"/repo/openmarketing/prompts",
		"--mode",
		"rpc",
		"--model",
		"openai:gpt-5.4",
		"--thinking",
		"medium",
		"hello",
	]);
});

test("buildPiArgs omits thinking arg when launch thinking is not explicit", () => {
	const args = buildPiArgs({
		appRoot: "/repo/openmarketing",
		workingDir: "/workspace",
		sessionDir: "/sessions",
		openmarketingAgentDir: "/home/.openmarketing/agent",
		mode: "rpc",
		initialPrompt: "hello",
	});

	assert.equal(args.includes("--thinking"), false);
});

test("buildPiEnv wires OpenMarketing paths into the Pi environment", () => {
	const previousUppercasePrefix = process.env.NPM_CONFIG_PREFIX;
	const previousLowercasePrefix = process.env.npm_config_prefix;
	process.env.NPM_CONFIG_PREFIX = "/tmp/global-prefix";
	process.env.npm_config_prefix = "/tmp/global-prefix-lower";

	const env = buildPiEnv({
		appRoot: "/repo/openmarketing",
		workingDir: "/workspace",
		sessionDir: "/sessions",
		openmarketingAgentDir: "/home/.openmarketing/agent",
		openmarketingVersion: "0.1.5",
	});

	try {
		assert.equal(env.OPENMARKETING_SESSION_DIR, "/sessions");
		assert.equal(env.OPENMARKETING_BIN_PATH, "/repo/openmarketing/bin/openmarketing.js");
		assert.equal(env.OPENMARKETING_PI_CLI_PATH, "/repo/openmarketing/node_modules/@earendil-works/pi-coding-agent/dist/cli.js");
		assert.equal(env.OPENMARKETING_MEMORY_DIR, "/home/.openmarketing/memory");
		assert.equal(env.OPENMARKETING_NPM_PREFIX, "/home/.openmarketing/npm-global");
		assert.equal(env.NPM_CONFIG_PREFIX, "/home/.openmarketing/npm-global");
		assert.equal(env.npm_config_prefix, "/home/.openmarketing/npm-global");
		assert.equal(env.OPENMARKETING_CODING_AGENT_DIR, "/home/.openmarketing/agent");
		assert.equal(env.PI_CODING_AGENT_DIR, "/home/.openmarketing/agent");
		assert.ok(
			env.PATH?.startsWith(
				"/repo/openmarketing/node_modules/.bin:/repo/openmarketing/.openmarketing/npm/node_modules/.bin:/home/.openmarketing/npm-global/bin:",
			),
		);
		assert.ok(env.PATH?.split(delimiter).includes(dirname(process.execPath)), "the running node's folder (and its npm) is on PATH");
	} finally {
		if (previousUppercasePrefix === undefined) {
			delete process.env.NPM_CONFIG_PREFIX;
		} else {
			process.env.NPM_CONFIG_PREFIX = previousUppercasePrefix;
		}
		if (previousLowercasePrefix === undefined) {
			delete process.env.npm_config_prefix;
		} else {
			process.env.npm_config_prefix = previousLowercasePrefix;
		}
	}
});

test("buildPiEnv uses pre-resolved executable paths when provided", () => {
	const paths = resolvePiPaths("/repo/openmarketing");
	const env = buildPiEnv(
		{
			appRoot: "/repo/openmarketing",
			workingDir: "/workspace",
			sessionDir: "/sessions",
			openmarketingAgentDir: "/home/.openmarketing/agent",
		},
		paths,
		{
			pandoc: "/opt/test/bin/pandoc",
			mermaid: "/opt/test/bin/mmdc",
			browser: "/opt/test/bin/chrome",
		},
	);

	assert.equal(env.PANDOC_PATH, "/opt/test/bin/pandoc");
	assert.equal(env.MERMAID_CLI_PATH, "/opt/test/bin/mmdc");
	assert.equal(env.PUPPETEER_EXECUTABLE_PATH, "/opt/test/bin/chrome");
});

test("applyOpenMarketingPackageManagerEnv pins npm globals to the OpenMarketing prefix", () => {
	const previousOpenMarketingPrefix = process.env.OPENMARKETING_NPM_PREFIX;
	const previousUppercasePrefix = process.env.NPM_CONFIG_PREFIX;
	const previousLowercasePrefix = process.env.npm_config_prefix;

	try {
		const prefix = applyOpenMarketingPackageManagerEnv("/home/.openmarketing/agent");

		assert.equal(prefix, "/home/.openmarketing/npm-global");
		assert.equal(process.env.OPENMARKETING_NPM_PREFIX, "/home/.openmarketing/npm-global");
		assert.equal(process.env.NPM_CONFIG_PREFIX, "/home/.openmarketing/npm-global");
		assert.equal(process.env.npm_config_prefix, "/home/.openmarketing/npm-global");
	} finally {
		if (previousOpenMarketingPrefix === undefined) {
			delete process.env.OPENMARKETING_NPM_PREFIX;
		} else {
			process.env.OPENMARKETING_NPM_PREFIX = previousOpenMarketingPrefix;
		}
		if (previousUppercasePrefix === undefined) {
			delete process.env.NPM_CONFIG_PREFIX;
		} else {
			process.env.NPM_CONFIG_PREFIX = previousUppercasePrefix;
		}
		if (previousLowercasePrefix === undefined) {
			delete process.env.npm_config_prefix;
		} else {
			process.env.npm_config_prefix = previousLowercasePrefix;
		}
	}
});

test("resolvePiPaths includes the Promise.withResolvers polyfill path", () => {
	const paths = resolvePiPaths("/repo/openmarketing");

	assert.equal(paths.promisePolyfillPath, "/repo/openmarketing/dist/system/promise-polyfill.js");
});

test("toNodeImportSpecifier converts absolute preload paths to file URLs", () => {
	assert.equal(
		toNodeImportSpecifier("/repo/openmarketing/dist/system/promise-polyfill.js"),
		pathToFileURL("/repo/openmarketing/dist/system/promise-polyfill.js").href,
	);
	assert.equal(toNodeImportSpecifier("tsx"), "tsx");
});
