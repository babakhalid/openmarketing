import { Film, Palette, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import type { WorkspaceInfo } from "../lib/types";
import { bytes, mediaUrl, rel } from "../lib/util";
import { BrandPreview } from "./BrandPreview";

type Tab = "outputs" | "references" | "branding";

const VERDICT_TONE: Record<string, string> = { PASS: "ok", PASS_WITH_WARNINGS: "warn", FAIL: "fail" };
const slugOf = (name: string) =>
	name
		.replace(/\.[^.]+$/, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.split("-")
		.slice(0, 6)
		.join("-");

function ReferenceCard({ path, name, analysis, onOpen }: { path: string; name: string; analysis?: WorkspaceInfo["analyses"][number]; onOpen: (path: string) => void }) {
	const [duration, setDuration] = useState<number>();
	return (
		<div className="ref-card" onClick={() => onOpen(path)}>
			<div className="ref-frame">
				<video
					src={`${mediaUrl(path)}#t=0.8`}
					muted
					loop
					playsInline
					preload="metadata"
					onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
					onMouseEnter={(e) => {
						e.currentTarget.currentTime = 0;
						e.currentTarget.play().catch(() => undefined);
					}}
					onMouseLeave={(e) => e.currentTarget.pause()}
				/>
				<span className={`ref-badge ${analysis ? "done" : ""}`}>{analysis ? "analysed" : "new"}</span>
				{duration ? <span className="ref-time">{duration.toFixed(1)}s</span> : null}
			</div>
			<div className="ref-name">{name}</div>
			<div className="ref-stats">{analysis ? `${analysis.cutsPerMinute ?? "—"} cuts/min · ${analysis.lufs ?? "—"} LUFS` : "not analysed yet"}</div>
		</div>
	);
}

export function Inspector({
	info,
	onOpen,
	onImport,
	onReveal,
	onAsk,
	focusTab,
}: {
	info?: WorkspaceInfo;
	onOpen: (path: string) => void;
	onImport: (files: File[]) => void;
	onReveal: (path: string) => void;
	onAsk: (prompt: string) => void;
	focusTab?: Tab;
}) {
	const [tab, setTab] = useState<Tab>("outputs");
	const [dragging, setDragging] = useState(false);
	const [page, setPage] = useState<string>();
	useEffect(() => {
		if (focusTab) setTab(focusTab);
	}, [focusTab]);
	if (!info) return <aside className="inspector" />;
	const verdict = info.latest?.info?.verdict;
	const pages = info.pages ?? [];
	const activePage = pages.find((p) => p.path === page) ?? pages[0];
	const otherFiles = info.branding.filter((f) => !/\.html?$/i.test(f.name));

	return (
		<aside
			className={`inspector ${dragging ? "dragging" : ""}`}
			onDragOver={(e) => {
				e.preventDefault();
				setDragging(true);
			}}
			onDragLeave={() => setDragging(false)}
			onDrop={(e) => {
				e.preventDefault();
				setDragging(false);
				onImport([...e.dataTransfer.files]);
				setTab("references");
			}}
		>
			<div className="drag insp-top" />
			<div className="tabs">
				{(
					[
						["outputs", "Outputs", info.renders.length],
						["references", "References", info.references.length],
						["branding", "Branding", pages.length],
					] as const
				).map(([key, label, count]) => (
					<button key={key} className={tab === key ? "on" : ""} onClick={() => setTab(key)}>
						{label}
						{count ? <span className="count">{count}</span> : null}
					</button>
				))}
			</div>

			{tab === "outputs" ? (
				<div className="insp-body">
					<div className="latest">
						<div className="insp-label">
							latest.mp4
							{verdict ? <span className={`verdict ${VERDICT_TONE[verdict] ?? "warn"}`}>{verdict === "PASS_WITH_WARNINGS" ? "pass · warnings" : verdict.toLowerCase()}</span> : null}
						</div>
						{info.latest ? (
							<>
								<video key={info.latest.mtime} className="player tall" src={`${mediaUrl(info.latest.video)}?v=${info.latest.mtime}#t=0.5`} poster={info.latest.cover ? mediaUrl(info.latest.cover) : undefined} controls />
								<div className="latest-meta mono">
									{info.latest.info?.qa?.duration ? `${info.latest.info.qa.duration.toFixed(1)}s` : ""}
									{info.latest.info?.qa?.loudness ? ` · ${info.latest.info.qa.loudness.integratedLUFS} LUFS · ${info.latest.info.qa.loudness.truePeakDBFS} dBTP` : ""}
									<button className="link" onClick={() => onReveal(info.latest!.video)}>
										Reveal
									</button>
								</div>
							</>
						) : (
							<div className="empty-slot">
								<Film size={20} strokeWidth={1.5} />
								<span>No finished video yet.</span>
								<span className="dim">Renders that pass QA land here.</span>
							</div>
						)}
					</div>
					{info.renders.length ? <div className="insp-label">renders</div> : null}
					{info.renders.map((r) => (
						<div key={r.slug} className="render-row" onClick={() => r.videos[0] && onOpen(r.videos[0].path)}>
							{r.cover ? <img src={mediaUrl(r.cover)} alt="" /> : <div className="thumb-ph" />}
							<div>
								<div className="row-title">{r.slug}</div>
								<div className="dim mono">
									{r.videos.length} file{r.videos.length === 1 ? "" : "s"}
								</div>
							</div>
							{r.verdict ? <span className={`dot-v ${VERDICT_TONE[r.verdict] ?? "warn"}`} /> : null}
						</div>
					))}
				</div>
			) : null}

			{tab === "references" ? (
				<div className="insp-body">
					<label className="dropzone">
						<Upload size={16} strokeWidth={1.5} />
						<span>Drop reference videos</span>
						<span className="dim">or click to choose · copied into references/</span>
						<input type="file" accept="video/*" multiple hidden onChange={(e) => onImport([...(e.target.files ?? [])])} />
					</label>
					{info.references.length ? (
						<div className="ref-grid">
							{info.references.map((ref) => (
								<ReferenceCard key={ref.path} path={ref.path} name={ref.name} analysis={info.analyses.find((a) => a.slug === slugOf(ref.name))} onOpen={onOpen} />
							))}
						</div>
					) : null}
				</div>
			) : null}

			{tab === "branding" ? (
				<div className="insp-body flush">
					{activePage ? (
						<BrandPreview
							path={activePage.path}
							version={activePage.mtime}
							cwd={info.cwd}
							pages={pages}
							onSelectPage={setPage}
							onAsk={onAsk}
							onExpand={() => onOpen(activePage.path)}
						/>
					) : (
						<div className="brand-empty empty-slot">
							<Palette size={20} strokeWidth={1.5} />
							<span>No brand page yet.</span>
							<span className="dim">The agent writes branding/brand.html — palette, type, voice and storyboard — and uses it as the reference for every render.</span>
							<button className="solid-btn" style={{ marginTop: 10 }} onClick={() => onAsk("Create branding/brand.html from the brand template in the video-editing skill, using the workspace context and any reference analyses. Then summarise the palette and type you chose.")}>
								Create brand page
							</button>
						</div>
					)}
					{otherFiles.length ? (
						<div className="brand-files">
							<div className="insp-label">files</div>
							{otherFiles.slice(0, 8).map((f) => (
								<div key={f.path} className="file-row" onClick={() => onOpen(f.path)}>
									<span className="row-title">{rel(f.path, `${info.cwd}/branding`)}</span>
									<span className="dim mono">{bytes(f.size)}</span>
								</div>
							))}
						</div>
					) : null}
				</div>
			) : null}
		</aside>
	);
}
