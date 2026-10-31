import { ArrowLeftRight, Check, ChevronDown, KeyRound, MessageSquarePlus, RotateCcw, TriangleAlert } from "lucide-react";
import { type ReactNode, useState } from "react";
import { type FixAction, providerName } from "../lib/errors";
import type { Item } from "../lib/types";

type ProblemItem = Extract<Item, { kind: "problem" }>;

// A failed turn told like a person would: what happened, why, and the one-click ways out.
// The first fix is the recommended one; once a fix lands the card collapses to a quiet line.
export function ProblemCard({ item, alternative, onFix }: { item: ProblemItem; alternative?: string; onFix: (item: ProblemItem, action: FixAction) => Promise<void> }) {
	const { problem } = item;
	const [pending, setPending] = useState<FixAction>();
	const [details, setDetails] = useState(false);

	if (item.resolved) {
		return (
			<div className="problem resolved">
				<Check size={13} />
				<span>{problem.title}</span>
				<span className="dim">· {item.resolved}</span>
			</div>
		);
	}

	const label: Record<FixAction, { icon: ReactNode; text: string } | undefined> = {
		login: { icon: <KeyRound size={13} />, text: `Sign in to ${providerName(problem.provider)}` },
		switch: alternative ? { icon: <ArrowLeftRight size={13} />, text: `Continue with ${alternative}` } : undefined,
		retry: { icon: <RotateCcw size={13} />, text: "Try again" },
		new_chat: { icon: <MessageSquarePlus size={13} />, text: "Start a new chat" },
	};
	const fixes = problem.fixes.filter((fix) => label[fix]);

	const run = async (fix: FixAction) => {
		setPending(fix);
		try {
			await onFix(item, fix);
		} finally {
			setPending(undefined);
		}
	};

	return (
		<section className={`problem ${problem.kind}`}>
			<header className="problem-head">
				<span className="problem-mark">
					<TriangleAlert size={14} />
				</span>
				<span className="problem-title">{problem.title}</span>
			</header>
			<p className="problem-body">{problem.body}</p>
			<div className="problem-fixes">
				{fixes.map((fix, index) => (
					<button key={fix} className={index === 0 ? "solid" : "ghost"} disabled={Boolean(pending)} onClick={() => run(fix)}>
						{pending === fix ? <span className="ws-busy" /> : label[fix]!.icon}
						{label[fix]!.text}
					</button>
				))}
			</div>
			<button className="problem-toggle" onClick={() => setDetails(!details)}>
				<ChevronDown size={12} className={details ? "open" : ""} />
				Details
			</button>
			{details ? <pre className="problem-raw mono">{problem.raw}</pre> : null}
		</section>
	);
}
