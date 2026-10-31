// Launch Electron with a clean environment. Terminals inside VS Code export
// ELECTRON_RUN_AS_NODE=1, which turns Electron into plain Node and breaks the app.
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import electron from "electron";

export function electronEnv(extra = {}) {
	const env = { ...process.env, ...extra };
	delete env.ELECTRON_RUN_AS_NODE;
	return env;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const appDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
	const child = spawn(electron, [appDir, ...process.argv.slice(2)], { stdio: "inherit", env: electronEnv() });
	child.on("exit", (code) => process.exit(code ?? 0));
}
