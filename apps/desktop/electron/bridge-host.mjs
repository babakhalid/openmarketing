// Long-lived `openmarketing desktop-bridge` process: accounts, login, default model and
// session history. Requests carry an id; login prompts and events stream back as messages.
import { spawn } from "node:child_process";

export class BridgeHost {
	constructor({ nodePath, cliPath, envPath, onMessage, onExit }) {
		this.pending = new Map();
		this.nextId = 1;
		this.buffer = "";
		this.stderr = "";
		this.onMessage = onMessage;
		this.child = spawn(nodePath, [cliPath, "desktop-bridge"], {
			env: { ...process.env, PATH: envPath || process.env.PATH, FORCE_COLOR: "0", NO_COLOR: "1" },
			stdio: ["pipe", "pipe", "pipe"],
		});
		this.ready = new Promise((resolve) => (this.markReady = resolve));
		this.child.stdout.setEncoding("utf8");
		this.child.stdout.on("data", (chunk) => this.#read(chunk));
		this.child.stderr.setEncoding("utf8");
		this.child.stderr.on("data", (chunk) => (this.stderr = (this.stderr + chunk).slice(-8000)));
		this.child.on("exit", (code) => {
			this.exited = true;
			for (const { reject } of this.pending.values()) reject(new Error(`Account service exited (${code}). ${this.stderr.slice(-600)}`));
			this.pending.clear();
			onExit?.(code);
		});
	}

	#read(chunk) {
		this.buffer += chunk;
		let newline;
		while ((newline = this.buffer.indexOf("\n")) !== -1) {
			const line = this.buffer.slice(0, newline).trim();
			this.buffer = this.buffer.slice(newline + 1);
			if (!line.startsWith("{")) continue; // npm chatter from the launcher, not protocol
			let message;
			try {
				message = JSON.parse(line);
			} catch {
				continue;
			}
			if (message.type === "ready") {
				this.markReady();
				continue;
			}
			if (message.type === "response" && this.pending.has(message.id)) {
				const { resolve, timer } = this.pending.get(message.id);
				clearTimeout(timer);
				this.pending.delete(message.id);
				resolve(message);
				continue;
			}
			this.onMessage?.(message);
		}
	}

	async request(type, payload = {}, timeoutMs = 60_000) {
		await this.ready;
		if (this.exited) throw new Error("Account service is not running");
		const id = `b${this.nextId++}`;
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				this.pending.delete(id);
				reject(new Error(`${type} timed out`));
			}, timeoutMs);
			this.pending.set(id, { resolve, reject, timer });
			this.child.stdin.write(`${JSON.stringify({ ...payload, type, id })}\n`);
		});
	}

	stop() {
		if (!this.exited) this.child.kill("SIGTERM");
	}
}
