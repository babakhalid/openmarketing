import { Check, Compass, ExternalLink, PenLine, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Item, UiRequest } from "../lib/types";
import { abs, mediaUrl } from "../lib/util";

type Tool = Extract<Item, { kind: "tool" }>;
type Option = { id: string; label: string; description?: string; recommended?: boolean; why?: string; preview?: string[] };
type Question = { id: string; question: string; header?: string; multiSelect?: boolean; options: Option[] };
type Answer = { id: string; question: string; choices: string[]; labels: string[]; custom?: string; deferred?: boolean };
type Pick = { ids: string[]; own: string };

const IMAGE = /\.(png|jpe?g|webp|gif)$/i;
const VIDEO = /\.(mp4|mov|m4v|webm)$/i;

// A pending dialog belongs to a running ask_user card when its title is one of the card's questions.
export function decisionFor(request: UiRequest, items: Item[]): Tool | undefined {
	return items.find((i): i is Tool => i.kind === "tool" && i.name === "ask_user" && i.status === "running" && (i.args?.questions ?? []).some((q: Question) => q.question === request.title));
}

function Preview({ path, cwd, onOpen }: { path: string; cwd: string; onOpen: (path: string) => void }) {
	const full = abs(path, cwd);
	const open = (e: React.MouseEvent) => {
		e.stopPropagation();
		onOpen(full);
	};
	if (IMAGE.test(path)) return <img className="dc-thumb" src={mediaUrl(full)} alt="" onClick={open} />;
	if (VIDEO.test(path)) return <video className="dc-thumb" src={mediaUrl(full)} muted loop autoPlay playsInline onClick={open} />;
	return (
		<button className="dc-file" onClick={open}>
			<ExternalLink size={12} />
			{path.split("/").pop()}
		</button>
	);
}

// The guided checkpoint: the agent's options (recommendation preselected, with its reason and
// previews), the user's own words, and a way to defer. Answers go back through the dialogs the
// tool opens one question at a time, so the card queues them and replies as each one arrives.
export function DecisionCard({ tool, cwd, requests, onRespond, onOpen }: { tool: Tool; cwd: string; requests: UiRequest[]; onRespond: (response: Record<string, unknown>) => void; onOpen: (path: string) => void }) {
	const a = tool.args ?? {};
	const questions: Question[] = a.questions ?? [];
	const answers: Answer[] | undefined = tool.result?.details?.answers;
	const [picks, setPicks] = useState<Record<string, Pick>>(() =>
		Object.fromEntries(questions.map((q) => [q.id, { ids: q.options.filter((o) => o.recommended).slice(0, q.multiSelect ? undefined : 1).map((o) => o.id), own: "" }])),
	);
	const [sent, setSent] = useState<"answer" | "skip">();
	const [writing, setWriting] = useState<Record<string, boolean>>({});
	const pending = useMemo(() => requests.find((r) => questions.some((q) => q.question === r.title)), [requests, questions]);
	const waiting = tool.status === "running" && Boolean(pending);

	// once submitted, reply to each question's dialog as the tool opens it
	useEffect(() => {
		if (!sent || !pending) return;
		const q = questions.find((x) => x.question === pending.title)!;
		if (sent === "skip") return onRespond({ id: pending.id, cancelled: true });
		const pick = picks[q.id];
		const labels = q.options.filter((o) => pick.ids.includes(o.id)).map((o) => o.label);
		onRespond({ id: pending.id, value: [...labels, pick.own.trim()].filter(Boolean).join("\n") });
	}, [sent, pending]); // eslint-disable-line react-hooks/exhaustive-deps

	const toggle = (q: Question, id: string) =>
		setPicks((p) => {
			const ids = p[q.id].ids;
			const next = q.multiSelect ? (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]) : [id];
			return { ...p, [q.id]: { ...p[q.id], ids: next } };
		});
	const ready = questions.every((q) => picks[q.id]?.ids.length || picks[q.id]?.own.trim());

	if (answers) {
		return (
			<section className="decision done">
				<header className="dc-head">
					<span className="dc-mark">
						<Check size={14} />
					</span>
					<span className="dc-title">{a.title}</span>
					{tool.result?.details?.interactive === false ? <span className="dc-chip">inferred</span> : null}
				</header>
				<ul className="dc-answers">
					{answers.map((ans) => (
						<li key={ans.id}>
							<span className="dim">{ans.question}</span>
							<span>
								{ans.labels.join(" + ") || "Their own direction"}
								{ans.custom ? <em> — “{ans.custom}”</em> : null}
								{ans.deferred ? <span className="dc-chip">agent's pick</span> : null}
							</span>
						</li>
					))}
				</ul>
			</section>
		);
	}

	return (
		<section className={`decision ${waiting ? "live" : ""}`}>
			<header className="dc-head">
				<span className="dc-mark">
					<Compass size={14} />
				</span>
				<span className="dc-title">{a.title ?? "Your call"}</span>
				{a.stage ? <span className="dc-chip">{a.stage}</span> : null}
			</header>
			{a.context ? (
				<div className="dc-context assistant-text">
					<ReactMarkdown remarkPlugins={[remarkGfm]}>{a.context}</ReactMarkdown>
				</div>
			) : null}
			{questions.map((q) => {
				const visual = q.options.some((o) => o.preview?.length);
				return (
					<div key={q.id} className="dc-question">
						<div className="dc-q">
							{q.header ? <span className="dc-chip">{q.header}</span> : null}
							{q.question}
							{q.multiSelect ? <span className="dim"> · pick any</span> : null}
						</div>
						<div className={`dc-options ${visual ? "visual" : ""}`}>
							{q.options.map((o) => {
								const on = picks[q.id]?.ids.includes(o.id);
								return (
									<div key={o.id} role="button" tabIndex={0} className={`dc-option ${on ? "on" : ""}`} onClick={() => !sent && toggle(q, o.id)} onKeyDown={(e) => e.key === "Enter" && !sent && toggle(q, o.id)}>
										{o.preview?.length ? (
											<div className="dc-previews">
												{o.preview.map((p) => (
													<Preview key={p} path={p} cwd={cwd} onOpen={onOpen} />
												))}
											</div>
										) : null}
										<div className="dc-option-text">
											<span className={`dc-tick ${q.multiSelect ? "box" : ""}`}>{on ? <Check size={11} /> : null}</span>
											<span className="dc-label">{o.label}</span>
											{o.recommended ? (
												<span className="dc-rec">
													<Sparkles size={11} /> Recommended
												</span>
											) : null}
										</div>
										{o.description ? <div className="dc-desc">{o.description}</div> : null}
										{o.recommended && o.why ? <div className="dc-why">{o.why}</div> : null}
									</div>
								);
							})}
						</div>
						{writing[q.id] ? (
							<input
								className="dc-own"
								autoFocus
								placeholder={picks[q.id]?.ids.length ? "Add a note to your pick, e.g. warmer light, slower cut…" : "Describe what you want instead…"}
								value={picks[q.id]?.own ?? ""}
								disabled={Boolean(sent)}
								onChange={(e) => setPicks((p) => ({ ...p, [q.id]: { ...p[q.id], own: e.target.value } }))}
							/>
						) : (
							<button className="dc-own-toggle" disabled={Boolean(sent)} onClick={() => setWriting((w) => ({ ...w, [q.id]: true }))}>
								<PenLine size={12} /> Add your own direction
							</button>
						)}
					</div>
				);
			})}
			<footer className="dc-actions">
				{tool.status !== "running" ? (
					<span className="dim">This checkpoint is no longer waiting.</span>
				) : sent ? (
					<span className="dim">
						<span className="ws-busy" /> Sending your decision…
					</span>
				) : (
					<>
						<button className="solid" disabled={!ready || !waiting} onClick={() => setSent("answer")}>
							Continue
						</button>
						<button className="ghost" disabled={!waiting} onClick={() => setSent("skip")}>
							Let the agent decide
						</button>
						{!waiting ? <span className="dim">Preparing…</span> : null}
					</>
				)}
			</footer>
		</section>
	);
}
