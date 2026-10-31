import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import {
	ensureOpenMarketingHome,
	getBootstrapStatePath,
	getDefaultSessionDir,
	getOpenMarketingAgentDir,
	getOpenMarketingHome,
	getOpenMarketingMemoryDir,
	getOpenMarketingStateDir,
} from "../src/config/paths.js";

test("getOpenMarketingHome uses OPENMARKETING_HOME env var when set", () => {
	const previousOpenMarketingHome = process.env.OPENMARKETING_HOME;
	const previousAdsAgentsHome = process.env.ADSAGENTS_HOME;
	try {
		process.env.OPENMARKETING_HOME = "/custom/home";
		process.env.ADSAGENTS_HOME = "/legacy/home";
		assert.equal(getOpenMarketingHome(), resolve("/custom/home", ".openmarketing"));
	} finally {
		if (previousOpenMarketingHome === undefined) {
			delete process.env.OPENMARKETING_HOME;
		} else {
			process.env.OPENMARKETING_HOME = previousOpenMarketingHome;
		}
		if (previousAdsAgentsHome === undefined) {
			delete process.env.ADSAGENTS_HOME;
		} else {
			process.env.ADSAGENTS_HOME = previousAdsAgentsHome;
		}
	}
});

test("getOpenMarketingHome accepts ADSAGENTS_HOME as a deprecated base-home fallback", () => {
	const previousOpenMarketingHome = process.env.OPENMARKETING_HOME;
	const previousAdsAgentsHome = process.env.ADSAGENTS_HOME;
	try {
		delete process.env.OPENMARKETING_HOME;
		process.env.ADSAGENTS_HOME = "/legacy/custom/home";
		assert.equal(getOpenMarketingHome(), resolve("/legacy/custom/home", ".openmarketing"));
	} finally {
		if (previousOpenMarketingHome === undefined) {
			delete process.env.OPENMARKETING_HOME;
		} else {
			process.env.OPENMARKETING_HOME = previousOpenMarketingHome;
		}
		if (previousAdsAgentsHome === undefined) {
			delete process.env.ADSAGENTS_HOME;
		} else {
			process.env.ADSAGENTS_HOME = previousAdsAgentsHome;
		}
	}
});

test("getOpenMarketingHome falls back to homedir when OPENMARKETING_HOME is unset", () => {
	const previous = process.env.OPENMARKETING_HOME;
	try {
		delete process.env.OPENMARKETING_HOME;
		const home = getOpenMarketingHome();
		assert.ok(home.endsWith(".openmarketing"), `expected path ending in .openmarketing, got: ${home}`);
		assert.ok(!home.includes("undefined"), `expected no 'undefined' in path, got: ${home}`);
	} finally {
		if (previous === undefined) {
			delete process.env.OPENMARKETING_HOME;
		} else {
			process.env.OPENMARKETING_HOME = previous;
		}
	}
});

test("getOpenMarketingAgentDir resolves to <home>/agent", () => {
	assert.equal(getOpenMarketingAgentDir("/some/home"), resolve("/some/home", "agent"));
});

test("getOpenMarketingMemoryDir resolves to <home>/memory", () => {
	assert.equal(getOpenMarketingMemoryDir("/some/home"), resolve("/some/home", "memory"));
});

test("getOpenMarketingStateDir resolves to <home>/.state", () => {
	assert.equal(getOpenMarketingStateDir("/some/home"), resolve("/some/home", ".state"));
});

test("getDefaultSessionDir resolves to <home>/sessions", () => {
	assert.equal(getDefaultSessionDir("/some/home"), resolve("/some/home", "sessions"));
});

test("getBootstrapStatePath resolves to <home>/.state/bootstrap.json", () => {
	assert.equal(getBootstrapStatePath("/some/home"), resolve("/some/home", ".state", "bootstrap.json"));
});

test("ensureOpenMarketingHome creates all required subdirectories", () => {
	const root = mkdtempSync(join(tmpdir(), "openmarketing-paths-"));
	try {
		const home = join(root, "home");
		ensureOpenMarketingHome(home);

		assert.ok(existsSync(home), "home dir should exist");
		assert.ok(existsSync(join(home, "agent")), "agent dir should exist");
		assert.ok(existsSync(join(home, "memory")), "memory dir should exist");
		assert.ok(existsSync(join(home, ".state")), ".state dir should exist");
		assert.ok(existsSync(join(home, "sessions")), "sessions dir should exist");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("ensureOpenMarketingHome is idempotent when dirs already exist", () => {
	const root = mkdtempSync(join(tmpdir(), "openmarketing-paths-"));
	try {
		const home = join(root, "home");
		ensureOpenMarketingHome(home);
		assert.doesNotThrow(() => ensureOpenMarketingHome(home));
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("ensureOpenMarketingHome migrates a legacy .adsagents home atomically", () => {
	const root = mkdtempSync(join(tmpdir(), "openmarketing-migration-"));
	try {
		const legacyHome = join(root, ".adsagents");
		const currentHome = join(root, ".openmarketing");
		mkdirSync(legacyHome, { recursive: true });
		writeFileSync(join(legacyHome, "settings.json"), '{"source":"legacy"}\n', "utf8");

		ensureOpenMarketingHome(currentHome);

		assert.equal(existsSync(legacyHome), false);
		assert.equal(readFileSync(join(currentHome, "settings.json"), "utf8"), '{"source":"legacy"}\n');
		assert.equal(existsSync(join(currentHome, "agent")), true);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("ensureOpenMarketingHome migrates the previous .marketingagents home before older ones", () => {
	const root = mkdtempSync(join(tmpdir(), "openmarketing-rename-"));
	try {
		const previousHome = join(root, ".marketingagents");
		const olderHome = join(root, ".feynman");
		const currentHome = join(root, ".openmarketing");
		mkdirSync(previousHome, { recursive: true });
		mkdirSync(olderHome, { recursive: true });
		writeFileSync(join(previousHome, "settings.json"), '{"source":"marketingagents"}\n', "utf8");

		ensureOpenMarketingHome(currentHome);

		assert.equal(existsSync(previousHome), false);
		assert.equal(existsSync(olderHome), true);
		assert.equal(readFileSync(join(currentHome, "settings.json"), "utf8"), '{"source":"marketingagents"}\n');
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test("ensureOpenMarketingHome preserves both homes when old and new storage coexist", () => {
	const root = mkdtempSync(join(tmpdir(), "openmarketing-conflict-"));
	try {
		const legacyHome = join(root, ".adsagents");
		const currentHome = join(root, ".openmarketing");
		mkdirSync(legacyHome, { recursive: true });
		mkdirSync(currentHome, { recursive: true });
		writeFileSync(join(legacyHome, "legacy.txt"), "legacy\n", "utf8");
		writeFileSync(join(currentHome, "current.txt"), "current\n", "utf8");

		ensureOpenMarketingHome(currentHome);

		assert.equal(readFileSync(join(legacyHome, "legacy.txt"), "utf8"), "legacy\n");
		assert.equal(readFileSync(join(currentHome, "current.txt"), "utf8"), "current\n");
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
