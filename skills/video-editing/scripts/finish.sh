#!/bin/sh
# Finish a Remotion render for delivery: two-pass loudnorm to -14 LUFS / -1 dBTP,
# platform encodes (H.264 high, yuv420p, bt709, faststart), cover frame, and QA metrics.
# Usage: finish.sh <render.mp4> <out-dir> [pinterest|reels|tiktok|shorts|all] [cover-seconds]

set -eu

IN="$1"
OUT="$2"
TARGET="${3:-all}"
COVER_AT="${4:-1.0}"
SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ANALYZE="$SKILL_DIR/../video-reference-analysis/scripts/analyze-reference.mjs"
BASE="$(basename "$IN" .mp4)"
mkdir -p "$OUT"

# Pass 1: measure. Pass 2: apply linear loudnorm with the measured values.
if ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$IN" | grep -q .; then
  STATS=$(ffmpeg -hide_banner -nostdin -i "$IN" -vn -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
  get() { printf '%s' "$STATS" | sed -n "s/.*\"$1\" : \"\\([^\"]*\\)\".*/\\1/p"; }
  AF="loudnorm=I=-14:TP=-1:LRA=11:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true,aresample=48000"
  AUDIO="-c:a aac -b:a 192k -ar 48000 -af $AF"
else
  AUDIO="-an"
fi

encode() {
  # $1 = platform, $2 = max video bitrate
  # shellcheck disable=SC2086
  ffmpeg -hide_banner -nostdin -y -i "$IN" \
    -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,fps=30,format=yuv420p" \
    -c:v libx264 -profile:v high -level 4.1 -preset slow -crf 18 -maxrate "$2" -bufsize "$2" \
    -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
    $AUDIO -movflags +faststart "$OUT/$BASE-$1.mp4"
  echo "  -> $OUT/$BASE-$1.mp4"
}

case "$TARGET" in
  pinterest) encode pinterest 12M ;;
  reels) encode reels 12M ;;
  tiktok) encode tiktok 10M ;;
  shorts) encode shorts 16M ;;
  all) encode pinterest 12M; encode reels 12M; encode tiktok 10M; encode shorts 16M ;;
  *) echo "unknown target: $TARGET" >&2; exit 1 ;;
esac

ffmpeg -hide_banner -nostdin -loglevel error -y -ss "$COVER_AT" -i "$IN" -frames:v 1 -update 1 -q:v 2 "$OUT/$BASE-cover.jpg"

# QA: run the same analyzer used on the references so outputs are comparable against the style bible.
FIRST=$(ls "$OUT/$BASE"-*.mp4 | head -1)
node "$ANALYZE" "$FIRST" "$OUT/$BASE-qa" --no-transcript >/dev/null
echo "QA metrics: $OUT/$BASE-qa/metrics.json (compare with the video-qa thresholds)"
