# Style bible — derived from the reference-video analysis

> **How to read this file.** This is the measured style bible from forensic analysis of 7 reference ads (cuts, loudness, pacing, type, lighting, motion, transitions, sound). The numbers in §1–§2 (formats, beat timings, pacing, type sizes, safe zones, loudness, transitions) are the quality bar — follow them.
>
> §3 lists the **full component roadmap**. The studio that renders today is the data-driven `SpecAd` composition (scene types `punch`, `chapter`, `counter`, `footage`, `still`, `endcard`; transitions `cut`, `fade`, `slide-up`, `slide-left`, `wipe`, `flash`) — see [`../SKILL.md`](../SKILL.md) and [`master-prompt.md`](master-prompt.md). Effects not yet built as components (glass 3D characters, matte "depth sandwich" type, glitch transitions) are produced as Higgsfield footage/stills and placed in `footage` / `still` scenes. Names like `beats.json`, `GlassExplainer`, `qa.mjs` in §3/§5 are roadmap, not files that exist.
>
> Colours, fonts and spring values were estimated from compressed 720p stills; treat them as calibrated starting points.

## 1. Archetype catalogue

Measured ranges across the refs:
- Duration: 12.8–125 s.
- Real visual events: 19–37 /min (scene changes + punch-ins + overlay events). **Inferred** from eyeballing contact sheets, not measured. Measured cut rate after merging cut clusters < 0.2 s apart: 0 (boho, mental-wellness: detector miss), 4.7 (travel), 8.0 (sewing), 10.0 (wedding), 14.8 (pinterest), 33.6 (earthy) /min.
- Audio: −14.2 to −16.9 LUFS integrated, LRA 1.7–4.3 LU, TP −0.9 to +0.6 dBFS. Three refs reach or exceed 0 dBTP (sewing +0.2, wedding +0.3, travel +0.6) and two more sit at −0.1 (earthy, mental-wellness). That is a flaw to beat, not copy.
- Frame rates of the refs: 23.976 / 24 / 25 / 30. Mean luma and saturation in `metrics.json` are ffmpeg `signalstats` YAVG / SATAVG (8-bit scale) at 1 fps.

All timings are at **30 fps** (`f` = frame).

### F1. Chapter Listicle (creator talking head + numbered chapter cards)
- **Refs:** `wedding-photo-ideas` (primary), `sewing-ideas` (numbered 3D numerals variant).
- **Use when:** you have a creator or founder face and a "N ways / N steps / N hooks" teaching angle. Use it for lead-magnet capture (comment-keyword CTA) and for authority building. Works for organic Reels/TikTok and for Spark/partnership ads.
- **Duration:** 45–60 s (1350–1800 f). Range seen: 60–83 s.
- **Pacing:**
  - Visual event every 45–75 f (25–35 events/min).
  - Caption page every ~15 f.
  - Chapter card 45–60 f.
  - A-roll punch-in alternating scale 1.00 / 1.12–1.15 at each sentence end.

| Beat | Frames | Content |
|---|---|---|
| Hook / promise | 0–78 | Two-tone title on frame 0. Lines slide in from opposite sides (6 f, motion blur). A 3D hook element (shattering bulb / dropping numeral) between f24 and f45. |
| Re-colour hit | 78–138 | Backlight hue swap + 1 f white flash. Presenter gesture shows N. |
| Setup | 138–220 | State the concept / product to camera. |
| Chapter card k | 45–60 f each | Branded card (radial wheel or 3D numeral) with whoosh + sub-hit. Cumulative state: previous chapters ghosted. |
| Example k | 120–240 f each | A-roll + viewfinder/REC overlay, stickers, UI cutaways, accent colour per chapter. |
| Pattern interrupt + CTA | at 55–65% of runtime, 90–150 f | Different caption style (lowercase italic), fake platform UI (ad bar / Skip Ad). Lead magnet: 2.5D document fly-in on a desaturated frame. "Comment the word X". |
| Remaining chapters | — | Same grammar. |
| Open-loop end | last 60–90 f | Start the final chapter card + one VO line ("Here's how."). No outro. Rewatch bait. |

### F2. Creator Breakdown (talking head + depth-sandwich type + stylised B-roll)
- **Refs:** `pinterest-marketing` (primary), `sewing-ideas`.
- **Use when:** you have a thesis / contrarian explainer ("You think X, the real business is Y"), a face on camera, and 45–90 s of argument. This is the highest-retention format for founder-led brand building.
- **Duration:** 45–90 s (1350–2700 f). Range seen: 83–125 s. Cut to ≤ 90 s for ads.
- **Pacing:**
  - About 14 real edits/min plus about 15 punch-ins/min, so the screen changes every ~60 f.
  - Sections of 300–360 f, each ending in a white flash (9 f) or a glitch (6–10 f).
  - B-roll inserts 45–120 f. A-roll holds 30–90 f.

| Beat | Frames | Content |
|---|---|---|
| Hook / pattern interrupt | 0–36 | Giant accent word BEHIND the head (person matte), white word in front at chest height. Punch-in at f~36. |
| Contrarian claim | 36–210 | Word-by-word two-tier captions. Halftone brand/object glows behind the head. |
| Curiosity gap | 210–300 | White flash, then an alternate setup, then back. |
| Thesis lock-up | 300–540 | Glowing named concept ("custo de troca"). |
| Problem | 540–840 | Halftone/RGB-split B-roll. Glitch on "trap/brain" words. |
| Mechanism | 840–1950 | Alternate A-roll and B-roll proof inserts every 45–120 f. Stat callout with 1–3 neon numbers. |
| Payoff | ~1950–end−180 | Recap words behind the head. |
| Brand end card | last 150–180 f | White flash, gradient card, concentric line field, wordmark spring, 3-hit sting. |

### F3. Dark Glass Explainer (faceless 2.5D, one accent on black)
- **Refs:** `mental-wellness` (primary), `travel-bucket-list`, `boho-corner`.
- **Use when:** there is no face and no footage, the product is abstract (finance, SaaS, apps, services), it's a paid ad or a brand spot, and you need fast iteration of many variants. Cheapest to produce at a premium level: everything is code.
- **Duration:** 15–30 s (450–900 f). Range seen: 12.8–31.6 s.
- **Pacing:**
  - One VO sentence = one scene = 60–105 f (19–25 scenes/min).
  - Captions one word every 6–10 f.
  - Transitions (whip-push 10 f, ring iris 18 f, fade 5 f) sit in breath gaps.
  - **At most 1–2 hard cuts.** In mental-wellness the only hard cut is onto the logo; travel's only detected cut is at 1.77 s (into the "DISCIPLINE" scene). Everything else is in-scene animation, which is why the scene detector reads these as 1–2 shots.
- **Variants:**
  - Semantic duotone (boho: green = gain, red = loss, same layout recoloured).
  - Mood-per-line (travel: white, then red, then green).
  - Monochrome (mental-wellness: #2A5AFA only).

| Beat | Frames | Content |
|---|---|---|
| Cold open | 0–10 | Mascot / prop already lit, plus a moving tracking target (counter or sparkle) by f6. |
| Hook question + counter | 10–75 | Question builds word by word at y≈13%. Counter animates to the hero number, landing on the stressed word. |
| Hook payoff | 75–126 | Second line at y≈72% with the accent words 1.6x. |
| Problem / premise | 126–270 | Glass card fly-in (rotateY −28→−12°), data viz builds. |
| Mechanism 1–2 | 270–430 | Whip-push between; the caption shares the card's 3D plane. |
| Signature transition | 430–450 | Light-arc + expanding ring iris (18 f). |
| Proof | 450–530 | Chart/candles build about 1 per 4 f. Corner bloom. |
| Turn | 530–560 | "And the best part": depth-push old scene back (scale 0.75, blur 14). |
| Offer | 560–600 | Ring counter / giant % numeral. |
| CTA end card | 600–700 | Hard cut. Logo spring, "starting from" + price pop, pendulum tag. Text fades over 8 f. Hold the logo 48 f. |

### F4. Kinetic Type Collage (light/dark alternating editorial)
- **Refs:** `earthy-mountain` (only true example). `boho-corner` is an F3 video (all-dark, no light/dark alternation, 31.6 s); it is a technique donor here only, for the condensed "fear and greed" type slam and the tracking-collapse "Save this post" CTA.
- **Use when:** you have a service offer or a direct-response DM/lead CTA, punchy copy, no footage. Problem → agitate → mechanism → proof → CTA in under 20 s. Best for retargeting and for Pinterest/Reels interest audiences.
- **Duration:** 15–20 s (450–600 f).
- **Pacing:**
  - One VO clause per scene, 36–60 f (about 35–40 scenes/min).
  - Word changes every ~10 f.
  - Hard luma alternation: cream ~#F8F5EE (measured luma 201–231 per second) vs black (measured 19–39). Mid values (69, 178–181) are transition seconds.

| Beat | Frames | Content |
|---|---|---|
| Hook (identification) | 0–43 | Cream collage: hero 3D cut-out bleeding off the edge, barcode/grid/stamp decor. Per-word reveal; keywords go pink to red. |
| Dip to dark | 43–48 | Black overlay 0→0.6 over 5 f, then a hard cut. |
| Problem | 48–96 | Black: text inside an object (glowing circle head), rising blurred white line. |
| Agitate | 96–180 | Neon-red glow words with an empty-black beat between lines; a metaphor sticker (clown = noise). |
| Stakes | 180–290 | 2.5D tilted plane + prop (briefcase = money). Pinned note card list build. |
| Mechanism | 290–383 | Brand logotype blur focus pull; the keyword lands huge in red. |
| Iris wipe | 383–386 | Black circle iris (5 f). |
| Proof | 386–425 | Recreated profile / dashboard card settles from blur 12. |
| Re-agitate | 425–490 | Motion-blur slide-in word; emoji sticker with DOF duplicates. |
| CTA | 490–540 + 30 f hold | Ghost-word neon CTA: all words laid out at 0.08 opacity, each lights on its VO word. **Add an end-card hold**; the ref ends abruptly. |

### Format selection matrix

| Have face footage? | Argument length | Goal | Format |
|---|---|---|---|
| yes | listable N items | leads / comments | F1 |
| yes | thesis / story | brand / authority | F2 |
| no | 3–6 sentence pitch | paid conversion, many variants | F3 |
| no | punchy DR copy | DM / lead / retargeting | F4 |

---

## 2. Style bible / quality bar

Each rule is a number the QA gate (section 5, `video-qa`) can check, or a reviewer can check against a contact sheet.

### 2.1 Delivery spec (all platforms)

| Property | Value |
|---|---|
| Canvas | 1080x1920, 9:16, square pixels |
| Frame rate | 30 fps CFR (render at 30; never deliver the 24/25 fps of the refs) |
| Video codec | H.264 High profile, level 4.2, yuv420p, bt709 (primaries/trc/matrix tagged), `+faststart` |
| Quality | CRF 18 (preset slow), capped `-maxrate 12M -bufsize 24M`. Target 8–12 Mbps. Refs sat at 0.3–1.9 Mbps and visibly band. That is the cheapest tell to beat. |
| GOP | keyint 60 (2 s), closed GOP |
| Audio | AAC-LC 192 kbps, 48 kHz, stereo |
| Loudness | **−14 LUFS integrated (±1), true peak ≤ −1.0 dBTP, LRA ≤ 6 LU** (refs: LRA 1.7–4.3) |
| Length | F1 45–60 s · F2 45–90 s · F3 15–30 s · F4 15–20 s |
| Master | ProRes 4444 or lossless intermediate from Remotion, then ffmpeg finish (section 4) |
| Platform variants | `pinterest`, `reels`, `tiktok`, `shorts` share the same encode. Variants differ only by cover frame and safe-zone check. Shorts ≤ 60 s for ads. |

### 2.2 Hook rules
- **Frame 0 is never empty.** A lit subject (presenter, mascot, prop or counter) is visible on f0 in 7/7 refs (checked on `hook/hook-0.0s.jpg`). Hook **text** is on f0 in only 1/7 (wedding); it is on screen by 0.5 s (f15) in 6/7 (travel shows only the logo + URL until ~2 s). Rule: subject on f0, hook text on screen by **f15**.
- **First motion event ≤ f6** (counter tick, slide-in, sparkle). Refs: `motionPerSecond[0]` is 2.3–22.5 in all 7, so second 0 always moves; the ≤ f6 figure itself is inferred from 0.5 s stills, not measured per frame. The first semantic payoff or keyword lands by **f45 (1.5 s)**. A 3D or "wow" element appears by **f45** (wedding bulb in hand at 0–1 s, earthy 3D bulb on f0, counters in boho/mental-wellness on f0).
- The first scene change or re-colour hit happens at **f40–f80**.
- Hook text ≤ 7 words, split into two lines with a two-tone hierarchy (accent line + white line).

### 2.3 Pacing (per format)

| Metric | F1 | F2 | F3 | F4 |
|---|---|---|---|---|
| Visual events /min (scene + punch + overlay) | 25–35 | 25–32 | 19–25 | 35–40 |
| Scene / shot length (f) | 45–75 | 30–90 A-roll, 45–120 B-roll | 60–105 | 36–60 |
| Max frames without a visual event | 90 | 90 | 105 | 60 |
| Caption change cadence | 12–18 f page | per word, 6–10 f | per word, 6–10 f | per word, ~10 f |
| Min `motionPerSecond` in any second (excl. last) | > 0.2 (no dead frames: always drift) | > 0.2 | > 0.2 | > 0.2 |

Definitions (so these are measurable):
- `motionPerSecond` = mean `signalstats` YAVG of `tblend=difference` at 10 fps, 160 px wide (0–255 scale), as computed by `analyze-reference.mjs`. Refs' minimum per-second values: 0.07 (travel), 0.08 (mental-wellness), 0.24–0.92 (the rest), so > 0.2 is deliberately stricter than two refs.
- A **visual event** = a scene cut (cuts < 0.2 s apart count as one), a punch-in (scale step ≥ 8%), or an overlay entering/leaving that covers ≥ 10% of the frame. Until `visualEventsPerMinute` exists in the analyzer, count events from `beats.json` (each beat, punch and overlay cue) and spot-check against the contact sheet.

Cuts land on **VO sentence or clause boundaries** (scene boundary = sentence-end frame + 2–4 f), not the music beat. This is a design choice, **not** a measured property of the refs: `cutsOnOnsetShare` (0.2–0.34; travel 1.0 on a single cut) is computed from onset times that are ~2x wrong (see status note 1), so it says nothing yet. Key animated events (counter end, check badge, ring fill) **finish on the stressed word's first frame**.

### 2.4 Safe zones and text sizes (1080x1920)
- Safe rect: top 220 px, bottom 380 px, sides 90 px (the template's `safe` already encodes this). Nothing readable goes in the bottom 20% (platform caption/CTA) or the right 120 px band from y 900–1700 (action rail).
- **Talking-head captions:** chest-to-lap height **y 45–65%** (865–1250 px), never over the face. Measured on the sheets: wedding ~45–52%, sewing ~48–55%, pinterest plain captions ~60–65% (neon tier ~50–58%). In faceless formats: top block y 13–21% (250–400 px), secondary block y 62–78%.
- Type scale (px at 1080 w):

| Role | Size | Weight | Notes |
|---|---|---|---|
| Hero keyword / numeral | 150–220 (3D numerals ~75% width) | 900 | accent colour or gradient, tracking −0.03em |
| Accent caption word | 88–120 | 700–900 | 1.4–1.6x the base line |
| Base caption line | 52–64 | 500–600 | white / ink |
| Lead / connector word | 40–56 | 300–600, light italic ok | |
| Chapter label | 44 caps | 800 | |
| UI / label text | 24–34 | 600 | |

- Max 3 levels per frame; base:accent:hero ≈ 1 : 1.6 : 2.8 (mental-wellness).

### 2.5 Type system
- **Display (creator / chapter):** Montserrat 900 / Gilroy Black / Monument Extended, CAPS, for F1 chapter cards and hook titles.
- **Kinetic body:** Inter Display / Poppins 500–600, sentence case, for F3/F4.
- **Condensed slam:** Anton / Bebas Neue, used for ≤ 3 moments per video ("fear / greed", "no matter the trend").
- **Two-tier creator captions (F2):** Barlow Condensed Bold (plain white) + Poppins/Outfit Bold (neon accent).
- Numbers always `font-variant-numeric: tabular-nums`.
- One accent colour per video (plus at most one semantic counter-colour). Red is only ever for negation, loss or strike-through.

### 2.6 Colour and lighting recipes (pick one per video)

| Recipe | bg | Accent(s) | Light | Ref |
|---|---|---|---|---|
| `noirBlue` | #000000, beam rgba(42,90,250,.18) | #2A5AFA, deep #2445BC, logo #0B41FE→#7FD6FF | diagonal volumetric beam 118°, 3 px top rim, bloom on accents | mental-wellness |
| `noirDuotone` | #050505, panel #121212 | greed #2BD12B/#3CFF5A, fear #E0102A/#FF3B4E | top-light radial wash `ellipse 80% 50% at 70% 0%`; cross-fade variables over 6 f | boho-corner |
| `noirMood` | #050203 → #0B0B0B | white → red rgba(179,18,42,.55) → green #5AFF3C | rim light at the desk edge, light cone, anamorphic star | travel-bucket-list |
| `creatorChapter` | crushed A-roll, black floor #050507 | per chapter: #E8303A / #7B2BE2 / #2FD3A6 / #C99A2E / #E8E8E8 | radial halo behind the head at 55%, hue swaps on the caption-accent frame | wedding-photo-ideas |
| `creatorWarm` | peach wall #E8B48A→#F5C27A | royal blue #2457F0 (+ red negation, yellow #F2C21B steps) | soft camera-left key, warm rim | sewing-ideas |
| `creatorGreen` | #0B1A12 / wall #123A22 | neon #39FF7A | gobo shafts, warm practicals #F2B544 | pinterest-marketing |
| `paperRed` | cream #F8F5EE ↔ #030303 | #E3192F (light) / #FF1F2D neon (dark) | drop shadows + parallax on cream, neon glow on black | earthy-mountain |

Rules:
- Mean saturation of the whole video stays **≤ 20**. Refs measured 1.4–17.2 (travel 1.38 … sewing 17.23), which keeps the accent loud.
- Glow and bloom go on **graphics only**, never on footage.
- Whole-video mean luma by set: dark faceless (F3) 25–30 (boho 26.4, travel 25.3, mental-wellness 29.4); dark creator set (F1) ~38 (wedding 38.4); lit creator sets 70–100 (pinterest 70.8, sewing 98.4); F4 alternation ~129 (earthy). These are whole-video means including graphics, not a footage-only grade.
- Add 1–2% animated grain on all dark gradients to stop banding.

### 2.7 Motion defaults (Remotion, 30 fps)

| Name | Config | Use |
|---|---|---|
| `pop` | `{damping:14, stiffness:220, mass:0.6}` | caption words, pills: scale 0.82–0.85→1, translateY 22→0, blur 8→0, 2–4 f opacity |
| `bounce` | `{damping:10, stiffness:200, mass:0.8}` | stickers, emoji, badges: scale 0→1, rotate −8→0°, ~1.12 overshoot |
| `card` | `{damping:18, stiffness:90, mass:1}` | glass card fly-in over ~24 f |
| `smooth` | `{damping:200}` | camera, end-card logo, large layers |
| `wheel` | `{damping:14, stiffness:120}` | chapter-wheel rotation, 15 f |
| `numeralDrop` | `{damping:12, stiffness:160}` | 3D numeral y −300→0, scale 1.3→1 in CameraMotionBlur(270°, 8) |
| `snap` | `{damping:22, stiffness:300, mass:0.5}` | UI slides |

Eases: entrances `Easing.bezier(0.16,1,0.3,1)` (expo-out), camera `Easing.bezier(0.65,0,0.35,1)`, iris/whip `Easing.in(Easing.cubic)`. Spring configs above are passed as `spring({frame, fps, config:{damping, stiffness, mass}})`.

**Every scene drifts:** scale 1.00→1.06 plus translateY 0→−20 px over its duration. Blur-to-focus (blur 8–16→0) goes on almost every entering element. Motion blur (`@remotion/motion-blur` CameraMotionBlur, shutter 180–270°, 6–8 samples) goes on every fast move over 30 px/f.

### 2.8 Transition vocabulary (meaning-bearing; at most 2 types per video plus a hard cut)

| Transition | Frames | Means | Ref |
|---|---|---|---|
| Hard cut on clause end | 0 | default rhythm | all |
| Punch-in jump (scale 1.0↔1.12–1.45) | 0 | emphasis within A-roll | F1/F2 |
| White flash (#FFFDF5, opacity 0,1,1,0 at f0/2/4/9) | 9 | topic / section change | pinterest |
| Glitch slice (8–14 bands, RGB ±12 px) | 6–10 | "trap / brain / danger" beats only | pinterest |
| White-silhouette flash (matte filled white + glow) | 4 | contrarian turn | sewing |
| Whip-push + motion blur (out 0→−1080, in +1080→0) | 8–10 | next step in a sequence | mental-wellness |
| Light-arc + ring iris | 18 | signature reveal (1 per video) | mental-wellness |
| Black circle iris | 5 | light↔dark scene flip | earthy-mountain |
| Dip to dark (0→0.6) + hard cut | 5 | mood drop | earthy-mountain |
| Depth-push (scale 0.75, blur 14, brightness 0.55) | 12 | "and the best part" turn | mental-wellness |
| Recolour in place (CSS vars over 6 f) | 6 | opposite state, same layout | boho-corner |

### 2.9 Caption style
- Captions are VO-synced from **word-level whisper JSON** (run with the correct `language`), converted to `Caption[]` (`{text, startMs, endMs, timestampMs, confidence}`) and paged with `createTikTokStyleCaptions` from `@remotion/captions`:
  - Faceless formats: per word, with `combineTokensWithinMilliseconds: 0`.
  - Creator pages: 500–800 ms grouping, 1–3 words per page.
- Exactly one emphasis mechanism per video. Pick one:
  1. Two-tone line (accent line + white line).
  2. Grey-to-white settle (#8A8F9C→#FFF).
  3. Pink-to-red keyword (#F0697A @0.45 → #E3192F).
  4. Neon-glow tier (`0 0 8px, 0 0 24px, 0 0 60px` of the accent).
- 1–3 emphasis words per phrase, never more.
- Behind-subject depth sandwich (plate → text → matte → foreground captions) is used for hero words in F1/F2. It needs an RVM/rembg alpha matte.
- Spell-check every on-screen word against the script (mental-wellness shipped "challange").

### 2.10 SFX vocabulary and mix

| Event | SFX | Level |
|---|---|---|
| Scene transition | whoosh, starting 3–4 f before the cut | −8 dB rel. / −18 to −22 LUFS-S |
| Cut frame of a chapter/section | sub-hit / impact | peak about −10 dBFS |
| Counter running | ticks every 2–3 f, final tick on landing | −24 dB |
| Pill / badge / sticker pop | soft pop / click | −20 dB |
| UI message card | notification ding | −18 dB |
| Ring / iris reveal | riser 0.6–1.2 s + hit | −14 dB |
| Logo end card | 3 decaying hits about 0.6 s apart, or a single sting | −10 dB |

- VO sits about 0 dB with a high-pass at 80 Hz, compressor 4:1, about 6 dB gain reduction.
- Music bed −26 to −30 LUFS under VO (ducked about 6 dB via sidechain), dark minimal 95–110 BPM (**unverified**: the refs' `estimatedBPM` is computed from the broken onset envelope, so this tempo is taste, not measurement). It fades over the last 45 f.
- No silence anywhere. `silentShare` = 0 in 6/7 refs; sewing has 0.5 s of silence at the very end (82.28–82.78 s, share 0.006), which the QA rule allows.

### 2.11 Branding / CTA lock-up
- The CTA must be **explicit on screen**. Three refs had none; that is a defect, not a style.
- CTA patterns:
  - **Mid-roll keyword comment:** at 55–65% of runtime, inside a pattern interrupt, with a lead-magnet visual. Used in F1.
  - **Price end card:** logo ~40% width at y≈40%, "starting from" above, price below springing with `bounce`. Text out over 8 f, logo hold 48 f. Used in F3.
  - **Ghost-word neon CTA** + 30 f hold. Used in F4.
  - **Gradient end card** with line field + wordmark + sting, 150–180 f. Used in F2.
- Persistent lock-up (F3 brand spots): logo at y≈74% (1420 px), URL at y≈78% (1500 px), ~410 px wide. The travel ref puts them at ~77% / ~81%, but 81% (1555 px) falls inside the 380 px bottom zone (safe bottom = 1540 px), so move both up.
- Creator formats: no logo on A-roll. The face is the brand. The end card is optional.

---

## 3. Remotion component library spec

Template: `skills/video-editing/studio-template/`. **Existing** components:
- `components/KineticCaptions.tsx`: KineticCaptions
- `components/Graphics.tsx`: GlowCounter, ChapterBadge, Viewfinder, PunchLine, CTAEndCard, KenBurns
- `components/Atmosphere.tsx`: GrainVignette, LightBeam, AmbientGlow, FlashHit
- `lib/motion.ts`: springs, ramp, drift, msToFrame
- `lib/theme.ts`: fonts, canvas, safe, palettes

Dependencies: the template pins Remotion 4.0.539 with `@remotion/{captions, motion-blur, noise, transitions, google-fonts, layout-utils, media-utils}`. Components below that use `@remotion/paths` (`ChartDraw`, `StrikeThrough`), `@remotion/three` + `three` + `@react-three/fiber` (`ShatterFX`, `Numeral3D` 3D path) need those packages **added at the same 4.0.539 version**. `noise2D` takes `(seed, x, y)`, e.g. `noise2D("beam", frame/240, 0)`.

Each item below is marked **[exists → extend]** or **[new]**.

Priority:
- **P0:** needed to ship any of the 4 formats.
- **P1:** needed to hit the quality bar of the primary ref.
- **P2:** polish, signature moments.

### Foundations
| Component | P | Props | Behaviour / numbers |
|---|---|---|---|
| `theme.ts` recipes | P0 [extend] | `Recipe = {bg, bgAlt, text, muted, accent, accent2?, glow, beam?}` | Add the 7 recipes from §2.6 (`noirBlue`, `noirDuotone`, `noirMood`, `creatorChapter`, `creatorWarm`, `creatorGreen`, `paperRed`). Add `typeScale` {base 56, accent 92, hero 160, label 30} and fonts Poppins, Anton, Barlow Condensed. |
| `motion.ts` springs | P0 [extend] | — | Add `card`, `wheel`, `numeralDrop` from §2.7. Add `sceneDrift(frame, dur)` (scale 1→1.06, y 0→−20, inOut). |
| `useWordTimings(jsonPath, lang)` | P0 [new] | whisper JSON | Returns `{words:[{text,startF,endF}], sentences:[{startF,endF}]}` at 30 fps. Sentence ends drive scene boundaries (+3 f). |
| `SceneDirector` (composition helper) | P0 [new] | `beats: BeatSpec[]`, `timings` | Builds `TransitionSeries` from a JSON beat sheet (§6): per-beat component, duration from VO, transition type, SFX cues. Single source of truth so the LLM only writes JSON. |

### Type
| Component | P | Props | Behaviour |
|---|---|---|---|
| `KineticCaption` | P0 [exists → extend] | `words`, `mode: 'word'\|'page'`, `combineMs`, `emphasis: string[]`, `emphasisStyle: 'twoTone'\|'greySettle'\|'pinkRed'\|'neon'`, `y`, `align`, `plane3d?` | `pop` spring: translateY 22→0, scale 0.82→1, opacity 0→1 over 4 f, colour #8A8F9C→#FFF. Page mode: hard cut between pages. Emphasis words ×1.6. Optional `plane3d` inherits a parent card's transform. |
| `HighlightWord` | P0 [new] | `text, color, glow, size, delayF, behind?:boolean` | Hero word: scale 1.25→1, blur 8→0 over 3 f. `behind` renders into the depth-sandwich middle layer. Gradient text via `background-clip:text`. |
| `TwoToneTitle` (hook title) | P0 [new] | `line1, line2, c1, c2, recolorAtF?` | Lines slide from ∓1080 (6 f, line 2 delayed 2 f) in CameraMotionBlur(180, 8), scale 1.04→1. At `recolorAtF` line 2 swaps to a gradient with a 1 f 30% white flash. |
| `StrikeThrough` | P1 [new] | `targetBox, color, atF` | SVG path at −2°, 14 px, gradient #FF1E3C→#FF5A8A, dash draw over 8 f (expo-out). |
| `TypeSlam` | P1 [extend PunchLine] | `words:[{t,size,color,delay}]` | Anton 150 px. Spring scale 1.35→1, blur 8→0, brightness 0.4→1 over 6 f, delays 0/8/14 f. |
| `GreyRevealParagraph` | P1 [new] | `text, emphasis, timings` | Pre-laid-out paragraph (no reflow). Each word #4A4A4A→#FFF over 6 f at its VO start. Emphasis at 78 px over a 3x3 grid glow. |
| `GhostWordCTA` | P1 [new] | `words, accentWords, timings` | All words at 0.08 opacity with blur 6. Each word lights to 1 with blur 0 and a glow pulse `[0,40,28]` over 4 f on its VO word. |
| `TrackingCollapseCTA` | P2 [new] | `text, icon` | Per-letter fade over 6 f, stagger 1.5 f. letterSpacing 24→2 px over 40 f. Icon `bounce` at f30. |
| `PerspectiveSweep` | P2 [new] | `text` | perspective 1200: rotateY −35→0 over 20 f, translateX 420→−260 linear over 45 f, blur 6→0 over 8 f. |

### Numbers, data, UI
| Component | P | Props | Behaviour |
|---|---|---|---|
| `GlowCounter` | P0 [exists → extend] | `from, to, startF, endF, format:'usd'\|'int'\|'pct', easing, label, ticks?:boolean` | `Intl.NumberFormat`, tabular-nums, ends on the stressed-word frame. Emits tick SFX cues every 3 f. Variants: card (label 40 px accent + value 56 px), pill (`Profit` 670x115), hero (160 px). |
| `ProgressRing` | P1 [new] | `from, to, r=110, stroke=14` | dashoffset `C*(1-pct/100)`, gradient accent→#7FA4FF, drop-shadow glow, number synced. |
| `GlassCard` | P0 [new] | `w,h, tilt:{rx,ry}, flyIn, specular, cornerBloom, grid` | radius 36, border 3 px rgba(255,255,255,.6), backdrop blur 12, gradient fill 8%→2%. Fly-in `card` spring: rotateY −28→−12°, rotateX 18→6°, y 500→0, z −400→0 over 24 f. Idle ry += 4·sin(f/45). Specular sweep −120%→220% over 60 f, 10 f after landing. Grid 1 px 6% every 48 px. |
| `ChartDraw` | P0 [new] | `kind:'line'\|'sine2'\|'candles'\|'bars'\|'loss', data, color, durF` | `@remotion/paths` evolvePath over 30–60 f. Candles 1 per 4 f. Bars row i at 6+3i f. Optional sparkle head at `getPointAtLength`. Dashed markers. |
| `PillPointer` | P2 [new] | `pills, activeAtF[]` | Triangle pointer via spring {18,120}; active pill glow 0→24 px over 6 f. |
| `UIMockCard` | P1 [new] | `kind:'dm'\|'comment'\|'whatsapp'\|'profile'\|'adBar'`, content | Dark UI on #0E1418, tilt rx 6 / ry −8, push 1→1.06. Comments stagger 5 f (y 30→0, blur 6→0), max 3. `adBar`: yellow #F5D90A fill 0→100% over 90 f + "Skip Ad" chip. |
| `IconStepRow` | P2 [new] | `steps:[{icon,label}]` | Circles #F2C21B 130 px pop 6 f apart (`{11,240}`), dashed connector draws over 8 f. |

### Characters, props, 3D
| Component | P | Props | Behaviour |
|---|---|---|---|
| `GlassOrbCharacter` | P0 [new] (CSS) / P2 (three) | `size=290, rim:'white'\|'red'\|'blue', mood, exitTo?` | CSS radial-gradient sphere + inset highlights, eyes 14 px dots ±40 px, dome body masked. Bob 4–6·sin(f/18–20), blink scaleY 0.1 for 3 f every 90 f. Exit spring to scale 0.45. |
| `Numeral3D` | P1 [new] | `value, color='#2457F0', depth=12` | 12 stacked CSS layers translateZ(−2px·i) darkening to #0C2A8F, or `@remotion/three` TextGeometry. Shadow offset 40 px / blur 30. `numeralDrop` entry + drift 1→1.03. `behind` sandwich. |
| `ChapterWheel` (`RimLitTitleCard` for F1) | P1 [extend ChapterBadge] | `index, total, label, hue` | 45–55 f card on #08060C→#3A0F66. SVG N-segment annulus r 700 at (540,860). Active wedge gradient + 2 px stroke + glow 30 px. Rotate −360/N per chapter (`wheel`), inactive at 10%, prior chapters ghosted. Bulb at centre + violet cone + noise2D particles. |
| `PropImage` | P0 [new] | `src (transparent PNG/WebM), x,y,scale, parallax, enter:'bounce'\|'drop'\|'fade'` | `drop-shadow(0 30px 40px rgba(0,0,0,.18))` on cream / rim glow on black. Optional DOF duplicates (blur 8, 0.6 opacity, 1.5x parallax). |
| `Sticker` | P1 [new] | `src, side:'left'\|'right', polaroid?:boolean, ring?:boolean` | `bounce` scale 0→1 + rotate −4→0° over 8 f, hard cut out. Polaroid: grayscale + 4 px white border. Ring: 4 px circle strokeDash full→0 over 10 f. |
| `ShatterFX` | P2 [new] | `src, atF, shards=40` | `@remotion/three` shards: vel rand·6 px/f, gravity 0.15 px/f², spin, opacity 1→0 over 20 f. Fallback: pre-rendered alpha WebM. |
| `DocumentFlyIn` | P1 [new] | `src` | Background saturate(0) brightness(.35). Doc perspective 1200: rotateX 35→8°, rotateZ −8→0°, scale .6→1.05 over 30 f expo-out in motion blur. Whoosh + impact cue. |
| `TextInObject` | P1 [new] | `shape:'circle'\|'pill', size=380, text, emphasis` | F4 (earthy "But your growth?"): white disc on black with soft glow 40 px, text wraps inside the disc in ink, a halftone cut-out figure below. Disc scales 0.9→1 (`pop`), text per word. |
| `HalftoneCutout` | P1 [new] | `src, dot=6, color` | Footage/photo cut-out rendered as a dot screen (earthy suit figure, pinterest Apple logo behind head). SVG pattern mask or pre-processed PNG; on black, white dots; on cream, ink dots. |
| `PinnedNoteList` | P1 [new] | `title, items:[{icon,label}], pinColor='#E3192F'` | F4 stakes beat (earthy "Value / No eyeballs / No impact / No earnings"): grey card #8E8E8E, rotate −3°, red pushpin, drop shadow 0 30 40 .18. Items add one per VO clause, `pop` 6 f. |
| `CollageDecor` | P1 [new] | `items:('barcode'\|'grid'\|'stamp'\|'arcBand')[]` | F4 cream-scene decor: barcode top-right, 1 px dot grid, small stamp/logo bottom, thick grey arc band (#BDBAB3, 90 px stroke) sweeping off-frame. Parallax 0.3x of the hero prop. |
| `LightCone` | P2 [new] | `color, apexY, spreadDeg=30` | Travel/noirMood: narrow volumetric cone from a point light with a 4-point anamorphic star at the apex; cone opacity flicker ±5% via noise2D. Used under a counter or logo. |
| `EmojiInWord` | P2 [new] | `word, index, emoji` | Earthy "But not sm😎rt": an emoji sticker replaces one glyph, `bounce` in, with DOF duplicates behind. |
| `CrowdFigures` | P2 [new] | `count=12, tint, rows=2` | Boho: rows of glossy mannequin figures (reuse `GlassOrbCharacter` at scale 0.25) that recolour with `ColorWash`. |

### A-roll (creator formats)
| Component | P | Props | Behaviour |
|---|---|---|---|
| `ARoll` | P0 [new] | `src, matteSrc?, punches:[{atF, scale}], origin='50% 30%'` | OffthreadVideo with hard-cut scale steps 1.0/1.12/1.45/2.2 on sentence boundaries + hold drift ×1.03. Exposes `DepthSandwich` slots (`behind`, `front`). Requires ≥ 1080p source; 4K for a 2.2x punch. |
| `DepthSandwich` | P0 [new] | `plate, matte, behind: ReactNode, front: ReactNode` | Layer order: plate → behind → matte (transparent) → front. |
| `Viewfinder` | P1 [exists] | `active` | L-brackets 75 px, REC dot blinks every 15 f, fake timecode. |
| `BacklightHalo` | P1 [new] | `hue, atF` | radial-gradient at 50% 30%, 600 px, 55% opacity, screen blend. Hue hard cut synced to the caption accent. |
| `SplitProof` | P2 [new] | `topARoll, bottomSrc, pillWords` | A-roll spring {20,120} to scale 0.5 inset with 6–8 px white border, blurred proof below, seam pill pop 0.8→1 per word. |
| `AISkitCutaway` | P2 [new] | `src, ring:'blue'\|'white', pill` | Cool grade saturate .4, halftone 6 px multiply .1, ring draw 10 f + scale 1.15→1, label pill. |
| `PrintedBRoll` (`PhotoKenBurnsSlideshow`) | P1 [extend KenBurns] | `items:[{src, durF}], treatment:'halftone'\|'clean'` | Ken Burns 1.0→1.08. Halftone 6 px multiply 0.35 + RGB split ±3 px + contrast 1.35 saturate .55. Insert 45–120 f each. |

### Atmosphere and transitions
| Component | P | Props | Behaviour |
|---|---|---|---|
| `LightBeam` | P0 [exists → extend] | `angle=118, color, intensity=.18, drift` | Lives OUTSIDE transition layers so it never moves with content. Double band, blur 40, screen. Drift ±30 px via `noise2D("beam", f/240, 0)·30`. Plus `RimLight` (3 px top edge, glow 24 px). |
| `ColorWash` | P0 [new] | `recipe, state, crossfadeF=6` | Radial top-light wash; switches state via CSS-var interpolation (greed↔fear). |
| `GrainVignette` | P0 [exists] | existing props `grain=0.06, vignette=0.55` (numbers, opacity-style) | Always on in dark formats (anti-banding). Use grain ≈ 0.02 on dark gradients per §2.6. |
| `Stage45` | P2 [new] | `letterbox:boolean` | 1080x1350 stage at top 285 for a 4:5 look (boho). |
| `FlashHit` → `WhiteFlash` | P0 [exists → extend] | existing `at, color='#FFFFFF', frames=6`; add `variant:'flash'\|'lightLeak'\|'silhouette'`, default `frames=9, color='#FFFDF5'` | Opacity `[0,1,1,0]` at f0/2/4/9, under-layer blur 0→20→0. Silhouette: matte brightness(0) invert(1) + glow, 4 f. |
| `WhipPush` | P0 [new] | `dir, durF=10` | Custom TransitionPresentation: out 0→−1080, in +1080→0, Easing.in/out cubic, CameraMotionBlur 270/8 or blur(12v)+scaleX(1+.15v). |
| `RingIris` (light-wipe) | P1 [new] | `durF=18, arcColor` | 40° arc, 30 px stroke, rotate −140→20° over 12 f. Ring r 120→1300 over f4–18. Incoming clipPath circle. Old card scale 1→.55, rotZ −8°. |
| `CircleIris` | P1 [new] | `durF=5, color='#000'` | clipPath circle r 0→1200 in-cubic; incoming blur 12→0 over 8 f. |
| `GlitchSlice` | P1 [new] | `durF=8, bands=12` | Bands translateX (rand−.5)·80, caption RGB ±12, 2–3 f pixelated mosaic. |
| `DepthPush` / `ZoomThrough` | P1 [new] | `durF=12` | Old layer scale 1→.75, blur 0→14, brightness→.55, rotateY 12°. ZoomThrough variant: scale 1→3 + blur into the next scene centre over 10 f. |
| `DipToDark` | P2 [new] | `durF=5` | Overlay 0→0.6 then hard cut. |

### End cards
| Component | P | Props | Behaviour |
|---|---|---|---|
| `LogoLockup` | P0 [new] | `logo, wordmark?, url?, persistent:boolean` | Persistent: y 74% / URL 78%, 410 px (inside the safe rect; see §2.11). End variant: spring `smooth` scale 0.9→1, opacity 0→1 over 6 f, letterSpacing .1em→0, bloom. |
| `CTAEndCard` | P0 [exists → extend] | `variant:'price'\|'gradientLines'\|'ghostWords'\|'keyword', headline, price?, keyword?, holdF=48` | Price: "starting from" + price spring (damping 9, stiffness 160) + pendulum tag `25·e^(−f/8)·cos(f/2.2)`, text out 8 f, logo hold 48 f. GradientLines: 170° gradient, 20 arcs draw 20 f, rotate 0→4°, exit blur 0→40 into a light leak, 150–180 f. |

### Audio
| Component | P | Props | Behaviour |
|---|---|---|---|
| `SfxTrack` | P0 [new] | `cues:[{type, atF}]` | Maps the §2.10 vocabulary to files in `public/sfx/` (whoosh, hit, tick, pop, ding, riser, sting3) with standard offsets (whoosh −4 f) and volumes. Cues are auto-generated by `SceneDirector`. |
| `MusicBed` | P0 [new] | `src, duckUnder: wordTimings, base=-26 LUFS` | Volume callback −6 dB while VO is active (5 f attack, 8 f release), fade out over the last 45 f. |

### Compositions (one per format, all driven by a beat-sheet JSON)
| Composition | P | Notes |
|---|---|---|
| `GlassExplainer` (F3) | P0 | replaces/extends `SpecAd.tsx`; 450–900 f |
| `KineticCollage` (F4) | P0 | 450–600 f; cream/black alternation |
| `ChapterListicle` (F1) | P1 | needs ARoll + matte |
| `CreatorBreakdown` (F2) | P1 | needs ARoll + matte + PrintedBRoll |
| `Cover` (still) | P0 | 1080x1920 cover frame = hook title on the best hook frame |

---

## 4. ffmpeg post pipeline

`skills/video-editing/scripts/finish.sh` already implements two-pass loudnorm + encodes + cover + QA. The commands below are the canonical forms it must match. Paths use `$IN` (Remotion render), `$OUT`.

### 4.1 Pre-render: VO cleanup (before Remotion)
```sh
ffmpeg -y -i vo_raw.wav -af "highpass=f=80,lowpass=f=14000,afftdn=nf=-25,acompressor=threshold=-20dB:ratio=4:attack=5:release=80:makeup=2,alimiter=limit=0.89" -ar 48000 vo.wav
```
`acompressor` `makeup` is a **linear** gain (1–64): `makeup=2` ≈ +6 dB, matching the ~6 dB of gain reduction targeted in §2.10 (`makeup=4` would be +12 dB).

### 4.2 Audio ducking: music under VO (when mixing outside Remotion)
```sh
ffmpeg -y -i vo.wav -i music.wav -i sfx.wav -filter_complex \
"[1:a]volume=-8dB[m];[0:a]asplit=2[vo][sc];\
[m][sc]sidechaincompress=threshold=0.05:ratio=8:attack=5:release=250:makeup=1[mduck];\
[vo][mduck][2:a]amix=inputs=3:normalize=0:duration=first[mix]" \
-map "[mix]" -ar 48000 mix.wav
```

### 4.3 Loudness: two-pass to −14 LUFS / −1 dBTP
```sh
# pass 1: measure
ffmpeg -hide_banner -nostdin -i "$IN" -vn -af loudnorm=I=-14:TP=-1:LRA=7:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p' > loud.json
# pass 2: apply (linear) with the measured values
I=$(jq -r .input_i loud.json); TP=$(jq -r .input_tp loud.json); LRA=$(jq -r .input_lra loud.json)
TH=$(jq -r .input_thresh loud.json); OFF=$(jq -r .target_offset loud.json)
AF="loudnorm=I=-14:TP=-1:LRA=7:measured_I=$I:measured_TP=$TP:measured_LRA=$LRA:measured_thresh=$TH:offset=$OFF:linear=true:print_format=summary,aresample=48000"
```
If pass 2 reports `Normalization Type: Dynamic`, the source LRA is too wide. Compress the VO harder (4.1) and rerun, rather than accepting dynamic mode. Note that `finish.sh` currently uses `LRA=11`. That is fine for linear mode, but QA still enforces LRA ≤ 6.

### 4.4 Platform encode (1080x1920, H.264 High, yuv420p, bt709, faststart)
```sh
ffmpeg -hide_banner -nostdin -y -i "$IN" \
  -vf "scale=1080:1920:flags=lanczos,fps=30,format=yuv420p,setsar=1" \
  -c:v libx264 -profile:v high -level:v 4.2 -preset slow -crf 18 \
  -maxrate 12M -bufsize 24M -g 60 -keyint_min 60 -sc_threshold 0 -bf 2 \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv \
  -x264-params "colorprim=bt709:transfer=bt709:colormatrix=bt709" \
  -af "$AF" -c:a aac -b:a 192k -ar 48000 -ac 2 \
  -movflags +faststart -metadata title="$SLUG" \
  "$OUT/$SLUG-$PLATFORM.mp4"
```
- `PLATFORM ∈ {pinterest, reels, tiktok, shorts}`. Same settings for all four; only the file name and cover differ.
- Optional anti-banding before encoding dark formats: insert `noise=alls=3:allf=t` before `format=yuv420p`.

### 4.5 Grade helpers (for footage, not graphics)
```sh
# low-key creator set (F1)
-vf "eq=contrast=1.12:brightness=-0.04:saturation=0.9,curves=preset=darker,vignette=PI/4"
# warm wall (sewing)
-vf "eq=saturation=0.85:gamma=1.03,colorbalance=rs=.06:gs=.02:bs=-.05,vignette=PI/5"
# printed B-roll (F2)
-vf "rgbashift=rh=-4:bh=4,eq=contrast=1.35:saturation=0.55,noise=alls=12:allf=t"
```

### 4.6 Cover / thumbnail extraction
```sh
# exact frame (hook title frame, default 1.0 s), full-res PNG + JPEG
ffmpeg -y -ss 1.0 -i "$OUT/$SLUG-reels.mp4" -frames:v 1 -update 1 "$OUT/$SLUG-cover.png"
ffmpeg -y -i "$OUT/$SLUG-cover.png" -q:v 2 "$OUT/$SLUG-cover.jpg"
# candidate picker: best-scoring representative frame from the first 3 s
ffmpeg -y -t 3 -i "$IN" -vf "thumbnail=30,scale=1080:-1" -frames:v 1 "$OUT/$SLUG-cover-auto.jpg"
```

### 4.7 Contact-sheet QA
```sh
# 24-frame sheet (6x4) spaced evenly across the duration
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT/$SLUG-reels.mp4")
ffmpeg -y -i "$OUT/$SLUG-reels.mp4" -vf "fps=24/$D,scale=270:-1,tile=6x4:padding=4:color=white" -frames:v 1 "$OUT/qa/$SLUG-sheet.jpg"
# hook strip: first 3 s at 4 fps
ffmpeg -y -t 3 -i "$OUT/$SLUG-reels.mp4" -vf "fps=4,scale=270:-1,tile=6x2:padding=4" -frames:v 1 "$OUT/qa/$SLUG-hook.jpg"
# safe-zone overlay check on the sheet frames
ffmpeg -y -i "$OUT/$SLUG-reels.mp4" -vf "fps=32/$D,drawbox=x=90:y=220:w=900:h=1320:color=red@0.6:t=4,scale=270:-1,tile=8x4" -frames:v 1 "$OUT/qa/$SLUG-safe.jpg"
# loudness verification on the delivered file
ffmpeg -hide_banner -nostdin -i "$OUT/$SLUG-reels.mp4" -af ebur128=peak=true -f null - 2>&1 | tail -12
# metrics (same analyzer as the references)
node skills/video-reference-analysis/scripts/analyze-reference.mjs "$OUT/$SLUG-reels.mp4" "$OUT/qa/$SLUG"
```

---

## 5. Skills to create

Location: `skills/<name>/SKILL.md` plus scripts. Two already exist as scripts only (`video-reference-analysis/scripts/analyze-reference.mjs`, `video-editing/{scripts,studio-template}`). Each needs a `SKILL.md`.

### 5.1 `video-reference-analysis` [exists: scripts; add SKILL.md, fix bugs]
- **Purpose:** turn a reference video into a forensic breakdown (beats, techniques with rebuild recipes, quality signals) plus metrics.
- **Trigger:** "analyze this reference / ad / reel", a new file in `assets/Video references/`, or before any new format is added.
- **Inputs:** video path, slug (derived from **content**, not file title), `--lang` for whisper.
- **Outputs:** `outputs/video-analysis/<slug>/{metrics.json, transcript.json, transcript.srt, hook/, keyframes/, sheets/, waveform.png, analysis.md}`. Update `_synthesis.md` when a new archetype appears.
- **Steps:**
  1. Run `analyze-reference.mjs <video> <outdir> --lang auto|pt|en`.
  2. Read the sheets, hook strip and keyframes by eye.
  3. Re-count real scenes from the sheets, since the detector is unreliable on dark or punch-in edits.
  4. Write `analysis.md` from the fixed template: archetype, one line, beat sheet (s + frames @30), techniques {name, evidence path, howToRebuild with numbers}, quality signals, uncertain.
  5. Map it to F1–F4 or propose F5.
- **Required fixes (P0):**
  - Onset time scaling: timestamps are about 2x in **7/7** files. The envelope is built from `asetnsamples=n=441` at 22050 Hz with `hop = 0.02`, so the RMS list has about twice as many entries as 20 ms hops. Likely cause: `ametadata=print` emits each RMS value twice, or the resample changes block size. Fix by deriving `hop` from `rms.length / duration` (or parsing `pts_time`), then re-run all 7 refs.
  - Whisper language auto-detect, with speech detection that does not mark pt-BR as music.
  - A `visualEventsPerMinute` metric from frame-diff peaks with a low threshold plus punch-in (scale-change) detection.
  - Collapse cut clusters shorter than 4 frames into one transition event.
  - The **lead agent** writes `analysis.md` (subagent writes are blocked); subagents return the structured JSON.
- **Files:** `skills/video-reference-analysis/{SKILL.md, scripts/analyze-reference.mjs, templates/analysis.md}`.

### 5.2 `video-editing` [exists: template + scripts; add SKILL.md]
- **Purpose:** produce the video: Remotion composition from a beat-sheet JSON, then the ffmpeg finish.
- **Trigger:** "make / edit / render the video", or a beat sheet produced by `video-prompting`.
- **Inputs:** `outputs/creatives/<slug>-beats.json`, VO wav (or a TTS script), assets (props, footage, matte, logo, sfx), recipe name.
- **Outputs:**
  - `outputs/creatives/<slug>/<variant-id>-{pinterest,reels,tiktok,shorts}.mp4`
  - `<variant-id>-cover.jpg`
  - sidecar `<variant-id>.json` (beats, recipe, render settings, QA result)
- **Steps:**
  1. `setup-video-stack.sh` (once).
  2. `transcribe.mjs vo.wav --lang` to word JSON.
  3. Matte A-roll if F1/F2 (RVM → ProRes 4444).
  4. Copy the template, then write `src/beats.json`.
  5. `npx remotion studio` preview of the hook (f0–90) and one transition.
  6. `npx remotion render <Comp> --codec prores --prores-profile 4444` (or h264 crf 12 intermediate).
  7. `finish.sh render.mov <outdir> all 1.0`.
  8. Run `video-qa`. Fix and re-render until it passes.
- **Files:**
  - `skills/video-editing/SKILL.md`
  - `scripts/{setup-video-stack.sh, transcribe.mjs, finish.sh, matte.sh (new)}`
  - `studio-template/src/{components/*, compositions/{GlassExplainer,KineticCollage,ChapterListicle,CreatorBreakdown}.tsx, lib/*}`
  - `public/sfx/*`

### 5.3 `video-ad-formats` [new]
- **Purpose:** the 4 archetypes as fill-in templates: beat skeleton with frame budgets, default recipe, component per beat, transition vocabulary, CTA variant.
- **Trigger:** choosing a format for a campaign / creative spec, or "what kind of video should we make".
- **Inputs:** campaign plan / creative spec (`outputs/campaigns/<slug>-plan.md`, `outputs/creatives/<slug>-spec.md`), asset availability (face footage? product UI?), objective.
- **Outputs:** chosen format + justification + a pre-filled `beats.json` skeleton in `outputs/creatives/<slug>-beats.json`.
- **Steps:**
  1. Apply the §1 selection matrix.
  2. Load `formats/<F>.json`.
  3. Set duration from the VO word count at 2.6–3.5 words/s.
  4. Allocate frames per beat.
  5. Choose a recipe and an emphasis style.
  6. Hand off to `video-prompting` to fill copy and visuals.
- **Files:** `skills/video-ad-formats/{SKILL.md, formats/{chapter-listicle,creator-breakdown,glass-explainer,kinetic-collage}.json, examples/<ref-slug>.beats.json}`. Rebuild each primary ref as a worked example.

### 5.4 `video-prompting` [new]
- **Purpose:** the master prompt and brief templates that get premium output from (a) an LLM editor agent writing `beats.json` + Remotion code, and (b) Higgsfield for source footage and props.
- **Trigger:** before any video render. Use it whenever Higgsfield is asked for ad footage, props, AI skits or a mascot.
- **Inputs:** format, offer, audience/persona (`<slug>-persona.md`), psychology levers (`<slug>-psychology.md`), brand recipe, VO script or a talking-points brief.
- **Outputs:** `outputs/creatives/<slug>-video-brief.md` (filled master prompt) and `<slug>-beats.json`. A Higgsfield shot list `outputs/creatives/<slug>-higgsfield.json` with one entry per asset: `{id, model, prompt, negative, ar, seconds, transparent?, usage beat}`.
- **Higgsfield prompt rules:**
  - **Props:** isolated on pure black or a chroma background for matting. Spec: "glossy 3D render, studio rim light from back-left, soft top key, black void, centred, no text". Use Nano Banana Pro / GPT Image 2.
  - **Motion props:** Kling/Seedance image-to-video, 2–4 s, locked camera.
  - **AI skits:** Soul ID for creator likeness, 2–3 s, single emotion, one prop/sign, cool grade.
  - **A-roll** is never AI-generated for F1/F2 unless the user approves; a real face is the trust signal.
  - Request 2x the final length and ≥ 1080p.
  - Ask for no burned-in text: all text is added in Remotion.
- **Steps:**
  1. Fill §6 sections A–C.
  2. Write the VO script to the word budget.
  3. Make the per-beat spec table.
  4. Produce the Higgsfield shot list.
  5. Self-check against §2 numbers.
- **Files:** `skills/video-prompting/{SKILL.md, master-prompt.md (=§6), higgsfield-recipes.md, brief-template.md}`.

### 5.5 `video-qa` [new]
- **Purpose:** an automated quality gate. It compares the delivered file's metrics to the style bible and blocks delivery on failure.
- **Trigger:** after every `finish.sh`, before any upload, and on any "is this good enough". Required by the AGENTS.md adversarial-verification rule for creative uploads.
- **Inputs:** delivered mp4, `beats.json`, format id, script text.
- **Outputs:**
  - `outputs/reports/.notes/<slug>-video-qa-<YYYY-MM-DD>.json` (raw metrics + per-check pass/fail)
  - `outputs/creatives/<slug>/qa/{sheet.jpg, hook.jpg, safe.jpg}`
  - Verdict PASS / FAIL with fixes. A FAIL blocks Meta upload.
- **Automated checks:**

| Check | Source | Pass |
|---|---|---|
| Resolution / fps | `metrics.video` | 1080x1920, 30 |
| Bitrate | `metrics.video.bitrateKbps` | 6000–14000 |
| Codec / pix_fmt / colour tags | ffprobe | h264 High, yuv420p, bt709 x3, moov at the front |
| Integrated loudness | `audio.integratedLUFS` | −15 ≤ x ≤ −13 |
| True peak | `audio.truePeakDBFS` | ≤ −1.0 |
| LRA | `audio.loudnessRangeLU` | ≤ 6 |
| Silence | `audio.silentShare` | 0 (except the final 0.5 s) |
| Duration | `duration` | within the format range (§2.1) |
| No dead seconds | `motionPerSecond` | every second > 0.2 |
| Hook motion | `motionPerSecond[0]` and hook strip | > 1.0, first change ≤ f6 (diff of f0 vs f6) |
| Visual events/min | new `visualEventsPerMinute` | within the format band (§2.3) |
| Max gap without an event | frame-diff peaks | ≤ the format max (§2.3) |
| Mean saturation | `look.meanSaturation` | ≤ 20 |
| Banding proxy | `video.bitrateKbps` + beats.json | bitrate ≥ 6000 kbps AND `GrainVignette` present on every dark-gradient beat. A visual check of the 3 darkest sheet frames at 200% is in the manual list; there is no automated banding metric yet. |
| Transcript vs script | whisper on the output | word error rate ≤ 10%; on-screen text spell-checked vs script |
| CTA present | beats.json + last-3 s OCR (tesseract) | CTA text or logo detected |

- **Manual checklist** (reviewer looks at the sheet):
  - Captions are inside the safe rect.
  - One accent colour.
  - No text over the face.
  - At most 2 transition types.
  - The end card holds ≥ 30 f.
  - No visible banding on the 3 darkest frames at 200% zoom.
- **Steps:**
  1. Run `analyze-reference.mjs` on the output.
  2. Run `qa.mjs` with the format thresholds.
  3. Build the contact sheets (§4.7).
  4. Write the JSON.
  5. Verdict.
  6. Append a `CHANGELOG.md` entry with the verified / unverified labels.
- **Files:** `skills/video-qa/{SKILL.md, scripts/qa.mjs, thresholds.json (per format F1–F4)}`.

---

## 6. Master prompt

```text
ROLE
You are the editor-director for a premium short-form vertical ad. You do not "make a video";
you produce (1) a VO script, (2) a frame-accurate beats.json for the OpenMarketing Remotion
studio template, (3) a Higgsfield asset list, and (4) a QA self-check. Every visual decision
must be a number. If a value is a guess, say so in the sheet's "uncertain" field.

INPUTS (fill all; if missing, ask once, then mark "inferred")
- slug:                      <lowercase-hyphen ≤5 words>
- objective:                 <lead | purchase | DM | follow | brand>
- offer + price/proof:       <one line + the single hard number we can show>
- audience + awareness stage: <from <slug>-persona.md / <slug>-psychology.md>
- core lever(s):             <e.g. loss aversion, social proof, curiosity gap>
- assets available:          <face A-roll? product UI? logo SVG? props?>
- language / locale:         <en-US | pt-BR | ...>   (whisper must use this)
- format:                    <F1 Chapter Listicle | F2 Creator Breakdown | F3 Dark Glass Explainer | F4 Kinetic Collage>
                             choose with: face+list→F1, face+thesis→F2, no face+pitch→F3, no face+DR copy→F4
- recipe:                    <noirBlue | noirDuotone | noirMood | creatorChapter | creatorWarm | creatorGreen | paperRed>
- CTA variant:               <keyword-comment | price end card | ghost-word DM | gradient logo card>

HARD NUMBERS (non-negotiable; from the style bible)
- 1080x1920, 30 fps. Durations: F1 45–60 s, F2 45–90 s, F3 15–30 s, F4 15–20 s.
- VO 2.6–3.5 words/s. Word budget = duration_s × 3.0 (±10%).
- Frame 0 shows the subject + hook text, lit. First motion ≤ f6. Hook keyword lands ≤ f45.
  First re-colour/scene change f40–f80.
- One VO sentence (F3) or clause (F4) = one scene. Scene length: F1 45–75 f, F2 30–90 f A-roll /
  45–120 f B-roll, F3 60–105 f, F4 36–60 f. Never > 105 f without a visual event.
- Scene boundary = sentence-end frame + 3 f. Key animation (counter end, check, ring) ENDS on
  the stressed word's start frame.
- Every scene drifts scale 1.00→1.06. Nothing static. Motion blur on moves > 30 px/f.
- Type: base 52–64 px, accent ×1.6, hero 150–220 px. 1–3 accent words per phrase. One accent
  hue (+1 semantic counter-colour max). Mean saturation ≤ 20.
- Safe rect x 90–990, y 220–1540. Talking-head captions y 45–65% (chest to lap), never over the face.
  Hook text on screen by f15; subject lit on f0.
- Springs: pop {14,220,0.6} words; bounce {10,200,0.8} stickers; card {18,90,1} glass cards;
  smooth {200} camera/logo; numeralDrop {12,160}.
- Transitions: hard cut + at most 2 named types from
  [whiteFlash 9f, glitch 8f, whipPush 10f, ringIris 18f (max 1), circleIris 5f, depthPush 12f,
  recolor 6f, dipToDark 5f]. Each must carry a meaning (topic change, danger, next step, reveal).
- Audio: VO -14 LUFS-ish dry and compressed; bed -26 LUFS ducked 6 dB; whoosh 4 f before each
  transition; hit on the cut frame; ticks on counters; pop on pills/stickers; sting on logo.
  Master -14 LUFS integrated, ≤ -1 dBTP, LRA ≤ 6. No silence.
- CTA explicit on screen. End card holds ≥ 30 f (price/logo: 48 f logo hold).

PROCESS
1. Angle: write the hook as a two-line two-tone claim (≤ 7 words) using the core lever.
   Write 3 alternatives; pick the one with a concrete number or a contrarian verb.
2. Script: write the VO to the word budget, one sentence per planned scene. Mark stressed
   words in CAPS. Put the CTA at the format position (F1: 55–65% mid-roll; others: end).
3. Beat sheet: copy the format skeleton; for EACH beat output a row:
     id | startF–endF | VO text | on-screen text (exact, with accent words) |
     component(s) + props (numbers) | entry motion (spring/ease + frames) |
     camera (drift/punch scale) | transition out (type, frames) | SFX cues (type@frame) |
     light/colour state (recipe token, hue) | asset id
   Then emit the same as beats.json:
     {"slug","format","recipe","fps":30,"durationInFrames",
      "vo":{"src","wordsJson"},
      "beats":[{"id","from","durationInFrames","component","props":{...},
                "caption":{"text","emphasis":[...],"style":"twoTone|greySettle|pinkRed|neon","y"},
                "camera":{"drift":[1,1.06],"punch":null},
                "transitionOut":{"type","durationInFrames"},
                "sfx":[{"type","atF"}]}],
      "cta":{"variant","headline","keyword|price|url","holdF"}}
4. Assets: for every prop/footage not built in code, write a Higgsfield entry:
     {id, model, prompt, negative:"text, watermark, logo, extra fingers, blurry",
      ar:"9:16"|"1:1", seconds, transparent:true|false, beat}
   Prop prompt shape: "<object>, glossy 3D render, <material>, rim light back-left, soft top
   key, centred on pure black, no text, 4k". Video: image-to-video, locked camera, 2–4 s.
   Never generate the presenter's A-roll; never bake text into generated media.
5. Build: hand beats.json to video-editing (template compositions GlassExplainer /
   KineticCollage / ChapterListicle / CreatorBreakdown). Preview f0–90 and one transition
   before full render. Render master, then finish.sh → 4 platform files + cover.
6. QA gate (video-qa): run analyze-reference on the output and check:
     1080x1920@30 · h264 High yuv420p bt709 faststart · 6–14 Mbps · -15≤LUFS≤-13 ·
     TP ≤ -1 · LRA ≤ 6 · motion > 0.2 every second · motion[0] > 1.0 ·
     visual events/min in format band · max event gap ≤ format max · meanSat ≤ 20 ·
     transcript WER ≤ 10% vs script · on-screen spelling exact · CTA present in last 3 s ·
     contact sheet: captions in safe rect, one accent hue, no text over face.
   Any FAIL → fix the beat that caused it and re-render. Report PASS only with the QA JSON path.

OUTPUT (in this order)
A. Chosen format + recipe + 1-line rationale.
B. Hook options (3) + pick.
C. VO script with CAPS stresses and word count / seconds.
D. Beat table.
E. beats.json (valid JSON).
F. Higgsfield asset list (JSON).
G. QA self-check table (predicted values) + "uncertain" list.

QUALITY TELLS TO AVOID (seen in the references)
Clipping (TP ≥ 0), sub-2 Mbps banding, typos on screen, no CTA, abrupt ending without hold,
text over faces, more than one accent hue, stock clip-art without lighting, static frames,
cuts on the music beat instead of the sentence, every overlay on top (use the depth sandwich
for hero words when a matte exists).
```

---

## Review log

Adversarial review, 2026-10-29. Evidence checked: all 7 `metrics.json` files (parsed, not skimmed), the contact sheets for wedding, sewing, boho, earthy, travel, pinterest and mental-wellness, and the hook stills at 0.0 / 0.5 / 1.0 s for all 7. Every ffmpeg recipe in §4 was smoke-tested on a synthetic 1080x1920 clip with ffmpeg 8.1 (all ran without errors). Remotion API names were checked against the template's `package.json` (4.0.539) and its existing source. Per-video `analysis.md` files **still do not exist**, so no claim could be checked against them.

Changes made:
1. **Onset bug scope** (status note 1, §5.1): "2x in 3 files" → 2x in **all 7** (max onset / duration ≈ 1.98–2.0 in each). Added the likely cause in the analyzer (`hop` vs RMS list length) and a fix.
2. **Mental-wellness scene count:** "~8" → "~10 distinct scenes" (counted on sheet-01). Pinterest real cut rate now cites the computed 14.8/min (cuts < 0.2 s apart merged).
3. **Clipping count:** "Four refs clip at ≥ 0 dBTP" → three (sewing +0.2, wedding +0.3, travel +0.6), plus two at −0.1.
4. **19–37 visual events/min** is now labelled inferred, and the measured clustered cut rates per ref are listed beside it.
5. **F3 "only one hard cut, onto the logo"** was contradicted by travel (its only cut is at 1.77 s, not onto a logo). Reworded to "at most 1–2 hard cuts".
6. **Mis-cluster:** `boho-corner` was listed as an F4 ref. It is all-dark with no cream/black alternation, so it is now F3 only, kept in F4 as a technique donor (type slam, tracking-collapse CTA).
7. **Frame-0 claim:** "Title … visible on f0 in 7/7" was false. A subject is on f0 in 7/7, text is on f0 in 1/7 and by 0.5 s in 6/7. The rule now reads "subject on f0, hook text by f15" (§2.2 and the master prompt).
8. **cutsOnOnsetShare ≈ 0.2–0.25 as support for sentence-synced cuts:** the actual values are 0.2–0.34 (travel 1.0), and they come from the broken onsets anyway. The rule is now marked as a design choice, not evidence.
9. **Measurability:** added definitions of `motionPerSecond` (units and method) and "visual event". Noted that the > 0.2 floor is stricter than travel (0.07) and mental-wellness (0.08). Replaced the unmeasurable banding check ("8-bit steps wider than 12 px") with bitrate + grain presence, plus a manual 200% check.
10. **Caption height:** "y 48–55%" contradicted pinterest (plain captions at ~60–65%). Widened to 45–65% with per-ref measurements (§2.4 and the master prompt).
11. **Saturation range:** "3.6–17.2" → 1.4–17.2 (travel 1.38). **Footage luma 38–45:** only wedding fits (38.4). Replaced with measured whole-video luma per set type.
12. **Silence:** "silentShare = 0 in all refs" → 6/7; sewing has 0.5 s of trailing silence. The music BPM guidance is marked unverified because it depends on the broken onsets.
13. **Safe-zone conflict:** the persistent lock-up URL at y 81% (1555 px) sat below the 1540 px safe bottom. Moved to 74% / 78% in §2.11 and in `LogoLockup`.
14. **Remotion API fixes:** `noise2D(f/240)` → `noise2D(seed, x, y)`; `Easing.in(cubic)` → `Easing.in(Easing.cubic)`; added the spring config call shape; added the whisper → `Caption[]` conversion step. Flagged that `@remotion/paths`, `@remotion/three`, `three` and `@react-three/fiber` are not in the template deps. Corrected the existing `GrainVignette` props (`grain=0.06, vignette=0.55`, not `PI/5`) and `FlashHit` props (`at, color, frames=6`).
15. **ffmpeg fixes:** `acompressor makeup=4` is linear (+12 dB), changed to `makeup=2` (≈ +6 dB). The safe-zone sheet used `fps=1` with an 8x4 tile, which only covered the first 32 s; changed to `fps=32/$D`.
16. **Missing components:** techniques visible on the sheets had no component, so these were added: `TextInObject`, `HalftoneCutout`, `PinnedNoteList`, `CollageDecor` (barcode, grid, stamp, arc band) from earthy; `LightCone` + anamorphic star from travel; `EmojiInWord` from earthy; `CrowdFigures` from boho.

Still unverified:
- Every frame-level beat timing in §1, the hex values, fonts and spring constants. They are inferred from 720p stills at 2–6 fps and none can be measured without per-frame analysis.
- The ~15 punch-ins/min (F2), 25–35 events/min (F1) and 35–40 scenes/min (F4) bands. They need the `visualEventsPerMinute` metric.
- The ≤ f6 first-motion claim. Only second-level motion and 0.5 s stills were checked.
- Platform claims (Shorts ≤ 60 s for ads, the safe-zone pixel sizes per platform) were not checked against current platform docs.
- Mid-roll CTA at 55–65% of runtime is from wedding only (the Skip Ad / document fly-in sits at ~58–67% on its sheet). That is n = 1.
- The F1 pattern-interrupt caption style (lowercase italic) has no `emphasisStyle` value in `KineticCaption`. Add a `'interrupt'` override, or accept it as a one-off.
- The sewing and pinterest pt-BR transcripts are still the English-mode whisper output and were not re-read.
- `finish.sh` uses `LRA=11` while the QA gate enforces LRA ≤ 6. These are consistent only if the VO compression holds. Not tested on a real render.
