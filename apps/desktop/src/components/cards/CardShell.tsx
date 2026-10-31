import { Check, ChevronRight, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import type { ToolStatus } from "../../lib/types";
import { timecode } from "../../lib/util";

export type Family = "video" | "analysis" | "render" | "qa" | "file" | "shell" | "agent" | "web" | "gen" | "other";

function useElapsed(startedAt: number, endedAt: number | undefined, running: boolean) {
	const [now, setNow] = useState(Date.now());
	useEffect(() => {
		if (!running) return;
		const timer = setInterval(() => setNow(Date.now()), 100);
		return () => clearInterval(timer);
	}, [running]);
	if (!startedAt) return undefined;
	return (endedAt ?? now) - startedAt;
}

// One step of agent work: a quiet row (icon disc, title, meta, time, state) that expands into
// details. Rich results (frames, players, QA) sit underneath, aligned to the title column.
export function CardShell({
	family,
	icon,
	title,
	meta,
	status,
	startedAt,
	endedAt,
	badge,
	defaultOpen = false,
	children,
	footer,
}: {
	family: Family;
	icon: ReactNode;
	title: ReactNode;
	meta?: ReactNode;
	status: ToolStatus;
	startedAt: number;
	endedAt?: number;
	badge?: ReactNode;
	defaultOpen?: boolean;
	children?: ReactNode;
	footer?: ReactNode;
}) {
	const running = status === "running" || status === "preparing";
	const [open, setOpen] = useState(defaultOpen);
	const elapsed = useElapsed(startedAt, endedAt, running);
	const expandable = Boolean(children);
	return (
		<div className={`step fam-${family} st-${status} ${open ? "open" : ""}`}>
			<button className="step-head" onClick={() => expandable && setOpen(!open)} disabled={!expandable} aria-expanded={expandable ? open : undefined}>
				<span className="step-icon">{icon}</span>
				<span className="step-title">{title}</span>
				{meta ? <span className="step-meta">{meta}</span> : null}
				<span className="step-spacer" />
				{badge}
				{elapsed !== undefined && elapsed > 0 ? <span className="step-time">{timecode(elapsed)}</span> : null}
				<span className="step-state" aria-label={status}>
					{status === "done" ? <Check size={13} /> : status === "error" ? <X size={13} /> : <i />}
				</span>
				{expandable ? <ChevronRight size={14} className="step-chev" /> : null}
			</button>
			{footer ? <div className="step-media">{footer}</div> : null}
			{expandable && open ? <div className="step-body">{children}</div> : null}
		</div>
	);
}

export function Mono({ children, className = "" }: { children: ReactNode; className?: string }) {
	return <pre className={`mono-block ${className}`}>{children}</pre>;
}
