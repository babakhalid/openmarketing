import { AlertTriangle, Info, Sparkle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Item, UiRequest } from "../lib/types";
import { timecode } from "../lib/util";
import { ToolCard } from "./cards/ToolCard";
import { ProblemCard } from "./ProblemCard";
import { DecisionCard } from "./DecisionCard";
import { ErrorBoundary } from "./ErrorBoundary";
import type { FixAction } from "../lib/errors";

function Thinking({ item }: { item: Extract<Item, { kind: "thinking" }> }) {
	const [open, setOpen] = useState(false);
	const seconds = item.endedAt && item.startedAt ? timecode(item.endedAt - item.startedAt) : undefined;
	return (
		<div className={`thinking ${item.streaming ? "live" : ""}`}>
			<button onClick={() => setOpen(!open)}>
				<Sparkle size={12} />
				<span>{item.streaming ? "Thinking" : "Thought"}</span>
				{seconds ? <span className="mono dim">{seconds}</span> : null}
			</button>
			{open || item.streaming ? <div className="thinking-text">{item.text || "…"}</div> : null}
		</div>
	);
}

type ToolItem = Extract<Item, { kind: "tool" }>;

// Consecutive tool calls read as one block of work: a header with the step count and the
// span of time it took, then each step as a quiet row.
function WorkBlock({ tools, cwd, onOpen }: { tools: ToolItem[]; cwd: string; onOpen: (path: string) => void }) {
	const running = tools.some((t) => t.status === "running" || t.status === "preparing");
	const failed = tools.filter((t) => t.status === "error").length;
	const start = Math.min(...tools.map((t) => t.startedAt || Infinity));
	const end = Math.max(...tools.map((t) => t.endedAt ?? (running ? Date.now() : t.startedAt)));
	const span = Number.isFinite(start) && end > start ? timecode(end - start) : undefined;
	return (
		<section className={`work ${running ? "live" : ""}`}>
			<header className="work-head">
				<span className="work-label">{running ? "Working" : "Work"}</span>
				<span className="work-count">
					{tools.length} step{tools.length === 1 ? "" : "s"}
					{failed ? ` · ${failed} failed` : ""}
				</span>
				<span className="spacer" />
				{span ? <span className="work-span">{span}</span> : null}
			</header>
			<div className="work-steps">
				{tools.map((tool, i) => (
					<div key={tool.id} className="work-step" style={{ "--i": i } as React.CSSProperties}>
						<ToolCard tool={tool} cwd={cwd} onOpen={onOpen} />
					</div>
				))}
			</div>
		</section>
	);
}

type Block = { kind: "tools"; id: string; tools: ToolItem[] } | { kind: "item"; item: Item };

function toBlocks(items: Item[]): Block[] {
	const blocks: Block[] = [];
	for (const item of items) {
		const last = blocks[blocks.length - 1];
		if (item.kind === "tool" && item.name === "ask_user") {
			blocks.push({ kind: "item", item });
		} else if (item.kind === "tool") {
			if (last?.kind === "tools") last.tools.push(item);
			else blocks.push({ kind: "tools", id: `w-${item.id}`, tools: [item] });
		} else {
			blocks.push({ kind: "item", item });
		}
	}
	return blocks;
}

type ProblemItem = Extract<Item, { kind: "problem" }>;

export function ChatLog({
	items,
	cwd,
	busy,
	onOpen,
	alternative,
	onFix,
	requests,
	onRespond,
	onSend,
}: {
	items: Item[];
	cwd: string;
	busy: boolean;
	onOpen: (path: string) => void;
	alternative?: string;
	onFix: (item: ProblemItem, action: FixAction) => Promise<void>;
	requests: UiRequest[];
	onRespond: (response: Record<string, unknown>) => void;
	onSend: (text: string) => void;
}) {
	const end = useRef<HTMLDivElement>(null);
	const scroller = useRef<HTMLDivElement>(null);
	const pinned = useRef(true);

	useEffect(() => {
		if (pinned.current) end.current?.scrollIntoView({ block: "end" });
	}, [items]);

	return (
		<div
			className="log"
			ref={scroller}
			onScroll={(e) => {
				const el = e.currentTarget;
				pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
			}}
		>
			<div className="log-inner">
				{toBlocks(items).map((block) => {
					if (block.kind === "tools")
						return (
							<ErrorBoundary key={block.id} label="tool activity">
								<WorkBlock tools={block.tools} cwd={cwd} onOpen={onOpen} />
							</ErrorBoundary>
						);
					const item = block.item;
					switch (item.kind) {
						case "user":
							return (
								<div key={item.id} className={`turn-user ${item.queued ? "queued" : ""}`}>
									<div className="bubble">{item.text}</div>
									{item.queued ? <span className="queued-note">Queued · reaches the agent after the current step</span> : null}
								</div>
							);
						case "text":
							return (
								<div key={item.id} className={`assistant-text ${item.streaming ? "streaming" : ""}`}>
									<ReactMarkdown remarkPlugins={[remarkGfm]}>{item.text}</ReactMarkdown>
								</div>
							);
						case "thinking":
							return <Thinking key={item.id} item={item} />;
						case "tool":
							return (
								<ErrorBoundary key={item.id} label="decision card">
									<DecisionCard tool={item} cwd={cwd} requests={requests} onRespond={onRespond} onOpen={onOpen} onSend={onSend} />
								</ErrorBoundary>
							);
						case "problem":
							return <ProblemCard key={item.id} item={item} alternative={alternative} onFix={onFix} />;
						case "notice":
							return (
								<div key={item.id} className={`notice ${item.level}`}>
									{item.level === "info" ? <Info size={13} /> : <AlertTriangle size={13} />}
									{item.text}
								</div>
							);
						default:
							return null;
					}
				})}
				{busy && items[items.length - 1]?.kind !== "tool" && !(items[items.length - 1] as any)?.streaming ? (
					<div className="working">
						<span className="pulse-dot" />
						<span className="shimmer-text">Thinking</span>
					</div>
				) : null}
				<div ref={end} />
			</div>
		</div>
	);
}
