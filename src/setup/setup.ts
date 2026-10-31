// `openmarketing setup`: the guided first-run flow for model access, search and preview tooling.

import { dirname } from "node:path";

import { getPiWebAccessStatus } from "../pi/web-access.js";
import { normalizeOpenMarketingSettings } from "../pi/settings.js";
import type { ThinkingLevel } from "../pi/settings.js";
import { getMissingConfiguredPackages, installPackageSources } from "../pi/package-ops.js";
import { listOptionalPackagePresets } from "../pi/package-presets.js";
import { getCurrentModelSpec, runModelSetup } from "../model/commands.js";
import { buildModelStatusSnapshotFromRecords, getAuthenticatedModelRecords, getSupportedModelRecords } from "../model/catalog.js";
import { PANDOC_FALLBACK_PATHS, resolveExecutable } from "../system/executables.js";
import { setupPreviewDependencies } from "./preview.js";
import {
	printAsciiHeader,
	printDivider,
	printInfo,
	printSection,
	printStep,
	printSuccess,
	printSummaryCard,
	printWarning,
} from "../ui/terminal.js";
import {
	isInteractiveTerminal,
	promptConfirm,
	promptIntro,
	promptMultiSelect,
	promptOutro,
	SetupCancelledError,
} from "./prompts.js";

type SetupOptions = {
	settingsPath: string;
	bundledSettingsPath: string;
	authPath: string;
	workingDir: string;
	sessionDir: string;
	appRoot: string;
	defaultThinkingLevel?: ThinkingLevel;
};

const TOTAL_STEPS = 4;

function printNonInteractiveSetupGuidance(): void {
	printAsciiHeader([
		"setup · non-interactive terminal",
		"Run these commands manually to finish provisioning:",
	]);

	printSection("1 — Authenticate a model");
	printInfo("openmarketing model login <provider>      OAuth flow (Anthropic, OpenAI, Google, …)");
	printInfo("openmarketing model login                  Interactive picker for OAuth + API-key providers");
	printInfo("openmarketing model set <provider/model>   Pin the default model");

	printSection("2 — Confirm runtime");
	printInfo("openmarketing doctor                       Diagnose config, auth, runtime, preview deps");
	printInfo("openmarketing status                       One-screen summary");

	printSection("3 — Optional");
	printInfo("openmarketing setup preview                Install pandoc for PDF/HTML export");
	printInfo("openmarketing packages install <preset>    Add optional Pi package presets");
	console.log("");
	printDivider();
	console.log("");
	printInfo("Already configured? Try `openmarketing research \"<your topic>\"`.");
	console.log("");
}

function summarizePackageSources(sources: string[]): string {
	if (sources.length <= 3) {
		return sources.join(", ");
	}

	return `${sources.slice(0, 3).join(", ")} +${sources.length - 3} more`;
}

async function maybeInstallBundledPackages(options: SetupOptions): Promise<void> {
	const agentDir = dirname(options.authPath);
	const { missing, bundled } = getMissingConfiguredPackages(options.workingDir, agentDir, options.appRoot);
	const userMissing = missing.filter((entry) => entry.scope === "user").map((entry) => entry.source);
	const projectMissing = missing.filter((entry) => entry.scope === "project").map((entry) => entry.source);

	if (bundled.length > 0) {
		printInfo(`Bundled runtime ready · ${summarizePackageSources(bundled.map((entry) => entry.source))}`);
	}

	if (missing.length === 0) {
		printInfo("Nothing else to install.");
		return;
	}

	printInfo(`Missing · ${summarizePackageSources(missing.map((entry) => entry.source))}`);
	const shouldInstall = await promptConfirm("Install the missing packages now?", true);
	if (!shouldInstall) {
		printInfo("Skipped. OpenMarketing will install on-demand later if needed.");
		return;
	}

	if (userMissing.length > 0) {
		try {
			await installPackageSources(options.workingDir, agentDir, userMissing);
			printSuccess(`Installed · ${summarizePackageSources(userMissing)}`);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			printInfo(message.includes("No supported package manager found")
				? "No package manager available. The standalone bundle still runs with shipped packages."
				: `Skipped · ${message}`);
		}
	}

	if (projectMissing.length > 0) {
		try {
			await installPackageSources(options.workingDir, agentDir, projectMissing, { local: true });
			printSuccess(`Installed (project) · ${summarizePackageSources(projectMissing)}`);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			printInfo(`Skipped (project) · ${message}`);
		}
	}
}

async function maybeInstallOptionalPackages(options: SetupOptions): Promise<void> {
	const agentDir = dirname(options.authPath);
	const presets = listOptionalPackagePresets();
	if (presets.length === 0) {
		printInfo("No optional presets available on this platform.");
		return;
	}

	printInfo("Pick any extras you want pre-installed (none required).");
	const selectedPresets = await promptMultiSelect(
		"Optional packages",
		presets.map((preset) => ({
			value: preset.name,
			label: preset.name,
			hint: preset.description,
		})),
		[],
	);

	if (selectedPresets.length === 0) {
		printInfo("Skipped — you can add presets anytime with `openmarketing packages install <preset>`.");
		return;
	}

	for (const presetName of selectedPresets) {
		const preset = presets.find((entry) => entry.name === presetName);
		if (!preset) continue;
		try {
			await installPackageSources(options.workingDir, agentDir, preset.sources, {
				persist: true,
			});
			printSuccess(`Installed · ${preset.name}`);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			printInfo(message.includes("No supported package manager found")
				? `Skipped · ${preset.name} (no package manager available)`
				: `Skipped · ${preset.name} — ${message}`);
		}
	}
}

async function maybeInstallPreviewDependencies(): Promise<void> {
	if (resolveExecutable("pandoc", PANDOC_FALLBACK_PATHS)) {
		printInfo("Pandoc already available — preview/export is ready.");
		return;
	}

	const shouldInstall = await promptConfirm(
		"Install pandoc to export marketing reports as PDF/HTML?",
		false,
	);
	if (!shouldInstall) {
		printInfo("Skipped. Run `openmarketing setup preview` later if you need PDF export.");
		return;
	}

	try {
		const result = setupPreviewDependencies();
		printSuccess(result.message);
	} catch (error) {
		printInfo(`Skipped · ${error instanceof Error ? error.message : String(error)}`);
	}
}

export async function runSetup(options: SetupOptions): Promise<void> {
	if (!isInteractiveTerminal()) {
		printNonInteractiveSetupGuidance();
		return;
	}

	printAsciiHeader([
		"setup · get your marketing workspace ready in under a minute",
		`We'll connect a model, install runtime packages, and verify export tooling.`,
	]);

	try {
		await promptIntro("OpenMarketing · Setup wizard");

		printStep(1, TOTAL_STEPS, "Model provider");
		printInfo("Connect Anthropic, OpenAI, Google, OpenRouter, a local provider, or any API-key provider.");
		await runModelSetup(options.settingsPath, options.authPath);

		printStep(2, TOTAL_STEPS, "Runtime packages");
		printInfo("Bundled Pi packages keep memory, search, and previews available offline.");
		await maybeInstallBundledPackages(options);

		printStep(3, TOTAL_STEPS, "Optional extras");
		await maybeInstallOptionalPackages(options);

		printStep(4, TOTAL_STEPS, "Export tooling");
		await maybeInstallPreviewDependencies();

		await normalizeOpenMarketingSettings(
			options.settingsPath,
			options.bundledSettingsPath,
			options.defaultThinkingLevel ?? "medium",
			options.authPath,
		);

		const modelStatus = buildModelStatusSnapshotFromRecords(
			await getSupportedModelRecords(options.authPath),
			await getAuthenticatedModelRecords(options.authPath),
			getCurrentModelSpec(options.settingsPath),
		);
		const currentModel = getCurrentModelSpec(options.settingsPath);
		const previewReady = Boolean(resolveExecutable("pandoc", PANDOC_FALLBACK_PATHS));

		printSummaryCard("You're set", [
			{ label: "model", value: currentModel ?? "not set", ok: Boolean(currentModel) && modelStatus.currentValid },
			{ label: "preview", value: previewReady ? "configured" : "skipped", ok: previewReady },
			{ label: "web", value: getPiWebAccessStatus().routeLabel },
		]);

		if (modelStatus.recommended && !modelStatus.currentValid) {
			printWarning(`Recommended model: ${modelStatus.recommended}`);
		}

		printSection("Try this next");
		printInfo("openmarketing start \"<your product>\"          Build context and choose the right next action");
		printInfo("openmarketing (or om)                          Launch the interactive REPL");
		printInfo("openmarketing doctor                           Diagnose any remaining issues");
		console.log("");

		await promptOutro("Ready to start your marketing workflow.");
	} catch (error) {
		if (error instanceof SetupCancelledError) {
			console.log("");
			printWarning("Setup cancelled. Rerun `openmarketing setup` whenever you're ready.");
			console.log("");
			return;
		}

		throw error;
	}
}
