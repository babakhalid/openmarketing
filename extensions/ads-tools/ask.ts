// ask_user: a guided decision checkpoint. The agent proposes options (with a recommendation, the
// reason for it, and optional preview files); the user decides. Each question is a Pi `select`
// dialog, so the terminal shows a plain list while the desktop app matches the dialog to this
// tool call and draws a rich card (previews, recommended badge, write-in answer). Answers can be
// appended to a JSON decision log so long workflows (e.g. /video) can resume from them.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "@sinclair/typebox";

export const OTHER = "Something else…";

export type Option = { id: string; label: string; description?: string; recommended?: boolean; why?: string; preview?: string[] };
export type Question = { id: string; question: string; header?: string; multiSelect?: boolean; options: Option[] };
export type Answer = { id: string; question: string; choices: string[]; labels: string[]; custom?: string; deferred?: boolean };

// The string a select dialog shows for an option; the desktop sends bare labels back.
export const optionLine = (option: Option) => `${option.label}${option.recommended ? " (recommended)" : ""}${option.description ? ` — ${option.description}` : ""}`;

function matchOption(options: Option[], line: string): Option | undefined {
	const text = line.trim();
	return options.find((o) => text === o.label || text.startsWith(`${o.label} (`) || text.startsWith(`${o.label} —`));
}

// Parse a dialog reply: one option per line (multi-select joins lines); anything that is not an
// option is the user's own words.
export function parseReply(question: Question, reply: string | undefined): Answer {
	const base = { id: question.id, question: question.question };
	if (reply === undefined) {
		const picks = question.options.filter((o) => o.recommended);
		const chosen = picks.length ? picks : question.options.slice(0, 1);
		return { ...base, choices: chosen.map((o) => o.id), labels: chosen.map((o) => o.label), deferred: true };
	}
	const chosen: Option[] = [];
	const custom: string[] = [];
	for (const line of reply.split("\n").map((l) => l.trim()).filter(Boolean)) {
		const option = matchOption(question.options, line);
		if (option) {
			if (!chosen.includes(option)) chosen.push(option);
		} else if (line !== OTHER) custom.push(line);
	}
	return { ...base, choices: chosen.map((o) => o.id), labels: chosen.map((o) => o.label), ...(custom.length ? { custom: custom.join("\n") } : {}) };
}

function summarize(title: string, answers: Answer[], interactive: boolean): string {
	const lines = answers.map((a) => {
		const picked = a.labels.length ? a.labels.join(" + ") : "(no option)";
		const own = a.custom ? `${a.labels.length ? " — plus, in their words:" : " — in their words:"} "${a.custom}"` : "";
		const note = a.deferred ? (interactive ? " [skipped: they deferred to your recommendation]" : " [inferred: no one was available to answer]") : "";
		return `- ${a.question}\n  → ${picked}${own}${note}`;
	});
	return [`User decisions — ${title}:`, ...lines, "", "Act on exactly these decisions. Their own words override option details. Don't re-ask what they already decided."].join("\n");
}

function record(path: string, entry: Record<string, unknown>) {
	let log: unknown[] = [];
	try {
		const parsed = JSON.parse(readFileSync(path, "utf8"));
		if (Array.isArray(parsed)) log = parsed;
	} catch {
		// first entry
	}
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, JSON.stringify([...log, entry], null, 2));
}

const OptionSchema = Type.Object({
	id: Type.String({ description: "Short stable id, e.g. editorial-noir." }),
	label: Type.String({ description: "1-5 word name the user picks." }),
	description: Type.Optional(Type.String({ description: "One or two sentences: what this choice means and its trade-off (time, cost, quality)." })),
	recommended: Type.Optional(Type.Boolean({ description: "Mark the option you recommend (usually one)." })),
	why: Type.Optional(Type.String({ description: "For the recommended option: why it fits this brief, the references and the available engines." })),
	preview: Type.Optional(Type.Array(Type.String(), { description: "Workspace-relative files that show the option: images, a short video, or an HTML page." })),
});

export function registerAskTools(pi: ExtensionAPI): void {
	pi.registerTool({
		name: "ask_user",
		label: "Ask User",
		description:
			"Put a decision in front of the user and wait for it: 1-4 questions, each with 2-5 options you propose, one marked recommended with the reason, and optional preview files. The user can also answer in their own words or skip (deferring to your recommendation). Returns their decisions. Use at workflow checkpoints where the choice is the user's (brand, references, style, generation path, approval before an expensive render).",
		promptSnippet: "Checkpoint: propose options (with a recommendation and previews), wait for the user's decision.",
		promptGuidelines: [
			"Use ask_user for decisions that belong to the user; do not ask about things you can verify or that have an obvious default.",
			"Before calling ask_user, say in one or two sentences what you did and what you need from them; the card then carries the options.",
			"Make options genuinely different, give each a concrete trade-off, recommend one with a specific reason, and attach previews when you have them.",
		],
		parameters: Type.Object({
			title: Type.String({ description: "Checkpoint name, e.g. 'Validate the brand' or 'Pick a style'." }),
			stage: Type.Optional(Type.String({ description: "Workflow stage id, e.g. brand, references, style, path, storyboard, review." })),
			context: Type.Optional(Type.String({ description: "Short markdown framing shown above the questions: what you found and what the choice affects." })),
			questions: Type.Array(
				Type.Object({
					id: Type.String(),
					question: Type.String({ description: "The full question, ending with '?'." }),
					header: Type.Optional(Type.String({ description: "Very short chip label, e.g. Style, Quality." })),
					multiSelect: Type.Optional(Type.Boolean({ description: "Allow several options (e.g. which references to use)." })),
					options: Type.Array(OptionSchema, { minItems: 1, maxItems: 6 }),
				}),
				{ minItems: 1, maxItems: 4 },
			),
			record: Type.Optional(Type.String({ description: "Workspace-relative JSON decision log to append to, e.g. branding/decisions-<slug>.json." })),
		}),
		async execute(_id, params, signal, _onUpdate, ctx) {
			const questions = params.questions as Question[];
			const answers: Answer[] = [];
			for (const question of questions) {
				if (!ctx.hasUI) {
					answers.push(parseReply(question, undefined));
					continue;
				}
				const lines = [...question.options.map(optionLine), OTHER];
				let reply = await ctx.ui.select(question.question, lines, { signal });
				if (reply === OTHER) reply = (await ctx.ui.input(question.question, "Describe what you want", { signal })) ?? undefined;
				answers.push(parseReply(question, reply));
			}
			let logPath: string | undefined;
			if (params.record) {
				logPath = isAbsolute(params.record) ? params.record : resolve(ctx.cwd, params.record);
				record(logPath, { at: new Date().toISOString(), title: params.title, stage: params.stage, interactive: ctx.hasUI, answers });
			}
			const text = summarize(params.title, answers, ctx.hasUI) + (logPath ? `\nRecorded in ${params.record}.` : "");
			return { content: [{ type: "text", text }], details: { title: params.title, stage: params.stage, interactive: ctx.hasUI, answers, logPath } };
		},
	});
}
