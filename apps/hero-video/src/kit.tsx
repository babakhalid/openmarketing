// Shared primitives for the hero film: the desktop app's tokens, easing, glass surfaces,
// the edge light sweep, scramble text and whip transitions between shots.
import "@fontsource-variable/jetbrains-mono";
import type { CSSProperties, ReactNode } from "react";
import { Easing, interpolate, random, useCurrentFrame } from "remotion";

export const T = {
	bg: "#0b0b0b",
	panel: "rgba(30, 30, 30, 0.78)",
	raise: "#202020",
	raise2: "#262626",
	text: "#ececec",
	text2: "#a8a8a8",
	text3: "#6f6f6f",
	line: "rgba(255, 255, 255, 0.08)",
	line2: "rgba(255, 255, 255, 0.14)",
	invert: "#f2f2f2",
	onInvert: "#141414",
	mode: "rgba(74, 222, 128, 0.13)",
	modeText: "#6ee7a0",
	sans: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
	mono: '"JetBrains Mono Variable", ui-monospace, monospace',
};

export const ease = Easing.bezier(0.16, 1, 0.3, 1);
export const easeIn = Easing.bezier(0.7, 0, 0.84, 0);

// 0 → 1 over [start, start + duration], eased and clamped.
export const prog = (frame: number, start: number, duration: number, easing = ease) =>
	interpolate(frame, [start, start + duration], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

export const mix = (t: number, a: number, b: number) => a + (b - a) * t;

// A shot that whips in from the right and out to the left with directional blur, like the reference.
export function Shot({ duration, children, enter = 12, exit = 12, style }: { duration: number; children: ReactNode; enter?: number; exit?: number; style?: CSSProperties }) {
	const f = useCurrentFrame();
	const tin = enter ? prog(f, 0, enter) : 1;
	const tout = exit ? prog(f, duration - exit, exit, easeIn) : 0;
	const x = mix(tin, 260, 0) + mix(tout, 0, -320);
	const blur = (1 - tin) * 26 + tout * 30;
	const opacity = Math.min(tin * 1.4, 1 - tout);
	return (
		<div style={{ position: "absolute", inset: 0, transform: `translateX(${x}px)`, filter: blur > 0.3 ? `blur(${blur}px)` : undefined, opacity, ...style }}>
			{children}
		</div>
	);
}

// The desktop app's glass surface: raised zinc, hairline border, a lit top edge.
export function Glass({ children, style, radius = 18 }: { children?: ReactNode; style?: CSSProperties; radius?: number }) {
	return (
		<div
			style={{
				position: "relative",
				background: T.panel,
				borderRadius: radius,
				boxShadow: `inset 0 0 0 1px ${T.line}, inset 0 1px 0 rgba(255,255,255,0.07), 0 40px 120px -40px rgba(0,0,0,0.9)`,
				...style,
			}}
		>
			{children}
		</div>
	);
}

// A highlight travelling along the top edge of a surface between two frames.
export function Sweep({ from, duration, radius = 18 }: { from: number; duration: number; radius?: number }) {
	const f = useCurrentFrame();
	const t = prog(f, from, duration, Easing.inOut(Easing.cubic));
	const visible = f >= from && f <= from + duration + 6;
	if (!visible) return null;
	const fade = Math.sin(Math.PI * Math.min(1, t));
	return (
		<div style={{ position: "absolute", inset: 0, borderRadius: radius, overflow: "hidden", pointerEvents: "none" }}>
			<div
				style={{
					position: "absolute",
					top: 0,
					left: `${mix(t, -30, 100)}%`,
					width: "30%",
					height: 1.5,
					background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)",
					opacity: fade,
					boxShadow: "0 0 18px 2px rgba(255,255,255,0.35)",
				}}
			/>
		</div>
	);
}

const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz0123456789<>/#*";

// Letters resolve left to right; unresolved ones flicker through glyphs. One resolving letter
// can carry the green accent, like the blue letter in the reference.
export function Scramble({ text, start, perChar = 1.6, accentIndex, style }: { text: string; start: number; perChar?: number; accentIndex?: number; style?: CSSProperties }) {
	const f = useCurrentFrame();
	return (
		<span style={{ whiteSpace: "pre", ...style }}>
			{[...text].map((ch, i) => {
				const at = start + i * perChar;
				if (f < at - 6) return <span key={i} style={{ opacity: 0 }}>{ch}</span>;
				const resolved = f >= at + 4;
				const glyph = ch === " " ? " " : resolved ? ch : GLYPHS[Math.floor(random(`${text}-${i}-${Math.floor(f / 2)}`) * GLYPHS.length)];
				const accent = !resolved && i === accentIndex;
				return (
					<span key={i} style={{ color: accent ? T.modeText : undefined, opacity: resolved ? 1 : 0.75 }}>
						{glyph}
					</span>
				);
			})}
		</span>
	);
}

// Text typed character by character, with a caret while typing.
export function Typed({ text, start, cps = 1.1, caret = true }: { text: string; start: number; cps?: number; caret?: boolean }) {
	const f = useCurrentFrame();
	const n = Math.max(0, Math.min(text.length, Math.floor((f - start) * cps)));
	const typing = f >= start && n < text.length + 6;
	const blink = Math.floor(f / 8) % 2 === 0;
	return (
		<span>
			{text.slice(0, n)}
			{caret && (typing || blink) && f >= start ? <span style={{ display: "inline-block", width: 2, height: "1.05em", marginLeft: 2, verticalAlign: "-0.15em", background: T.text }} /> : null}
		</span>
	);
}

export function Check({ size = 14, color = T.text }: { size?: number; color?: string }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
			<path d="M20 6 9 17l-5-5" />
		</svg>
	);
}

export function Spinner({ size = 14 }: { size?: number }) {
	const f = useCurrentFrame();
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" style={{ transform: `rotate(${f * 14}deg)` }}>
			<circle cx="12" cy="12" r="9" fill="none" stroke={T.line2} strokeWidth="2.4" />
			<path d="M12 3a9 9 0 0 1 9 9" fill="none" stroke={T.text} strokeWidth="2.4" strokeLinecap="round" />
		</svg>
	);
}

// The OM mark from the desktop app (white tile, dark letters).
export function Mark({ size = 56 }: { size?: number }) {
	return (
		<div style={{ width: size, height: size, borderRadius: size * 0.27, background: T.invert, color: T.onInvert, display: "grid", placeItems: "center", fontFamily: T.sans, fontWeight: 650, fontSize: size * 0.36, letterSpacing: "-0.02em" }}>
			OM
		</div>
	);
}

// Static film grain on top of everything, cheap to render.
export function Grain() {
	return (
		<svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.07, mixBlendMode: "overlay", pointerEvents: "none" }}>
			<filter id="g">
				<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
			</filter>
			<rect width="100%" height="100%" filter="url(#g)" />
		</svg>
	);
}
