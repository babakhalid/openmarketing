#!/usr/bin/env node
// Deterministic first pass over a reference video: cuts, shot lengths, keyframes,
// hook burst, contact sheet, loudness, silence, and (optionally) a transcript.
// Usage: node analyze-reference.mjs <video> <out-dir> [--scene 0.2] [--lang auto] [--no-transcript]
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
	const i = args.indexOf(name);
	return i === -1 ? fallback : args[i + 1];
};
const [input, outArg] = args.filter((a, i) => !a.startsWith("--") && !["--scene", "--lang"].includes(args[i - 1]));
if (!input || !outArg) {
	console.error("usage: analyze-reference.mjs <video> <out-dir> [--scene 0.2] [--lang auto] [--no-transcript]");
	process.exit(1);
}
const sceneThreshold = Number(flag("--scene", "0.2"));
const out = resolve(outArg);
for (const d of ["keyframes", "hook", "sheets"]) mkdirSync(join(out, d), { recursive: true });

function run(cmd, cmdArgs) {
	const r = spawnSync(cmd, cmdArgs, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
	if (r.error) throw r.error;
	return { stdout: r.stdout ?? "", stderr: r.stderr ?? "", status: r.status };
}
const ff = (a) => run("ffmpeg", ["-hide_banner", "-nostdin", "-y", ...a]);

// --- probe
const probe = JSON.parse(run("ffprobe", ["-v", "error", "-print_format", "json", "-show_format", "-show_streams", input]).stdout);
const v = probe.streams.find((s) => s.codec_type === "video");
const a = probe.streams.find((s) => s.codec_type === "audio");
const duration = Number(probe.format.duration);
const [num, den] = v.r_frame_rate.split("/").map(Number);
const fps = num / (den || 1);

// --- cuts via scene score
const sceneRun = ff(["-i", input, "-an", "-vf", `select='gt(scene,${sceneThreshold})',showinfo`, "-f", "null", "-"]);
const rawCuts = [...sceneRun.stderr.matchAll(/pts_time:([\d.]+)/g)].map((m) => Number(m[1])).filter((t) => t > 0.05);
const cuts = rawCuts.filter((t, i) => i === 0 || t - rawCuts[i - 1] >= 0.2);
const bounds = [0, ...cuts, duration];
const shots = bounds.slice(0, -1).map((start, i) => ({ index: i, start: +start.toFixed(3), end: +bounds[i + 1].toFixed(3), duration: +(bounds[i + 1] - start).toFixed(3) }));
const lengths = shots.map((s) => s.duration).sort((x, y) => x - y);
const median = lengths[Math.floor(lengths.length / 2)];

// --- keyframe at the middle of each shot (capped), plus first/last frame of the video
const maxKeyframes = 48;
const step = Math.max(1, Math.ceil(shots.length / maxKeyframes));
const keyframes = [];
for (const s of shots.filter((_, i) => i % step === 0)) {
	const t = s.start + s.duration / 2;
	const file = join("keyframes", `shot-${String(s.index).padStart(3, "0")}-${t.toFixed(2)}s.jpg`);
	ff(["-ss", t.toFixed(3), "-i", input, "-frames:v", "1", "-vf", "scale=480:-2", "-q:v", "3", join(out, file)]);
	keyframes.push({ shot: s.index, t: +t.toFixed(3), file });
}

// --- hook burst: first 3 s at 4 fps, tiled, to read the opening motion and text reveal
ff(["-t", "3", "-i", input, "-vf", "fps=4,scale=240:-2,tile=6x2:padding=4:color=white", "-frames:v", "1", join(out, "hook", "hook-0-3s.jpg")]);
for (const t of [0, 0.5, 1, 1.5, 2, 3]) {
	ff(["-ss", String(t), "-i", input, "-frames:v", "1", "-vf", "scale=540:-2", "-q:v", "2", join(out, "hook", `hook-${t.toFixed(1)}s.jpg`)]);
}

// --- contact sheets: whole video sampled evenly into 24 frames per sheet
const sheetFrames = 24;
const sampleFps = Math.max(sheetFrames / duration, 0.2);
const sheetsNeeded = Math.ceil((duration * sampleFps) / sheetFrames);
ff(["-i", input, "-vf", `fps=${sampleFps.toFixed(4)},scale=180:-2,tile=6x4:padding=4:color=white`, "-vsync", "vfr", join(out, "sheets", "sheet-%02d.jpg")]);

// --- motion proxy: mean frame difference per second (camera/kinetic energy curve)
const motionRun = ff(["-i", input, "-an", "-vf", "fps=10,scale=160:-2,tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG", "-f", "null", "-"]);
const motionVals = [...motionRun.stderr.matchAll(/YAVG=([\d.]+)/g)].map((m) => Number(m[1]));
const meanMotion = motionVals.reduce((x, y) => x + y, 0) / (motionVals.length || 1);
const sdMotion = Math.sqrt(motionVals.reduce((x, y) => x + (y - meanMotion) ** 2, 0) / (motionVals.length || 1));
const visualEvents = [];
for (let i = 1; i < motionVals.length - 1; i++) {
	const t = i / 10;
	if (motionVals[i] > meanMotion + 2 * sdMotion && motionVals[i] >= motionVals[i - 1] && motionVals[i] >= motionVals[i + 1] && (!visualEvents.length || t - visualEvents.at(-1) >= 0.3)) visualEvents.push(+t.toFixed(1));
}
const motionPerSecond = [];
for (let i = 0; i < motionVals.length; i += 10) {
	const chunk = motionVals.slice(i, i + 10);
	motionPerSecond.push(+(chunk.reduce((x, y) => x + y, 0) / chunk.length).toFixed(2));
}

// --- color: average brightness/saturation per shot keyframe
const colorRun = ff(["-i", input, "-an", "-vf", "fps=1,scale=160:-2,signalstats,metadata=print:key=lavfi.signalstats.SATAVG", "-f", "null", "-"]);
const sat = [...colorRun.stderr.matchAll(/SATAVG=([\d.]+)/g)].map((m) => Number(m[1]));
const lumaRun = ff(["-i", input, "-an", "-vf", "fps=1,scale=160:-2,signalstats,metadata=print:key=lavfi.signalstats.YAVG", "-f", "null", "-"]);
const luma = [...lumaRun.stderr.matchAll(/YAVG=([\d.]+)/g)].map((m) => Number(m[1]));
const avg = (xs) => (xs.length ? +(xs.reduce((x, y) => x + y, 0) / xs.length).toFixed(2) : null);

// --- audio: loudness, silence, waveform
let audio = null;
let beat = null;
if (a) {
	const loudRaw = ff(["-i", input, "-vn", "-af", "ebur128=peak=true", "-f", "null", "-"]).stderr;
	const loud = loudRaw.slice(loudRaw.lastIndexOf("Summary:"));
	const pick = (re) => Number(loud.match(re)?.[1] ?? NaN);

	// onset envelope at 20 ms hops -> positive energy flux -> onsets + tempo by autocorrelation
	const env = ff(["-i", input, "-vn", "-af", "aformat=channel_layouts=mono,aresample=22050,asetnsamples=n=441:p=0,astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level", "-f", "null", "-"]).stderr;
	const rms = [...env.matchAll(/RMS_level=(-?[\d.]+|-inf)/g)].map((m) => (m[1] === "-inf" ? -120 : Number(m[1])));
	const hop = 0.02;
	const flux = rms.map((x, i) => (i === 0 ? 0 : Math.max(0, x - rms[i - 1])));
	const meanFlux = flux.reduce((x, y) => x + y, 0) / (flux.length || 1);
	const onsets = [];
	for (let i = 1; i < flux.length - 1; i++) {
		if (flux[i] > meanFlux * 3 && flux[i] >= flux[i - 1] && flux[i] >= flux[i + 1] && (!onsets.length || i * hop - onsets.at(-1) > 0.1)) onsets.push(+(i * hop).toFixed(2));
	}
	let bestLag = 0;
	let bestScore = -Infinity;
	for (let lag = Math.round(60 / 180 / hop); lag <= Math.round(60 / 70 / hop); lag++) {
		let score = 0;
		for (let i = lag; i < flux.length; i++) score += flux[i] * flux[i - lag];
		if (score > bestScore) [bestScore, bestLag] = [score, lag];
	}
	beat = {
		estimatedBPM: bestLag ? +(60 / (bestLag * hop)).toFixed(1) : null,
		onsetCount: onsets.length,
		onsets,
		cutsOnOnsetShare: cuts.length ? +(cuts.filter((c) => onsets.some((o) => Math.abs(o - c) <= 0.08)).length / cuts.length).toFixed(2) : null,
	};
	const silence = ff(["-i", input, "-vn", "-af", "silencedetect=n=-40dB:d=0.4", "-f", "null", "-"]).stderr;
	const silences = [...silence.matchAll(/silence_start: ([\d.]+)[\s\S]*?silence_end: ([\d.]+)/g)].map((m) => ({ start: +m[1], end: +m[2] }));
	ff(["-i", input, "-filter_complex", "showwavespic=s=1600x240:colors=0x333333", "-frames:v", "1", join(out, "waveform.png")]);
	audio = {
		codec: a.codec_name,
		integratedLUFS: pick(/I:\s+(-?[\d.]+) LUFS/),
		loudnessRangeLU: pick(/LRA:\s+(-?[\d.]+) LU/),
		truePeakDBFS: pick(/True peak:\s+Peak:\s+(-?[\d.]+) dBFS/),
		silences,
		silentShare: +(silences.reduce((x, s) => x + (s.end - s.start), 0) / duration).toFixed(3),
		...beat,
	};
}

// --- transcript (whisper.cpp), if available
let transcript = null;
const model = process.env.WHISPER_MODEL ?? [join(homedir(), ".cache", "whisper", "ggml-base.bin"), join(homedir(), ".cache", "whisper", "ggml-base.en.bin")].find((m) => existsSync(m)) ?? "";
const hasWhisper = run("sh", ["-c", "command -v whisper-cli"]).status === 0;
if (a && !args.includes("--no-transcript") && hasWhisper && existsSync(model)) {
	const wav = join(out, "audio-16k.wav");
	ff(["-i", input, "-vn", "-ac", "1", "-ar", "16000", wav]);
	// .en models cannot detect language; multilingual models auto-detect (pt-BR refs are common)
	const lang = model.endsWith(".en.bin") ? "en" : flag("--lang", "auto");
	run("whisper-cli", ["-m", model, "-f", wav, "-l", lang, "-oj", "-osrt", "-of", join(out, "transcript")]);
	if (existsSync(join(out, "transcript.json"))) {
		// whisper hallucinates repeated lines over music-only beds; flag that instead of trusting it
		const segs = JSON.parse(readFileSync(join(out, "transcript.json"), "utf8")).transcription ?? [];
		const lines = segs.map((s) => s.text.trim().toLowerCase()).filter(Boolean);
		const uniqueShare = lines.length ? new Set(lines).size / lines.length : 0;
		const detected = JSON.parse(readFileSync(join(out, "transcript.json"), "utf8")).result?.language ?? null;
		transcript = { file: "transcript.json", srt: "transcript.srt", language: detected, model: model.split("/").pop(), segments: lines.length, uniqueLineShare: +uniqueShare.toFixed(2), likelyMusicOnly: lines.length === 0 || uniqueShare < 0.6 };
	}
}

const metrics = {
	source: input,
	analyzedAt: new Date().toISOString(),
	video: { width: v.width, height: v.height, aspect: +(v.width / v.height).toFixed(4), fps: +fps.toFixed(3), codec: v.codec_name, bitrateKbps: Math.round(Number(probe.format.bit_rate) / 1000) },
	duration: +duration.toFixed(3),
	sceneThreshold,
	pacing: {
		shotCount: shots.length,
		cutsPerMinute: +((cuts.length / duration) * 60).toFixed(2),
		medianShotSeconds: median,
		meanShotSeconds: +(duration / shots.length).toFixed(3),
		shortestShotSeconds: lengths[0],
		longestShotSeconds: lengths[lengths.length - 1],
		firstCutSeconds: cuts[0] ?? null,
		rawCutCount: rawCuts.length,
		// frame-difference peaks: scene changes + punch-ins + flashes + reveals (detector-independent rhythm)
		visualEventsPerMinute: +((visualEvents.length / duration) * 60).toFixed(2),
		visualEvents,
	},
	look: { meanSaturation: avg(sat), meanLuma: avg(luma), saturationPerSecond: sat, lumaPerSecond: luma },
	motionPerSecond,
	audio,
	transcript,
	shots,
	keyframes,
	hook: { strip: "hook/hook-0-3s.jpg", stills: ["0.0", "0.5", "1.0", "1.5", "2.0", "3.0"].map((t) => `hook/hook-${t}s.jpg`) },
	sheets: Array.from({ length: sheetsNeeded }, (_, i) => `sheets/sheet-${String(i + 1).padStart(2, "0")}.jpg`).filter((f) => existsSync(join(out, f))),
	waveform: audio ? "waveform.png" : null,
};
writeFileSync(join(out, "metrics.json"), JSON.stringify(metrics, null, 2));
console.log(`${input}\n  ${shots.length} shots, ${metrics.pacing.cutsPerMinute} cuts/min, median shot ${median}s, ${keyframes.length} keyframes -> ${out}`);
