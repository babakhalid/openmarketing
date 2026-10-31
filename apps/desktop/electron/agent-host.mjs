// One OpenMarketing runtime per workspace folder, driven over Pi's RPC protocol
// (JSON lines on stdin/stdout). The CLI is the same one `om` runs, so agents, skills,
// extensions and the video tools behave exactly as in the terminal.
import { execFileSync, spawn } from "node:child_process";
import { existsSync, realpathSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

function fromLoginShell(command) {
	try {
		const out = execFileSync(process.env.SHELL || "/bin/zsh", ["-lc", `command -v ${command}`], { encoding: "utf8", timeout: 8000 }).trim();
		return out.split("\n").pop() || undefined;
	} catch {
		return undefined;
	}
}

// Apps launched from Finder get a minimal PATH, so resolve node through a login shell.
export function resolveNodeBinary() {
	const candidates = [process.env.OM_NODE, fromLoginShell("node"), "/opt/homebrew/bin/node", "/usr/local/bin/node"];
	return candidates.find((candidate) => candidate && existsSync(candidate));
}

// Prefer the repo checkout this app lives in, then the globally linked `openmarketing`.
export function resolveCliPath() {
	const candidates = [process.env.OM_CLI_PATH, resolve(here, "..", "..", "..", "bin", "openmarketing.js"), fromLoginShell("openmarketing")];
	for (const candidate of candidates) {
		if (candidate && existsSync(candidate)) return realpathSync(candidate);
	}
	return undefined;
}

export function loginShellPath() {
	try {
		return execFileSync(process.env.SHELL || "/bin/zsh", ["-lc", "printf %s \"$PATH\""], { encoding: "utf8", timeout: 8000 });
	} catch {
		return process.env.PATH ?? "";
	}
}

export class AgentHost {
	constructor({ cwd, nodePath, cliPath, envPath, onEvent, onExit }) {
		this.cwd = cwd;
		this.onEvent = onEvent;
		this.onExit = onExit;
		this.pending = new Map();
		this.nextId = 1;
		this.stderr = "";
		this.buffer = "";
		this.exited = false;
		this.child = spawn(nodePath, [cliPath, "--mode", "rpc", "--cwd", cwd], {
			cwd,
			env: { ...process.env, PATH: envPath || process.env.PATH, FORCE_COLOR: "0", NO_COLOR: "1" },
			stdio: ["pipe", "pipe", "pipe"],
		});
		this.child.stdout.setEncoding("utf8");
		this.child.stdout.on("data", (chunk) => this.#read(chunk));
		this.child.stderr.setEncoding("utf8");
		this.child.stderr.on("data", (chunk) => {
			this.stderr = (this.stderr + chunk).slice(-20000);
		});
		this.child.on("exit", (code, signal) => {
			this.exited = true;
			const error = new Error(`Agent exited (${code ?? signal}). ${this.stderr.slice(-1500)}`);
			for (const { reject } of this.pending.values()) reject(error);
			this.pending.clear();
			this.onExit?.({ code, signal, stderr: this.stderr.slice(-4000) });
		});
	}

	#read(chunk) {
		this.buffer += chunk;
		let newline;
		while ((newline = this.buffer.indexOf("\n")) !== -1) {
			const line = this.buffer.slice(0, newline).trim();
			this.buffer = this.buffer.slice(newline + 1);
			if (!line) continue;
			let message;
			try {
				message = JSON.parse(line);
			} catch {
				this.stderr = (this.stderr + `\n[stdout] ${line}`).slice(-20000);
				continue;
			}
			if (message.type === "response" && message.id && this.pending.has(message.id)) {
				const { resolve: done, reject } = this.pending.get(message.id);
				this.pending.delete(message.id);
				if (message.success === false) reject(new Error(message.error ?? `${message.command} failed`));
				else done(message.data);
				continue;
			}
			this.onEvent?.(message);
		}
	}

	#write(payload) {
		if (this.exited) throw new Error("Agent is not running");
		this.child.stdin.write(`${JSON.stringify(payload)}\n`);
	}

	request(command, timeoutMs = 120_000) {
		const id = `desk-${this.nextId++}`;
		return new Promise((resolvePromise, reject) => {
			const timer = setTimeout(() => {
				this.pending.delete(id);
				reject(new Error(`${command.type} timed out`));
			}, timeoutMs);
			this.pending.set(id, {
				resolve: (value) => {
					clearTimeout(timer);
					resolvePromise(value);
				},
				reject: (error) => {
					clearTimeout(timer);
					reject(error);
				},
			});
			try {
				this.#write({ ...command, id });
			} catch (error) {
				clearTimeout(timer);
				this.pending.delete(id);
				reject(error);
			}
		});
	}

	respondToUi(response) {
		this.#write({ type: "extension_ui_response", ...response });
	}

	stop() {
		if (this.exited) return;
		this.child.stdin.end();
		setTimeout(() => {
			if (!this.exited) this.child.kill("SIGTERM");
		}, 1500);
	}
}
