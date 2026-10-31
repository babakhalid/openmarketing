#!/bin/sh
# Install and configure the video stack: ffmpeg, whisper.cpp (+ model), and a Remotion studio
# copied from studio-template/. Idempotent: re-running only fills in what is missing.
# Invoked by the video_setup / video_render tools; users never run Remotion directly.
# Usage: setup-video-stack.sh [studio-dir]   (default: ~/.openmarketing/video-studio)

set -eu

SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
STUDIO_DIR="${1:-$HOME/.openmarketing/video-studio}"
WHISPER_MODEL_NAME="${WHISPER_MODEL_NAME:-base.en}"
WHISPER_DIR="${WHISPER_DIR:-$HOME/.cache/whisper}"

step() { printf '==> %s\n' "$1"; }
have() { command -v "$1" >/dev/null 2>&1; }

install_pkg() {
  if have brew; then brew install "$@"
  elif have apt-get; then sudo apt-get update -y && sudo apt-get install -y "$@"
  else echo "No supported package manager found; install $* manually." >&2; return 1
  fi
}

step "Node.js"
have node || { echo "Node.js >= 20 is required." >&2; exit 1; }
node -e 'process.exit(Number(process.versions.node.split(".")[0]) >= 20 ? 0 : 1)' || { echo "Node.js >= 20 is required." >&2; exit 1; }

step "ffmpeg / ffprobe"
have ffmpeg && have ffprobe || install_pkg ffmpeg

step "whisper.cpp"
if ! have whisper-cli; then
  if have brew; then brew install whisper-cpp
  else echo "Install whisper.cpp (https://github.com/ggml-org/whisper.cpp) and put whisper-cli on PATH." >&2
  fi
fi
mkdir -p "$WHISPER_DIR"
MODEL_PATH="$WHISPER_DIR/ggml-$WHISPER_MODEL_NAME.bin"
if [ ! -f "$MODEL_PATH" ]; then
  step "Downloading whisper model $WHISPER_MODEL_NAME"
  curl -fL --progress-bar -o "$MODEL_PATH" "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-$WHISPER_MODEL_NAME.bin"
fi

step "Remotion studio at $STUDIO_DIR"
if [ ! -f "$STUDIO_DIR/package.json" ]; then
  mkdir -p "$STUDIO_DIR"
  cp -R "$SKILL_DIR/studio-template/." "$STUDIO_DIR/"
fi
(cd "$STUDIO_DIR" && npm install --no-audit --no-fund && npx remotion browser ensure)

step "Self-check"
ffmpeg -hide_banner -version | head -1
whisper-cli --help >/dev/null 2>&1 && echo "whisper-cli ok ($MODEL_PATH)" || echo "whisper-cli missing: captions must be supplied manually"
(cd "$STUDIO_DIR" && npx remotion versions >/dev/null && echo "remotion ok")

echo "Video stack ready at $STUDIO_DIR (agent-managed; driven through the video_* tools)."
