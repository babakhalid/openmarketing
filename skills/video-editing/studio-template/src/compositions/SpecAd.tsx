import type { Caption } from "@remotion/captions";
import { linearTiming, TransitionSeries, type TransitionPresentation } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { AbsoluteFill, Audio, interpolate, OffthreadVideo, Sequence, staticFile, type CalculateMetadataFunction } from "remotion";
import { AmbientGlow, FlashHit, GrainVignette, LightBeam } from "../components/Atmosphere";
import { ChapterBadge, CTAEndCard, GlowCounter, KenBurns, PunchLine, Viewfinder } from "../components/Graphics";
import { KineticCaptions } from "../components/KineticCaptions";
import { ease } from "../lib/motion";
import { palettes, type PaletteName } from "../lib/theme";

// An edit decision list an agent can write as JSON. Paths are relative to public/ unless http(s).
export type Scene =
	| { type: "punch"; seconds: number; lead?: string; punch: string; tail?: string; bg?: "light" | "dark"; glow?: boolean }
	| { type: "chapter"; seconds: number; index: number; title: string }
	| { type: "counter"; seconds: number; label?: string; from: number; to: number; prefix?: string; suffix?: string; beam?: boolean }
	| { type: "footage"; seconds: number; src: string; startSec?: number; viewfinder?: boolean; muted?: boolean; zoom?: [number, number] }
	| { type: "still"; seconds: number; src: string; zoom?: [number, number]; pan?: [number, number] }
	| { type: "endcard"; seconds: number; handle: string; cta: string; logo?: string };

export type Transition = "cut" | "fade" | "slide-up" | "slide-left" | "wipe" | "flash";

export type AdSpec = {
	palette: PaletteName;
	// palette tokens copied from branding/brand.html #brand-tokens; override the preset
	brand?: Partial<(typeof palettes)[PaletteName]>;
	scenes: (Scene & { transition?: Transition })[];
	transitionFrames?: number;
	voiceover?: string;
	captions?: string | Caption[];
	captionStyle?: { y?: number; uppercase?: boolean; highlight?: string[]; glow?: boolean; maxFontSize?: number; hideDuring?: Scene["type"][] };
	music?: string;
	musicVolume?: number;
	// music level while the VO is speaking (sidechain-style ducking)
	duckTo?: number;
	sfx?: { src: string; atSec: number; volume?: number }[];
	grain?: number;
	vignette?: number;
};

const isLight = (hex: string) => parseInt(hex.slice(1, 3), 16) + parseInt(hex.slice(3, 5), 16) + parseInt(hex.slice(5, 7), 16) > 384;

const src = (p: string) => (/^https?:\/\//.test(p) ? p : staticFile(p));

function presentation(t: Transition): TransitionPresentation<Record<string, unknown>> | null {
	switch (t) {
		case "fade":
			return fade() as TransitionPresentation<Record<string, unknown>>;
		case "slide-up":
			return slide({ direction: "from-bottom" }) as TransitionPresentation<Record<string, unknown>>;
		case "slide-left":
			return slide({ direction: "from-right" }) as TransitionPresentation<Record<string, unknown>>;
		case "wipe":
			return wipe({ direction: "from-left" }) as TransitionPresentation<Record<string, unknown>>;
		default:
			return null;
	}
}

function SceneView({ scene, fps, palette }: { scene: Scene; fps: number; palette: (typeof palettes)[PaletteName] }) {
	const frames = Math.round(scene.seconds * fps);
	switch (scene.type) {
		case "punch": {
			const dark = scene.bg === "dark";
			return (
				<AbsoluteFill style={{ backgroundColor: dark ? palette.bgAlt : palette.bg }}>
					{dark ? <AmbientGlow color={palette.accent} y={0.5} size={0.7} /> : null}
					<PunchLine lead={scene.lead} punch={scene.punch} tail={scene.tail} color={dark ? "#FFFFFF" : palette.text} accent={palette.accent} glow={scene.glow ?? dark} />
					{dark ? <GrainVignette grain={0} vignette={0.5} /> : null}
				</AbsoluteFill>
			);
		}
		case "chapter":
			return (
				<AbsoluteFill style={{ backgroundColor: isLight(palette.bg) ? palette.bgAlt : palette.bg }}>
					<AmbientGlow color={palette.glow} y={0.42} size={0.9} />
					<GrainVignette grain={0} vignette={0.5} />
					<ChapterBadge index={scene.index} title={scene.title} color={palette.glow} />
				</AbsoluteFill>
			);
		case "counter":
			return (
				<AbsoluteFill style={{ backgroundColor: isLight(palette.bg) ? palette.bgAlt : palette.bg }}>
					<GrainVignette grain={0} vignette={0.55} />
					{scene.beam !== false ? <LightBeam color={palette.accent} x={0.5} y={0.42} /> : null}
					<GlowCounter label={scene.label} from={scene.from} to={scene.to} prefix={scene.prefix} suffix={scene.suffix} color={palette.accent} durationInFrames={frames} />
				</AbsoluteFill>
			);
		case "footage":
			return (
				<AbsoluteFill style={{ backgroundColor: "#000" }}>
					<AbsoluteFill style={{ transform: `scale(${scene.zoom ? scene.zoom[0] : 1})` }}>
						<OffthreadVideo src={src(scene.src)} startFrom={Math.round((scene.startSec ?? 0) * fps)} muted={scene.muted ?? true} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
					</AbsoluteFill>
					<GrainVignette grain={0} vignette={0.4} />
					{scene.viewfinder ? <Viewfinder /> : null}
				</AbsoluteFill>
			);
		case "still":
			return <KenBurns src={src(scene.src)} durationInFrames={frames} zoom={scene.zoom} pan={scene.pan} />;
		case "endcard":
			return (
				<AbsoluteFill style={{ backgroundColor: palette.bg }}>
					{isLight(palette.bg) ? null : <AmbientGlow color={palette.accent} y={0.55} />}
					<CTAEndCard handle={scene.handle} cta={scene.cta} accent={palette.accent2} color={palette.text} logoSrc={scene.logo ? src(scene.logo) : undefined} />
				</AbsoluteFill>
			);
	}
}

export function SpecAd(props: AdSpec & { resolvedCaptions?: Caption[] }) {
	const fps = 30;
	const palette = { ...palettes[props.palette], ...(props.brand ?? {}) };
	const tf = props.transitionFrames ?? 8;
	const captions = props.resolvedCaptions ?? (Array.isArray(props.captions) ? props.captions : []);

	// scene start frames on the output timeline (transitions overlap neighbours by tf)
	const starts: number[] = [];
	let cursor = 0;
	props.scenes.forEach((s, i) => {
		starts.push(cursor);
		const overlap = i + 1 < props.scenes.length && presentation(props.scenes[i + 1].transition ?? "cut") ? tf : 0;
		cursor += Math.round(s.seconds * fps) - overlap;
	});
	const hidden = new Set(props.captionStyle?.hideDuring ?? ["chapter", "endcard", "punch", "counter"]);
	const speech = captions.map((c) => [(c.startMs / 1000) * fps, (c.endMs / 1000) * fps] as const);
	const duck = props.duckTo ?? 0.18;
	const musicVol = props.musicVolume ?? 0.6;

	return (
		<AbsoluteFill style={{ backgroundColor: palette.bg }}>
			<TransitionSeries>
				{props.scenes.flatMap((scene, i) => {
					const t = presentation(scene.transition ?? "cut");
					const items = [];
					if (i > 0 && t) items.push(<TransitionSeries.Transition key={`t${i}`} presentation={t} timing={linearTiming({ durationInFrames: tf })} />);
					items.push(
						<TransitionSeries.Sequence key={`s${i}`} durationInFrames={Math.round(scene.seconds * fps)}>
							<SceneView scene={scene} fps={fps} palette={palette} />
						</TransitionSeries.Sequence>,
					);
					return items;
				})}
			</TransitionSeries>

			{props.scenes.map((s, i) => (s.transition === "flash" ? <FlashHit key={`f${i}`} at={starts[i]} /> : null))}

			{captions.length
				? props.scenes.map((s, i) =>
						hidden.has(s.type) ? null : (
							<Sequence key={`c${i}`} from={starts[i] + (i > 0 && presentation(s.transition ?? "cut") ? tf : 0)} durationInFrames={Math.round(s.seconds * fps) - (i > 0 && presentation(s.transition ?? "cut") ? tf : 0)} layout="none">
								<Sequence from={-(starts[i] + (i > 0 && presentation(s.transition ?? "cut") ? tf : 0))} layout="none">
									<KineticCaptions captions={captions} accent={palette.accent} {...props.captionStyle} />
								</Sequence>
							</Sequence>
						),
					)
				: null}

			<GrainVignette grain={props.grain ?? 0.05} vignette={props.vignette ?? 0} />

			{props.voiceover ? <Audio src={src(props.voiceover)} /> : null}
			{props.music ? (
				<Audio
					src={src(props.music)}
					loop
					volume={(f) => {
						const speaking = speech.some(([a, b]) => f >= a - 4 && f <= b + 6);
						const fadeOut = interpolate(f, [cursor - 30, cursor], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease.inOut });
						return (speaking ? musicVol * duck : musicVol) * fadeOut;
					}}
				/>
			) : null}
			{(props.sfx ?? []).map((s, i) => (
				<Sequence key={`x${i}`} from={Math.round(s.atSec * fps)} layout="none">
					<Audio src={src(s.src)} volume={s.volume ?? 0.8} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
}

export const calculateSpecAdMetadata: CalculateMetadataFunction<AdSpec & { resolvedCaptions?: Caption[] }> = async ({ props }) => {
	const fps = 30;
	const tf = props.transitionFrames ?? 8;
	const total = props.scenes.reduce((sum, s, i) => sum + Math.round(s.seconds * fps) - (i > 0 && presentation(s.transition ?? "cut") ? tf : 0), 0);
	let resolvedCaptions: Caption[] | undefined;
	if (typeof props.captions === "string") {
		resolvedCaptions = (await fetch(src(props.captions)).then((r) => r.json())) as Caption[];
	}
	return { durationInFrames: Math.max(1, total), fps, width: 1080, height: 1920, props: { ...props, resolvedCaptions } };
};
