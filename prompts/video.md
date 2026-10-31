---
description: Create a premium short-form video, guided step by step — brief, brand, references, style and generation path, storyboard approval, then render with Remotion and deliver outputs/latest.mp4 after an automated QA gate. You decide at every checkpoint; the agent recommends.
args: <brief-or-slug> [--format <F1|F2|F3|F4>] [--platform <reels|tiktok|shorts|pinterest|all>]
argument-hint: <brief-or-slug>
section: Execute & Launch
topLevelCli: true
---
Create a video for: $@

Follow the `video-editing` skill and its `references/master-prompt.md`. This is a **guided** workflow: you do the work between checkpoints and recommend at every checkpoint, but the user makes the decisions. Run the checkpoints yourself with `ask_user`. Subagents cannot talk to the user, so only delegate legs that need no decisions, such as reference analysis or the final render/finish, and pass them the decision log.

## How to guide

- Before each checkpoint, say in 1–2 plain sentences what you just did and what you need from them. The `ask_user` card carries the options, so don't repeat them as a list.
- Options must be genuinely different. Give each one a concrete trade-off (look, time, cost, quality). Recommend one and give a specific reason tied to the brief, the references and the engines that are actually connected. Attach previews (`preview` paths) whenever you have something to show.
- Between checkpoints, keep moving; don't ask anything else. If the user answers in their own words, follow their words over the option details.
- Log every checkpoint to `branding/decisions-<slug>.json` (the `record` parameter). When resuming, read that log first and skip checkpoints already decided, unless the user asks to revisit one.
- If `ask_user` reports that nobody was available to answer (a non-interactive run), continue with the recommendations and mark those decisions `inferred` in the storyboard.

## Stages

1. **Workspace and brief.** Call `video_workspace` and resolve the slug. Read `outputs/campaigns/<slug>-{context,persona,psychology,plan}.md` when present.
   - Only if something essential is missing (subject, goal/CTA, length, platform), ask one `ask_user` checkpoint ("Shape the brief") with suggested answers.
   - A stated length is a hard constraint. For ≤ 8 s, plan a single-beat sting (hook visual → brand lockup) instead of a multi-beat format.

2. **Brand → checkpoint "Validate the brand".**
   - Create or update `branding/brand.html` from the skill's `references/brand-template.html`.
   - For a real organisation or product, start from its actual identity (logo, colours, type, tone). Research it, cite the sources inside the page, and never invent a logo.
   - Tell the user the page is open in the side panel and that they can click any element to request a change.
   - Ask with `preview: ["branding/brand.html"]` and offer: approve as is; adjust (in their words); and, when the identity is not fixed, 1–2 alternative directions.
   - Apply any changes, then re-ask until it's approved.

3. **References → checkpoint "Choose the references".**
   - Analyse each new video in `references/` (`video_analyze_reference`, look at the frames, write `branding/analysis/<ref>/analysis.md`).
   - Ask (`multiSelect`) with one option per reference. The preview is its hook strip or cover; the description says what you would borrow (pace, type, transitions, framing). Recommend the best fits.
   - If `references/` is empty, offer: they add videos now (then stop and wait), go without references, or you propose reference directions in words.
   - Only the chosen references shape the next stages.

4. **Style and generation path → checkpoint "Pick the style".** One `ask_user` call with up to three questions:
   - **Style direction:** 2–3 distinct directions built from the approved brand and chosen references (format or sting structure, palette, type, motion and pacing, music feel). Give each a preview hook frame, made cheaply:
     - a `video_still` from a minimal draft spec; or
     - an `image_generate` mood frame, when the direction uses generated imagery.
   - **Generation path:** offer only the paths whose engines are connected (check the model roster and `higgsfield_balance`):
     - *Motion design*: Remotion type, shapes and brand assets. Fastest, free, sharpest text.
     - *GPT image + motion*: `image_generate` key visuals animated with Ken Burns/parallax, about 1 min per image on the ChatGPT account.
     - *AI footage*: Higgsfield video models. The most cinematic and the slowest; state the credit estimate against the balance.
   - **Quality:** a fast draft render to review timing first, or straight to the final 1080×1920 master.

   Recommend based on the brief, the length, the references and the budget. Nothing that costs credits happens before this answer.

5. **Storyboard → checkpoint "Approve the storyboard".**
   - Write `branding/storyboard-<slug>.md` and `branding/specs/<slug>.json` for the chosen direction.
   - Generate the assets on the chosen path into `branding/assets/<slug>/`. Confirm credits for Higgsfield batches over 2 items. Transcribe any voice-over with `video_transcribe`.
   - `video_still` the hook, middle and last frames, and look at them yourself first.
   - Ask with those stills as previews: render it; change something (their words); or try another hook.
   - **Never call `video_render` for the master before this approval.** If they picked a draft first, render `draft: true`, show it, and confirm before the final.

6. **Render, finish, QA.**
   - Run `video_render`, then `video_finish` (`--platform` sets `target`; default `all`).
   - FAIL → fix and re-render without asking. PASS_WITH_WARNINGS → fix or justify each warning.

7. **Review → checkpoint "Review the video".**
   - Ask with `preview: ["outputs/latest.mp4"]`: done; revise (their words); or make a variation (another style, length or platform).
   - Loop back to the stage the revision touches.

## Defaults

- Format chosen from the brief: face + list → F1, face + thesis → F2, no face + pitch → F3, no face + direct-response copy → F4. Short stings for ≤ 8 s.
- Platform `all` (Reels, TikTok, Shorts and Pinterest encodes). Never upload or launch ads from this workflow.

## Output

- `outputs/latest.mp4` (+ `latest-cover.jpg`, and `latest.json` with the QA verdict)
- `outputs/videos/<slug>/` with the master, platform files and QA folder
- `branding/decisions-<slug>.json` with every checkpoint and the user's answer
- `branding/storyboard-<slug>.md` ending with a Delivery section: paths, verdict, and the decisions taken (with `inferred` ones marked)
