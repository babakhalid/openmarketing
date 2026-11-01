import { classifyError } from "./errors";
import type { Item, Session, ToolResult, UiRequest } from "./types";

export function emptySession(cwd: string): Session {
	return { cwd, connected: false, connecting: false, busy: false, items: [], models: [], commands: [], cost: 0, contextTokens: 0, statuses: {}, uiRequests: [] };
}

const textOf = (content: unknown): string => {
	if (typeof content === "string") return content;
	if (!Array.isArray(content)) return "";
	return content
		.filter((block: any) => block?.type === "text")
		.map((block: any) => block.text)
		.join("");
};

// A failed assistant turn has no content, only an errorMessage; it becomes a guided problem card.
const problemItem = (id: string, message: any): Item => ({ kind: "problem", id, problem: classifyError(message.errorMessage, message.provider, message.model) });

// Rebuild the chat log from persisted session messages (get_messages). While the agent is still
// running (a window reload mid-turn), a tool call without a result is still in progress.
export function itemsFromHistory(messages: any[], live = false): Item[] {
	const items: Item[] = [];
	const tools = new Map<string, Extract<Item, { kind: "tool" }>>();
	messages.forEach((message, m) => {
		if (message.role === "user") {
			const text = textOf(message.content);
			if (text.trim()) items.push({ kind: "user", id: `h${m}`, text });
		} else if (message.role === "assistant") {
			(message.content ?? []).forEach((block: any, b: number) => {
				const id = `h${m}:${b}`;
				if (block.type === "text" && block.text?.trim()) items.push({ kind: "text", id, text: block.text, streaming: false });
				else if (block.type === "thinking" && block.thinking?.trim()) items.push({ kind: "thinking", id, text: block.thinking, streaming: false, startedAt: 0, endedAt: 0 });
				else if (block.type === "toolCall") {
					const tool: Extract<Item, { kind: "tool" }> = { kind: "tool", id: block.id, name: block.name, args: block.arguments ?? {}, status: live ? "running" : "done", startedAt: live ? Date.now() : 0, endedAt: live ? undefined : 0 };
					tools.set(block.id, tool);
					items.push(tool);
				}
			});
			if (message.stopReason === "error" && message.errorMessage) items.push(problemItem(`h${m}:error`, message));
		} else if (message.role === "toolResult") {
			const tool = tools.get(message.toolCallId);
			if (tool) {
				tool.result = { content: message.content, details: message.details };
				tool.status = message.isError ? "error" : "done";
			}
		}
	});
	return items;
}

type Draft = Session & { _msg?: number; _seq?: number };

function upsert(items: Item[], item: Item): Item[] {
	const index = items.findIndex((existing) => existing.id === item.id);
	if (index === -1) return [...items, item];
	const next = items.slice();
	next[index] = item;
	return next;
}

function patchTool(items: Item[], id: string, patch: (tool: Extract<Item, { kind: "tool" }>) => Extract<Item, { kind: "tool" }>, create?: () => Extract<Item, { kind: "tool" }>): Item[] {
	const index = items.findIndex((item) => item.kind === "tool" && item.id === id);
	if (index === -1) return create ? [...items, patch(create())] : items;
	const next = items.slice();
	next[index] = patch(next[index] as Extract<Item, { kind: "tool" }>);
	return next;
}

// Fold one RPC event into the session. Pure, so live events and fixture replays share it.
export function reduceEvent(session: Draft, event: any, now = Date.now()): Draft {
	switch (event.type) {
		case "agent_start":
			return { ...session, busy: true, runStartedAt: now };
		case "agent_end":
		case "agent_settled":
			return {
				...session,
				busy: false,
				items: session.items.map((item) =>
					item.kind === "tool" && (item.status === "running" || item.status === "preparing")
						? { ...item, status: "done", endedAt: item.endedAt ?? now }
						: item.kind !== "tool" && "streaming" in item && item.streaming
							? { ...item, streaming: false }
							: item.kind === "user" && item.queued && event.type === "agent_settled"
								? { ...item, queued: false }
								: item,
				),
			};
		// A steered message stays marked as queued until Pi takes it off the queue and hands it to the model.
		case "queue_update": {
			const waiting = [...(event.steering ?? []), ...(event.followUp ?? [])];
			return { ...session, items: session.items.map((item) => (item.kind === "user" && item.queued && !waiting.includes(item.text) ? { ...item, queued: false } : item)) };
		}
		case "message_start": {
			if (event.message?.role !== "assistant") return session;
			return { ...session, _msg: (session._msg ?? 0) + 1 };
		}
		case "message_update": {
			const e = event.assistantMessageEvent ?? {};
			const key = `m${session._msg ?? 0}:${e.contentIndex ?? 0}`;
			const items = session.items;
			if (e.type === "text_start") return { ...session, items: upsert(items, { kind: "text", id: key, text: "", streaming: true }) };
			if (e.type === "text_delta") {
				const current = items.find((item) => item.id === key);
				const text = (current && current.kind === "text" ? current.text : "") + (e.delta ?? "");
				return { ...session, items: upsert(items, { kind: "text", id: key, text, streaming: true }) };
			}
			if (e.type === "text_end") return { ...session, items: upsert(items, { kind: "text", id: key, text: e.content ?? "", streaming: false }) };
			if (e.type === "thinking_start") return { ...session, items: upsert(items, { kind: "thinking", id: key, text: "", streaming: true, startedAt: now }) };
			if (e.type === "thinking_delta" || e.type === "thinking_end") {
				const current = items.find((item) => item.id === key);
				const prev = current && current.kind === "thinking" ? current : { kind: "thinking" as const, id: key, text: "", streaming: true, startedAt: now };
				const text = e.type === "thinking_end" ? (e.content ?? prev.text) : prev.text + (e.delta ?? "");
				return { ...session, items: upsert(items, { ...prev, text, streaming: e.type !== "thinking_end", endedAt: e.type === "thinking_end" ? now : undefined }) };
			}
			if (e.type === "toolcall_start") {
				return { ...session, items: patchTool(items, e.id, (t) => t, () => ({ kind: "tool", id: e.id, name: e.toolName, args: {}, status: "preparing", startedAt: now })) };
			}
			if (e.type === "toolcall_end" && e.toolCall) {
				return { ...session, items: patchTool(items, e.toolCall.id, (t) => ({ ...t, args: e.toolCall.arguments ?? t.args })) };
			}
			return session;
		}
		case "message_end": {
			const message = event.message?.role === "assistant" ? event.message : undefined;
			if (!message) return session;
			const usage = message.usage;
			const next = usage ? { ...session, cost: session.cost + (usage.cost?.total ?? 0), contextTokens: usage.totalTokens || session.contextTokens } : session;
			if (message.stopReason !== "error" || !message.errorMessage) return next;
			const seq = (next._seq ?? 0) + 1;
			return { ...next, _seq: seq, items: [...next.items, problemItem(`n${seq}`, message)] };
		}
		case "tool_execution_start":
			return {
				...session,
				items: patchTool(session.items, event.toolCallId, (t) => ({ ...t, name: event.toolName, args: event.args ?? t.args, status: "running", startedAt: now }), () => ({ kind: "tool", id: event.toolCallId, name: event.toolName, args: event.args ?? {}, status: "running", startedAt: now })),
			};
		case "tool_execution_update":
			return { ...session, items: patchTool(session.items, event.toolCallId, (t) => ({ ...t, partial: event.partialResult as ToolResult })) };
		case "tool_execution_end":
			return { ...session, items: patchTool(session.items, event.toolCallId, (t) => ({ ...t, result: event.result as ToolResult, status: event.isError ? "error" : "done", endedAt: now })) };
		case "extension_ui_request": {
			if (event.method === "setStatus") {
				const statuses = { ...session.statuses };
				if (event.statusText) statuses[event.statusKey] = event.statusText;
				else delete statuses[event.statusKey];
				return { ...session, statuses };
			}
			if (event.method === "notify") {
				const seq = (session._seq ?? 0) + 1;
				return { ...session, _seq: seq, items: [...session.items, { kind: "notice", id: `n${seq}`, level: event.notifyType ?? "info", text: event.message }] };
			}
			if (["select", "confirm", "input", "editor"].includes(event.method)) {
				return { ...session, uiRequests: [...session.uiRequests, event as UiRequest] };
			}
			return session;
		}
		case "auto_retry_start": {
			const seq = (session._seq ?? 0) + 1;
			return { ...session, _seq: seq, items: [...session.items, { kind: "notice", id: `n${seq}`, level: "warning", text: `Retrying (${event.attempt ?? ""}) — ${event.errorMessage ?? "transient error"}` }] };
		}
		case "compaction_start": {
			const seq = (session._seq ?? 0) + 1;
			return { ...session, _seq: seq, items: [...session.items, { kind: "notice", id: `n${seq}`, level: "info", text: "Compacting context…" }] };
		}
		default:
			return session;
	}
}

export const shortModel = (id?: string) =>
	(id ?? "")
		.replace(/^claude-/, "")
		.replace(/-(\d+)-(\d+)$/, " $1.$2")
		.replace(/-(\d+)$/, " $1")
		.replace(/^\w/, (c) => c.toUpperCase());
