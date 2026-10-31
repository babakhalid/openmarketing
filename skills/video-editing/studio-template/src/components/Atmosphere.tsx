import { noise2D } from "@remotion/noise";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { ease } from "../lib/motion";

// Film grain + vignette. Grain is a per-frame SVG turbulence seed so it actually moves.
export function GrainVignette({ grain = 0.06, vignette = 0.55 }: { grain?: number; vignette?: number }) {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill style={{ pointerEvents: "none" }}>
			<AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, transparent 45%, rgba(0,0,0,${vignette}) 100%)` }} />
			<svg width="100%" height="100%" style={{ position: "absolute", opacity: grain, mixBlendMode: "overlay" }}>
				<filter id={`g${frame % 8}`}>
					<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 8} stitchTiles="stitch" />
				</filter>
				<rect width="100%" height="100%" filter={`url(#g${frame % 8})`} />
			</svg>
		</AbsoluteFill>
	);
}

// Volumetric light cone from a point source (the green "profit" beam / white key light in the 3D refs).
export function LightBeam({
	x = 0.5,
	y = 0.55,
	angle = 180,
	spread = 26,
	color = "#3DDC84",
	intensity = 0.8,
	length = 1400,
	flicker = 0.08,
}: {
	x?: number;
	y?: number;
	angle?: number;
	spread?: number;
	color?: string;
	intensity?: number;
	length?: number;
	flicker?: number;
}) {
	const frame = useCurrentFrame();
	const { width, height } = useVideoConfig();
	const sway = noise2D("beam", frame / 60, 0) * 4;
	const alpha = intensity * (1 - flicker + flicker * noise2D("flick", frame / 8, 1));
	const cx = x * width;
	const cy = y * height;
	return (
		<AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen" }}>
			<div
				style={{
					position: "absolute",
					left: cx - length,
					top: cy,
					width: length * 2,
					height: length,
					transformOrigin: "50% 0%",
					transform: `rotate(${angle - 180 + sway}deg)`,
					background: `conic-gradient(from ${180 - spread / 2}deg at 50% 0%, ${color}00 0deg, ${color}CC ${spread / 2}deg, ${color}00 ${spread}deg, transparent ${spread}deg)`,
					maskImage: "linear-gradient(to bottom, black 0%, transparent 85%)",
					WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 85%)",
					filter: "blur(18px)",
					opacity: alpha,
				}}
			/>
			<div
				style={{
					position: "absolute",
					left: cx - 40,
					top: cy - 40,
					width: 80,
					height: 80,
					borderRadius: "50%",
					background: `radial-gradient(circle, #FFFFFF 0%, ${color} 30%, transparent 70%)`,
					opacity: alpha,
				}}
			/>
		</AbsoluteFill>
	);
}

// Soft colored room glow behind a subject (purple/teal/red wash in creator + 3D refs).
export function AmbientGlow({ color = "#8B5CF6", x = 0.5, y = 0.35, size = 1.1, pulse = 0.15 }: { color?: string; x?: number; y?: number; size?: number; pulse?: number }) {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const p = 1 - pulse / 2 + (pulse / 2) * Math.sin((frame / fps) * Math.PI * 0.8);
	return (
		<AbsoluteFill
			style={{
				pointerEvents: "none",
				background: `radial-gradient(circle at ${x * 100}% ${y * 100}%, ${color}${Math.round(0x66 * p).toString(16).padStart(2, "0")} 0%, transparent ${size * 55}%)`,
			}}
		/>
	);
}

// Flash-to-white or flash-to-black hit used on hard cuts that land on a beat.
export function FlashHit({ at, color = "#FFFFFF", frames = 6 }: { at: number; color?: string; frames?: number }) {
	const frame = useCurrentFrame();
	const o = interpolate(frame, [at, at + 1, at + frames], [0, 0.85, 0], { easing: ease.out, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
	return <AbsoluteFill style={{ backgroundColor: color, opacity: o, pointerEvents: "none" }} />;
}
