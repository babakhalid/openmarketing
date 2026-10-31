import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import type { ModelRuntime, PackageSource } from "@earendil-works/pi-coding-agent";

import { CORE_PACKAGE_SOURCES, filterPackageSourcesForCurrentNode, INCOMPATIBLE_PACKAGE_SOURCES, shouldPruneLegacyDefaultPackages } from "./package-presets.js";
import { choosePreferredModelRecord, getAvailableModelRecords } from "../model/catalog.js";

export type ThinkingLevel = "off" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max";

type ModelLookup = Pick<ModelRuntime, "getModel">;

export function parseModelSpec(spec: string, modelLookup: ModelLookup) {
	const trimmed = spec.trim();
	const separator = trimmed.includes(":") ? ":" : trimmed.includes("/") ? "/" : null;
	if (!separator) {
		return undefined;
	}

	const [provider, ...rest] = trimmed.split(separator);
	const id = rest.join(separator);
	if (!provider || !id) {
		return undefined;
	}

	return modelLookup.getModel(provider, id);
}

export function normalizeThinkingLevel(value: string | undefined): ThinkingLevel | undefined {
	if (!value) {
		return undefined;
	}

	const normalized = value.toLowerCase();
	if (
		normalized === "off" ||
		normalized === "minimal" ||
		normalized === "low" ||
		normalized === "medium" ||
		normalized === "high" ||
		normalized === "xhigh" ||
		normalized === "max"
	) {
		return normalized;
	}

	return undefined;
}

function filterConfiguredPackagesForCurrentNode(packages: PackageSource[] | undefined): PackageSource[] {
	if (!Array.isArray(packages)) {
		return [];
	}

	const filteredStringSources = new Set(filterPackageSourcesForCurrentNode(
		packages
			.map((entry) => (typeof entry === "string" ? entry : entry.source))
			.filter((entry): entry is string => typeof entry === "string"),
	));

	return packages.filter((entry) => {
		const source = typeof entry === "string" ? entry : entry.source;
		return filteredStringSources.has(source);
	});
}

export function readJson(path: string): Record<string, unknown> {
	if (!existsSync(path)) {
		return {};
	}

	try {
		return JSON.parse(readFileSync(path, "utf8"));
	} catch {
		return {};
	}
}

export async function normalizeOpenMarketingSettings(
	settingsPath: string,
	bundledSettingsPath: string,
	defaultThinkingLevel: ThinkingLevel,
	authPath: string,
): Promise<void> {
	let settings: Record<string, unknown> = {};

	if (existsSync(settingsPath)) {
		try {
			settings = JSON.parse(readFileSync(settingsPath, "utf8"));
		} catch {
			settings = {};
		}
	} else if (existsSync(bundledSettingsPath)) {
		try {
			settings = JSON.parse(readFileSync(bundledSettingsPath, "utf8"));
		} catch {
			settings = {};
		}
	}

	if (!settings.defaultThinkingLevel) {
		settings.defaultThinkingLevel = defaultThinkingLevel;
	}
	if (settings.editorPaddingX === undefined) {
		settings.editorPaddingX = 1;
	}
	settings.theme = "openmarketing";
	settings.quietStartup = true;
	settings.collapseChangelog = true;
	const supportedCorePackages = filterPackageSourcesForCurrentNode(CORE_PACKAGE_SOURCES);
	if (!Array.isArray(settings.packages) || settings.packages.length === 0) {
		settings.packages = supportedCorePackages;
	} else if (shouldPruneLegacyDefaultPackages(settings.packages as PackageSource[])) {
		settings.packages = supportedCorePackages;
	} else {
		settings.packages = filterConfiguredPackagesForCurrentNode(settings.packages as PackageSource[]);
	}
	settings.packages = (settings.packages as PackageSource[]).filter(
		(source) => !INCOMPATIBLE_PACKAGE_SOURCES.includes(typeof source === "string" ? source : source.source),
	);

	if (!settings.defaultProvider || !settings.defaultModel) {
		// newest authenticated Claude Opus first (Opus 5.5 today), then other families
		const preferredModel = choosePreferredModelRecord(await getAvailableModelRecords(authPath));
		if (preferredModel) {
			settings.defaultProvider = preferredModel.provider;
			settings.defaultModel = preferredModel.id;
		}
	}

	mkdirSync(dirname(settingsPath), { recursive: true });
	writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n", "utf8");
}
