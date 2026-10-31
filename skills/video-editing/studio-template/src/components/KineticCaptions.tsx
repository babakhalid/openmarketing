import { createTikTokStyleCaptions, type Caption } from "@remotion/captions";
import { fitText } from "@remotion/layout-utils";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { msToFrame, springIn } from "../lib/motion";
import { fonts, safe } from "../lib/theme";

export type KineticCaptionsProps = {
	captions: Caption[];
	// words (lowercase, no punctuation) that get the accent color
	highlight?: string[];
	color?: string;
	accent?: string;
	// vertical position of the caption block's center, 0..1 of frame height
	y?: number;
	// how many ms of speech to group into one on-screen page
	combineMs?: number;
	uppercase?: boolean;
	maxFontSize?: number;
	glow?: boolean;
};

const clean = (w: string) => w.toLowerCase().replace(/[^a-z0-9$%']/g, "");

// Word-by-word captions synced to a whisper transcript: 1–3 words per page, active word pops,
// keywords switch to the accent color. Matches the creator/kinetic references.
export function KineticCaptions({
	captions,
	highlight = [],
	color = "#FFFFFF",
	accent = "#2EE6A8",
	y = 0.58,
	combineMs = 700,
	uppercase = true,
	maxFontSize = 104,
	glow = false,
}: KineticCaptionsProps) {
	const { fps, width } = useVideoConfig();
	const { pages } = createTikTokStyleCaptions({ captions, combineTokensWithinMilliseconds: combineMs });
	const hl = new Set(highlight.map(clean));

	return (
		<AbsoluteFill>
			{pages.map((page, i) => {
				const from = msToFrame(page.startMs, fps);
				const next = pages[i + 1];
				const until = next ? msToFrame(next.startMs, fps) : from + msToFrame(page.durationMs, fps) + 8;
				return (
					<Sequence key={i} from={from} durationInFrames={Math.max(1, until - from)} layout="none">
						<CaptionPage page={page} hl={hl} color={color} accent={accent} y={y} uppercase={uppercase} maxFontSize={maxFontSize} glow={glow} width={width} />
					</Sequence>
				);
			})}
		</AbsoluteFill>
	);
}

function CaptionPage({
	page,
	hl,
	color,
	accent,
	y,
	uppercase,
	maxFontSize,
	glow,
	width,
}: {
	page: ReturnType<typeof createTikTokStyleCaptions>["pages"][number];
	hl: Set<string>;
	color: string;
	accent: string;
	y: number;
	uppercase: boolean;
	maxFontSize: number;
	glow: boolean;
	width: number;
}) {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const text = page.tokens.map((t) => t.text).join("").trim();
	const { fontSize } = fitText({ text: uppercase ? text.toUpperCase() : text, withinWidth: width - safe.side * 2, fontFamily: fonts.display, fontWeight: 900 });
	const size = Math.min(maxFontSize, fontSize);
	const enter = springIn(frame, fps, "pop");
	const absMs = page.startMs + (frame / fps) * 1000;

	return (
		<AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center" }}>
			<div
				style={{
					position: "absolute",
					top: `${y * 100}%`,
					transform: `translateY(-50%) scale(${0.85 + 0.15 * enter})`,
					opacity: enter,
					padding: `0 ${safe.side}px`,
					textAlign: "center",
					fontFamily: fonts.display,
					fontWeight: 900,
					fontSize: size,
					lineHeight: 1.0,
					letterSpacing: -1,
					textTransform: uppercase ? "uppercase" : "none",
					// two-layer shadow: tight edge for legibility over footage, wide soft for depth
					textShadow: "0 4px 0 rgba(0,0,0,0.35), 0 10px 40px rgba(0,0,0,0.55)",
				}}
			>
				{page.tokens.map((t, j) => {
					const active = absMs >= t.fromMs && absMs < t.toMs;
					const isHl = hl.has(clean(t.text));
					const c = isHl ? accent : color;
					return (
						<span
							key={j}
							style={{
								color: c,
								display: "inline-block",
								whiteSpace: "pre",
								transform: `scale(${active ? 1.08 : 1})`,
								textShadow: glow || isHl ? `0 0 24px ${c}AA, 0 0 60px ${c}55` : undefined,
							}}
						>
							{t.text}
						</span>
					);
				})}
			</div>
		</AbsoluteFill>
	);
}
