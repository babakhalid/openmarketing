import type { ToolResult } from "./types";

export const mediaUrl = (path: string) => `media://local${path.split("/").map(encodeURIComponent).join("/")}`;
// HTML pages served with the element picker injected (see electron/picker.js)
export const inspectUrl = (path: string, version?: number) => `media://inspect${path.split("/").map(encodeURIComponent).join("/")}${version ? `?v=${Math.round(version)}` : ""}`;

export const rel = (path: string | undefined, cwd: string) => {
	if (!path) return "";
	return path.startsWith(cwd + "/") ? path.slice(cwd.length + 1) : path.replace(/^\/Users\/[^/]+/, "~");
};

export const abs = (path: string | undefined, cwd: string) => (!path ? "" : path.startsWith("/") ? path : `${cwd}/${path}`);

export const resultText = (result?: ToolResult) =>
	(result?.content ?? [])
		.filter((block) => block.type === "text")
		.map((block) => block.text ?? "")
		.join("\n");

export const timecode = (ms: number) => {
	if (!Number.isFinite(ms) || ms < 0) return "00:00.0";
	const s = ms / 1000;
	const m = Math.floor(s / 60);
	return `${String(m).padStart(2, "0")}:${(s - m * 60).toFixed(1).padStart(4, "0")}`;
};

export const bytes = (n: number) => (n > 1e9 ? `${(n / 1e9).toFixed(1)} GB` : n > 1e6 ? `${(n / 1e6).toFixed(1)} MB` : n > 1e3 ? `${Math.round(n / 1e3)} KB` : `${n} B`);

export const lineMatch = (text: string, re: RegExp) => text.match(re)?.[1]?.trim();
