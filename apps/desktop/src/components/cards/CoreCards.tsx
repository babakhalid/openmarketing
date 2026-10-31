import { Bot, Code2, FileDiff, FilePen, FileText, Globe, Search, Sparkles, SquareTerminal } from "lucide-react";
import type { Item } from "../../lib/types";
import { rel, resultText } from "../../lib/util";
import { CardShell, Mono } from "./CardShell";

type Tool = Extract<Item, { kind: "tool" }>;
type Props = { tool: Tool; cwd: string; onOpen: (path: string) => void };
const shell = (tool: Tool) => ({ status: tool.status, startedAt: tool.startedAt, endedAt: tool.endedAt });

const clip = (text: string, lines = 40) => {
	const all = text.split("\n");
	return all.length > lines ? `${all.slice(0, lines).join("\n")}\n… ${all.length - lines} more lines` : text;
};

export function BashCard({ tool }: Props) {
	const output = resultText(tool.result ?? tool.partial);
	const lines = output ? output.split("\n").length : 0;
	return (
		<CardShell family="shell" icon={<SquareTerminal size={15} />} title={<span className="mono cmd">{tool.args?.command}</span>} {...shell(tool)}
			badge={lines ? <span className="chip">{lines} lines</span> : undefined}
			defaultOpen={tool.status === "error"}
		>
			<Mono className={`terminal ${tool.status === "error" ? "err" : ""}`}>
				<span className="prompt">$ </span>
				{tool.args?.command}
				{"\n"}
				{clip(output, 60)}
			</Mono>
		</CardShell>
	);
}

function DiffView({ oldText, newText }: { oldText: string; newText: string }) {
	return (
		<pre className="mono-block diff">
			{oldText.split("\n").map((line, i) => (
				<div key={`o${i}`} className="del">
					− {line}
				</div>
			))}
			{newText.split("\n").map((line, i) => (
				<div key={`n${i}`} className="add">
					+ {line}
				</div>
			))}
		</pre>
	);
}

export function FileCard({ tool, cwd, onOpen }: Props) {
	const path: string = tool.args?.path ?? tool.args?.file_path ?? "";
	const absolute = path.startsWith("/") ? path : `${cwd}/${path}`;
	const name = path.split("/").pop();
	const meta = <span className="mono link" onClick={(e) => (e.stopPropagation(), onOpen(absolute))}>{rel(absolute, cwd)}</span>;
	if (tool.name === "write") {
		const content: string = tool.args?.content ?? "";
		return (
			<CardShell family="file" icon={<FilePen size={15} />} title={`Write ${name}`} meta={meta} {...shell(tool)} badge={<span className="chip">{content.split("\n").length} lines</span>}>
				<Mono>{clip(content, 50)}</Mono>
			</CardShell>
		);
	}
	if (tool.name === "edit") {
		const edits: { oldText: string; newText: string }[] = tool.args?.edits ?? (tool.args?.oldText !== undefined ? [{ oldText: tool.args.oldText, newText: tool.args.newText }] : []);
		return (
			<CardShell family="file" icon={<FileDiff size={15} />} title={`Edit ${name}`} meta={meta} {...shell(tool)} badge={<span className="chip">{edits.length} change{edits.length === 1 ? "" : "s"}</span>} defaultOpen={edits.length === 1}>
				{edits.map((e, i) => (
					<DiffView key={i} oldText={e.oldText ?? ""} newText={e.newText ?? ""} />
				))}
				{tool.status === "error" ? <Mono className="err">{resultText(tool.result)}</Mono> : null}
			</CardShell>
		);
	}
	return (
		<CardShell family="file" icon={<FileText size={15} />} title={`Read ${name}`} meta={meta} {...shell(tool)}>
			<Mono>{clip(resultText(tool.result), 30)}</Mono>
		</CardShell>
	);
}

export function SearchCard({ tool, cwd }: Props) {
	const output = resultText(tool.result);
	const target = tool.args?.pattern ?? tool.args?.path ?? tool.args?.query ?? "";
	const count = output ? output.split("\n").filter(Boolean).length : 0;
	return (
		<CardShell family="file" icon={<Search size={15} />} title={tool.name} meta={<span className="mono">{rel(String(target), cwd)}</span>} {...shell(tool)} badge={count ? <span className="chip">{count}</span> : undefined}>
			<Mono>{clip(output, 40)}</Mono>
		</CardShell>
	);
}

export function SubagentCard({ tool }: Props) {
	const a = tool.args ?? {};
	const tasks: { agent: string; task: string }[] = a.tasks ?? a.chain ?? (a.agent ? [{ agent: a.agent, task: a.task }] : []);
	const mode = a.tasks ? "parallel" : a.chain ? "chain" : "single";
	const output = resultText(tool.result ?? tool.partial);
	return (
		<CardShell family="agent" icon={<Bot size={15} />} title={tasks.length === 1 ? tasks[0].agent : `${tasks.length} agents`} meta={mode} {...shell(tool)}
			footer={
				<div className="agents">
					{tasks.map((t, i) => (
						<div key={i} className="agent-row">
							<span className="agent-name">{t.agent}</span>
							<span className="agent-task">{t.task}</span>
						</div>
					))}
				</div>
			}
		>
			{output ? <Mono>{clip(output, 60)}</Mono> : null}
		</CardShell>
	);
}

export function WebCard({ tool }: Props) {
	const a = tool.args ?? {};
	const query = a.query ?? (Array.isArray(a.queries) ? a.queries.join(" · ") : undefined) ?? a.url ?? (Array.isArray(a.urls) ? a.urls.join(" · ") : "");
	const output = resultText(tool.result);
	const urls = [...new Set(output.match(/https?:\/\/[^\s)\]]+/g) ?? [])].slice(0, 6);
	return (
		<CardShell family="web" icon={<Globe size={15} />} title={tool.name === "web_search" ? "Search the web" : "Fetch"} meta={<span className="quote">{query}</span>} {...shell(tool)}
			footer={
				urls.length ? (
					<div className="sources">
						{urls.map((u) => (
							<span key={u} className="source">
								{new URL(u).hostname.replace(/^www\./, "")}
							</span>
						))}
					</div>
				) : null
			}
		>
			<Mono>{clip(output, 40)}</Mono>
		</CardShell>
	);
}

export function GenerateCard({ tool }: Props) {
	const a = tool.args ?? {};
	return (
		<CardShell family="gen" icon={<Sparkles size={15} />} title={tool.name.replace("higgsfield_", "Higgsfield · ").replace(/_/g, " ")} meta={a.aspect ?? a.model} {...shell(tool)}
			footer={a.prompt ? <div className="quote prompt-quote">“{a.prompt}”</div> : null}
		>
			<Mono>{resultText(tool.result)}</Mono>
		</CardShell>
	);
}

export function GenericCard({ tool }: Props) {
	const args = JSON.stringify(tool.args ?? {}, null, 2);
	return (
		<CardShell family="other" icon={<Code2 size={15} />} title={tool.name} {...shell(tool)}>
			{args !== "{}" ? <Mono>{args}</Mono> : null}
			<Mono>{clip(resultText(tool.result), 40)}</Mono>
		</CardShell>
	);
}
