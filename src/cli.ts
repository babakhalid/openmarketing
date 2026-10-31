// Command-line front end. Parses arguments, runs the subcommands (setup, model, search, status,
// doctor, packages, update, desktop-bridge, …) and otherwise launches the Pi chat with OpenMarketing's
// prompts, skills, agents and extensions.

import "dotenv/config";

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { parseArgs } from "node:util";
import { fileURLToPath } from "node:url";

import { SettingsManager } from "@earendil-works/pi-coding-agent";

import { syncBundledAssets } from "./bootstrap/sync.js";
import { ensureOpenMarketingHome, getOpenMarketingAgentDir, getOpenMarketingHome, getDefaultSessionDir } from "./config/paths.js";
import { launchPiChat } from "./pi/launch.js";
import { installPackageSources, updateConfiguredPackages } from "./pi/package-ops.js";
import { MAX_NATIVE_PACKAGE_NODE_MAJOR } from "./pi/package-presets.js";
import {
	CORE_PACKAGE_SOURCES,
	getOptionalPackagePresetSources,
	isOptionalPackagePresetSupported,
	listOptionalPackagePresetInstallTargets,
	listOptionalPackagePresets,
	normalizeOptionalPackagePresetName,
	resolvePackageUpdateSources,
} from "./pi/package-presets.js";
import { normalizeOpenMarketingSettings, normalizeThinkingLevel, parseModelSpec, type ThinkingLevel } from "./pi/settings.js";
import { applyOpenMarketingPackageManagerEnv } from "./pi/runtime.js";
import { getConfiguredServiceTier, normalizeServiceTier, setConfiguredServiceTier } from "./model/service-tier.js";
import {
	authenticateModelProvider,
	getCurrentModelSpec,
	loginModelProvider,
	logoutModelProvider,
	printModelList,
	setDefaultModelSpec,
} from "./model/commands.js";
import { buildModelStatusSnapshotFromRecords, getAuthenticatedModelRecords, getSupportedModelRecords } from "./model/catalog.js";
import { clearSearchConfig, printSearchStatus, setSearchProvider } from "./search/commands.js";
import type { PiWebSearchProvider } from "./pi/web-access.js";
import { runDoctor, runStatus } from "./setup/doctor.js";
import { setupPreviewDependencies } from "./setup/preview.js";
import { runSetup } from "./setup/setup.js";
import { ASH, printAsciiHeader, printDivider, printInfo, printPanel, printSection, RESET, SAGE } from "./ui/terminal.js";
import { createModelRuntime } from "./model/registry.js";
import { runDesktopBridge } from "./desktop/bridge.js";
import {
	cliCommandSections,
	formatCliWorkflowUsage,
	legacyFlags,
	readPromptSpecs,
	topLevelCommandNames,
} from "../metadata/commands.mjs";

const TOP_LEVEL_COMMANDS = new Set(topLevelCommandNames);

function clipDescription(text: string, max = 70): string {
	const single = text.replace(/\s+/g, " ").trim();
	if (single.length <= max) return single;
	const clipped = single.slice(0, max - 1).replace(/[\s,;:.]+\S*$/, "");
	return `${clipped || single.slice(0, max - 1)}…`;
}

function printHelpLine(usage: string, description: string): void {
	const COLUMN = 36;
	const visible = usage.length;
	const desc = clipDescription(description);
	if (visible >= COLUMN) {
		console.log(`  ${SAGE}${usage}${RESET}`);
		console.log(`  ${" ".repeat(COLUMN)}${ASH}${desc}${RESET}`);
		return;
	}
	const padding = " ".repeat(COLUMN - visible);
	console.log(`  ${SAGE}${usage}${RESET}${padding}${ASH}${desc}${RESET}`);
}

function printHelp(appRoot: string): void {
	const workflowCommands = readPromptSpecs(appRoot).filter((command) => command.topLevelCli);
	const preferredWorkflowSections = [
		"Guided Marketing",
		"Research & Strategy",
		"Execute & Launch",
		"Measure & Improve",
		"Utilities",
	];
	const workflowSections = new Map<string, typeof workflowCommands>();
	for (const command of workflowCommands) {
		const commands = workflowSections.get(command.section) ?? [];
		commands.push(command);
		workflowSections.set(command.section, commands);
	}
	const version = loadPackageVersion(appRoot).version;

	printAsciiHeader([
		`SYSTEM/READY · v${version ?? "dev"}`,
		"RESEARCH › POSITION › LAUNCH › ACQUIRE › MEASURE › IMPROVE",
		"INIT › `openmarketing setup` · ALIAS › `om`",
	]);

	printSection("Try this");
	printHelpLine("openmarketing setup", "One-time: pick a model, install packages.");
	printHelpLine("openmarketing start \"<product>\"", "Establish context and choose the right next marketing action.");
	printHelpLine("openmarketing", "Launch the interactive REPL (short alias: om).");

	for (const section of cliCommandSections) {
		printSection(section.title);
		for (const command of section.commands) {
			printHelpLine(command.usage, command.description);
		}
	}

	const orderedSections = [
		...preferredWorkflowSections.filter((section) => workflowSections.has(section)),
		...[...workflowSections.keys()].filter((section) => !preferredWorkflowSections.includes(section)),
	];
	for (const section of orderedSections) {
		printSection(section);
		for (const command of workflowSections.get(section) ?? []) {
			printHelpLine(formatCliWorkflowUsage(command), command.description);
		}
	}

	printSection("Flags");
	for (const flag of legacyFlags) {
		printHelpLine(flag.usage, flag.description);
	}

	printSection("REPL");
	printInfo("Inside the REPL, type `/help` to browse live slash commands.");
	console.log("");
	printDivider();
	console.log("");
	printInfo(`Docs: https://github.com/babakhalid/openmarketing`);
	console.log("");
}

async function handleModelCommand(subcommand: string | undefined, args: string[], openmarketingSettingsPath: string, openmarketingAuthPath: string): Promise<void> {
	if (!subcommand || subcommand === "list") {
		await printModelList(openmarketingSettingsPath, openmarketingAuthPath);
		return;
	}

	if (subcommand === "login") {
		if (args[0]) {
			// Specific provider given - resolve OAuth vs API-key setup automatically
			await loginModelProvider(openmarketingAuthPath, args[0], openmarketingSettingsPath);
		} else {
			// No provider specified - show auth method choice
			await authenticateModelProvider(openmarketingAuthPath, openmarketingSettingsPath);
		}
		return;
	}

	if (subcommand === "logout") {
		await logoutModelProvider(openmarketingAuthPath, args[0]);
		return;
	}

	if (subcommand === "set") {
		const spec = args[0];
		if (!spec) {
			throw new Error("Usage: openmarketing model set <provider/model|provider:model>");
		}
		await setDefaultModelSpec(openmarketingSettingsPath, openmarketingAuthPath, spec);
		return;
	}

	if (subcommand === "tier") {
		const requested = args[0];
		if (!requested) {
			console.log(getConfiguredServiceTier(openmarketingSettingsPath) ?? "not set");
			return;
		}

		if (requested === "unset" || requested === "clear" || requested === "off") {
			setConfiguredServiceTier(openmarketingSettingsPath, undefined);
			console.log("Cleared service tier override");
			return;
		}

		const tier = normalizeServiceTier(requested);
		if (!tier) {
			throw new Error("Usage: openmarketing model tier <auto|default|flex|priority|standard_only|unset>");
		}

		setConfiguredServiceTier(openmarketingSettingsPath, tier);
		console.log(`Service tier set to ${tier}`);
		return;
	}

	throw new Error(`Unknown model command: ${subcommand}`);
}

async function handleUpdateCommand(workingDir: string, openmarketingAgentDir: string, source?: string): Promise<void> {
	try {
		const updateSources = source ? resolvePackageUpdateSources(source) : [undefined];
		const results = [];
		for (const updateSource of updateSources) {
			results.push(await updateConfiguredPackages(workingDir, openmarketingAgentDir, updateSource));
		}

		const updated = results.flatMap((result) => result.updated);
		const skipped = results.flatMap((result) => result.skipped);

		if (updated.length === 0) {
			console.log("All packages up to date.");
			return;
		}

		for (const updatedSource of updated) {
			console.log(`Updated ${updatedSource}`);
		}
		for (const skippedSource of skipped) {
			console.log(`Skipped ${skippedSource} on Node ${process.versions.node} (native packages are only supported through Node ${MAX_NATIVE_PACKAGE_NODE_MAJOR}.x).`);
		}
		console.log("All packages up to date.");
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		if (message.includes("No supported package manager found")) {
			console.log("No package manager is available for live package updates.");
			console.log("If you installed the standalone app, rerun the installer to get newer bundled packages.");
			return;
		}
		if (message.includes("Installing pi-generative-ui failed")) {
			console.log(message);
			console.log("Skipped optional generative-ui update.");
			return;
		}

		throw error;
	}
}

async function handlePackagesCommand(subcommand: string | undefined, args: string[], workingDir: string, openmarketingAgentDir: string): Promise<void> {
	applyOpenMarketingPackageManagerEnv(openmarketingAgentDir);
	const settingsManager = SettingsManager.create(workingDir, openmarketingAgentDir);
	const configuredSources = new Set(
		settingsManager
			.getPackages()
			.map((entry) => (typeof entry === "string" ? entry : entry.source))
			.filter((entry): entry is string => typeof entry === "string"),
	);

	if (!subcommand || subcommand === "list") {
		printPanel("OpenMarketing Packages", [
			"Core packages are installed by default to keep first-run setup fast.",
		]);
		printSection("Core");
		for (const source of CORE_PACKAGE_SOURCES) {
			printInfo(source);
		}
		printSection("Optional");
		const optionalPresets = listOptionalPackagePresets();
		if (optionalPresets.length === 0) {
			printInfo(`No optional package presets are available on ${process.platform}.`);
			printInfo("Core packages already include memory and session search.");
			return;
		}
		for (const preset of optionalPresets) {
			const installed = preset.sources.every((source) => configuredSources.has(source));
			printInfo(`${preset.name}${installed ? " (installed)" : ""}  ${preset.description}`);
		}
		printInfo(`Install with: openmarketing packages install <${listOptionalPackagePresetInstallTargets().join("|")}>`);
		return;
	}

	if (subcommand !== "install") {
		throw new Error(`Unknown packages command: ${subcommand}`);
	}

	const target = args[0];
	if (!target) {
		const installTargets = listOptionalPackagePresetInstallTargets();
		if (installTargets.length === 0) {
			throw new Error(`No optional package presets are available on ${process.platform}. Core packages already include memory and session search.`);
		}
		throw new Error(`Usage: openmarketing packages install <${installTargets.join("|")}>`);
	}

	const sources = getOptionalPackagePresetSources(target);
	if (!sources) {
		const normalizedPreset = normalizeOptionalPackagePresetName(target);
		if (normalizedPreset === "all-extras") {
			console.log(`No optional package presets are available on ${process.platform}.`);
			console.log("Core packages already include memory and session search.");
			return;
		}
		if (normalizedPreset && !isOptionalPackagePresetSupported(normalizedPreset)) {
			console.log(`${normalizedPreset} is not available on ${process.platform}.`);
			if (normalizedPreset === "generative-ui") {
				console.log("The upstream pi-generative-ui package currently supports macOS only.");
			}
			return;
		}
		if (target === "memory" || target === "session-search") {
			console.log(`${target} is installed by default as a core package.`);
			return;
		}
		throw new Error(`Unknown package preset: ${target}`);
	}

	const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
	const isStandaloneBundle = !existsSync(resolve(appRoot, ".openmarketing", "runtime-workspace.tgz")) && existsSync(resolve(appRoot, ".openmarketing", "npm"));
	if (target === "generative-ui" && process.platform === "darwin" && isStandaloneBundle) {
		console.log("The generative-ui preset is currently unavailable in the standalone macOS bundle.");
		console.log("Its native glimpseui dependency fails to compile reliably in that environment.");
		console.log("If you need generative-ui, install OpenMarketing through npm instead of the standalone bundle.");
		return;
	}

	const pendingSources = sources.filter((source) => !configuredSources.has(source));
	for (const source of sources) {
		if (configuredSources.has(source)) {
			console.log(`${source} already installed`);
		}
	}

	if (pendingSources.length === 0) {
		console.log("Optional packages installed.");
		return;
	}

	try {
		const result = await installPackageSources(workingDir, openmarketingAgentDir, pendingSources, { persist: true });
		for (const skippedSource of result.skipped) {
			console.log(`Skipped ${skippedSource} on Node ${process.versions.node} (native packages are only supported through Node ${MAX_NATIVE_PACKAGE_NODE_MAJOR}.x).`);
		}
		await settingsManager.flush();
		console.log("Optional packages installed.");
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		if (message.includes("No supported package manager found")) {
			console.log("No package manager is available for optional package installs.");
			console.log("Install npm, pnpm, or bun, or rerun the standalone installer for bundled package updates.");
			return;
		}
		if (message.includes("Installing pi-generative-ui failed")) {
			console.log(message);
			console.log("Skipped optional generative-ui install.");
			return;
		}

		throw error;
	}
}

function handleSearchCommand(subcommand: string | undefined, args: string[]): void {
	if (!subcommand || subcommand === "status") {
		printSearchStatus();
		return;
	}

	if (subcommand === "set") {
		const provider = args[0] as PiWebSearchProvider | undefined;
		const validProviders: PiWebSearchProvider[] = ["auto", "perplexity", "exa", "gemini"];
		if (!provider || !validProviders.includes(provider)) {
			throw new Error("Usage: openmarketing search set <auto|perplexity|exa|gemini> [api-key]");
		}
		setSearchProvider(provider, args[1]);
		return;
	}

	if (subcommand === "clear") {
		clearSearchConfig();
		return;
	}

	throw new Error(`Unknown search command: ${subcommand}`);
}

function loadPackageVersion(appRoot: string): { version?: string } {
	try {
		return JSON.parse(readFileSync(resolve(appRoot, "package.json"), "utf8")) as { version?: string };
	} catch {
		return {};
	}
}

export function resolveInitialPrompt(
	command: string | undefined,
	rest: string[],
	oneShotPrompt: string | undefined,
	workflowCommands: Set<string>,
): string | undefined {
	if (oneShotPrompt) {
		return oneShotPrompt;
	}
	if (!command) {
		return undefined;
	}
	if (command === "chat") {
		return rest.length > 0 ? rest.join(" ") : undefined;
	}
	if (workflowCommands.has(command)) {
		return [`/${command}`, ...rest].join(" ").trim();
	}
	if (!TOP_LEVEL_COMMANDS.has(command)) {
		return [command, ...rest].join(" ");
	}
	return undefined;
}

export function resolvePiPromptOptions(
	command: string | undefined,
	rest: string[],
	oneShotPrompt: string | undefined,
	workflowCommands: Set<string>,
): { oneShotPrompt?: string; initialPrompt?: string } {
	const resolvedPrompt = resolveInitialPrompt(command, rest, oneShotPrompt, workflowCommands);
	if (!resolvedPrompt) {
		return {};
	}
	if (oneShotPrompt) {
		return { oneShotPrompt: resolvedPrompt };
	}
	return { initialPrompt: resolvedPrompt };
}

export function appendWorkflowFlagPositionals(
	command: string | undefined,
	rest: string[],
	values: Record<string, string | boolean | undefined>,
): string[] {
	if (command !== "summarize") {
		return rest;
	}

	const appended = [...rest];
	for (const flag of ["window-size", "overlap", "tier1-threshold", "tier2-threshold"] as const) {
		const value = values[flag];
		if (typeof value === "string") {
			appended.push(`--${flag}`, value);
		}
	}
	return appended;
}

export function resolveThinkingConfig(rawValue: string | undefined): {
	defaultThinkingLevel: ThinkingLevel;
	launchThinkingLevel?: ThinkingLevel;
} {
	const explicitThinkingLevel = normalizeThinkingLevel(rawValue);
	return {
		defaultThinkingLevel: explicitThinkingLevel ?? "medium",
		launchThinkingLevel: explicitThinkingLevel,
	};
}

export async function shouldRunInteractiveSetup(
	explicitModelSpec: string | undefined,
	currentModelSpec: string | undefined,
	isInteractiveTerminal: boolean,
	authPath: string,
): Promise<boolean> {
	if (explicitModelSpec || !isInteractiveTerminal) {
		return false;
	}

	const status = buildModelStatusSnapshotFromRecords(
		await getSupportedModelRecords(authPath),
		await getAuthenticatedModelRecords(authPath),
		currentModelSpec,
	);
	return !status.currentValid;
}

export async function main(): Promise<void> {
	const here = dirname(fileURLToPath(import.meta.url));
	const appRoot = resolve(here, "..");
	const openmarketingVersion = loadPackageVersion(appRoot).version;
	const bundledSettingsPath = resolve(appRoot, ".openmarketing", "settings.json");
	const openmarketingHome = getOpenMarketingHome();
	const openmarketingAgentDir = getOpenMarketingAgentDir(openmarketingHome);

	ensureOpenMarketingHome(openmarketingHome);
	syncBundledAssets(appRoot, openmarketingAgentDir);

	const { values, positionals } = parseArgs({
		args: process.argv.slice(2),
		allowPositionals: true,
		options: {
			cwd: { type: "string" },
			doctor: { type: "boolean" },
			help: { type: "boolean" },
			version: { type: "boolean" },
			mode: { type: "string" },
			model: { type: "string" },
			"new-session": { type: "boolean" },
			prompt: { type: "string" },
			"service-tier": { type: "string" },
			"session-dir": { type: "string" },
			"setup-preview": { type: "boolean" },
			"tier1-threshold": { type: "string" },
			"tier2-threshold": { type: "string" },
			thinking: { type: "string" },
			overlap: { type: "string" },
			"window-size": { type: "string" },
		},
	});

	if (values.help) {
		printHelp(appRoot);
		return;
	}

	if (values.version) {
		if (openmarketingVersion) {
			console.log(openmarketingVersion);
			return;
		}
		throw new Error("Unable to determine the installed OpenMarketing version.");
	}

	const workingDir = resolve(values.cwd ?? process.cwd());
	const sessionDir = resolve(values["session-dir"] ?? getDefaultSessionDir(openmarketingHome));
	const openmarketingSettingsPath = resolve(openmarketingAgentDir, "settings.json");
	const openmarketingAuthPath = resolve(openmarketingAgentDir, "auth.json");
	const configuredThinking = values.thinking ?? process.env.OPENMARKETING_THINKING ?? process.env.ADSAGENTS_THINKING;
	const { defaultThinkingLevel, launchThinkingLevel } = resolveThinkingConfig(configuredThinking);

	// Desktop app service: accounts, login, default model and session history over JSON lines.
	if (positionals[0] === "desktop-bridge") {
		await runDesktopBridge({ settingsPath: openmarketingSettingsPath, authPath: openmarketingAuthPath, sessionDir });
		return;
	}

	await normalizeOpenMarketingSettings(openmarketingSettingsPath, bundledSettingsPath, defaultThinkingLevel, openmarketingAuthPath);

	if (values.doctor) {
		await runDoctor({
			settingsPath: openmarketingSettingsPath,
			authPath: openmarketingAuthPath,
			sessionDir,
			workingDir,
			appRoot,
		});
		return;
	}

	if (values["setup-preview"]) {
		const result = setupPreviewDependencies();
		console.log(result.message);
		return;
	}

	const [command, ...rest] = positionals;
	if (command === "help") {
		printHelp(appRoot);
		return;
	}

	if (command === "setup") {
		if (rest[0] === "preview") {
			const result = setupPreviewDependencies();
			console.log(result.message);
			return;
		}
		if (rest[0]) {
			throw new Error(`Unknown setup command: ${rest[0]}`);
		}
		await runSetup({
			settingsPath: openmarketingSettingsPath,
			bundledSettingsPath,
			authPath: openmarketingAuthPath,
			workingDir,
			sessionDir,
			appRoot,
			defaultThinkingLevel,
		});
		return;
	}

	if (command === "doctor") {
		await runDoctor({
			settingsPath: openmarketingSettingsPath,
			authPath: openmarketingAuthPath,
			sessionDir,
			workingDir,
			appRoot,
		});
		return;
	}

	if (command === "status") {
		await runStatus({
			settingsPath: openmarketingSettingsPath,
			authPath: openmarketingAuthPath,
			sessionDir,
			workingDir,
			appRoot,
		});
		return;
	}

	if (command === "model") {
		await handleModelCommand(rest[0], rest.slice(1), openmarketingSettingsPath, openmarketingAuthPath);
		return;
	}

	if (command === "search") {
		handleSearchCommand(rest[0], rest.slice(1));
		return;
	}

	if (command === "packages") {
		await handlePackagesCommand(rest[0], rest.slice(1), workingDir, openmarketingAgentDir);
		return;
	}

	if (command === "update") {
		await handleUpdateCommand(workingDir, openmarketingAgentDir, rest[0]);
		return;
	}

	const configuredServiceTier = values["service-tier"] ?? process.env.OPENMARKETING_SERVICE_TIER ?? process.env.ADSAGENTS_SERVICE_TIER;
	const explicitModelSpec = values.model ?? process.env.OPENMARKETING_MODEL ?? process.env.ADSAGENTS_MODEL;
	const explicitServiceTier = normalizeServiceTier(configuredServiceTier);
	const mode = values.mode;
	if (mode !== undefined && mode !== "text" && mode !== "json" && mode !== "rpc") {
		throw new Error("Unknown mode. Use text, json, or rpc.");
	}
	if (configuredServiceTier && !explicitServiceTier) {
		throw new Error("Unknown service tier. Use auto, default, flex, priority, or standard_only.");
	}
	if (explicitServiceTier) {
		process.env.OPENMARKETING_SERVICE_TIER = explicitServiceTier;
	}
	if (explicitModelSpec) {
		const modelRuntime = await createModelRuntime(openmarketingAuthPath);
		const explicitModel = parseModelSpec(explicitModelSpec, modelRuntime);
		if (!explicitModel) {
			throw new Error(`Unknown model: ${explicitModelSpec}`);
		}
	}

	const currentModelSpec = getCurrentModelSpec(openmarketingSettingsPath);
	if (await shouldRunInteractiveSetup(
		explicitModelSpec,
		currentModelSpec,
		Boolean(process.stdin.isTTY && process.stdout.isTTY),
		openmarketingAuthPath,
	)) {
		await runSetup({
			settingsPath: openmarketingSettingsPath,
			bundledSettingsPath,
			authPath: openmarketingAuthPath,
			workingDir,
			sessionDir,
			appRoot,
			defaultThinkingLevel,
		});
		if (!getCurrentModelSpec(openmarketingSettingsPath)) {
			return;
		}
		await normalizeOpenMarketingSettings(openmarketingSettingsPath, bundledSettingsPath, defaultThinkingLevel, openmarketingAuthPath);
	}

	const workflowCommandNames = new Set(readPromptSpecs(appRoot).filter((s) => s.topLevelCli).map((s) => s.name));
	const workflowRest = appendWorkflowFlagPositionals(command, rest, values);
	const promptOptions = resolvePiPromptOptions(command, workflowRest, values.prompt, workflowCommandNames);
	await launchPiChat({
		appRoot,
		workingDir,
		sessionDir,
		openmarketingAgentDir,
		openmarketingVersion,
		mode,
		thinkingLevel: launchThinkingLevel,
		explicitModelSpec,
		...promptOptions,
	});
}
