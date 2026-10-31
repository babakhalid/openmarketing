---
title: Installation
description: Install OpenMarketing on macOS, Linux, or Windows with curl or npm.
section: Getting Started
order: 1
---

OpenMarketing can be installed either as a standalone runtime bundle or as an npm package. For most users, the standalone installer is the simplest path because it downloads a prebuilt native bundle with zero external runtime dependencies.

## One-line installer (recommended)

On **macOS or Linux**, open a terminal and run:

```bash
curl -fsSL https://raw.githubusercontent.com/babakhalid/openmarketing/main/scripts/install/install.sh | bash
```

The installer detects your OS and architecture automatically. On macOS it supports both Intel and Apple Silicon. On Linux it supports x64 and arm64. It installs both `openmarketing` and the short `om` alias into `~/.local/bin`, unpacks the bundled runtime into `~/.local/share/openmarketing`, and updates your `PATH` when needed.

If you previously installed OpenMarketing through a package manager and still see local Node.js errors after a curl install, your shell is probably still resolving an older global binary first. Run `which -a openmarketing`, then `hash -r`, or launch the standalone shim directly with `~/.local/bin/openmarketing`.

On **Windows**, open PowerShell as Administrator and run:

```powershell
irm https://raw.githubusercontent.com/babakhalid/openmarketing/main/scripts/install/install.ps1 | iex
```

This installs the Windows runtime bundle under `%LOCALAPPDATA%\Programs\openmarketing`, adds the `openmarketing` and `om` launchers to your user `PATH`, and lets you re-run the installer at any time to update.

## Alternative: npm install

If you prefer installing OpenMarketing into an existing Node.js environment, use npm instead:

```bash
npm install -g openmarketing
```

This path uses your local Node.js runtime instead of the bundled standalone runtime. It requires a compatible Node.js version that satisfies OpenMarketing's current engine range: `>=20.19.0 <25`.

## Migrating from AdsAgents

Install the new package, then remove the former package name:

```bash
npm install -g openmarketing
npm uninstall -g @youmake-ai/adsagents
```

On first launch, OpenMarketing atomically moves `~/.adsagents` to `~/.openmarketing` when the new directory does not already exist. If both directories exist, it preserves both and uses `~/.openmarketing` so no existing data is overwritten. The deprecated `ADSAGENTS_*` environment variables remain fallback aliases for one transition period; new configuration should use `OPENMARKETING_*`.

The standalone installer removes an installer-managed `adsagents` launcher but preserves the old runtime directory until you verify the new installation. You can then remove `~/.local/share/adsagents` on macOS/Linux or `%LOCALAPPDATA%\Programs\adsagents` on Windows.

## Updating the standalone app

To update the standalone OpenMarketing app on macOS, Linux, or Windows, rerun the installer you originally used. That replaces the downloaded runtime bundle with the latest tagged release.

`openmarketing update` is different: it updates installed Pi packages inside OpenMarketing's environment, not the standalone app bundle itself.

If you installed OpenMarketing with npm, upgrade it with:

```bash
npm install -g openmarketing@latest
```

## Uninstalling

OpenMarketing does not currently ship a dedicated `uninstall` command. Remove the standalone launcher and runtime bundle directly, then optionally remove the OpenMarketing home directory if you also want to delete settings, sessions, and installed package state. If you also want to clear alphaXiv login state, remove `~/.ahub`.

If you installed OpenMarketing with npm, uninstall it with:

```bash
npm uninstall -g openmarketing
```

On macOS or Linux:

```bash
rm -f ~/.local/bin/openmarketing ~/.local/bin/om
# optional: remove a launcher left by an older release
rm -f ~/.local/bin/adsagents
rm -rf ~/.local/share/openmarketing
# optional: remove the preserved AdsAgents standalone runtime
rm -rf ~/.local/share/adsagents
# optional: remove settings, sessions, and installed package state
rm -rf ~/.openmarketing
# optional: remove alphaXiv auth state
rm -rf ~/.ahub
```

On Windows PowerShell:

```powershell
Remove-Item "$env:LOCALAPPDATA\\Programs\\openmarketing" -Recurse -Force
# optional: remove the preserved AdsAgents standalone runtime
Remove-Item "$env:LOCALAPPDATA\\Programs\\adsagents" -Recurse -Force
# optional: remove settings, sessions, and installed package state
Remove-Item "$HOME\\.openmarketing" -Recurse -Force
# optional: remove alphaXiv auth state
Remove-Item "$HOME\\.ahub" -Recurse -Force
```

If you added the launcher directory to `PATH` manually, remove that entry as well.

## Skills only

If you only want OpenMarketing's context, research, strategy, planning, reporting, and loop skills without the terminal runtime, install the skill library separately.

For a user-level install into `~/.codex/skills/openmarketing`:

```bash
curl -fsSL https://raw.githubusercontent.com/babakhalid/openmarketing/main/scripts/install/install-skills.sh | bash
```

For a repo-local install into `.agents/skills/openmarketing` under the current repository:

```bash
curl -fsSL https://raw.githubusercontent.com/babakhalid/openmarketing/main/scripts/install/install-skills.sh | bash -s -- --repo
```

On Windows, install the skills into your Codex skill directory:

```powershell
irm https://raw.githubusercontent.com/babakhalid/openmarketing/main/scripts/install/install-skills.ps1 | iex
```

Or install them repo-locally:

```powershell
& ([scriptblock]::Create((irm https://raw.githubusercontent.com/babakhalid/openmarketing/main/scripts/install/install-skills.ps1))) -Scope Repo
```

These installers download the bundled `skills/` and `prompts/` trees plus the repo guidance files referenced by those skills. They do not install the OpenMarketing terminal, bundled Node runtime, auth storage, or Pi packages.

## Pinned releases

The one-line installer already targets the latest tagged release. To pin an exact version, pass it explicitly:

```bash
curl -fsSL https://raw.githubusercontent.com/babakhalid/openmarketing/main/scripts/install/install.sh | bash -s -- 0.1.1
```

On Windows:

```powershell
& ([scriptblock]::Create((irm https://raw.githubusercontent.com/babakhalid/openmarketing/main/scripts/install/install.ps1))) -Version 0.1.1
```

## Post-install setup

After installation, run the guided setup wizard to configure your model provider and API keys:

```bash
openmarketing setup
```

This walks you through selecting a default model, authenticating with your provider, and optionally installing extra packages. See the [Setup guide](/docs/getting-started/setup) for a detailed walkthrough.

## Verifying the installation

Confirm OpenMarketing is installed and accessible:

```bash
openmarketing --version
```

The shorthand is equivalent: `om --version`.

If you see a version number, you are ready to go. Run `openmarketing doctor` at any time to diagnose configuration issues, missing dependencies, or authentication problems.
