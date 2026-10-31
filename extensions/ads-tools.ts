import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { registerHiggsfieldTools } from "./ads-tools/higgsfield.js";
import { registerMetaTools } from "./ads-tools/meta.js";
import { registerAskTools } from "./ads-tools/ask.js";
import { registerModelTools } from "./ads-tools/models.js";
import { registerVideoTools } from "./ads-tools/video.js";

export default function adsTools(pi: ExtensionAPI): void {
	registerHiggsfieldTools(pi);
	registerMetaTools(pi);
	registerModelTools(pi);
	registerAskTools(pi);
	registerVideoTools(pi);
}
