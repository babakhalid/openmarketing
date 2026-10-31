import { Composition } from "remotion";
import { calculateSpecAdMetadata, SpecAd, type AdSpec } from "./compositions/SpecAd";

// Demo spec: replace via `--props=public/specs/<slug>.json`. Every field is documented in SpecAd.tsx.
const demo: AdSpec = {
	palette: "paper",
	transitionFrames: 8,
	scenes: [
		{ type: "punch", seconds: 1.6, lead: "You've got the", punch: "ideas", bg: "light" },
		{ type: "punch", seconds: 1.4, lead: "But your", punch: "growth?", bg: "dark", transition: "flash" },
		{ type: "chapter", seconds: 1.4, index: 1, title: "Hook first", transition: "slide-up" },
		{ type: "counter", seconds: 2.4, label: "Saves", from: 1200, to: 48210, transition: "fade" },
		{ type: "punch", seconds: 1.6, lead: "It rewards", punch: "strategy", bg: "light", transition: "wipe" },
		{ type: "endcard", seconds: 2.2, handle: "@yourbrand", cta: "Save this", transition: "fade" },
	],
	grain: 0.05,
};

export function Root() {
	return (
		<Composition
			id="SpecAd"
			component={SpecAd}
			width={1080}
			height={1920}
			fps={30}
			durationInFrames={300}
			defaultProps={demo}
			calculateMetadata={calculateSpecAdMetadata}
		/>
	);
}
