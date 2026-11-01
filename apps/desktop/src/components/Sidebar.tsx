import { ArrowLeft, ArrowRight, Blocks, CalendarClock, Clapperboard, Folder, FolderOpen, FolderPlus, ListFilter, MessageSquarePlus, PanelLeft, Search, Settings, X } from "lucide-react";
import { useMemo, useState } from "react";
import { accountLabel } from "./Accounts";
import type { ProviderStatus, Session, SessionEntry, WorkspaceInfo } from "../lib/types";

const ago = (iso: string) => {
	const s = (Date.now() - new Date(iso).getTime()) / 1000;
	if (s < 60) return "now";
	if (s < 3600) return `${Math.round(s / 60)}m`;
	if (s < 86400) return `${Math.round(s / 3600)}h`;
	if (s < 86400 * 7) return `${Math.round(s / 86400)}d`;
	return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export type GettingStartedStep = { label: string; done: boolean; action: string; run: () => void };

export function Sidebar({
	recent,
	active,
	sessions,
	info,
	userName,
	onSelect,
	onAdd,
	onForget,
	onNewVideo,
	onNewChat,
	onAutomations,
	onCustomize,
	onSettings,
	onCollapse,
	onBack,
	onForward,
	canBack,
	canForward,
	steps,
	mode,
	accounts,
	sessionLists,
	activeSessionFile,
	onResume,
}: {
	recent: string[];
	active?: string;
	sessions: Record<string, Session>;
	info?: WorkspaceInfo;
	userName: string;
	onSelect: (cwd: string) => void;
	onAdd: () => void;
	onForget: (cwd: string) => void;
	onNewVideo: () => void;
	onNewChat: () => void;
	onAutomations: () => void;
	onCustomize: () => void;
	onSettings: () => void;
	onCollapse: () => void;
	onBack: () => void;
	onForward: () => void;
	canBack: boolean;
	canForward: boolean;
	steps: GettingStartedStep[];
	mode: "video" | "chat" | "automations" | "customize";
	accounts: ProviderStatus[];
	sessionLists: Record<string, SessionEntry[]>;
	activeSessionFile?: string;
	onResume: (cwd: string, path: string) => void;
}) {
	const [showAll, setShowAll] = useState(false);
	const [query, setQuery] = useState<string>();
	const [sortByName, setSortByName] = useState(false);
	const list = useMemo(() => {
		const filtered = recent.filter((cwd) => !query || cwd.toLowerCase().includes(query.toLowerCase()));
		return sortByName ? [...filtered].sort((a, b) => (a.split("/").pop() ?? "").localeCompare(b.split("/").pop() ?? "")) : filtered;
	}, [recent, query, sortByName]);
	const doneCount = steps.filter((s) => s.done).length;
	const next = steps.find((s) => !s.done);
	const words = userName.split(/[\s._-]+/).filter(Boolean);
	const initials = (words.length > 1 ? words.slice(0, 2).map((w) => w[0]) : [userName.slice(0, 2)]).join("").toUpperCase();

	return (
		<aside className="sidebar">
			<div className="side-top drag">
				<button className="icon-btn" title="Hide sidebar" onClick={onCollapse}>
					<PanelLeft size={16} />
				</button>
				<button className={`icon-btn ${query !== undefined ? "on" : ""}`} title="Search workspaces" onClick={() => setQuery(query === undefined ? "" : undefined)}>
					<Search size={16} />
				</button>
				<span className="spacer" />
				<button className="icon-btn" title="Back" disabled={!canBack} onClick={onBack}>
					<ArrowLeft size={16} />
				</button>
				<button className="icon-btn" title="Forward" disabled={!canForward} onClick={onForward}>
					<ArrowRight size={16} />
				</button>
			</div>

			<nav className="side-nav">
				<button className={`side-item ${mode === "video" ? "on" : ""}`} onClick={onNewVideo}>
					<Clapperboard size={16} />
					New Video
					<kbd>⌘N</kbd>
				</button>
				<button className={`side-item ${mode === "chat" ? "on" : ""}`} onClick={onNewChat}>
					<MessageSquarePlus size={16} />
					New Chat
				</button>
				<button className={`side-item ${mode === "automations" ? "on" : ""}`} onClick={onAutomations}>
					<CalendarClock size={16} />
					Automations
				</button>
				<button className={`side-item ${mode === "customize" ? "on" : ""}`} onClick={onCustomize}>
					<Blocks size={16} />
					Customize
				</button>
			</nav>

			<div className="side-section">
				<span>Workspaces</span>
				<span className="spacer" />
				<button className={`icon-btn sm ${sortByName ? "on" : ""}`} title={sortByName ? "Sorted by name" : "Sorted by recent"} onClick={() => setSortByName(!sortByName)}>
					<ListFilter size={15} />
				</button>
				<button className="icon-btn sm" title="Open folder" onClick={onAdd}>
					<FolderPlus size={15} />
				</button>
			</div>
			{query !== undefined ? (
				<div className="side-search">
					<Search size={13} />
					<input autoFocus value={query} placeholder="Filter workspaces" onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Escape" && setQuery(undefined)} />
				</div>
			) : null}
			<div className="ws-list">
				{list.map((cwd) => {
					const s = sessions[cwd];
					const isActive = cwd === active;
					const history = isActive ? (sessionLists[cwd] ?? []) : [];
					return (
						<div key={cwd} className="ws-group">
						<div className={`ws-row ${isActive ? "active" : ""}`} onClick={() => onSelect(cwd)} title={cwd}>
							{isActive ? <FolderOpen size={16} /> : <Folder size={16} />}
							<span className="ws-label">{cwd.split("/").pop()}</span>
							{s?.busy ? <span className="ws-busy" /> : null}
							<button
								className="ws-x"
								title="Remove from list"
								onClick={(e) => {
									e.stopPropagation();
									onForget(cwd);
								}}
							>
								<X size={13} />
							</button>
						</div>
						{history.length ? (
							<div className="ss-list">
								{(showAll ? history : history.slice(0, 8)).map((entry) => (
									<button
										key={entry.path}
										className={`ss-row ${entry.path === activeSessionFile ? "on" : ""}`}
										title={`${entry.title}\n${entry.messageCount} messages · ${new Date(entry.modified).toLocaleString()}`}
										onClick={() => onResume(cwd, entry.path)}
									>
										<span className="ss-title">{entry.title}</span>
										<span className="ss-time">{ago(entry.modified)}</span>
									</button>
								))}
								{history.length > 8 ? (
									<button className="ss-more" onClick={() => setShowAll(!showAll)}>
										{showAll ? "Show less" : `Show all (${history.length})`}
									</button>
								) : null}
							</div>
						) : null}
						</div>
					);
				})}
				{!list.length ? <div className="ws-empty">{query ? "No matching workspace." : "Open a folder to give the agent a workspace."}</div> : null}
			</div>

			{next ? (
				<div className="getting-started">
					<div className="gs-head">
						<span>Getting Started</span>
						<span className="gs-count">
							{doneCount}/{steps.length}
							<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
								<circle cx="7" cy="7" r="5.5" fill="none" strokeWidth="1.5" className="gs-track" />
								<circle cx="7" cy="7" r="5.5" fill="none" strokeWidth="1.5" className="gs-fill" strokeDasharray={`${(doneCount / steps.length) * 34.6} 34.6`} transform="rotate(-90 7 7)" />
							</svg>
						</span>
					</div>
					<div className="gs-next">{next.label}</div>
					<button className="gs-action" onClick={next.run}>
						{next.action}
					</button>
				</div>
			) : null}

			<div className="side-user">
				<button className="user-card" onClick={onSettings} title={accounts.length ? accounts.map((p) => accountLabel(p)).join("\n") : "Connect a model provider"}>
					<span className="avatar">{initials || "OM"}</span>
					<span className="user-text">
						<span className="user-name">{userName}</span>
						<span className={`user-sub ${accounts.length ? "" : "warn"}`}>
							<i />
							<span>{accounts.length ? accounts.map((p) => p.name.replace(/ Codex.*$/, "")).filter((n, k, all) => all.indexOf(n) === k).join(" · ") : "No account connected"}</span>
						</span>
					</span>
				</button>
				<button className="icon-btn" title="Settings" onClick={onSettings}>
					<Settings size={16} />
				</button>
			</div>
		</aside>
	);
}

