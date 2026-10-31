import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { registerDiscoveryCommands } from "./core-tools/discovery.js";
import { registerOpenMarketingModelCommand } from "./core-tools/openmarketing-model.js";
import { installOpenMarketingHeader } from "./core-tools/header.js";
import { registerHelpCommand } from "./core-tools/help.js";
import { registerInitCommand, registerOutputsCommand } from "./core-tools/project.js";
import { registerServiceTierControls } from "./core-tools/service-tier.js";

export default function coreTools(pi: ExtensionAPI): void {
	const cache: { agentSummaryPromise?: Promise<{ agents: string[]; chains: string[] }> } = {};

	pi.on("session_start", async (_event, ctx) => {
		await installOpenMarketingHeader(pi, ctx, cache);
	});

	registerDiscoveryCommands(pi);
	registerOpenMarketingModelCommand(pi);
	registerHelpCommand(pi);
	registerInitCommand(pi);
	registerOutputsCommand(pi);
	registerServiceTierControls(pi);
}
