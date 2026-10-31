# Contributing to OpenMarketing

OpenMarketing is a founder-first marketing operating system built on Pi. This guide is for humans and agents contributing code, prompts, skills, docs, installers, or workflow behavior to the repository.

## Quick Links

- GitHub: https://github.com/babakhalid/openmarketing
- Docs: https://github.com/babakhalid/openmarketing/tree/main/website/src/content/docs
- Repo agent contract: [AGENTS.md](AGENTS.md)
- Issues: https://github.com/babakhalid/openmarketing/issues

## Project Map

| Path | What lives there |
| --- | --- |
| `bin/openmarketing.js` | The `openmarketing` / `om` launcher: Node version guard, then `dist/index.js` |
| `src/` | The CLI: argument parsing (`cli.ts`), setup and model login (`setup/`, `model/`), launching and patching Pi (`pi/`), the desktop app's account service (`desktop/bridge.ts`) |
| `extensions/` | Pi extensions loaded into every session. `core-tools/` adds the core commands and startup header; `ads-tools/` adds the marketing tools (Higgsfield, Meta Ads, `ask_user` checkpoints, cross-model calls, the video studio) |
| `prompts/` | One Markdown prompt per workflow (`/start`, `/research`, `/video`, …). Frontmatter `topLevelCli: true` also exposes it as `openmarketing <name>` |
| `skills/` | Pi skills: reusable capabilities with their references and scripts. `skills/video-editing/studio-template/` is the Remotion project the video tools copy for the agent |
| `.openmarketing/` | Bundled subagents (`agents/`), the system prompt, default settings and the theme, synced into `~/.openmarketing/agent/` on startup |
| `metadata/` | Reads prompt frontmatter into the command list shared by the CLI, help and docs |
| `scripts/` | Build, packaging and release scripts, the installers (`install/`) and the Pi source patches (`lib/*-patch.mjs`) |
| `tests/` | Node test runner suites for the CLI, patches, prompts and tools |
| `apps/desktop/` | The Electron + React desktop app ([README](apps/desktop/README.md)) |
| `apps/hero-video/` | The Remotion source of the website hero video and the README demo ([README](apps/hero-video/README.md)) |
| `website/` | The Astro site and docs at openmarketing.dev ([README](website/README.md)) |
| `outputs/`, `notes/`, `papers/`, `experiments/` | Empty workspace folders; generated artifacts are git-ignored |

To change how a bundled subagent behaves, edit `.openmarketing/agents/*.md`. Do not duplicate that behavior in `AGENTS.md`.

## Before You Open a PR

1. Start from the latest `main`.
2. Use Node.js `22.x` for local development. The supported runtime range is Node.js `20.19.0` through `24.x`; `.nvmrc` pins the preferred local version while `package.json`, `website/package.json`, and the runtime version guard define the broader supported range.
3. Install dependencies from the repo root:

```bash
nvm use || nvm install
npm install
```

4. Run the required checks before asking for review:

```bash
npm test
npm run typecheck
npm run build
npm run unused      # knip: unused files, exports and dependencies across every package
```

If you changed an app, also run its own check: `npm run typecheck` in `apps/desktop` or `apps/hero-video`.

5. If you changed the docs site, also validate the website:

```bash
cd website
npm install
npm run build
```

6. Keep the PR focused. Do not mix unrelated cleanup with the real change.
7. Add or update tests when behavior changes.
8. Update docs, prompts, or skills when the user-facing workflow changes.

## Contribution Rules

- Bugs, docs fixes, installer fixes, and focused workflow improvements are good PRs.
- Large feature changes should start with an issue or a concrete implementation discussion before code lands.
- Avoid refactor-only PRs unless they are necessary to unblock a real fix or requested by a maintainer.
- Do not silently change release behavior, installer behavior, or runtime defaults without documenting the reason in the PR.
- Use American English in docs, comments, prompts, UI copy, and examples.
- Do not add bundled prompts, skills, or docs whose primary purpose is to market, endorse, or funnel users toward a third-party product or service. Product integrations must be justified by user-facing utility and written in neutral language.

## Repo-Specific Checks

### Prompt and skill changes

- New workflows usually live in `prompts/*.md`.
- New reusable capabilities usually live in `skills/<name>/SKILL.md`.
- Keep skill files concise. Put detailed operational rules in the prompt or in focused reference files only when needed.
- If a new workflow should be invokable from the CLI, make sure its prompt frontmatter includes the correct metadata and that the command works through the normal prompt discovery path.

### Agent and artifact conventions

- `AGENTS.md` is the repo-level contract for workspace conventions, handoffs, provenance, and output naming.
- Long-running marketing flows should write plan artifacts to `outputs/.plans/` and use `CHANGELOG.md` as a chronological campaign/workspace log when the work is substantial.
- Do not update `CHANGELOG.md` for trivial one-shot changes.

### Release and versioning discipline

- The curl installer and release docs point users at tagged releases, not arbitrary commits on `main`.
- If you ship user-visible fixes after a tag, do not leave the repo in a state where `main` and the latest release advertise the same version string while containing different behavior.
- When changing release-sensitive behavior, check the version story across:
  - `.nvmrc`
  - `package.json`
  - `website/package.json`
  - `scripts/check-node-version.mjs`
  - install docs in `README.md` and `website/src/content/docs/getting-started/installation.md`

### Publishing

Releases come from the `Publish and Release` GitHub workflow: when `package.json` holds a version that is not yet released, it publishes to npm with provenance, builds the native bundles, and creates the GitHub release from the matching `## vX.Y.Z` section in `RELEASES.md`. The one-line installers download those bundles, so they only work once a GitHub release exists.

For the workflow to publish, configure npm trusted publishing for repository `babakhalid/openmarketing` and workflow `publish.yml` (or add a granular `NPM_TOKEN` secret). `repository.url` in `package.json` must match the public repository exactly. As a local fallback, publish while signed in to the npm account that owns the package:

```bash
npm whoami
npm pack --dry-run
npm publish
```

## AI-Assisted Contributions

AI-assisted PRs are fine. The contributor is still responsible for the diff.

- Understand the code you are submitting.
- Run the local checks yourself instead of assuming generated code is correct.
- Include enough context in the PR description for a reviewer to understand the change quickly.
- If an agent updated prompts or skills, verify the instructions match the actual repo behavior.

## Review Expectations

- Explain what changed and why.
- Call out tradeoffs, follow-up work, and anything intentionally not handled.
- Include screenshots for UI changes.
- Resolve review comments you addressed before requesting review again.

## Good First Areas

Useful contributions usually land in one of these areas:

- installation and upgrade reliability
- context, diagnosis, strategy, and learning-loop quality
- model/provider setup ergonomics
- docs clarity
- preview and export stability
- packaging and release hygiene
