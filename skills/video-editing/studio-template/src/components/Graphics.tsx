import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { ease, ramp, springIn } from "../lib/motion";
import { fonts, safe } from "../lib/theme";

// Rolling number in a glowing pill ("Profit 442049 → 747350" in the 3D trading refs).
export function GlowCounter({
	label = "Profit",
	from = 0,
	to = 100000,
	durationInFrames = 90,
	prefix = "",
	suffix = "",
	color = "#3DDC84",
	y = 0.33,
}: {
	label?: string;
	from?: number;
	to?: number;
	durationInFrames?: number;
	prefix?: string;
	suffix?: string;
	color?: string;
	y?: number;
}) {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const enter = springIn(frame, fps, "snap");
	const value = Math.round(interpolate(frame, [0, durationInFrames], [from, to], { easing: ease.out, extrapolateRight: "clamp" }));
	return (
		<AbsoluteFill style={{ alignItems: "center" }}>
			<div
				style={{
					position: "absolute",
					top: `${y * 100}%`,
					transform: `translateY(${(1 - enter) * 40}px)`,
					opacity: enter,
					padding: "18px 40px 18px 28px",
					borderRadius: 18,
					background: `linear-gradient(180deg, ${color}26 0%, ${color}59 100%)`,
					border: `1.5px solid ${color}88`,
					boxShadow: `0 0 40px ${color}44, inset 0 1px 0 rgba(255,255,255,0.25)`,
					display: "flex",
					alignItems: "flex-end",
					gap: 28,
				}}
			>
				<span style={{ fontFamily: fonts.body, fontWeight: 600, fontSize: 30, color: "#FFFFFFCC", alignSelf: "flex-start" }}>{label}</span>
				<span style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 96, color: "#FFFFFF", fontVariantNumeric: "tabular-nums", letterSpacing: -1 }}>
					{prefix}
					{value.toLocaleString("en-US").replace(/,/g, "")}
					{suffix}
				</span>
			</div>
		</AbsoluteFill>
	);
}

// Numbered chapter card for listicles ("7 · THE CLASSIC" trapezoid badge on a dark glow).
export function ChapterBadge({ index, title, color = "#7C3AED", y = 0.38 }: { index: number; title: string; color?: string; y?: number }) {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const s = springIn(frame, fps, "bounce");
	return (
		<AbsoluteFill style={{ alignItems: "center" }}>
			<div
				style={{
					position: "absolute",
					top: `${y * 100}%`,
					width: 300,
					padding: "26px 20px 34px",
					clipPath: "polygon(0 0, 100% 0, 88% 100%, 12% 100%)",
					background: `linear-gradient(180deg, ${color} 0%, ${color}CC 100%)`,
					boxShadow: `0 0 80px ${color}`,
					textAlign: "center",
					transform: `perspective(900px) rotateX(${(1 - s) * 70}deg) scale(${0.6 + 0.4 * s})`,
					opacity: Math.min(1, s * 1.5),
					color: "#FFFFFF",
				}}
			>
				<div style={{ fontFamily: fonts.display, fontWeight: 900, fontSize: 96, lineHeight: 1 }}>{index}</div>
				<div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 28, textTransform: "uppercase", marginTop: 8, lineHeight: 1.1 }}>{title}</div>
			</div>
		</AbsoluteFill>
	);
}

// Camera viewfinder frame: corner brackets, blinking REC dot, running timecode.
export function Viewfinder({ color = "#FFFFFF", opacity = 0.55 }: { color?: string; opacity?: number }) {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const s = Math.floor(frame / fps);
	const tc = `00:00:${String(s % 60).padStart(2, "0")}:${String(frame % fps).padStart(2, "0")}`;
	const corner = (pos: React.CSSProperties, rot: number) => (
		<div style={{ position: "absolute", width: 70, height: 70, borderTop: `3px solid ${color}`, borderLeft: `3px solid ${color}`, transform: `rotate(${rot}deg)`, ...pos }} />
	);
	return (
		<AbsoluteFill style={{ opacity, pointerEvents: "none" }}>
			{corner({ top: safe.top, left: safe.side }, 0)}
			{corner({ top: safe.top, right: safe.side }, 90)}
			{corner({ bottom: safe.bottom, right: safe.side }, 180)}
			{corner({ bottom: safe.bottom, left: safe.side }, 270)}
			<div style={{ position: "absolute", top: safe.top + 24, left: safe.side + 24, width: 18, height: 18, borderRadius: 9, background: "#FF2D2D", opacity: Math.floor(frame / 15) % 2 ? 1 : 0.2 }} />
			<div style={{ position: "absolute", bottom: safe.bottom + 20, right: safe.side + 20, fontFamily: "monospace", fontSize: 26, color }}>{tc}</div>
		</AbsoluteFill>
	);
}

// Kinetic phrase: lead words small/light, punch word large/heavy/accent with glow (kinetic-type refs).
export function PunchLine({
	lead,
	punch,
	tail,
	color = "#151515",
	accent = "#E10600",
	glow = false,
	y = 0.5,
	punchSize = 150,
	stagger = 4,
}: {
	lead?: string;
	punch: string;
	tail?: string;
	color?: string;
	accent?: string;
	glow?: boolean;
	y?: number;
	punchSize?: number;
	stagger?: number;
}) {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const part = (i: number) => springIn(frame, fps, "pop", i * stagger);
	const blurIn = (i: number) => (1 - part(i)) * 14;
	const leadSize = Math.round(punchSize * 0.38);
	return (
		<AbsoluteFill style={{ alignItems: "center" }}>
			<div style={{ position: "absolute", top: `${y * 100}%`, transform: "translateY(-50%)", textAlign: "center", padding: `0 ${safe.side}px`, fontFamily: fonts.body, letterSpacing: -2 }}>
				{lead ? (
					<div style={{ fontSize: leadSize, fontWeight: 600, color, opacity: part(0), filter: `blur(${blurIn(0)}px)`, transform: `translateY(${(1 - part(0)) * 30}px)` }}>{lead}</div>
				) : null}
				<div
					style={{
						fontSize: punchSize,
						fontWeight: 800,
						lineHeight: 0.95,
						color: accent,
						opacity: part(1),
						filter: `blur(${blurIn(1)}px)`,
						transform: `scale(${0.7 + 0.3 * part(1)})`,
						textShadow: glow ? `0 0 30px ${accent}, 0 0 90px ${accent}88` : undefined,
					}}
				>
					{punch}
				</div>
				{tail ? <div style={{ fontSize: leadSize, fontWeight: 600, color, opacity: part(2) * 0.85, marginTop: 10 }}>{tail}</div> : null}
			</div>
		</AbsoluteFill>
	);
}

// End card: logo/handle lock-up + CTA pill that pulses.
export function CTAEndCard({ handle, cta, color = "#FFFFFF", accent = "#E10600", logoSrc }: { handle: string; cta: string; color?: string; accent?: string; logoSrc?: string }) {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const s = springIn(frame, fps, "bounce");
	const pulse = 1 + 0.04 * Math.sin((frame / fps) * Math.PI * 2);
	return (
		<AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 48, flexDirection: "column" }}>
			{logoSrc ? <Img src={logoSrc} style={{ width: 220, opacity: ramp(frame, 0, 12) }} /> : null}
			<div style={{ fontFamily: fonts.body, fontWeight: 800, fontSize: 72, letterSpacing: -1, color, opacity: ramp(frame, 4, 16) }}>{handle}</div>
			<div
				style={{
					fontFamily: fonts.display,
					fontWeight: 900,
					fontSize: 54,
					color: "#FFFFFF",
					background: accent,
					padding: "28px 64px",
					borderRadius: 999,
					transform: `scale(${s * pulse})`,
					boxShadow: `0 0 60px ${accent}88`,
					textTransform: "uppercase",
				}}
			>
				{cta}
			</div>
		</AbsoluteFill>
	);
}

// Ken Burns still: slow push + drift; used for photo listicles and AI-generated stills.
export function KenBurns({ src, durationInFrames, zoom = [1.04, 1.16], pan = [0, -40] }: { src: string; durationInFrames: number; zoom?: [number, number]; pan?: [number, number] }) {
	const frame = useCurrentFrame();
	const t = interpolate(frame, [0, durationInFrames], [0, 1], { easing: ease.inOut, extrapolateRight: "clamp" });
	return (
		<AbsoluteFill style={{ overflow: "hidden" }}>
			<Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom[0] + (zoom[1] - zoom[0]) * t}) translateY(${pan[0] + (pan[1] - pan[0]) * t}px)` }} />
		</AbsoluteFill>
	);
}
