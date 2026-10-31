import { ImagePlus, MessagesSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Item } from "../../lib/types";
import { mediaUrl, rel, resultText } from "../../lib/util";
import { CardShell, Mono } from "./CardShell";

type Tool = Extract<Item, { kind: "tool" }>;
type Props = { tool: Tool; cwd: string; onOpen: (path: string) => void };
const shell = (tool: Tool) => ({ status: tool.status, startedAt: tool.startedAt, endedAt: tool.endedAt });

const BACKEND: Record<string, string> = { "openai-codex": "ChatGPT", openai: "OpenAI API" };

// image_generate: GPT image generation driven through the Codex account. The result image is
// the hero; while it runs, a frame at the requested aspect breathes with the current stage.
export function ImageGenCard({ tool, cwd, onOpen }: Props) {
	const a = tool.args ?? {};
	const d = tool.result?.details ?? {};
	const live = tool.partial?.details ?? {};
	const inline = tool.result?.content?.find((block) => block.type === "image") as { data?: string; mimeType?: string } | undefined;
	const src = d.path ? mediaUrl(d.path) : inline?.data ? `data:${inline.mimeType};base64,${inline.data}` : undefined;
	const size: string = d.size ?? a.size ?? "auto";
	const [w, h] = /^\d+x\d+$/.test(size) ? size.split("x").map(Number) : [1, 1];
	const backend = d.backend ?? live.backend;
	const meta = [backend ? `GPT image · ${BACKEND[backend] ?? backend}` : "GPT image", size !== "auto" ? size : undefined, d.quality ?? a.quality].filter(Boolean).join(" · ");
	const refs: string[] = a.references ?? [];
	return (
		<CardShell
			family="gen"
			icon={<ImagePlus size={15} />}
			title={a.references?.length ? "Edit image" : "Generate image"}
			meta={meta}
			{...shell(tool)}
			footer={
				<div className="gen-image">
					{a.prompt ? <div className="quote prompt-quote">“{a.prompt}”</div> : null}
					{refs.length ? (
						<div className="gen-refs">
							{refs.map((r) => (
								<img key={r} src={mediaUrl(r.startsWith("/") ? r : `${cwd}/${r}`)} alt="" title={r} />
							))}
						</div>
					) : null}
					{src ? (
						<figure className="gen-frame done" style={{ aspectRatio: `${w} / ${h}` }} onClick={() => d.path && onOpen(d.path)}>
							<img src={src} alt={a.prompt ?? ""} />
						</figure>
					) : tool.status === "running" || tool.status === "preparing" ? (
						<figure className="gen-frame ghost" style={{ aspectRatio: `${w} / ${h}` }}>
							<span className="shimmer-text">{live.stage ? `${String(live.stage).replace(/_/g, " ")}…` : "Composing…"}</span>
						</figure>
					) : null}
					{d.path ? <div className="gen-path mono">{rel(d.path, cwd)}</div> : null}
				</div>
			}
		>
			{d.revisedPrompt ? <Mono>{`Revised prompt\n${d.revisedPrompt}`}</Mono> : null}
			{tool.status === "error" ? <Mono>{resultText(tool.result)}</Mono> : null}
		</CardShell>
	);
}

// ask_model: one model consulting another. Shows who was asked, the question, and the answer.
export function AskModelCard({ tool }: Props) {
	const a = tool.args ?? {};
	const d = tool.result?.details ?? {};
	const text = resultText(tool.result).replace(/^\[[^\]]+\]\n/, "");
	const who = d.model ? `${d.model}` : a.model;
	return (
		<CardShell
			family="agent"
			icon={<MessagesSquare size={15} />}
			title={`Ask ${who ?? "model"}`}
			meta={d.provider}
			{...shell(tool)}
			footer={
				<div className="ask-model">
					<div className="ask-q">{a.prompt}</div>
					{text && tool.status !== "error" ? (
						<div className="ask-a assistant-text">
							<ReactMarkdown remarkPlugins={[remarkGfm]}>{text.length > 1400 ? `${text.slice(0, 1400)}…` : text}</ReactMarkdown>
						</div>
					) : null}
				</div>
			}
		>
			{text.length > 1400 || tool.status === "error" ? <Mono>{resultText(tool.result)}</Mono> : null}
		</CardShell>
	);
}
