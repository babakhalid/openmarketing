#!/usr/bin/env node
// Transcribe a voice-over with whisper.cpp into word-level Remotion captions
// (the `Caption` shape from @remotion/captions: text, startMs, endMs, timestampMs, confidence).
// Usage: node transcribe.mjs <audio-or-video> <captions.json> [--model path] [--lang en]
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";

const args = process.argv.slice(2);
const flag = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const [input, output] = args.filter((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
if (!input || !output) {
	console.error("usage: transcribe.mjs <audio-or-video> <captions.json> [--model path] [--lang en]");
	process.exit(1);
}
const model = flag("--model", process.env.WHISPER_MODEL ?? join(homedir(), ".cache", "whisper", "ggml-base.en.bin"));
if (!existsSync(model)) {
	console.error(`whisper model not found: ${model} (run setup-video-stack.sh)`);
	process.exit(1);
}

const work = mkdtempSync(join(tmpdir(), "transcribe-"));
const wav = join(work, "audio.wav");
const ff = spawnSync("ffmpeg", ["-hide_banner", "-nostdin", "-y", "-i", input, "-vn", "-ac", "1", "-ar", "16000", wav], { encoding: "utf8" });
if (ff.status !== 0) {
	console.error(ff.stderr);
	process.exit(1);
}
// --max-len 1 + --split-on-word yields one segment per word with its own timing
const w = spawnSync("whisper-cli", ["-m", model, "-f", wav, "-l", flag("--lang", "en"), "--max-len", "1", "--split-on-word", "-oj", "-of", join(work, "out")], { encoding: "utf8" });
if (w.status !== 0) {
	console.error(w.stderr);
	process.exit(1);
}

const segments = JSON.parse(readFileSync(join(work, "out.json"), "utf8")).transcription ?? [];
const captions = segments
	.map((s) => ({ text: s.text, startMs: s.offsets.from, endMs: s.offsets.to }))
	.filter((c) => c.text.trim() && !/^\[.*\]$/.test(c.text.trim()))
	.map((c) => ({ ...c, text: c.text.startsWith(" ") ? c.text : ` ${c.text}`, timestampMs: c.startMs, confidence: null }));

writeFileSync(output, JSON.stringify(captions, null, 2));
console.log(`${captions.length} word captions -> ${output}`);
