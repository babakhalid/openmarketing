import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, extname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "@sinclair/typebox";

import { formatCliResult, runCli, tryParseJson } from "./shared.js";

// The Remotion studio is agent-owned infrastructure: it lives outside the user's workspace,
// is installed on first use, and its src/ is re-synced from the bundled template on every
// render so agents always render with the components shipped in this package.
const APP_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SKILLS = resolve(APP_ROOT, "skills");
const TEMPLATE = resolve(SKILLS, "video-editing", "studio-template");
const SCRIPTS = resolve(SKILLS, "video-editing", "scripts");
const ANALYZE = resolve(SKILLS, "video-reference-analysis", "scripts", "analyze-reference.mjs");
const STUDIO_DIR =
	process.env.OPENMARKETING_VIDEO_STUDIO ??
	resolve(process.env.OPENMARKETING_HOME ?? homedir(), ".openmarketing", "video-studio");
const REMOTION_BIN = resolve(STUDIO_DIR, "node_modules", ".bin", "remotion");
const RENDER_TIMEOUT_MS = 1_800_000;

// Every video job runs inside a workspace in the agent's cwd:
//   references/  videos the user drops in to be analysed
//   branding/    analysis, storyboard, brand kit, AdSpec JSON and the media it references
//   outputs/     renders and deliverables; outputs/latest.mp4 is always the newest finished video
const WORKSPACE_DIRS = {
	references: "Drop reference videos here (ads, Reels, TikToks, Pins). The agent analyses every video in this folder.",
	branding: "Agent-owned: brand.html (the brand reference page — open it in the desktop app to edit with the agent), reference analysis (analysis/), storyboards, AdSpec JSON (specs/) and the media they use (assets/).",
	outputs: "Agent-owned: renders per project (videos/<slug>/) and platform deliverables. latest.mp4 / latest-cover.jpg are the newest finished video.",
} as const;
const VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".m4v", ".webm", ".mkv"]);

const abs = (p: string, cwd: string) => (isAbsolute(p) ? p : resolve(cwd, p));
const slugify = (name: string) =>
	basename(name, extname(name))
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.split("-")
		.slice(0, 6)
		.join("-") || "video";

function ensureWorkspace(cwd: string): string[] {
	const created: string[] = [];
	for (const [dir, purpose] of Object.entries(WORKSPACE_DIRS)) {
		const path = resolve(cwd, dir);
		if (!existsSync(path)) {
			mkdirSync(path, { recursive: true });
			created.push(dir);
		}
		const readme = resolve(path, "README.md");
		if (!existsSync(readme)) writeFileSync(readme, `# ${dir}/\n\n${purpose}\n`, "utf8");
	}
	return created;
}

function listReferenceVideos(cwd: string): string[] {
	const dir = resolve(cwd, "references");
	if (!existsSync(dir)) return [];
	return readdirSync(dir)
		.filter((name) => VIDEO_EXTENSIONS.has(extname(name).toLowerCase()))
		.map((name) => resolve(dir, name));
}

type QaCheck = { check: string; value: unknown; pass: boolean; severity: "fail" | "warn"; rule: string };

// Measurable part of the style-bible QA gate (skills/video-editing/references/style-bible.md §5.5).
// "fail" blocks delivery; "warn" needs a look at the contact sheet before shipping.
function qaChecks(metrics: any): QaCheck[] {
	const v = metrics.video ?? {};
	const a = metrics.audio;
	const motion: number[] = metrics.motionPerSecond ?? [];
	const dead = motion.slice(0, -1).filter((m) => m <= 0.2).length;
	return [
		{ check: "resolution", value: `${v.width}x${v.height}`, pass: v.width === 1080 && v.height === 1920, severity: "fail", rule: "1080x1920" },
		{ check: "fps", value: v.fps, pass: Math.round(v.fps) === 30, severity: "fail", rule: "30" },
		{ check: "codec", value: v.codec, pass: v.codec === "h264", severity: "fail", rule: "h264" },
		{ check: "audio present", value: Boolean(a), pass: Boolean(a), severity: "warn", rule: "VO and/or music bed" },
		{ check: "integrated loudness", value: a?.integratedLUFS, pass: a ? a.integratedLUFS >= -15 && a.integratedLUFS <= -13 : true, severity: "fail", rule: "-15..-13 LUFS" },
		{ check: "true peak", value: a?.truePeakDBFS, pass: a ? a.truePeakDBFS <= -0.5 : true, severity: "fail", rule: "<= -0.5 dBTP (target -1)" },
		{ check: "loudness range", value: a?.loudnessRangeLU, pass: a ? a.loudnessRangeLU <= 6 : true, severity: "warn", rule: "<= 6 LU" },
		{ check: "silence", value: a?.silentShare, pass: a ? a.silentShare <= 0.05 : true, severity: "warn", rule: "<= 5% silent" },
		{ check: "hook motion (second 0)", value: motion[0], pass: (motion[0] ?? 0) > 1.0, severity: "warn", rule: "> 1.0 — something moves in the first second" },
		{ check: "dead seconds", value: dead, pass: dead === 0, severity: "warn", rule: "every second has motion > 0.2 (end-card hold excepted)" },
		{ check: "mean saturation", value: metrics.look?.meanSaturation, pass: (metrics.look?.meanSaturation ?? 0) <= 20, severity: "warn", rule: "<= 20 (one accent hue)" },
		{ check: "bitrate", value: v.bitrateKbps, pass: v.bitrateKbps >= 2000, severity: "warn", rule: ">= 2000 kbps (dark gradients need more; check for banding)" },
	];
}

const text = (t: string, details?: unknown) => ({ content: [{ type: "text" as const, text: t }], details });

function studioReady(): boolean {
	if (!existsSync(REMOTION_BIN)) return false;
	// dependency set changed in a newer package version -> reinstall
	const read = (p: string) => (existsSync(p) ? readFileSync(p, "utf8") : "");
	return read(resolve(TEMPLATE, "package.json")) === read(resolve(STUDIO_DIR, "package.json"));
}

async function ensureStudio(): Promise<string | null> {
	if (!studioReady()) {
		mkdirSync(STUDIO_DIR, { recursive: true });
		cpSync(resolve(TEMPLATE, "package.json"), resolve(STUDIO_DIR, "package.json"), { force: true });
		const setup = await runCli("sh", [resolve(SCRIPTS, "setup-video-stack.sh"), STUDIO_DIR], { timeoutMs: 900_000 });
		if (setup.code !== 0 || !existsSync(REMOTION_BIN)) return `Video stack setup failed.\n${formatCliResult(setup)}`;
	}
	for (const entry of ["src", "remotion.config.ts", "tsconfig.json"]) {
		cpSync(resolve(TEMPLATE, entry), resolve(STUDIO_DIR, entry), { recursive: true, force: true });
	}
	return null;
}

export function registerVideoTools(pi: ExtensionAPI): void {
	pi.registerTool({
		name: "video_workspace",
		label: "Video Workspace",
		description:
			"Create (idempotently) the video work folders in the current directory — references/ (user's reference videos), branding/ (analysis, storyboard, brand kit, specs, assets), outputs/ (renders; latest.mp4 = newest finished video) — and list the reference videos waiting in references/. Call this first in every video task.",
		parameters: Type.Object({}),
		async execute(_id, _params, _signal, _onUpdate, ctx) {
			const created = ensureWorkspace(ctx.cwd);
			const videos = listReferenceVideos(ctx.cwd);
			const analysed = videos.filter((video) => existsSync(resolve(ctx.cwd, "branding", "analysis", slugify(video), "metrics.json")));
			const lines = [
				`Video workspace: ${ctx.cwd}`,
				created.length ? `Created: ${created.map((d) => `${d}/`).join(", ")}` : "All work folders already exist.",
				`references/: ${videos.length} video(s)${videos.length ? `, ${analysed.length} already analysed` : " — ask the user to drop reference videos there"}`,
				...videos.map((video) => `  - ${basename(video)}${analysed.includes(video) ? " (analysed)" : ""} -> branding/analysis/${slugify(video)}/`),
				existsSync(resolve(ctx.cwd, "outputs", "latest.mp4")) ? "Latest video: outputs/latest.mp4" : "No finished video yet.",
			];
			return text(lines.join("\n"), { cwd: ctx.cwd, created, references: videos, analysed });
		},
	});

	pi.registerTool({
		name: "video_setup",
		label: "Video Stack Setup",
		description:
			"Install or verify the agent-managed video stack (ffmpeg, whisper.cpp + model, Remotion studio with headless Chrome). Idempotent; video_render calls it automatically, so use this only to pre-warm or diagnose.",
		parameters: Type.Object({}),
		async execute() {
			const error = await ensureStudio();
			if (error) return text(error);
			const versions = await runCli(REMOTION_BIN, ["versions"], { cwd: STUDIO_DIR, timeoutMs: 60_000 });
			return text(`Video stack ready at ${STUDIO_DIR}\n${formatCliResult(versions)}`, { studioDir: STUDIO_DIR });
		},
	});

	pi.registerTool({
		name: "video_analyze_reference",
		label: "Analyze Reference Video",
		description:
			"Measure a reference video: cuts/shot lengths, pacing, hook frames (first 3 s), per-shot keyframes, contact sheets, luma/saturation, motion energy, loudness (LUFS/true peak), BPM/onsets, cut-on-beat share, and a whisper transcript. Writes metrics.json + images to outDir; view the images to judge typography, lighting and transitions.",
		parameters: Type.Object({
			video: Type.String({ description: "Path to the reference video, normally references/<file>." }),
			outDir: Type.Optional(Type.String({ description: "Output directory (default branding/analysis/<video-slug>)." })),
			sceneThreshold: Type.Optional(Type.Number({ description: "Scene-cut threshold (default 0.2). Lower for dark motion graphics, higher for flashy footage." })),
			transcript: Type.Optional(Type.Boolean({ description: "Run whisper transcription (default true)." })),
		}),
		async execute(_id, params, _signal, _onUpdate, ctx) {
			ensureWorkspace(ctx.cwd);
			const outDir = abs(params.outDir ?? `branding/analysis/${slugify(params.video)}`, ctx.cwd);
			const args = [ANALYZE, abs(params.video, ctx.cwd), outDir];
			if (typeof params.sceneThreshold === "number") args.push("--scene", String(params.sceneThreshold));
			if (params.transcript === false) args.push("--no-transcript");
			const result = await runCli(process.execPath, args, { timeoutMs: 900_000 });
			const metricsPath = resolve(outDir, "metrics.json");
			const metrics = existsSync(metricsPath) ? JSON.parse(readFileSync(metricsPath, "utf8")) : null;
			const summary = metrics
				? JSON.stringify({ duration: metrics.duration, video: metrics.video, pacing: metrics.pacing, audio: metrics.audio && { ...metrics.audio, onsets: undefined, silences: undefined }, transcript: metrics.transcript, sheets: metrics.sheets, hook: metrics.hook }, null, 2)
				: "";
			return text(`${formatCliResult(result)}\nAnalysis: ${outDir}\n${summary}`, metrics);
		},
	});

	pi.registerTool({
		name: "video_transcribe",
		label: "Transcribe to Captions",
		description:
			"Transcribe a voice-over (audio or video file) with whisper.cpp into word-level caption JSON (@remotion/captions Caption[]). Reference the output from an AdSpec `captions` field.",
		parameters: Type.Object({
			input: Type.String({ description: "Audio or video file with speech." }),
			output: Type.String({ description: "Caption JSON path inside the assets dir, e.g. branding/assets/<slug>/captions.json." }),
			language: Type.Optional(Type.String({ description: "Language code (default en). Non-English needs a multilingual model via WHISPER_MODEL." })),
		}),
		async execute(_id, params, _signal, _onUpdate, ctx) {
			const args = [resolve(SCRIPTS, "transcribe.mjs"), abs(params.input, ctx.cwd), abs(params.output, ctx.cwd)];
			if (params.language) args.push("--lang", params.language);
			const result = await runCli(process.execPath, args, { timeoutMs: 900_000 });
			return text(formatCliResult(result), { output: abs(params.output, ctx.cwd) });
		},
	});

	pi.registerTool({
		name: "video_render",
		label: "Render Video (Remotion)",
		description:
			"Render a video from an AdSpec JSON with the agent-managed Remotion studio (1080x1920, 30 fps). Media paths in the spec are relative to assetsDir. Installs the stack on first use. Follow with video_still for frame QA and video_finish for loudness + platform encodes.",
		parameters: Type.Object({
			spec: Type.String({ description: "Path to the AdSpec JSON (see skills/video-editing/SKILL.md)." }),
			assetsDir: Type.Optional(Type.String({ description: "Directory holding the spec's media (voiceover, captions, footage, stills, music, sfx). Default branding/assets/<spec-name>." })),
			output: Type.Optional(Type.String({ description: "Output MP4 path. Default outputs/videos/<spec-name>/<spec-name>-master.mp4." })),
			composition: Type.Optional(Type.String({ description: "Composition id (default SpecAd)." })),
			draft: Type.Optional(Type.Boolean({ description: "Half-resolution fast draft for review (default false)." })),
		}),
		async execute(_id, params, _signal, _onUpdate, ctx) {
			const error = await ensureStudio();
			if (error) return text(error);
			ensureWorkspace(ctx.cwd);
			const name = slugify(params.spec);
			const output = abs(params.output ?? `outputs/videos/${name}/${name}-master.mp4`, ctx.cwd);
			mkdirSync(dirname(output), { recursive: true });
			const args = [
				"render",
				"src/index.ts",
				params.composition ?? "SpecAd",
				output,
				`--props=${abs(params.spec, ctx.cwd)}`,
				`--public-dir=${abs(params.assetsDir ?? `branding/assets/${name}`, ctx.cwd)}`,
				"--log=error",
			];
			if (params.draft) args.push("--scale=0.5", "--crf=28");
			const result = await runCli(REMOTION_BIN, args, { cwd: STUDIO_DIR, timeoutMs: RENDER_TIMEOUT_MS });
			if (result.code !== 0 || !existsSync(output)) return text(`Render failed.\n${formatCliResult(result)}`);
			const probe = await runCli("ffprobe", ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", output], { timeoutMs: 30_000 });
			return text(`Rendered ${output}`, tryParseJson(probe.stdout));
		},
	});

	pi.registerTool({
		name: "video_still",
		label: "Render Video Frame",
		description:
			"Render single frames from an AdSpec as PNGs so you can look at them (Read the image) before or after a full render: check type size, safe zones, contrast, layout. Much faster than a full render.",
		parameters: Type.Object({
			spec: Type.String({ description: "Path to the AdSpec JSON." }),
			assetsDir: Type.Optional(Type.String({ description: "Directory holding the spec's media. Default branding/assets/<spec-name>." })),
			outDir: Type.Optional(Type.String({ description: "Directory for the PNGs. Default outputs/videos/<spec-name>/frames." })),
			frames: Type.Array(Type.Integer(), { description: "Frame numbers at 30 fps (e.g. [0, 15, 45, 120])." }),
			composition: Type.Optional(Type.String({ description: "Composition id (default SpecAd)." })),
		}),
		async execute(_id, params, _signal, _onUpdate, ctx) {
			const error = await ensureStudio();
			if (error) return text(error);
			const name = slugify(params.spec);
			const outDir = abs(params.outDir ?? `outputs/videos/${name}/frames`, ctx.cwd);
			const assetsDir = abs(params.assetsDir ?? `branding/assets/${name}`, ctx.cwd);
			const written: string[] = [];
			for (const frame of params.frames) {
				const out = resolve(outDir, `frame-${String(frame).padStart(5, "0")}.png`);
				const result = await runCli(
					REMOTION_BIN,
					["still", "src/index.ts", params.composition ?? "SpecAd", out, `--frame=${frame}`, `--props=${abs(params.spec, ctx.cwd)}`, `--public-dir=${assetsDir}`, "--log=error"],
					{ cwd: STUDIO_DIR, timeoutMs: 300_000 },
				);
				if (result.code !== 0) return text(`Still failed at frame ${frame}.\n${formatCliResult(result)}`, { written });
				written.push(out);
			}
			return text(`Rendered ${written.length} frames:\n${written.join("\n")}`, { written });
		},
	});

	pi.registerTool({
		name: "video_finish",
		label: "Finish & Encode Video",
		description:
			"Deliverable pass on a rendered master: two-pass loudnorm to -14 LUFS / -1 dBTP, H.264 high/yuv420p/bt709/faststart encodes for pinterest|reels|tiktok|shorts|all, a cover JPG, and QA metrics (same analyzer as references) to compare against the video-editing QA gate. Runs the QA gate (PASS / PASS_WITH_WARNINGS / FAIL) and, unless it FAILs, publishes the result as outputs/latest.mp4 + outputs/latest-cover.jpg + outputs/latest.json.",
		parameters: Type.Object({
			input: Type.String({ description: "Rendered master MP4." }),
			outDir: Type.Optional(Type.String({ description: "Delivery directory (default: the master's folder, i.e. outputs/videos/<slug>/)." })),
			target: Type.Optional(Type.String({ description: "pinterest | reels | tiktok | shorts | all (default all)." })),
			coverAtSeconds: Type.Optional(Type.Number({ description: "Timestamp for the cover frame (default 1.0)." })),
		}),
		async execute(_id, params, _signal, _onUpdate, ctx) {
			const input = abs(params.input, ctx.cwd);
			const outDir = abs(params.outDir ?? dirname(input), ctx.cwd);
			const target = params.target ?? "all";
			const result = await runCli(
				"sh",
				[resolve(SCRIPTS, "finish.sh"), input, outDir, target, String(params.coverAtSeconds ?? 1)],
				{ timeoutMs: RENDER_TIMEOUT_MS },
			);
			const base = basename(input, ".mp4");
			const metricsPath = resolve(outDir, `${base}-qa`, "metrics.json");
			const metrics = existsSync(metricsPath) ? JSON.parse(readFileSync(metricsPath, "utf8")) : null;
			const qa = metrics ? JSON.stringify({ duration: metrics.duration, video: metrics.video, pacing: metrics.pacing, loudness: metrics.audio && { integratedLUFS: metrics.audio.integratedLUFS, truePeakDBFS: metrics.audio.truePeakDBFS }, sheets: metrics.sheets.map((s: string) => resolve(outDir, `${base}-qa`, s)) }, null, 2) : "";

			const checks = metrics ? qaChecks(metrics) : [];
			const failed = checks.filter((c) => !c.pass && c.severity === "fail");
			const warned = checks.filter((c) => !c.pass && c.severity === "warn");
			const verdict = !metrics ? "UNVERIFIED" : failed.length ? "FAIL" : warned.length ? "PASS_WITH_WARNINGS" : "PASS";
			if (metrics) writeFileSync(resolve(outDir, `${base}-qa`, "verdict.json"), JSON.stringify({ verdict, checks }, null, 2) + "\n", "utf8");
			const qaTable = checks.map((c) => `${c.pass ? "ok  " : c.severity === "fail" ? "FAIL" : "warn"} ${c.check}: ${JSON.stringify(c.value)} (${c.rule})`).join("\n");

			// newest finished video is always reachable at outputs/latest.mp4
			const preferred = target === "all" ? "reels" : target;
			const delivered = resolve(outDir, `${base}-${preferred}.mp4`);
			const cover = resolve(outDir, `${base}-cover.jpg`);
			let latest = "";
			if (result.code === 0 && existsSync(delivered) && verdict !== "FAIL") {
				const outputsDir = resolve(ctx.cwd, "outputs");
				mkdirSync(outputsDir, { recursive: true });
				copyFileSync(delivered, resolve(outputsDir, "latest.mp4"));
				if (existsSync(cover)) copyFileSync(cover, resolve(outputsDir, "latest-cover.jpg"));
				writeFileSync(
					resolve(outputsDir, "latest.json"),
					JSON.stringify({ source: delivered, master: input, target: preferred, finishedAt: new Date().toISOString(), verdict, qa: metrics && { duration: metrics.duration, loudness: metrics.audio && { integratedLUFS: metrics.audio.integratedLUFS, truePeakDBFS: metrics.audio.truePeakDBFS } } }, null, 2) + "\n",
					"utf8",
				);
				latest = `\nLatest video: ${resolve(outputsDir, "latest.mp4")}`;
			}
			const gate = `QA verdict: ${verdict}${verdict === "FAIL" ? " — not published to outputs/latest.mp4; fix the failing checks and re-render" : ""}\n${qaTable}`;
			return text(`${formatCliResult(result)}${latest}\n${gate}\n${qa}`, { verdict, checks, metrics });
		},
	});
}
