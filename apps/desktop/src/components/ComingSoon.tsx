import { ArrowRight, Blocks, CalendarClock, type LucideIcon } from "lucide-react";

export type Page = "automations" | "customize";

type Copy = { icon: LucideIcon; title: string; text: string; rows: [string, string][]; action: string };

const PAGES: Record<Page, Copy> = {
	automations: {
		icon: CalendarClock,
		title: "Automations",
		text: "Recurring work that runs on its own schedule, with your approval gates intact. Until then, /loop designs a recurring process you run from chat.",
		rows: [
			["Weekly review", "Mon · 09:00"],
			["Meta Ads check", "Daily · 08:30"],
			["Fresh creative batch", "When CTR drops"],
		],
		action: "Design a loop in chat",
	},
	customize: {
		icon: Blocks,
		title: "Customize",
		text: "Choose the agents, skills and tools each workspace uses, and tune how they work. Accounts, theme and the default model are already in Settings.",
		rows: [
			["market-researcher", "agent"],
			["video-editing", "skill"],
			["Higgsfield", "tool"],
		],
		action: "Open Settings",
	},
};

// Placeholder for sidebar pages that are not built yet: a sketch of the page drawing itself in.
export function ComingSoon({ page, onAction }: { page: Page; onAction: () => void }) {
	const { icon: Icon, title, text, rows, action } = PAGES[page];
	return (
		<div className="soon" key={page}>
			<div className="soon-inner">
				<div className="soon-sketch" aria-hidden>
					<div className="soon-sketch-head">
						<span className="soon-icon">
							<Icon size={15} />
						</span>
						<span className="soon-line w40" />
					</div>
					{rows.map(([name, meta], i) => (
						<div key={name} className="soon-row" style={{ "--i": i } as React.CSSProperties}>
							<span className="soon-dot" />
							<span className="soon-name">{name}</span>
							<span className="soon-meta">{meta}</span>
							<span className="soon-trace" />
						</div>
					))}
				</div>
				<span className="soon-chip">
					<span className="soon-pulse" />
					Under construction
				</span>
				<h1>{title}</h1>
				<p>{text}</p>
				<button className="soon-action" onClick={onAction}>
					{action}
					<ArrowRight size={14} />
				</button>
			</div>
		</div>
	);
}
