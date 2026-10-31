// JSON-lines service for the desktop app (`openmarketing desktop-bridge`): account status,
// OAuth / API-key login, logout, default model, and session history. It reuses the same
// model runtime and helpers as the CLI so the app and the terminal stay in lockstep.
import { createInterface } from "node:readline";

import type { AuthEvent, AuthPrompt } from "@earendil-works/pi-ai";
import { SessionManager } from "@earendil-works/pi-coding-agent";

import { MODEL_API_KEY_PROVIDERS } from "../model/api-key-providers.js";
import { chooseRecommendedModel } from "../model/catalog.js";
import {
	describeOAuthLoginFailure,
	getCurrentModelSpec,
	getOrCreateDeviceId,
	maybeSetRecommendedDefaultModel,
	refreshProviderModels,
	setDefaultModelSpec,
} from "../model/commands.js";
import { createModelRuntime } from "../model/registry.js";

type Request = { id?: string; type: string; [key: string]: unknown };
type Pending = { resolve: (value: string) => void; reject: (error: Error) => void };

class CancelledError extends Error {}

const write = (message: Record<string, unknown>) => process.stdout.write(`${JSON.stringify(message)}\n`);

export async function runDesktopBridge(options: { settingsPath: string; authPath: string; sessionDir: string }): Promise<void> {
	const { settingsPath, authPath, sessionDir } = options;
	const prompts = new Map<string, Pending>();
	const logins = new Map<string, AbortController>();
	let promptSeq = 0;

	async function status() {
		const runtime = await createModelRuntime(authPath);
		const credentials = new Map((await runtime.listCredentials()).map((c) => [c.providerId, c.type]));
		const envVars = new Map(MODEL_API_KEY_PROVIDERS.map((p) => [p.id, p.envVar]));
		const providers = runtime
			.getProviders()
			.filter((provider) => provider.auth.oauth || provider.auth.apiKey)
			.map((provider) => {
				const auth = runtime.getProviderAuthStatus(provider.id);
				return {
					id: provider.id,
					name: provider.name,
					oauthName: provider.auth.oauth?.name,
					oauth: Boolean(provider.auth.oauth),
					apiKey: Boolean(provider.auth.apiKey),
					envVar: envVars.get(provider.id),
					connected: auth.configured,
					source: auth.source,
					credential: credentials.get(provider.id),
				};
			})
			.sort((a, b) => Number(b.connected) - Number(a.connected) || a.name.localeCompare(b.name));
		const recommended = await chooseRecommendedModel(authPath).catch(() => undefined);
		return { providers, current: getCurrentModelSpec(settingsPath), recommended: recommended?.spec };
	}

	async function login(requestId: string, providerId: string, method: "oauth" | "api_key") {
		const runtime = await createModelRuntime(authPath);
		const controller = new AbortController();
		logins.set(requestId, controller);
		const deviceId = await getOrCreateDeviceId(authPath);
		try {
			await runtime.login(
				providerId,
				method,
				{
					signal: controller.signal,
					notify: (event: AuthEvent) => write({ type: "login_event", loginId: requestId, event }),
					prompt: (prompt: AuthPrompt) =>
						new Promise<string>((resolve, reject) => {
							const promptId = `p${++promptSeq}`;
							prompts.set(promptId, { resolve, reject });
							const { signal: _signal, ...shape } = prompt as AuthPrompt & { signal?: AbortSignal };
							write({ type: "login_prompt", loginId: requestId, promptId, prompt: shape });
							controller.signal.addEventListener("abort", () => reject(new CancelledError("cancelled")), { once: true });
						}),
				},
				method === "oauth" ? { getDeviceId: () => deviceId } : undefined,
			);
			await refreshProviderModels(runtime, providerId);
			await maybeSetRecommendedDefaultModel(settingsPath, authPath);
			return { ok: true };
		} catch (error) {
			if (error instanceof CancelledError || controller.signal.aborted) return { ok: false, cancelled: true };
			const described = method === "oauth" ? describeOAuthLoginFailure(providerId, error) : error;
			return { ok: false, error: described instanceof Error ? described.message : String(described) };
		} finally {
			logins.delete(requestId);
		}
	}

	async function sessions(cwd: string) {
		const list = await SessionManager.list(cwd, sessionDir);
		return list
			.filter((s) => s.messageCount > 0)
			.sort((a, b) => b.modified.getTime() - a.modified.getTime())
			.map((s) => ({
				path: s.path,
				id: s.id,
				name: s.name,
				created: s.created.toISOString(),
				modified: s.modified.toISOString(),
				messageCount: s.messageCount,
				title: (s.name || s.firstMessage || "Untitled session").replace(/\s+/g, " ").trim().slice(0, 140),
			}));
	}

	async function handle(request: Request) {
		const id = request.id ?? "";
		try {
			switch (request.type) {
				case "auth_status":
					return write({ type: "response", id, ok: true, data: await status() });
				case "login":
					return write({ type: "response", id, ...(await login(id, String(request.providerId), request.method === "api_key" ? "api_key" : "oauth")) });
				case "cancel_login":
					logins.get(String(request.loginId))?.abort();
					return write({ type: "response", id, ok: true });
				case "prompt_response": {
					const pending = prompts.get(String(request.promptId));
					prompts.delete(String(request.promptId));
					if (request.cancelled) pending?.reject(new CancelledError("cancelled"));
					else pending?.resolve(String(request.value ?? ""));
					return write({ type: "response", id, ok: true });
				}
				case "logout": {
					const runtime = await createModelRuntime(authPath);
					await runtime.logout(String(request.providerId));
					await maybeSetRecommendedDefaultModel(settingsPath, authPath);
					return write({ type: "response", id, ok: true });
				}
				case "set_default":
					await setDefaultModelSpec(settingsPath, authPath, String(request.spec));
					return write({ type: "response", id, ok: true });
				case "sessions":
					return write({ type: "response", id, ok: true, data: await sessions(String(request.cwd)) });
				default:
					return write({ type: "response", id, ok: false, error: `Unknown request: ${request.type}` });
			}
		} catch (error) {
			write({ type: "response", id, ok: false, error: error instanceof Error ? error.message : String(error) });
		}
	}

	write({ type: "ready" });
	const lines = createInterface({ input: process.stdin });
	for await (const line of lines) {
		if (!line.trim()) continue;
		let request: Request;
		try {
			request = JSON.parse(line);
		} catch {
			continue;
		}
		// logins are long-running and wait on prompt responses: never block the read loop
		void handle(request);
	}
}
