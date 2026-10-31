// Turns a raw provider/runtime error into something a person can act on: what happened, in plain
// words, and which fixes make sense. The chat log renders this as a guided card, not a stack trace.

export type ProblemKind = "auth" | "rate_limit" | "overloaded" | "network" | "context" | "billing" | "unknown";
export type FixAction = "login" | "switch" | "retry" | "new_chat";

export type Problem = {
	kind: ProblemKind;
	provider?: string;
	model?: string;
	title: string;
	body: string;
	fixes: FixAction[];
	raw: string;
};

const NAMES: Record<string, string> = {
	"openai-codex": "OpenAI Codex (ChatGPT)",
	openai: "OpenAI",
	anthropic: "Anthropic",
	google: "Google Gemini",
	"github-copilot": "GitHub Copilot",
	openrouter: "OpenRouter",
};

export const providerName = (id?: string) => (id ? (NAMES[id] ?? id) : "the model provider");

export function classifyError(raw: string, provider?: string, model?: string): Problem {
	const text = raw.toLowerCase();
	const authFor = raw.match(/OAuth refresh failed for ([\w-]+)/)?.[1];
	const who = authFor ?? provider;
	const name = providerName(who);
	const base = { provider: who, model, raw };

	if (authFor || /refresh_token|session has expired|log in again|unauthori[sz]ed|invalid api key|invalid x-api-key|\b401\b|no api key|not authenticated/.test(text)) {
		return {
			...base,
			kind: "auth",
			title: `Your ${name} sign-in has expired`,
			body: `I couldn't reach ${model ?? "the model"} because ${name} logged this machine out. This happens every so often with account sign-ins. Sign in again and I'll pick your request back up, or switch to another connected model and keep going now.`,
			fixes: ["login", "switch", "retry"],
		};
	}
	if (/insufficient_quota|billing|credit balance|payment required|\b402\b|usage limit|plan limit/.test(text)) {
		return {
			...base,
			kind: "billing",
			title: `${name} says the account is out of quota`,
			body: `Your ${name} plan or credits ran out for now. Top it up on their side, or switch to another connected model and I'll carry on there.`,
			fixes: ["switch", "login", "retry"],
		};
	}
	if (/rate.?limit|too many requests|\b429\b/.test(text)) {
		return {
			...base,
			kind: "rate_limit",
			title: `${name} is rate-limiting us`,
			body: `Too many requests in a short window. Waiting a minute and retrying usually works; switching models works right away.`,
			fixes: ["retry", "switch"],
		};
	}
	if (/overloaded|\b529\b|\b503\b|\b502\b|server error|\b500\b|unavailable/.test(text)) {
		return {
			...base,
			kind: "overloaded",
			title: `${name} is having a moment`,
			body: `Their servers are busy or briefly down. It's not something on your side. Retry in a bit, or switch to another model to keep moving.`,
			fixes: ["retry", "switch"],
		};
	}
	if (/context.?(length|window)|too many tokens|prompt is too long|maximum context/.test(text)) {
		return {
			...base,
			kind: "context",
			title: "This conversation got too long for the model",
			body: "The chat no longer fits in the model's memory. Start a new chat for the next step; your files and outputs stay where they are.",
			fixes: ["new_chat", "switch"],
		};
	}
	if (/fetch failed|network|econn|enotfound|etimedout|socket|timed out|timeout/.test(text)) {
		return {
			...base,
			kind: "network",
			title: `I couldn't reach ${name}`,
			body: "The connection dropped or timed out. Check your internet connection and retry.",
			fixes: ["retry", "switch"],
		};
	}
	return {
		...base,
		kind: "unknown",
		title: "Something went wrong on that turn",
		body: `${model ?? "The model"} stopped with an error before it could answer. Retrying often clears it; if it keeps happening, switch models and share the details below.`,
		fixes: ["retry", "switch"],
	};
}
