# Hero video

The 18-second, 1920×1080 film at the top of [openmarketing.dev](https://openmarketing.dev) and the demo GIF in the repo README. It is built with [Remotion](https://www.remotion.dev) in the desktop app's colors, and the soundtrack is synthesized in code, so there are no stock assets to license.

## Run

```sh
cd apps/hero-video
npm install
npm run browser   # once: fetch Remotion's headless Chrome (see "Paths with spaces" below)
npm run studio    # live preview with a timeline
```

## Produce the files

| Script | Output |
| --- | --- |
| `npm run render` | `out/hero-master.mp4`, the full-quality master (silent) |
| `npm run sound` | `out/hero-sound.mp4`: the master with the soundtrack from `scripts/sfx.py`, loudness-normalized for social |
| `npm run web` | `website/public/hero.mp4`, `hero.webm` and `hero-poster.jpg` for the site (silent, so the browser can autoplay them) |
| `npm run gif` | `assets/openmarketing-demo.gif`, the README preview |
| `npm run typecheck` | Type-checks the compositions |

`out/` is git-ignored. After `render`, run `web` and `gif` so the site and README match the new cut.

## Layout

| Path | Role |
| --- | --- |
| `src/Hero.tsx` | The film. `SHOTS` sets each shot's start frame and length; each shot is its own component |
| `src/kit.tsx` | Shared pieces: color tokens, easing, `Shot` (whip transitions), `Glass`, `Sweep`, `Scramble`, `Typed`, the OM `Mark` |
| `src/Root.tsx`, `src/index.ts` | Registers the `Hero` composition (540 frames at 30 fps) |
| `public/` | Style-preview images shown in the "Pick the style" shot |
| `scripts/sfx.py` | Soundtrack: music bed plus effects, with cue times in frames that match `src/Hero.tsx`. Standard-library Python only |
| `remotion.config.ts` | Render settings and the browser override |

If you retime a shot in `src/Hero.tsx`, move its cues in `scripts/sfx.py` too.

## Paths with spaces

Remotion's headless Chrome does not start when the project path contains a space. `npm run browser` copies the browser to `~/.cache/openmarketing-hero-chrome`, and `remotion.config.ts` uses that copy when it exists. On a path without spaces you can skip that step.

`npm run browser` uses `ditto`, so it is macOS only. Elsewhere, copy `node_modules/.remotion/chrome-headless-shell/<platform>/…` to that folder yourself, or just clone the repo into a path without spaces.
