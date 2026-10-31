import { Easing, interpolate, spring, type SpringConfig } from "remotion";

// Spring presets tuned against the reference ads (30 fps). Pick by intent, not by taste.
export const springs = {
	// word / caption pop: fast settle, tiny overshoot
	pop: { damping: 14, stiffness: 220, mass: 0.6 },
	// cards, props, chapter badges: visible overshoot
	bounce: { damping: 10, stiffness: 170, mass: 0.8 },
	// camera pushes and large layers: no overshoot
	smooth: { damping: 200, stiffness: 120, mass: 1 },
	// snappy UI-like slide
	snap: { damping: 22, stiffness: 300, mass: 0.5 },
} satisfies Record<string, Partial<SpringConfig>>;

export type SpringName = keyof typeof springs;

export function springIn(frame: number, fps: number, name: SpringName = "pop", delay = 0, durationInFrames?: number) {
	return spring({ frame: frame - delay, fps, config: springs[name], durationInFrames });
}

// Standard eases: expo-out for entrances, cubic in-out for camera, back-out for stickers.
export const ease = {
	out: Easing.bezier(0.16, 1, 0.3, 1),
	inOut: Easing.bezier(0.65, 0, 0.35, 1),
	in: Easing.bezier(0.7, 0, 0.84, 0),
	backOut: Easing.bezier(0.34, 1.56, 0.64, 1),
};

export function ramp(frame: number, from: number, to: number, out: [number, number] = [0, 1], easing = ease.out) {
	return interpolate(frame, [from, to], out, { easing, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
}

// Slow continuous push-in so no frame is ever static (refs never hold a dead frame).
/** @public Part of the template's toolkit for agent-written compositions. */
export function drift(frame: number, durationInFrames: number, from = 1, to = 1.06) {
	return interpolate(frame, [0, durationInFrames], [from, to], { easing: ease.inOut, extrapolateRight: "clamp" });
}

export const msToFrame = (ms: number, fps: number) => Math.round((ms / 1000) * fps);
