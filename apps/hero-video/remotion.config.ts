import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { Config } from "@remotion/cli/config";

// Chrome headless shell won't start from a path containing spaces (this repo can live in one,
// e.g. "projects 2025"), so `npm run browser` keeps a copy in ~/.cache and renders use it.
const browser = join(homedir(), ".cache", "openmarketing-hero-chrome", "chrome-headless-shell");
if (existsSync(browser)) Config.setBrowserExecutable(browser);

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setPixelFormat("yuv420p");
Config.setColorSpace("bt709");
