// Render the app headlessly (optionally replaying a recorded run) and save a PNG.
// node scripts/screenshot.mjs --out shot.png [--fixture events.jsonl --cwd <workspace> --prompt "..."] [--size 1480x940] [--delay 4000]
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import electron from "electron";
import { electronEnv } from "./electron.mjs";

const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, value, i, all) => (value.startsWith("--") ? [...pairs, [value.slice(2), all[i + 1]]] : pairs), []));
const appDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const result = spawnSync(electron, [appDir], {
	stdio: "inherit",
	env: electronEnv({
		OM_DESKTOP_SCREENSHOT: resolve(args.out ?? "screenshot.png"),
		OM_DESKTOP_SIZE: args.size ?? "1480x940",
		OM_DESKTOP_SCREENSHOT_DELAY: args.delay ?? "4000",
		...(args.open ? { OM_DESKTOP_OPEN: resolve(args.open) } : {}),
		...(args.autoprompt ? { OM_DESKTOP_AUTOPROMPT: args.autoprompt } : {}),
		...(args.tab ? { OM_DESKTOP_TAB: args.tab } : {}),
		...(args.theme ? { OM_DESKTOP_THEME: args.theme } : {}),
		...(args.customize ? { OM_DESKTOP_CUSTOMIZE: "1" } : {}),
		...(args.onboarding ? { OM_DESKTOP_ONBOARDING: "1" } : {}),
		...(args.login ? { OM_DESKTOP_LOGIN: args.login } : {}),
		...(args.home ? { OPENMARKETING_HOME: resolve(args.home) } : {}),
		...(args.view ? { OM_DESKTOP_VIEW: resolve(args.view) } : {}),
		...(args.fixture ? { OM_DESKTOP_FIXTURE: resolve(args.fixture), OM_DESKTOP_FIXTURE_CWD: args.cwd, OM_DESKTOP_FIXTURE_PROMPT: args.prompt ?? "" } : {}),
	}),
});
process.exit(result.status ?? 0);
