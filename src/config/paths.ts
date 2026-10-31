// Where OpenMarketing keeps its state (~/.openmarketing, or OPENMARKETING_HOME), including the
// migration from the legacy .marketingagents / .adsagents / .feynman home folders.

import { existsSync, mkdirSync, renameSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, resolve } from "node:path";

const CURRENT_HOME_DIR_NAME = ".openmarketing";
const LEGACY_HOME_DIR_NAMES = [".marketingagents", ".adsagents", ".feynman"] as const;

function getConfiguredBaseHome(): string {
	return process.env.OPENMARKETING_HOME ?? process.env.MARKETINGAGENTS_HOME ?? process.env.ADSAGENTS_HOME ?? homedir();
}

export function getOpenMarketingHome(): string {
	return resolve(getConfiguredBaseHome(), CURRENT_HOME_DIR_NAME);
}

export function getOpenMarketingAgentDir(home = getOpenMarketingHome()): string {
	return resolve(home, "agent");
}

export function getOpenMarketingMemoryDir(home = getOpenMarketingHome()): string {
	return resolve(home, "memory");
}

export function getOpenMarketingStateDir(home = getOpenMarketingHome()): string {
	return resolve(home, ".state");
}

export function getDefaultSessionDir(home = getOpenMarketingHome()): string {
	return resolve(home, "sessions");
}

export function getBootstrapStatePath(home = getOpenMarketingHome()): string {
	return resolve(getOpenMarketingStateDir(home), "bootstrap.json");
}

const migrationNotices = new Set<string>();

function displayHomePath(path: string): string {
	const userHome = homedir();
	return path.startsWith(`${userHome}/`) ? `~/${path.slice(userHome.length + 1)}` : path;
}

function writeMigrationNoticeOnce(key: string, message: string): void {
	if (migrationNotices.has(key)) return;
	migrationNotices.add(key);
	process.stderr.write(`[openmarketing] ${message}\n`);
}

function migrateLegacyHomeIfNeeded(home: string): void {
	if (basename(home) !== CURRENT_HOME_DIR_NAME) return;
	const legacyHome = LEGACY_HOME_DIR_NAMES
		.map((name) => resolve(dirname(home), name))
		.find((candidate) => existsSync(candidate));
	if (!legacyHome) return;

	if (existsSync(home)) {
		writeMigrationNoticeOnce(
			`conflict:${home}`,
			`found both ${displayHomePath(legacyHome)} and ${displayHomePath(home)}; preserving both and using ${displayHomePath(home)}`,
		);
		return;
	}

	try {
		renameSync(legacyHome, home);
		writeMigrationNoticeOnce(
			`migrated:${home}`,
			`migrated ${displayHomePath(legacyHome)} -> ${displayHomePath(home)}`,
		);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		writeMigrationNoticeOnce(
			`failed:${home}`,
			`could not migrate ${displayHomePath(legacyHome)} -> ${displayHomePath(home)} (${message}); continuing with ${displayHomePath(home)}`,
		);
	}
}

export function ensureOpenMarketingHome(home = getOpenMarketingHome()): void {
	migrateLegacyHomeIfNeeded(home);
	for (const dir of [
		home,
		getOpenMarketingAgentDir(home),
		getOpenMarketingMemoryDir(home),
		getOpenMarketingStateDir(home),
		getDefaultSessionDir(home),
	]) {
		mkdirSync(dir, { recursive: true });
	}
}
