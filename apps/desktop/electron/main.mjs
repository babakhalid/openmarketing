import { app, BrowserWindow, dialog, ipcMain, net, protocol, shell } from "electron";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { userInfo } from "node:os";

import { AgentHost, loginShellPath, resolveCliPath, resolveNodeBinary } from "./agent-host.mjs";
import { BridgeHost } from "./bridge-host.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const DEV_URL = process.env.OM_DESKTOP_DEV_URL;
const SCREENSHOT = process.env.OM_DESKTOP_SCREENSHOT;
const VIDEO_EXT = new Set([".mp4", ".mov", ".m4v", ".webm", ".mkv"]);

// media://local/<encoded absolute path> serves workspace files (frames, renders, references)
protocol.registerSchemesAsPrivileged([{ scheme: "media", privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, bypassCSP: true } }]);

// Screenshot/replay runs use a throwaway profile so the user's recent workspaces stay untouched.
if (SCREENSHOT) app.setPath("userData", join(app.getPath("temp"), "openmarketing-desktop-shot"));
// OpenMarketing was previously MarketingAgents: carry the old profile (workspaces, theme) over once.
else {
	const previous = join(app.getPath("appData"), "marketingagents-desktop");
	if (!existsSync(app.getPath("userData")) && existsSync(previous)) {
		try {
			renameSync(previous, app.getPath("userData"));
		} catch {
			// keep going with a fresh profile
		}
	}
}

let win;
const hosts = new Map();
const statePath = () => join(app.getPath("userData"), "workspaces.json");

function loadState() {
	try {
		return JSON.parse(readFileSync(statePath(), "utf8"));
	} catch {
		return { recent: [], last: undefined };
	}
}

function saveState(state) {
	mkdirSync(dirname(statePath()), { recursive: true });
	writeFileSync(statePath(), JSON.stringify(state, null, 2));
}

function rememberWorkspace(cwd) {
	const state = loadState();
	state.recent = [cwd, ...state.recent.filter((p) => p !== cwd)].slice(0, 12);
	state.last = cwd;
	saveState(state);
	return state;
}

function isInsideKnownWorkspace(path) {
	const roots = [...loadState().recent, ...hosts.keys()];
	return roots.some((root) => path === root || path.startsWith(root + sep));
}

function send(channel, payload) {
	if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
}

let userName;
function getUserName() {
	if (userName) return userName;
	try {
		userName = execFileSync("git", ["config", "--global", "user.name"], { encoding: "utf8", timeout: 3000 }).trim();
	} catch {
		/* no git identity */
	}
	userName ||= userInfo().username;
	return userName;
}

let runtime;
function getRuntime() {
	runtime ??= { nodePath: resolveNodeBinary(), cliPath: resolveCliPath(), envPath: loginShellPath() };
	return runtime;
}

let bridge;
function getBridge() {
	if (bridge && !bridge.exited) return bridge;
	const { nodePath, cliPath, envPath } = getRuntime();
	if (!nodePath || !cliPath) throw new Error("The OpenMarketing runtime was not found.");
	bridge = new BridgeHost({
		nodePath,
		cliPath,
		envPath,
		onMessage: (message) => {
			// open the browser for OAuth like the CLI does; the UI still shows the URL as a fallback
			if (!SCREENSHOT && message.type === "login_event" && message.event?.type === "auth_url") shell.openExternal(message.event.url);
			if (!SCREENSHOT && message.type === "login_event" && message.event?.type === "device_code") shell.openExternal(message.event.verificationUri);
			send("bridge:event", message);
		},
	});
	return bridge;
}

async function openWorkspace(cwd) {
	rememberWorkspace(cwd);
	let host = hosts.get(cwd);
	if (!host || host.exited) {
		const { nodePath, cliPath, envPath } = getRuntime();
		if (!nodePath) throw new Error("Node.js was not found. Install Node 22+ or set OM_NODE.");
		if (!cliPath) throw new Error("The OpenMarketing CLI was not found. Run `npm link` in the repo or set OM_CLI_PATH.");
		host = new AgentHost({
			cwd,
			nodePath,
			cliPath,
			envPath,
			onEvent: (event) => send("agent:event", { cwd, event }),
			onExit: (info) => {
				// a replaced host (e.g. restarted after an account change) must not clobber its successor
				if (hosts.get(cwd) !== host) return;
				hosts.delete(cwd);
				send("agent:exit", { cwd, ...info });
			},
		});
		hosts.set(cwd, host);
	}
	const [state, commands, models, messages] = await Promise.all([
		host.request({ type: "get_state" }),
		host.request({ type: "get_commands" }).catch(() => []),
		host.request({ type: "get_available_models" }).catch(() => ({ models: [] })),
		host.request({ type: "get_messages" }).catch(() => ({ messages: [] })),
	]);
	return { state, commands: commands?.commands ?? commands, models: models?.models ?? models, messages: messages?.messages ?? messages };
}

function gitBranch(cwd) {
	try {
		const head = readFileSync(join(cwd, ".git", "HEAD"), "utf8").trim();
		return head.startsWith("ref: ") ? head.split("/").pop() : head.slice(0, 7);
	} catch {
		return undefined;
	}
}

function fileEntry(path) {
	const stat = statSync(path);
	return { name: basename(path), path, size: stat.size, mtime: stat.mtimeMs };
}

function listFiles(dir, { depth = 3, skip = [] } = {}) {
	if (!existsSync(dir)) return [];
	const out = [];
	for (const name of readdirSync(dir)) {
		if (name.startsWith(".") || skip.includes(name)) continue;
		const path = join(dir, name);
		const stat = statSync(path);
		if (stat.isDirectory()) {
			if (depth > 0) out.push(...listFiles(path, { depth: depth - 1, skip }));
		} else {
			out.push(fileEntry(path));
		}
	}
	return out;
}

function readJson(path) {
	try {
		return JSON.parse(readFileSync(path, "utf8"));
	} catch {
		return undefined;
	}
}

function describeWorkspace(cwd) {
	const refsDir = join(cwd, "references");
	const references = existsSync(refsDir) ? listFiles(refsDir, { depth: 0 }).filter((f) => VIDEO_EXT.has(extname(f.name).toLowerCase())) : [];
	const analysisDir = join(cwd, "branding", "analysis");
	const analyses = existsSync(analysisDir)
		? readdirSync(analysisDir)
				.filter((name) => existsSync(join(analysisDir, name, "metrics.json")))
				.map((name) => {
					const metrics = readJson(join(analysisDir, name, "metrics.json")) ?? {};
					return {
						slug: name,
						dir: join(analysisDir, name),
						hookStrip: existsSync(join(analysisDir, name, "hook", "hook-0-3s.jpg")) ? join(analysisDir, name, "hook", "hook-0-3s.jpg") : undefined,
						hasBreakdown: existsSync(join(analysisDir, name, "analysis.md")),
						duration: metrics.duration,
						cutsPerMinute: metrics.pacing?.cutsPerMinute,
						lufs: metrics.audio?.integratedLUFS,
					};
				})
		: [];
	const branding = listFiles(join(cwd, "branding"), { depth: 2, skip: ["analysis", "assets"] }).filter((f) => f.name !== "README.md");
	const videosDir = join(cwd, "outputs", "videos");
	const renders = existsSync(videosDir)
		? readdirSync(videosDir)
				.filter((name) => statSync(join(videosDir, name)).isDirectory())
				.map((name) => {
					const files = listFiles(join(videosDir, name), { depth: 0 });
					return {
						slug: name,
						videos: files.filter((f) => VIDEO_EXT.has(extname(f.name).toLowerCase())),
						cover: files.find((f) => f.name.endsWith("-cover.jpg"))?.path,
						verdict: readdirSync(join(videosDir, name))
							.map((d) => readJson(join(videosDir, name, d, "verdict.json")))
							.find(Boolean)?.verdict,
						mtime: Math.max(0, ...files.map((f) => f.mtime)),
					};
				})
				.sort((a, b) => b.mtime - a.mtime)
		: [];
	const latestPath = join(cwd, "outputs", "latest.mp4");
	const latest = existsSync(latestPath)
		? { video: latestPath, cover: existsSync(join(cwd, "outputs", "latest-cover.jpg")) ? join(cwd, "outputs", "latest-cover.jpg") : undefined, info: readJson(join(cwd, "outputs", "latest.json")), mtime: statSync(latestPath).mtimeMs }
		: undefined;
	const pages = branding.filter((f) => /\.html?$/i.test(f.name)).sort((a, b) => Number(b.name === "brand.html") - Number(a.name === "brand.html") || b.mtime - a.mtime);
	return { cwd, name: basename(cwd), branch: gitBranch(cwd), hasWorkspace: existsSync(refsDir), references, analyses, branding, pages, renders, latest };
}

function createWindow() {
	const [width, height] = (process.env.OM_DESKTOP_SIZE ?? "1480x940").split("x").map(Number);
	win = new BrowserWindow({
		width,
		height,
		minWidth: 1040,
		minHeight: 680,
		backgroundColor: "#0b0b0d",
		titleBarStyle: "hiddenInset",
		trafficLightPosition: { x: 18, y: 18 },
		show: !SCREENSHOT,
		webPreferences: { preload: join(here, "preload.cjs"), contextIsolation: true, nodeIntegration: false, sandbox: true },
	});
	if (DEV_URL) win.loadURL(DEV_URL);
	else win.loadFile(join(here, "..", "dist", "index.html"));
	win.on("closed", () => {
		win = undefined;
	});
}

ipcMain.handle("state:get", () => {
	// OM_DESKTOP_OPEN (screenshot/verification runs) opens a workspace through the real agent path.
	if (SCREENSHOT && process.env.OM_DESKTOP_OPEN) rememberWorkspace(process.env.OM_DESKTOP_OPEN);
	return { ...loadState(), runtime: getRuntime(), user: getUserName(), screenshot: Boolean(SCREENSHOT), autoPrompt: SCREENSHOT ? process.env.OM_DESKTOP_AUTOPROMPT : undefined, tab: SCREENSHOT ? process.env.OM_DESKTOP_TAB : undefined, view: SCREENSHOT ? process.env.OM_DESKTOP_VIEW : undefined, theme: SCREENSHOT ? process.env.OM_DESKTOP_THEME : undefined, customize: Boolean(SCREENSHOT && process.env.OM_DESKTOP_CUSTOMIZE), onboarding: Boolean(SCREENSHOT && process.env.OM_DESKTOP_ONBOARDING), login: SCREENSHOT ? process.env.OM_DESKTOP_LOGIN : undefined };
});
ipcMain.handle("workspace:pick", async () => {
	const result = await dialog.showOpenDialog(win, { title: "Choose a workspace folder", properties: ["openDirectory", "createDirectory"] });
	if (result.canceled || !result.filePaths[0]) return undefined;
	rememberWorkspace(result.filePaths[0]);
	return result.filePaths[0];
});
ipcMain.handle("workspace:open", (_e, cwd) => openWorkspace(cwd));
ipcMain.handle("workspace:forget", (_e, cwd) => {
	const state = loadState();
	state.recent = state.recent.filter((p) => p !== cwd);
	if (state.last === cwd) state.last = state.recent[0];
	saveState(state);
	hosts.get(cwd)?.stop();
	hosts.delete(cwd);
	return state;
});
ipcMain.handle("workspace:describe", (_e, cwd) => describeWorkspace(cwd));
ipcMain.handle("workspace:import", (_e, cwd, paths) => {
	const dir = join(cwd, "references");
	mkdirSync(dir, { recursive: true });
	const copied = [];
	for (const path of paths) {
		if (!VIDEO_EXT.has(extname(path).toLowerCase())) continue;
		const target = join(dir, basename(path));
		copyFileSync(path, target);
		copied.push(target);
	}
	return copied;
});
ipcMain.handle("bridge:request", async (_e, type, payload) => {
	const response = await getBridge().request(type, payload, type === "login" ? 15 * 60_000 : 60_000);
	// a model/account change must reach running agents: restart them on their next open
	if ((type === "login" && response.ok) || type === "logout" || type === "set_default") {
		for (const host of hosts.values()) host.stop();
		hosts.clear();
	}
	return response;
});
ipcMain.handle("shell:external", (_e, url) => (/^https?:\/\//.test(url) ? shell.openExternal(url) : undefined));

ipcMain.handle("agent:command", (_e, cwd, command) => {
	const host = hosts.get(cwd);
	if (!host) throw new Error("Workspace agent is not running");
	return host.request(command, command.type === "prompt" ? 60_000 : 120_000);
});
ipcMain.handle("agent:ui-response", (_e, cwd, response) => hosts.get(cwd)?.respondToUi(response));
ipcMain.handle("file:read", (_e, path) => (isInsideKnownWorkspace(path) && existsSync(path) ? readFileSync(path, "utf8").slice(0, 400_000) : undefined));
ipcMain.handle("shell:reveal", (_e, path) => shell.showItemInFolder(path));
ipcMain.handle("shell:open", (_e, path) => shell.openPath(path));
ipcMain.handle("dev:fixture", () => {
	const fixture = process.env.OM_DESKTOP_FIXTURE;
	if (!fixture || !existsSync(fixture)) return undefined;
	if (process.env.OM_DESKTOP_FIXTURE_CWD) rememberWorkspace(process.env.OM_DESKTOP_FIXTURE_CWD);
	return { cwd: process.env.OM_DESKTOP_FIXTURE_CWD, prompt: process.env.OM_DESKTOP_FIXTURE_PROMPT, events: readFileSync(fixture, "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line)) };
});

app.whenReady().then(() => {
	const picker = readFileSync(join(here, "picker.js"), "utf8");
	protocol.handle("media", (request) => {
		const url = new URL(request.url);
		const path = decodeURIComponent(url.pathname);
		if (!isInsideKnownWorkspace(path) && !path.startsWith(app.getPath("temp"))) return new Response("forbidden", { status: 403 });
		// media://inspect/<file>.html serves branding pages with the element picker injected;
		// their relative assets resolve under the same host and are served as-is.
		if (url.host === "inspect" && /\.html?$/i.test(path) && existsSync(path)) {
			const html = readFileSync(path, "utf8");
			const tag = `<script>${picker}</script>`;
			const body = html.includes("</body>") ? html.replace("</body>", `${tag}</body>`) : html + tag;
			return new Response(body, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
		}
		return net.fetch(pathToFileURL(path).toString(), { headers: request.headers });
	});
	createWindow();
	if (SCREENSHOT) {
		const delay = Number(process.env.OM_DESKTOP_SCREENSHOT_DELAY ?? 4000);
		win.webContents.once("did-finish-load", () => {
			setTimeout(async () => {
				const image = await win.webContents.capturePage();
				writeFileSync(SCREENSHOT, image.toPNG());
				app.quit();
			}, delay);
		});
	}
	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

app.on("window-all-closed", () => {
	for (const host of hosts.values()) host.stop();
	bridge?.stop();
	if (process.platform !== "darwin" || SCREENSHOT) app.quit();
});

