import { OPENMARKETING_ASCII_LOGO } from "../../logo.mjs";

export const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

function rgb(red: number, green: number, blue: number): string {
	return `\x1b[38;2;${red};${green};${blue}m`;
}

// Modern blue-forward palette. Blue is the primary accent (logo, sections,
// panel bars). Sky highlights wordmark glyphs. Sage stays for command names so
// they pop against the blue scaffolding without visual clash.
const INK = rgb(220, 226, 234);
const STONE = rgb(157, 169, 184);
export const ASH = rgb(120, 134, 156);
const DARK_ASH = rgb(70, 84, 110);
export const SAGE = rgb(167, 192, 128);
const BLUE = rgb(96, 165, 250);
const SKY = rgb(125, 211, 252);
const ROSE = rgb(244, 114, 128);

const INDENT = "  ";
const RULE_WIDTH = 60;

function paint(text: string, ...codes: string[]): string {
	return `${codes.join("")}${text}${RESET}`;
}

export function printInfo(text: string): void {
	console.log(`${INDENT}${paint(text, ASH)}`);
}

export function printSuccess(text: string): void {
	console.log(`${INDENT}${paint(`✓`, SAGE, BOLD)} ${paint(text, INK)}`);
}

export function printWarning(text: string): void {
	console.log(`${INDENT}${paint(`!`, STONE, BOLD)} ${paint(text, INK)}`);
}

export function printSection(title: string): void {
	console.log("");
	const label = title.toUpperCase();
	const trailing = Math.max(0, RULE_WIDTH - label.length - 1);
	console.log(
		`${INDENT}${paint(label, BLUE, BOLD)} ${paint("─".repeat(trailing), DARK_ASH)}`,
	);
}

export function printDetail(label: string, value: string): void {
	const labelW = 16;
	const padded = label.length >= labelW ? `${label} ` : label.padEnd(labelW);
	console.log(
		`${INDENT}${paint(padded, ASH)}${paint(value, INK)}`,
	);
}

export function printDivider(): void {
	console.log(`${INDENT}${paint("─".repeat(RULE_WIDTH), DARK_ASH)}`);
}

// Hero: a clean blue ASCII wordmark with a SKY-tinted accent line on either
// side, a one-line tagline below, and optional context lines under that.
export function printAsciiHeader(subtitleLines: string[] = []): void {
	const logoWidth = Math.max(...OPENMARKETING_ASCII_LOGO.map((line) => line.length));
	const accent = "─".repeat(Math.max(8, Math.min(logoWidth, 72)));

	console.log("");
	for (const line of OPENMARKETING_ASCII_LOGO) {
		console.log(`${INDENT}${paint(line, BLUE, BOLD)}`);
	}
	console.log(`${INDENT}${paint(accent, SKY, BOLD)}`);
	if (subtitleLines.length > 0) {
		const [primary, ...rest] = subtitleLines;
		console.log(`${INDENT}${paint(primary!, INK, BOLD)}`);
		for (const line of rest) {
			console.log(`${INDENT}${paint(line, ASH)}`);
		}
	}
	console.log("");
}

// Lightweight panel: a left accent bar instead of a full box. Reads cleaner at
// scale than the heavy ┌─┐ frame and stays aligned with the rest of the CLI.
export function printPanel(title: string, subtitleLines: string[] = []): void {
	console.log("");
	console.log(
		`${INDENT}${paint("▎", BLUE, BOLD)} ${paint(title, BLUE, BOLD)}`,
	);
	for (const line of subtitleLines) {
		console.log(
			`${INDENT}${paint("▎", DARK_ASH)} ${paint(line, ASH)}`,
		);
	}
	console.log("");
}

// Step indicator for multi-stage flows like `openmarketing setup`. Renders
// `STEP n/total · LABEL ───────` with a sky-coloured numeral so users can see
// where they are at a glance without clack pushing it off-screen.
export function printStep(index: number, total: number, label: string): void {
	console.log("");
	const counter = `STEP ${index}/${total}`;
	const upper = label.toUpperCase();
	const head = `${counter} · ${upper}`;
	const trailing = Math.max(0, RULE_WIDTH - head.length - 1);
	console.log(
		`${INDENT}${paint(counter, SKY, BOLD)} ${paint("·", DARK_ASH)} ${paint(upper, BLUE, BOLD)} ${paint("─".repeat(trailing), DARK_ASH)}`,
	);
}

// Summary card for end-of-flow screens (e.g. setup complete). Each item is a
// label/value pair with a status glyph; pass `ok: false` for a warning glyph.
export type SummaryItem = {
	label: string;
	value: string;
	ok?: boolean;
};

export function printSummaryCard(title: string, items: SummaryItem[]): void {
	console.log("");
	console.log(`${INDENT}${paint("▎", BLUE, BOLD)} ${paint(title, BLUE, BOLD)}`);
	for (const item of items) {
		const glyph = item.ok === false ? paint("○", STONE, BOLD) : paint("●", SAGE, BOLD);
		const label = paint(item.label.padEnd(14), ASH);
		const value = paint(item.value, INK);
		console.log(`${INDENT}${paint("▎", DARK_ASH)} ${glyph}  ${label}${value}`);
	}
	console.log("");
}
