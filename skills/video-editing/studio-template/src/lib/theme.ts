import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";

const inter = loadInter("normal", { weights: ["400", "600", "800"], subsets: ["latin"] });
const montserrat = loadMontserrat("normal", { weights: ["700", "800", "900"], subsets: ["latin"] });

export const fonts = {
	// creator captions / chapter cards: heavy geometric caps
	display: montserrat.fontFamily,
	// kinetic typography / UI: neutral grotesk
	body: inter.fontFamily,
};

// 1080x1920 canvas. Safe zone keeps text clear of platform UI (top bar, right rail, caption/CTA footer).
export const canvas = { width: 1080, height: 1920, fps: 30 };
export const safe = { top: 220, bottom: 380, side: 90 };

export type Palette = {
	bg: string;
	bgAlt: string;
	text: string;
	accent: string;
	accent2: string;
	glow: string;
};

export const palettes = {
	// dark 3D / trading motion graphics
	noir: { bg: "#050505", bgAlt: "#111114", text: "#F5F5F7", accent: "#3DDC84", accent2: "#E5484D", glow: "#FFFFFF" },
	// creator talking-head edit
	creator: { bg: "#0B0B12", bgAlt: "#1A0F2E", text: "#FFFFFF", accent: "#2EE6A8", accent2: "#FF2D55", glow: "#8B5CF6" },
	// kinetic typography on paper
	paper: { bg: "#F7F3EC", bgAlt: "#0A0A0A", text: "#151515", accent: "#E10600", accent2: "#151515", glow: "#FF1A1A" },
} satisfies Record<string, Palette>;

export type PaletteName = keyof typeof palettes;
