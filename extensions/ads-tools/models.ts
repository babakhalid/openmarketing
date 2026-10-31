// Cross-model tools: the lead model knows which other models are connected and can call them.
// - a "model-roster" system prompt section lists the connected providers/models every turn
// - ask_model consults another connected model (second opinion, critique, translation)
// - image_generate runs OpenAI's built-in image_generation tool through the ChatGPT/Codex
//   account (OAuth) or an OpenAI API key, and saves the result with a provenance sidecar
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname, isAbsolute, resolve } from "node:path";

import type { ExtensionAPI, ModelRegistry } from "@earendil-works/pi-coding-agent";
import { Type } from "@sinclair/typebox";

type Registry = ModelRegistry;
type ChatModel = ReturnType<Registry["getAvailable"]>[number];

const CODEX_URL = "https://chatgpt.com/backend-api/codex/responses";
const OPENAI_URL = "https://api.openai.com/v1/responses";
const IMAGE_TIMEOUT_MS = 300_000;

const ALIASES: Record<string, string[]> = {
	codex: ["openai-codex"],
	gpt: ["openai-codex", "openai"],
	openai: ["openai", "openai-codex"],
	claude: ["anthropic"],
	anthropic: ["anthropic"],
	gemini: ["google", "google-vertex"],
	google: ["google", "google-vertex"],
};

const abs = (p: string, cwd: string) => (isAbsolute(p) ? p : resolve(cwd, p));
const slug = (text: string) =>
	text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.split("-")
		.slice(0, 5)
		.join("-") || "image";

// newest first: higher version number, then flagship tiers before small ones
function rank(model: ChatModel): number {
	// "opus-5-5" and "gpt-6.1" both carry a minor version; date suffixes (-20250514) do not
	const match = model.id.match(/(\d+)(?:[.-](\d{1,2}))?(?!\d)/);
	const version = match ? Number(`${match[1]}.${match[2] ?? 0}`) : 0;
	const tier = /opus|sol|pro/.test(model.id) ? 0.03 : /sonnet|terra/.test(model.id) ? 0.02 : /astra/.test(model.id) ? 0.01 : 0;
	const niche = /preview|research|gemma|embed|image|tts|audio|live/.test(model.id) ? 100 : 0;
	return version + tier - niche;
}

function bestOf(models: ChatModel[]): ChatModel | undefined {
	return [...models].sort((a, b) => rank(b) - rank(a))[0];
}

export function resolveModel(registry: Registry, spec: string): ChatModel | undefined {
	const available = registry.getAvailable();
	const key = spec.trim().toLowerCase();
	if (key.includes("/")) {
		const [provider, ...rest] = spec.split("/");
		return registry.find(provider, rest.join("/"));
	}
	const exact = available.find((m) => m.id.toLowerCase() === key);
	if (exact) return exact;
	for (const provider of ALIASES[key] ?? []) {
		const hit = bestOf(available.filter((m) => m.provider === provider));
		if (hit) return hit;
	}
	return bestOf(available.filter((m) => m.id.toLowerCase().includes(key)));
}

function roster(registry: Registry, current?: ChatModel): string {
	const byProvider = new Map<string, ChatModel[]>();
	for (const model of registry.getAvailable()) byProvider.set(model.provider, [...(byProvider.get(model.provider) ?? []), model]);
	if (!byProvider.size) return "";
	const lines = [...byProvider].map(([provider, models]) => {
		const ids = [...models].sort((a, b) => rank(b) - rank(a)).map((m) => m.id);
		return `- ${registry.getProviderDisplayName(provider)} (\`${provider}\`): ${ids.slice(0, 6).join(", ")}${ids.length > 6 ? `, +${ids.length - 6} more` : ""}`;
	});
	const images = imageBackends(registry);
	return [
		`You are ${current ? `\`${current.provider}/${current.id}\`` : "the lead model"}. Other models connected on this machine:`,
		...lines,
		"",
		"- `ask_model` consults another connected model (second opinion, adversarial critique, copy in another voice, image critique). Pass `provider/id` or an alias: codex, gpt, claude, gemini.",
		images.length
			? `- \`image_generate\` creates images with OpenAI's built-in GPT image generation via ${images.map((b) => (b === "openai-codex" ? "the ChatGPT/Codex account" : "the OpenAI API key")).join(" or ")}. The image comes back to you so you can review it; iterate by passing the previous file as a reference.`
			: "- `image_generate` needs an OpenAI Codex (ChatGPT) account or an OpenAI API key; none is connected. Tell the user to connect one if they want GPT image generation.",
	].join("\n");
}

function imageBackends(registry: Registry): ("openai-codex" | "openai")[] {
	const backends: ("openai-codex" | "openai")[] = [];
	if (registry.getProviderAuthStatus("openai-codex").configured) backends.push("openai-codex");
	if (registry.getProviderAuthStatus("openai").configured) backends.push("openai");
	return backends;
}

function accountIdFromToken(token: string): string {
	const payload = JSON.parse(Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8"));
	const id = payload?.["https://api.openai.com/auth"]?.chatgpt_account_id;
	if (!id) throw new Error("The Codex token has no ChatGPT account id. Sign in to OpenAI Codex again.");
	return id;
}

const MIME: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif" };

function readImage(path: string): { data: string; mimeType: string } {
	const mimeType = MIME[extname(path).toLowerCase()];
	if (!mimeType) throw new Error(`Unsupported image type: ${path}`);
	return { data: readFileSync(path).toString("base64"), mimeType };
}

type ImageCall = { result: string; revised_prompt?: string; size?: string; quality?: string; output_format?: string; background?: string };

async function requestImage(options: {
	backend: "openai-codex" | "openai";
	token: string;
	hostModel: string;
	prompt: string;
	references: { data: string; mimeType: string }[];
	tool: Record<string, unknown>;
	signal?: AbortSignal;
	onEvent: (type: string) => void;
}): Promise<ImageCall> {
	const { backend, token, hostModel, prompt, references, tool, signal, onEvent } = options;
	const headers: Record<string, string> = { Authorization: `Bearer ${token}`, "content-type": "application/json", accept: "text/event-stream" };
	if (backend === "openai-codex") {
		headers["chatgpt-account-id"] = accountIdFromToken(token);
		headers["OpenAI-Beta"] = "responses=experimental";
		headers.originator = "pi";
	}
	const body = {
		model: hostModel,
		instructions: "Generate exactly one image with the image_generation tool, following the user's brief faithfully. Do not ask questions.",
		input: [
			{
				role: "user",
				content: [{ type: "input_text", text: prompt }, ...references.map((r) => ({ type: "input_image", image_url: `data:${r.mimeType};base64,${r.data}` }))],
			},
		],
		tools: [{ type: "image_generation", ...tool }],
		tool_choice: { type: "image_generation" },
		stream: true,
		store: false,
	};
	const timeout = AbortSignal.timeout(IMAGE_TIMEOUT_MS);
	const response = await fetch(backend === "openai-codex" ? CODEX_URL : OPENAI_URL, {
		method: "POST",
		headers,
		body: JSON.stringify(body),
		signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
	});
	if (!response.ok || !response.body) {
		const detail = (await response.text().catch(() => "")).slice(0, 600);
		throw new Error(`${backend} returned ${response.status}: ${detail || response.statusText}`);
	}
	const decoder = new TextDecoder();
	let buffer = "";
	let image: ImageCall | undefined;
	let failure: string | undefined;
	for await (const chunk of response.body as unknown as AsyncIterable<Uint8Array>) {
		buffer += decoder.decode(chunk, { stream: true });
		let newline = buffer.indexOf("\n");
		while (newline >= 0) {
			const line = buffer.slice(0, newline).trim();
			buffer = buffer.slice(newline + 1);
			newline = buffer.indexOf("\n");
			if (!line.startsWith("data:")) continue;
			let event: any;
			try {
				event = JSON.parse(line.slice(5).trim());
			} catch {
				continue;
			}
			onEvent(event.type);
			if (event.type === "response.output_item.done" && event.item?.type === "image_generation_call" && event.item.result) image = event.item;
			if (event.type === "response.failed" || event.type === "error") failure = JSON.stringify(event.response?.error ?? event.error ?? event).slice(0, 600);
		}
	}
	if (image) return image;
	throw new Error(failure ? `Image generation failed: ${failure}` : "The model finished without returning an image.");
}

export function registerModelTools(pi: ExtensionAPI): void {
	pi.on("before_agent_start", (event, ctx) => {
		const section = roster(ctx.modelRegistry, ctx.model);
		if (section) event.systemPromptOptions.sections["model-roster"] = section;
		else delete event.systemPromptOptions.sections["model-roster"];
	});

	pi.registerTool({
		name: "ask_model",
		label: "Ask Model",
		description:
			"Consult another connected model (e.g. GPT via the Codex account, Claude, Gemini) and return its answer. Use for second opinions, adversarial critique, alternative copy, or reviewing images with a different model. The other model sees only what you pass here.",
		promptSnippet: "Consult another connected model by provider/id or alias (codex, gpt, claude, gemini).",
		parameters: Type.Object({
			model: Type.String({ description: "provider/id (e.g. openai-codex/gpt-6.1-sol) or an alias: codex, gpt, claude, gemini." }),
			prompt: Type.String({ description: "Self-contained question or task for the other model, including all needed context." }),
			system: Type.Optional(Type.String({ description: "Optional system prompt for the other model." })),
			images: Type.Optional(Type.Array(Type.String(), { description: "Image file paths (workspace-relative or absolute) to show the other model." })),
		}),
		async execute(_id, params, signal, _onUpdate, ctx) {
			const model = resolveModel(ctx.modelRegistry, params.model);
			if (!model) {
				const ids = ctx.modelRegistry.getAvailable().map((m) => `${m.provider}/${m.id}`);
				throw new Error(`No connected model matches "${params.model}". Available: ${ids.slice(0, 20).join(", ")}`);
			}
			const images = (params.images ?? []).map((p) => ({ type: "image" as const, ...readImage(abs(p, ctx.cwd)) }));
			const reply = await ctx.modelRegistry.complete(
				model,
				{
					systemPrompt: params.system,
					messages: [{ role: "user", content: [{ type: "text", text: params.prompt }, ...images], timestamp: Date.now() }],
				},
				{ signal },
			);
			if (reply.stopReason === "error") throw new Error(reply.errorMessage ?? `${model.provider}/${model.id} failed`);
			const text = reply.content
				.filter((block) => block.type === "text")
				.map((block) => block.text)
				.join("\n")
				.trim();
			return {
				content: [{ type: "text", text: `[${model.provider}/${model.id}]\n${text || "(empty reply)"}` }],
				details: { provider: model.provider, model: model.id, usage: reply.usage, stopReason: reply.stopReason },
			};
		},
	});

	pi.registerTool({
		name: "image_generate",
		label: "Generate Image",
		description:
			"Generate or edit an image with OpenAI's built-in GPT image generation, run through the connected ChatGPT/Codex account (or an OpenAI API key). Pass reference images to edit or keep a product/brand consistent. Saves a PNG plus a provenance sidecar JSON and shows you the result.",
		promptSnippet: "Generate/edit images with GPT image generation via the Codex (ChatGPT) account.",
		promptGuidelines: [
			"Write image_generate prompts as a full art-direction brief: subject, composition, framing, lighting, palette, typography (exact text in quotes), and style references.",
			"Review each returned image before using it; iterate by passing the previous output as a reference with a precise change request.",
		],
		parameters: Type.Object({
			prompt: Type.String({ description: "Full art-direction brief for the image." }),
			size: Type.Optional(Type.String({ description: "1024x1024 (square), 1024x1536 (portrait 2:3), 1536x1024 (landscape 3:2), or auto. Default auto." })),
			quality: Type.Optional(Type.String({ description: "low | medium | high | auto. Default high." })),
			background: Type.Optional(Type.String({ description: "transparent | opaque | auto. Default auto." })),
			references: Type.Optional(Type.Array(Type.String(), { description: "Reference image paths to edit or match (product shots, brand marks, previous outputs)." })),
			slug: Type.Optional(Type.String({ description: "Campaign slug; output goes to outputs/creatives/<slug>/. Defaults to a slug of the prompt." })),
			variantId: Type.Optional(Type.String({ description: "File name without extension, e.g. v1-hero. Defaults to a timestamp." })),
			output: Type.Optional(Type.String({ description: "Explicit output .png path; overrides slug/variantId." })),
			backend: Type.Optional(Type.String({ description: "openai-codex (ChatGPT account) or openai (API key). Default: whichever is connected, Codex first." })),
			hostModel: Type.Optional(Type.String({ description: "OpenAI chat model that drives the image tool. Default: newest connected." })),
		}),
		async execute(_id, params, signal, onUpdate, ctx) {
			const registry = ctx.modelRegistry;
			const available = imageBackends(registry);
			const order = params.backend ? available.filter((b) => b === params.backend) : available;
			if (!order.length) {
				throw new Error(
					params.backend
						? `${params.backend} is not connected. Connected image backends: ${available.join(", ") || "none"}.`
						: "GPT image generation needs an OpenAI Codex (ChatGPT) account or an OpenAI API key. Ask the user to connect one (desktop: Settings → Accounts; CLI: /login).",
				);
			}
			const references = (params.references ?? []).map((p) => readImage(abs(p, ctx.cwd)));
			const tool: Record<string, unknown> = { output_format: "png", quality: params.quality ?? "high", size: params.size ?? "auto" };
			if (params.background) tool.background = params.background;

			const errors: string[] = [];
			for (const backend of order) {
				const host =
					params.hostModel ?? bestOf(registry.getAvailable().filter((m) => m.provider === backend))?.id ?? (backend === "openai" ? "gpt-5" : "gpt-6.1-sol");
				try {
					const token = await registry.getApiKeyForProvider(backend);
					if (!token) throw new Error(`no credential for ${backend}`);
					const started = Date.now();
					let last = "";
					const image = await requestImage({
						backend,
						token,
						hostModel: host,
						prompt: params.prompt,
						references,
						tool,
						signal,
						onEvent: (type) => {
							const stage = type.includes("image_generation_call") ? type.split(".").pop()! : "";
							if (stage && stage !== last) {
								last = stage;
								onUpdate?.({ content: [{ type: "text", text: `GPT image (${backend}/${host}): ${stage.replace(/_/g, " ")}…` }], details: { backend, hostModel: host, stage } });
							}
						},
					});
					const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "-");
					const output = params.output
						? abs(params.output, ctx.cwd)
						: resolve(ctx.cwd, "outputs", "creatives", params.slug ? slug(params.slug) : slug(params.prompt), `${params.variantId ?? stamp}.png`);
					mkdirSync(dirname(output), { recursive: true });
					writeFileSync(output, Buffer.from(image.result, "base64"));
					const sidecar = output.replace(/\.[^.]+$/, ".json");
					const details = {
						path: output,
						sidecar,
						backend,
						hostModel: host,
						tool: "openai/image_generation",
						prompt: params.prompt,
						revisedPrompt: image.revised_prompt,
						size: image.size ?? tool.size,
						quality: image.quality ?? tool.quality,
						background: image.background ?? params.background,
						references: (params.references ?? []).map((p) => abs(p, ctx.cwd)),
						durationMs: Date.now() - started,
						createdAt: new Date().toISOString(),
					};
					writeFileSync(sidecar, `${JSON.stringify(details, null, 2)}\n`);
					return {
						content: [
							{
								type: "text",
								text: `Saved ${output}\nBackend: ${backend} (${host}) · ${details.size} · ${details.quality}${image.revised_prompt ? `\nRevised prompt: ${image.revised_prompt}` : ""}${errors.length ? `\nFell back after: ${errors.join("; ")}` : ""}`,
							},
							{ type: "image", data: image.result, mimeType: "image/png" },
						],
						details,
					};
				} catch (error) {
					if (signal?.aborted) throw error;
					const message = error instanceof Error ? error.message : String(error);
					const relogin = /refresh|expired|401|403/i.test(message) ? ` — sign in to ${backend === "openai-codex" ? "OpenAI Codex (ChatGPT)" : "OpenAI"} again` : "";
					errors.push(`${backend}: ${message}${relogin}`);
				}
			}
			throw new Error(`GPT image generation failed. ${errors.join(" | ")}`);
		},
	});
}
