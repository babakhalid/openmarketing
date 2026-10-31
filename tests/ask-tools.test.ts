import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { OTHER, optionLine, parseReply, registerAskTools, type Question } from "../extensions/ads-tools/ask.js";

const style: Question = {
	id: "style",
	question: "Which style direction?",
	options: [
		{ id: "noir", label: "Editorial Noir", description: "Dark glass, slow push-ins", recommended: true, why: "Matches the brand" },
		{ id: "paper", label: "Kinetic Paper", description: "Collage, fast cuts" },
		{ id: "clean", label: "Clean Campus" },
	],
};

test("parseReply maps bare labels and dialog lines to option ids", () => {
	assert.deepEqual(parseReply(style, "Kinetic Paper").choices, ["paper"]);
	assert.deepEqual(parseReply(style, optionLine(style.options[0])).choices, ["noir"]);
	assert.deepEqual(parseReply(style, "Editorial Noir\nClean Campus").choices, ["noir", "clean"]);
});

test("parseReply keeps the user's own words and defers to the recommendation on skip", () => {
	const own = parseReply(style, "Kinetic Paper\nbut warmer, more sunlight");
	assert.deepEqual(own.choices, ["paper"]);
	assert.equal(own.custom, "but warmer, more sunlight");
	const skipped = parseReply(style, undefined);
	assert.deepEqual(skipped.choices, ["noir"]);
	assert.equal(skipped.deferred, true);
});

function tool() {
	let registered: any;
	registerAskTools({ registerTool: (t: any) => (registered = t) } as any);
	return registered;
}

test("ask_user asks each question through select, records the log, and summarizes for the model", async () => {
	const cwd = mkdtempSync(join(tmpdir(), "ask-"));
	const asked: string[][] = [];
	const replies = ["Kinetic Paper", OTHER];
	const ctx = {
		cwd,
		hasUI: true,
		ui: {
			select: async (_title: string, options: string[]) => (asked.push(options), replies.shift()),
			input: async () => "Use the drone shot of the campus",
		},
	};
	const quality: Question = { id: "quality", question: "Draft first?", options: [{ id: "draft", label: "Draft first", recommended: true }, { id: "final", label: "Final now" }] };
	const result = await tool().execute("t1", { title: "Pick the style", stage: "style", questions: [style, quality], record: "branding/decisions-um6p.json" }, undefined, undefined, ctx);
	assert.equal(asked[0].at(-1), OTHER);
	assert.match(asked[0][0], /^Editorial Noir \(recommended\) — Dark glass/);
	assert.deepEqual(result.details.answers[0].choices, ["paper"]);
	assert.equal(result.details.answers[1].custom, "Use the drone shot of the campus");
	assert.match(result.content[0].text, /Which style direction\?\n {2}→ Kinetic Paper/);
	const log = JSON.parse(readFileSync(join(cwd, "branding/decisions-um6p.json"), "utf8"));
	assert.equal(log[0].stage, "style");
});

test("ask_user without a UI proceeds with recommendations marked inferred", async () => {
	const result = await tool().execute("t2", { title: "Pick the style", questions: [style] }, undefined, undefined, { cwd: tmpdir(), hasUI: false });
	assert.deepEqual(result.details.answers[0].choices, ["noir"]);
	assert.match(result.content[0].text, /inferred: no one was available/);
});
