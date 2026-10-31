// OpenMarketing hero film (16:9, 18 s, silent, loops). Motion grammar after the "Nexo" reference:
// glass UI on near-black, edge light sweeps, whip-blur cuts, 3D card stacks, scramble type,
// bracketed kinetic words, light streaks converging into the mark. Content is the product itself:
// a guided /video run in the desktop app, then strategy, then the brand.
import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Easing, Img, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Check, Glass, Grain, Mark, mix, prog, Scramble, Shot, Spinner, Sweep, T, Typed, easeIn } from "./kit";

const SHOTS = {
	composer: { from: 0, duration: 84 },
	app: { from: 78, duration: 96 },
	decision: { from: 168, duration: 96 },
	results: { from: 258, duration: 66 },
	strategy: { from: 318, duration: 78 },
	words: { from: 390, duration: 66 },
	logo: { from: 450, duration: 90 },
};
export const HERO_FRAMES = 540;

const PROMPT = "/video 15-second launch teaser for Tracewell";

export function Hero() {
	return (
		<AbsoluteFill style={{ background: T.bg, fontFamily: T.sans, color: T.text, overflow: "hidden" }}>
			<AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 60% at 50% 45%, #171717 0%, #0b0b0b 70%)" }} />
			<Sequence from={SHOTS.composer.from} durationInFrames={SHOTS.composer.duration}>
				<Composer />
			</Sequence>
			<Sequence from={SHOTS.app.from} durationInFrames={SHOTS.app.duration}>
				<AppWindow />
			</Sequence>
			<Sequence from={SHOTS.decision.from} durationInFrames={SHOTS.decision.duration}>
				<Decision />
			</Sequence>
			<Sequence from={SHOTS.results.from} durationInFrames={SHOTS.results.duration}>
				<Results />
			</Sequence>
			<Sequence from={SHOTS.strategy.from} durationInFrames={SHOTS.strategy.duration}>
				<Strategy />
			</Sequence>
			<Sequence from={SHOTS.words.from} durationInFrames={SHOTS.words.duration}>
				<Words />
			</Sequence>
			<Sequence from={SHOTS.logo.from} durationInFrames={SHOTS.logo.duration}>
				<Logo />
			</Sequence>
			<Grain />
			<AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 80% at 50% 50%, transparent 55%, rgba(0,0,0,0.75) 100%)", pointerEvents: "none" }} />
		</AbsoluteFill>
	);
}

// 3D stage with a slow camera drift.
function Stage({ children, rx = 0, ry = 0, drift = 0, z = 0 }: { children: ReactNode; rx?: number; ry?: number; drift?: number; z?: number }) {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill style={{ perspective: 2200, perspectiveOrigin: "50% 45%" }}>
			<AbsoluteFill style={{ transformStyle: "preserve-3d", transform: `translateZ(${z}px) rotateX(${rx}deg) rotateY(${ry + f * drift}deg)`, display: "grid", placeItems: "center" }}>{children}</AbsoluteFill>
		</AbsoluteFill>
	);
}

/* ---------- 1. The composer types the brief and sends it ---------- */
function Composer() {
	const f = useCurrentFrame();
	const appear = prog(f, 0, 22);
	const send = prog(f, 64, 6);
	const push = prog(f, 70, 14, easeIn);
	const scale = mix(appear, 0.94, 1) * mix(push, 1, 1.9);
	const blur = (1 - appear) * 16 + push * 22;
	return (
		<AbsoluteFill style={{ display: "grid", placeItems: "center", opacity: Math.min(1, appear * 1.3) * (1 - push * 0.9) }}>
			<div style={{ transform: `scale(${scale})`, filter: blur > 0.3 ? `blur(${blur}px)` : undefined, width: 1120 }}>
				<div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, marginLeft: 6, color: T.text3, fontSize: 19 }}>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.text3} strokeWidth="2">
						<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
					</svg>
					tracewell-launch
				</div>
				<Glass radius={26} style={{ padding: "28px 28px 20px" }}>
					<Sweep from={8} duration={34} radius={26} />
					<div style={{ fontSize: 34, height: 48, color: f < 28 ? T.text3 : T.text, letterSpacing: "-0.01em" }}>
						{f < 28 ? "Describe the video you want" : <Typed text={PROMPT} start={28} cps={1.45} />}
					</div>
					<div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 26 }}>
						<span style={{ width: 40, height: 40, borderRadius: 20, boxShadow: `inset 0 0 0 1px ${T.line2}`, display: "grid", placeItems: "center", color: T.text2, fontSize: 24 }}>+</span>
						<span style={{ padding: "8px 14px", borderRadius: 10, background: T.mode, color: T.modeText, fontSize: 19 }}>Video</span>
						<span style={{ flex: 1 }} />
						<span style={{ color: T.text2, fontSize: 19 }}>Opus 5.5 · High</span>
						<span style={{ width: 46, height: 46, borderRadius: 23, background: T.invert, display: "grid", placeItems: "center", transform: `scale(${1 - Math.sin(Math.PI * send) * 0.12})`, boxShadow: send > 0 ? `0 0 ${30 * Math.sin(Math.PI * send)}px rgba(255,255,255,0.5)` : undefined }}>
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.onInvert} strokeWidth="2.6" strokeLinecap="round">
								<path d="M12 19V5M5 12l7-7 7 7" />
							</svg>
						</span>
					</div>
				</Glass>
			</div>
		</AbsoluteFill>
	);
}

/* ---------- 2. The app window: checkpoint approved, work streaming in ---------- */
const STEPS = [
	{ title: "Workspace", meta: "references · branding · outputs" },
	{ title: "Analyse reference", meta: "devtool-ad-a.mp4 · 31 shots" },
	{ title: "Analyse reference", meta: "devtool-ad-b.mp4 · 18 shots" },
	{ title: "Brand page", meta: "branding/brand.html" },
];

function AppWindow() {
	const f = useCurrentFrame();
	const d = SHOTS.app.duration;
	const settle = prog(f, 0, 40);
	return (
		<Shot duration={d}>
			<Stage rx={mix(settle, 12, 6)} ry={mix(settle, -12, -6)} drift={0.03} z={mix(settle, -160, 0)}>
				<Glass radius={22} style={{ width: 1400, height: 690, display: "flex", overflow: "hidden", background: "rgba(24,24,24,0.94)" }}>
					<Sweep from={6} duration={30} radius={22} />
					<div style={{ width: 300, background: "#1b1b1b", boxShadow: `inset -1px 0 0 ${T.line}`, padding: "64px 18px", display: "flex", flexDirection: "column", gap: 6 }}>
						{["New Video", "New Chat", "Automations", "Customize"].map((label, i) => (
							<div key={label} style={{ padding: "11px 14px", borderRadius: 10, background: i === 0 ? T.raise2 : undefined, color: i === 0 ? T.text : T.text2, fontSize: 19, display: "flex", alignItems: "center", gap: 12 }}>
								<span style={{ width: 16, height: 16, borderRadius: 4, boxShadow: `inset 0 0 0 1.5px ${i === 0 ? T.text2 : T.text3}` }} />
								{label}
							</div>
						))}
						<div style={{ marginTop: 26, padding: "0 14px", color: T.text3, fontSize: 16 }}>Workspaces</div>
						<div style={{ padding: "11px 14px", borderRadius: 10, background: T.raise, fontSize: 19, display: "flex", alignItems: "center", gap: 12 }}>
							<span style={{ width: 16, height: 13, borderRadius: 3, boxShadow: `inset 0 0 0 1.5px ${T.text2}` }} />
							tracewell-launch
							<span style={{ flex: 1 }} />
							<Spinner size={15} />
						</div>
					</div>
					<div style={{ flex: 1, padding: "28px 56px", display: "flex", flexDirection: "column", gap: 22 }}>
						<div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 19, color: T.text, marginBottom: 6 }}>
							tracewell-launch <span style={{ width: 6, height: 6, borderRadius: 3, background: T.text2 }} /> <span style={{ color: T.text2 }}>Working</span>
						</div>
						<div style={{ alignSelf: "flex-end", padding: "14px 20px", borderRadius: 18, background: T.raise2, fontSize: 21, opacity: prog(f, 4, 10) }}>{PROMPT}</div>
						<Glass radius={16} style={{ padding: "18px 22px", opacity: prog(f, 12, 12), transform: `translateY(${mix(prog(f, 12, 16), 24, 0)}px)` }}>
							<div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 20, fontWeight: 600 }}>
								<span style={{ width: 28, height: 28, borderRadius: 8, background: T.mode, display: "grid", placeItems: "center" }}>
									<Check size={15} color={T.modeText} />
								</span>
								Validate the brand
							</div>
							<div style={{ marginLeft: 40, marginTop: 8, fontSize: 18, color: T.text2 }}>
								Approve as is <span style={{ fontStyle: "italic" }}>— “keep the green, darker background”</span>
							</div>
						</Glass>
						<div style={{ borderRadius: 18, background: T.raise, padding: 8, opacity: prog(f, 20, 10) }}>
							<div style={{ display: "flex", padding: "10px 14px", fontFamily: T.mono, fontSize: 15, color: T.text2 }}>
								<span style={{ color: T.text }}>Working</span>
								<span style={{ marginLeft: 12 }}>{Math.min(4, Math.max(1, Math.floor((f - 22) / 12) + 1))} steps</span>
							</div>
							{STEPS.map((step, i) => {
								const at = 24 + i * 12;
								const shown = prog(f, at, 10);
								const done = f > at + 14;
								return (
									<div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 14px", borderRadius: 12, opacity: shown, transform: `translateY(${mix(shown, 14, 0)}px)` }}>
										<span style={{ width: 30, height: 30, borderRadius: 15, background: T.raise2, display: "grid", placeItems: "center" }}>
											<span style={{ width: 11, height: 11, borderRadius: 3, boxShadow: `inset 0 0 0 1.5px ${T.text2}` }} />
										</span>
										<span style={{ fontSize: 19 }}>{step.title}</span>
										<span style={{ fontFamily: T.mono, fontSize: 15, color: T.text3 }}>{step.meta}</span>
										<span style={{ flex: 1 }} />
										<span style={{ fontFamily: T.mono, fontSize: 14, color: T.text3 }}>00:0{1 + i}.{(i * 3) % 10}</span>
										{done ? <Check size={16} color={T.text2} /> : <Spinner size={16} />}
									</div>
								);
							})}
						</div>
						<div style={{ fontSize: 20, color: T.text2, opacity: prog(f, 62, 10), marginLeft: 6 }}>
							<span style={{ backgroundImage: `linear-gradient(90deg, ${T.text3} 0%, ${T.text} ${mix((f % 30) / 30, 0, 100)}%, ${T.text3} 100%)`, WebkitBackgroundClip: "text", color: "transparent" }}>Rendering a hook frame for each direction…</span>
						</div>
					</div>
				</Glass>
			</Stage>
		</Shot>
	);
}

/* ---------- 3. The decision card: the agent proposes, you decide ---------- */
const STYLES = [
	{ img: "style-noir.jpg", label: "Dark Glow", desc: "Kinetic type, one green accent, fast cuts", rec: true },
	{ img: "style-paper.jpg", label: "Paper Cut", desc: "Bright editorial type, collage rhythm" },
	{ img: "style-counter.jpg", label: "Proof First", desc: "Opens on a live metric, calm build" },
];

function Decision() {
	const f = useCurrentFrame();
	const d = SHOTS.decision.duration;
	const settle = prog(f, 0, 44);
	const choose = prog(f, 40, 10);
	const press = prog(f, 66, 8);
	return (
		<Shot duration={d}>
			<Stage rx={mix(settle, 12, 4)} ry={mix(settle, 12, 3)} drift={-0.025}>
				<Glass radius={24} style={{ width: 1360, padding: "32px 40px 32px", background: "rgba(26,26,26,0.95)" }}>
					<Sweep from={4} duration={30} radius={24} />
					<div style={{ display: "flex", alignItems: "center", gap: 14 }}>
						<span style={{ width: 34, height: 34, borderRadius: 10, background: T.mode, display: "grid", placeItems: "center" }}>
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.modeText} strokeWidth="2.2">
								<circle cx="12" cy="12" r="9" />
								<path d="m15.5 8.5-2 5-5 2 2-5Z" />
							</svg>
						</span>
						<span style={{ fontSize: 24, fontWeight: 600 }}>Pick the style</span>
						<span style={{ padding: "3px 12px", borderRadius: 999, background: T.raise2, color: T.text2, fontSize: 15 }}>style</span>
					</div>
					<div style={{ margin: "20px 0 18px 48px", fontSize: 20, color: T.text }}>Which direction should the teaser take?</div>
					<div style={{ display: "flex", gap: 18, marginLeft: 48, transformStyle: "preserve-3d" }}>
						{STYLES.map((s, i) => {
							const t = prog(f, 6 + i * 6, 26);
							const on = s.rec && choose > 0;
							return (
								<div
									key={s.label}
									style={{
										width: 380,
										borderRadius: 18,
										padding: 10,
										background: "#151515",
										boxShadow: on ? `inset 0 0 0 ${mix(choose, 1, 2)}px ${T.text}, 0 0 ${40 * choose}px -10px rgba(110,231,160,0.35)` : `inset 0 0 0 1px ${T.line}`,
										transform: `translateZ(${mix(t, -700, 0)}px) rotateY(${mix(t, 24, 0)}deg) translateY(${mix(t, 60, 0)}px)`,
										opacity: t,
										filter: t < 0.98 ? `blur(${(1 - t) * 14}px)` : undefined,
									}}
								>
									<Img src={staticFile(s.img)} style={{ width: "100%", height: 330, objectFit: "cover", borderRadius: 12, display: "block" }} />
									<div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 6px 4px", fontSize: 20 }}>
										<span style={{ width: 20, height: 20, borderRadius: 10, display: "grid", placeItems: "center", background: on ? T.text : undefined, boxShadow: on ? undefined : `inset 0 0 0 1.5px ${T.line2}` }}>{on ? <Check size={12} color={T.onInvert} /> : null}</span>
										{s.label}
										{s.rec ? (
											<span style={{ marginLeft: "auto", padding: "3px 10px", borderRadius: 999, background: T.mode, color: T.modeText, fontSize: 14, opacity: prog(f, 30, 10), transform: `scale(${mix(prog(f, 30, 12), 0.7, 1)})` }}>Recommended</span>
										) : null}
									</div>
									<div style={{ padding: "4px 6px 6px 36px", fontSize: 16, color: T.text2, lineHeight: 1.45 }}>{s.desc}</div>
								</div>
							);
						})}
					</div>
					<div style={{ display: "flex", gap: 12, margin: "24px 0 0 48px", opacity: prog(f, 34, 12) }}>
						<span style={{ padding: "12px 22px", borderRadius: 12, background: T.invert, color: T.onInvert, fontSize: 18, transform: `scale(${1 - Math.sin(Math.PI * press) * 0.07})`, boxShadow: press > 0 && press < 1 ? `0 0 30px rgba(255,255,255,${0.4 * Math.sin(Math.PI * press)})` : undefined }}>Continue</span>
						<span style={{ padding: "12px 22px", borderRadius: 12, boxShadow: `inset 0 0 0 1px ${T.line2}`, fontSize: 18 }}>Let the agent decide</span>
						<span style={{ marginLeft: 10, alignSelf: "center", fontSize: 16, color: T.text3, opacity: prog(f, 72, 8) }}>Sending your decision…</span>
					</div>
				</Glass>
			</Stage>
		</Shot>
	);
}

/* ---------- 4. Results stack in depth ---------- */
const RESULTS = [
	{ icon: "check", title: "Brand approved", sub: "branding/brand.html · 2 references kept" },
	{ icon: "wave", title: "QA passed", sub: "−14 LUFS · safe zones · 0 warnings" },
	{ icon: "film", title: "Rendered", sub: "outputs/latest.mp4 · 1080×1920 · 15 s" },
	{ icon: "meta", title: "Meta Ads", sub: "Creative uploaded — launch needs your OK" },
];

function Icon({ kind }: { kind: string }) {
	const p: Record<string, ReactNode> = {
		check: <path d="M20 6 9 17l-5-5" />,
		wave: <path d="M3 12h2l2-6 4 12 4-9 2 3h4" />,
		film: (
			<>
				<rect x="3" y="4" width="18" height="16" rx="2" />
				<path d="M7 4v16M17 4v16M3 9h4M17 9h4M3 15h4M17 15h4" />
			</>
		),
		meta: <path d="M3 15c2-8 5-8 9 0s7 8 9 0" />,
	};
	return (
		<span style={{ width: 54, height: 54, borderRadius: 14, background: T.raise2, display: "grid", placeItems: "center" }}>
			<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={T.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
				{p[kind]}
			</svg>
		</span>
	);
}

function Results() {
	const f = useCurrentFrame();
	const d = SHOTS.results.duration;
	return (
		<Shot duration={d} enter={10}>
			<Stage rx={14} ry={-6} drift={0.05}>
				<div style={{ position: "relative", width: 1080, height: 560, transformStyle: "preserve-3d", transform: "rotateZ(-5deg) translateX(-40px)" }}>
					{RESULTS.map((r, i) => {
						const t = prog(f, 4 + i * 7, 20);
						return (
							<Glass
								key={r.title}
								radius={18}
								style={{
									position: "absolute",
									left: 20 + i * 110,
									top: 20 + i * 100,
									width: 660,
									padding: "24px 28px",
									display: "flex",
									alignItems: "center",
									gap: 18,
									background: "rgba(30,30,30,0.96)",
									opacity: t,
									transform: `translateZ(${mix(t, -500, i * 40)}px) translateY(${mix(t, 120, 0)}px)`,
									filter: t < 0.98 ? `blur(${(1 - t) * 12}px)` : undefined,
								}}
							>
								<Icon kind={r.icon} />
								<div>
									<div style={{ fontSize: 27, fontWeight: 600 }}>{r.title}</div>
									<div style={{ marginTop: 6, fontSize: 20, color: T.text2 }}>{r.sub}</div>
								</div>
							</Glass>
						);
					})}
				</div>
			</Stage>
		</Shot>
	);
}

/* ---------- 5. Strategy: scramble heading, bets, a toast ---------- */
const BETS = [
	{ tag: "Bet 01", title: "Developer-led content", body: "Weekly teardown posts from real customer logs" },
	{ tag: "Bet 02", title: "Launch week", body: "Show HN and Product Hunt with a live demo" },
	{ tag: "Non-bet", title: "Paid social", body: "Not until activation clears 40%", muted: true },
];

function Strategy() {
	const f = useCurrentFrame();
	const d = SHOTS.strategy.duration;
	const toast = prog(f, 46, 12);
	const dim = prog(f, 44, 14);
	return (
		<Shot duration={d}>
			<AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
				<div style={{ fontSize: 170, fontWeight: 650, letterSpacing: "-0.045em", lineHeight: 1, filter: dim > 0 ? `blur(${dim * 6}px)` : undefined, opacity: mix(dim, 1, 0.35), transform: `scale(${mix(dim, 1, 1.05)})` }}>
					<Scramble text="Strategy" start={2} perChar={1.8} accentIndex={4} />
				</div>
				<div style={{ display: "flex", gap: 22, marginTop: -16, perspective: 1600, filter: dim > 0 ? `blur(${dim * 4}px)` : undefined, opacity: mix(dim, 1, 0.45) }}>
					{BETS.map((b, i) => {
						const t = prog(f, 14 + i * 5, 20);
						return (
							<Glass
								key={b.tag}
								radius={18}
								style={{ width: 400, padding: "26px 28px", background: "rgba(28,28,28,0.95)", opacity: t * (b.muted ? 0.7 : 1), transform: `translateY(${mix(t, 90, 0)}px) rotateX(${mix(t, 40, 0)}deg)` }}
							>
								<div style={{ fontFamily: T.mono, fontSize: 17, color: b.muted ? T.text3 : T.modeText }}>{b.tag}</div>
								<div style={{ marginTop: 12, fontSize: 30, fontWeight: 600, textDecoration: b.muted ? "line-through" : undefined, textDecorationColor: T.text3 }}>{b.title}</div>
								<div style={{ marginTop: 10, fontSize: 20, color: T.text2, lineHeight: 1.45 }}>{b.body}</div>
							</Glass>
						);
					})}
				</div>
				<Glass
					radius={16}
					style={{ position: "absolute", top: "50%", left: "50%", padding: "18px 24px", display: "flex", alignItems: "center", gap: 16, background: "rgba(34,34,34,0.98)", opacity: toast, transform: `translate(-50%, -50%) translateY(${mix(toast, 30, 40)}px) scale(${mix(toast, 0.92, 1)})` }}
				>
					<Mark size={40} />
					<div>
						<div style={{ fontSize: 20, fontWeight: 600 }}>Strategy saved</div>
						<div style={{ marginTop: 3, fontSize: 16, color: T.text2 }}>2 focused bets · 1 explicit non-bet · ready for /plan</div>
					</div>
				</Glass>
			</AbsoluteFill>
		</Shot>
	);
}

/* ---------- 6. Bracketed kinetic words ---------- */
const WORDS = ["Research", "Decide", "Create"];

function Words() {
	const f = useCurrentFrame();
	const per = 20;
	const i = Math.min(WORDS.length - 1, Math.floor(f / per));
	const local = f - i * per;
	const pop = prog(local, 0, 10);
	const out = prog(f, SHOTS.words.duration - 8, 8, easeIn);
	const corner = (style: CSSProperties) => <span style={{ position: "absolute", width: 34, height: 34, borderColor: T.text, borderStyle: "solid", ...style }} />;
	return (
		<AbsoluteFill style={{ display: "grid", placeItems: "center", opacity: 1 - out, filter: out > 0 ? `blur(${out * 10}px)` : undefined }}>
			<div style={{ position: "relative", padding: "18px 44px", transform: `scale(${mix(pop, 0.92, 1)})` }}>
				{corner({ top: 0, right: 0, borderWidth: "2px 2px 0 0" })}
				{corner({ bottom: 0, left: 0, borderWidth: "0 0 2px 2px" })}
				<div style={{ fontSize: 120, fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
					<Scramble key={WORDS[i]} text={WORDS[i]} start={i * per} perChar={1.1} accentIndex={2} />
				</div>
			</div>
		</AbsoluteFill>
	);
}

/* ---------- 7. Streaks converge into the mark ---------- */
const STREAKS = Array.from({ length: 9 }, (_, i) => ({ angle: (i / 9) * 360 + (i % 2 ? 17 : -9), dist: 700 + (i % 3) * 160, delay: (i % 4) * 2 }));

function Logo() {
	const f = useCurrentFrame();
	const flash = Math.max(0, 1 - Math.abs(f - 22) / 8);
	const mark = prog(f, 20, 22);
	const word = prog(f, 30, 24);
	const line = prog(f, 44, 18);
	const url = prog(f, 52, 16);
	const fade = prog(f, SHOTS.logo.duration - 14, 14, Easing.in(Easing.quad));
	return (
		<AbsoluteFill style={{ opacity: 1 - fade }}>
			{STREAKS.map((s, i) => {
				const t = prog(f, s.delay, 22, Easing.in(Easing.cubic));
				const r = mix(t, s.dist, 0);
				const rad = (s.angle * Math.PI) / 180;
				return (
					<div
						key={i}
						style={{
							position: "absolute",
							left: 960 + Math.cos(rad) * r,
							top: 470 + Math.sin(rad) * r,
							width: mix(t, 40, 180),
							height: 4,
							borderRadius: 4,
							background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.95))",
							boxShadow: "0 0 24px 6px rgba(255,255,255,0.28)",
							transform: `translate(-100%, -50%) rotate(${s.angle + 180}deg)`,
							transformOrigin: "100% 50%",
							opacity: t < 1 ? mix(t, 0.2, 1) : 0,
							filter: "blur(1.2px)",
						}}
					/>
				);
			})}
			<div style={{ position: "absolute", left: 960, top: 470, width: 600, height: 600, transform: "translate(-50%,-50%)", background: "radial-gradient(circle, rgba(255,255,255,0.55) 0%, rgba(110,231,160,0.12) 30%, transparent 60%)", opacity: flash }} />
			<AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0 }}>
				<div style={{ display: "flex", alignItems: "center", gap: 30 }}>
					<div style={{ transform: `scale(${mix(mark, 0.55, 1)})`, opacity: mark, filter: mark < 0.98 ? `blur(${(1 - mark) * 10}px)` : undefined, boxShadow: `0 0 ${80 * mark}px -10px rgba(255,255,255,0.35)`, borderRadius: 30 }}>
						<Mark size={112} />
					</div>
					<div style={{ fontSize: 96, fontWeight: 650, letterSpacing: "-0.045em", clipPath: `inset(0 ${mix(word, 100, 0)}% 0 0)`, transform: `translateX(${mix(word, -30, 0)}px)` }}>OpenMarketing</div>
				</div>
				<div style={{ marginTop: 34, fontSize: 34, color: T.text2, letterSpacing: "-0.01em", opacity: line, transform: `translateY(${mix(line, 14, 0)}px)` }}>Your marketing team, guided step by step.</div>
				<div style={{ marginTop: 26, fontFamily: T.mono, fontSize: 22, color: T.modeText, opacity: url }}>openmarketing.dev</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
}

