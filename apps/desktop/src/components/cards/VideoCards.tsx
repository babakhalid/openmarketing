import { AudioLines, Clapperboard, FolderTree, Images, ScanSearch, ShieldCheck, Wrench } from "lucide-react";
import type { Item } from "../../lib/types";
import { abs, lineMatch, mediaUrl, rel, resultText } from "../../lib/util";
import { CardShell, Mono } from "./CardShell";

type Tool = Extract<Item, { kind: "tool" }>;
type Props = { tool: Tool; cwd: string; onOpen: (path: string) => void };

const shell = (tool: Tool) => ({ status: tool.status, startedAt: tool.startedAt, endedAt: tool.endedAt });
const fps = (rate?: string) => {
	const [num, den] = String(rate ?? "30/1").split("/").map(Number);
	return Math.round(num / (den || 1)) || 30;
};

export function WorkspaceCard({ tool, cwd }: Props) {
	const d = tool.result?.details ?? {};
	const refs: string[] = d.references ?? [];
	const analysed: string[] = d.analysed ?? [];
	const created: string[] = d.created ?? [];
	const folders = [
		{ name: "references", hint: refs.length ? `${refs.length} video${refs.length > 1 ? "s" : ""}` : "drop videos here" },
		{ name: "branding", hint: analysed.length ? `${analysed.length} analysed` : "storyboard · brand" },
		{ name: "outputs", hint: resultText(tool.result).includes("Latest video") ? "latest.mp4 ready" : "renders" },
	];
	return (
		<CardShell family="video" icon={<FolderTree size={15} />} title="Workspace" meta={(d.cwd ?? cwd).split("/").pop()} {...shell(tool)}
			footer={
				tool.result ? (
					<div className="ws-tiles">
						{folders.map((f) => (
							<div key={f.name} className={`ws-tile ${created.includes(`${f.name}/`) || created.includes(f.name) ? "new" : ""}`}>
								<span className="ws-name">{f.name}/</span>
								<span className="ws-hint">{f.hint}</span>
							</div>
						))}
					</div>
				) : null
			}
		>
			{refs.length ? (
				<ul className="plain-list">
					{refs.map((r) => (
						<li key={r}>
							<span className="mono">{rel(r, cwd)}</span>
							{analysed.includes(r) ? <span className="chip ok">analysed</span> : <span className="chip">new</span>}
						</li>
					))}
				</ul>
			) : (
				<Mono>{resultText(tool.result)}</Mono>
			)}
		</CardShell>
	);
}

export function AnalyzeCard({ tool, cwd, onOpen }: Props) {
	const m = tool.result?.details ?? {};
	const text = resultText(tool.result);
	const outDir = lineMatch(text, /Analysis: (.+)/) ?? abs(tool.args?.outDir, cwd);
	const strip = outDir && m.hook?.strip ? `${outDir}/${m.hook.strip}` : undefined;
	const sheet = outDir && m.sheets?.[0] ? `${outDir}/${m.sheets[0]}` : undefined;
	const stats = m.pacing
		? [
				["length", `${m.duration?.toFixed?.(1)}s`],
				["shots", m.pacing.shotCount],
				["cuts/min", m.pacing.cutsPerMinute],
				["median shot", `${m.pacing.medianShotSeconds}s`],
				["loudness", m.audio ? `${m.audio.integratedLUFS} LUFS` : "silent"],
				["tempo", m.audio?.estimatedBPM ? `${Math.round(m.audio.estimatedBPM)} bpm` : "—"],
			]
		: [];
	const name = (tool.args?.video ?? "").split("/").pop();
	return (
		<CardShell family="analysis" icon={<ScanSearch size={15} />} title="Analyse reference" meta={name} {...shell(tool)}
			badge={m.transcript?.language ? <span className="chip">{m.transcript.language}</span> : undefined}
			footer={
				tool.result && !tool.result.content?.[0]?.text?.startsWith("Exit") ? (
					<div className="analysis">
						{strip ? <img className="hook-strip" src={mediaUrl(strip)} onClick={() => onOpen(strip)} alt="first 3 seconds" /> : null}
						{stats.length ? (
							<div className="stat-grid">
								{stats.map(([k, v]) => (
									<div key={String(k)} className="stat">
										<span className="stat-v">{String(v)}</span>
										<span className="stat-k">{k}</span>
									</div>
								))}
							</div>
						) : null}
					</div>
				) : null
			}
		>
			{sheet ? <img className="sheet" src={mediaUrl(sheet)} onClick={() => onOpen(sheet)} alt="contact sheet" /> : null}
			{outDir ? <div className="path-line mono">{rel(outDir, cwd)}</div> : null}
		</CardShell>
	);
}

export function TranscribeCard({ tool, cwd }: Props) {
	const text = resultText(tool.result);
	const count = lineMatch(text, /(\d+) word captions/);
	return (
		<CardShell family="analysis" icon={<AudioLines size={15} />} title="Transcribe voice-over" meta={rel(tool.args?.input, cwd)} {...shell(tool)}
			badge={count ? <span className="chip">{count} words</span> : undefined}
		>
			<div className="path-line mono">→ {rel(tool.args?.output, cwd)}</div>
		</CardShell>
	);
}

export function StillsCard({ tool, cwd, onOpen }: Props) {
	const frames: string[] = tool.result?.details?.written ?? [];
	const requested: number[] = tool.args?.frames ?? [];
	return (
		<CardShell family="render" icon={<Images size={15} />} title="Preview frames" meta={`${requested.length} frame${requested.length === 1 ? "" : "s"} · ${rel(tool.args?.spec, cwd)}`} {...shell(tool)}
			footer={
				frames.length ? (
					<div className="frames">
						{frames.map((frame) => (
							<figure key={frame} onClick={() => onOpen(frame)}>
								<img src={mediaUrl(frame)} alt="" />
								<figcaption className="mono">f{Number(frame.match(/frame-(\d+)/)?.[1] ?? 0)}</figcaption>
							</figure>
						))}
					</div>
				) : tool.status === "running" ? (
					<div className="frames">
						{requested.map((f) => (
							<figure key={f} className="ghost">
								<div />
								<figcaption className="mono">f{f}</figcaption>
							</figure>
						))}
					</div>
				) : null
			}
		/>
	);
}

export function RenderCard({ tool, cwd, onOpen }: Props) {
	const text = resultText(tool.result);
	const output = lineMatch(text, /Rendered (.+)/);
	const video = tool.result?.details?.streams?.find?.((s: any) => s.codec_type === "video");
	const duration = Number(tool.result?.details?.format?.duration ?? 0);
	const failed = tool.status === "error" || text.startsWith("Render failed");
	return (
		<CardShell family="render" icon={<Clapperboard size={15} />} title={tool.args?.draft ? "Draft render" : "Render"} meta={rel(tool.args?.spec, cwd)} {...shell(tool)} status={failed ? "error" : tool.status}
			badge={video ? <span className="chip">{video.width}×{video.height} · {duration.toFixed(1)}s</span> : undefined}
			defaultOpen={failed}
			footer={
				tool.status === "running" ? (
					<div className="render-progress">
						<div className="bar" />
						<span className="mono">compositing frames · Remotion</span>
					</div>
				) : output ? (
					<div className="media-row">
						<video className="player" src={`${mediaUrl(output)}#t=0.5`} controls preload="metadata" />
						<dl className="facts">
							{video ? (
								<>
									<dt>frame</dt>
									<dd>
										{video.width}×{video.height} · {fps(video.r_frame_rate)} fps
									</dd>
								</>
							) : null}
							<dt>length</dt>
							<dd>{duration.toFixed(2)} s</dd>
							<dt>codec</dt>
							<dd>{video?.codec_name ?? "h264"}</dd>
							<dt>file</dt>
							<dd className="mono">{rel(output, cwd)}</dd>
							<dd className="actions">
								<button className="link" onClick={() => onOpen(output)}>
									open
								</button>
								<button className="link" onClick={() => window.om.reveal(output)}>
									reveal
								</button>
							</dd>
						</dl>
					</div>
				) : null
			}
		>
			{failed ? <Mono className="err">{text}</Mono> : null}
		</CardShell>
	);
}

const VERDICT: Record<string, { label: string; tone: string }> = {
	PASS: { label: "QA pass", tone: "ok" },
	PASS_WITH_WARNINGS: { label: "QA pass · warnings", tone: "warn" },
	FAIL: { label: "QA fail", tone: "fail" },
	UNVERIFIED: { label: "QA unverified", tone: "warn" },
};

export function FinishCard({ tool, cwd }: Props) {
	const d = tool.result?.details ?? {};
	const text = resultText(tool.result);
	const latest = lineMatch(text, /Latest video: (.+)/);
	const verdict = VERDICT[d.verdict ?? ""];
	const checks: any[] = d.checks ?? [];
	const encodes = [...text.matchAll(/-> (.+\.mp4)/g)].map((match) => match[1]);
	return (
		<CardShell family="qa" icon={<ShieldCheck size={15} />} title="Finish & QA" meta={`${tool.args?.target ?? "all"} · −14 LUFS`} {...shell(tool)}
			badge={verdict ? <span className={`verdict ${verdict.tone}`}>{verdict.label}</span> : undefined}
			defaultOpen={d.verdict === "FAIL"}
			footer={
				tool.result ? (
					<div className="finish">
						{latest ? <video className="player" src={`${mediaUrl(latest)}#t=0.5`} controls preload="metadata" /> : null}
						<ul className="checks">
							{checks.map((c) => (
								<li key={c.check} className={c.pass ? "ok" : c.severity}>
									<i />
									<span className="ck">{c.check}</span>
									<span className="cv mono">{typeof c.value === "number" ? Number(c.value.toFixed?.(2) ?? c.value) : String(c.value)}</span>
								</li>
							))}
						</ul>
					</div>
				) : tool.status === "running" ? (
					<div className="render-progress">
						<div className="bar" />
						<span className="mono">loudnorm · encode · QA</span>
					</div>
				) : null
			}
		>
			{encodes.length ? (
				<ul className="plain-list">
					{encodes.map((e) => (
						<li key={e} className="mono">
							{rel(e, cwd)}
						</li>
					))}
				</ul>
			) : null}
			{checks.length ? (
				<div className="rules">
					{checks.map((c) => (
						<div key={c.check} className="mono">
							{c.check}: {c.rule}
						</div>
					))}
				</div>
			) : null}
		</CardShell>
	);
}

export function SetupCard({ tool }: Props) {
	return (
		<CardShell family="video" icon={<Wrench size={15} />} title="Video stack" meta="ffmpeg · whisper · Remotion" {...shell(tool)}>
			<Mono>{resultText(tool.result)}</Mono>
		</CardShell>
	);
}

