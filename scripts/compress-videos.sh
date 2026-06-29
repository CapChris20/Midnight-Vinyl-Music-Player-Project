/**
 * Compress background videos for portfolio deployment.
 * Target: 720p max, 3–5 MB per MP4, VP9 WebM fallback.
 *
 * Usage: ./scripts/compress-videos.sh
 */
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/videos/originals"
OUT="$ROOT/videos/compressed"
mkdir -p "$SRC" "$OUT"

compress_one() {
  local name="$1"
  local in="$SRC/$name"
  local base="${name%.*}"
  if [ ! -f "$in" ]; then
    echo "Skip (missing): $in"
    return
  fi
  echo "Compressing $name..."
  ffmpeg -y -i "$in" \
    -vf "scale='min(1280,iw)':-2" \
    -c:v libx264 -preset medium -crf 28 -maxrate 900k -bufsize 1800k \
    -an -movflags +faststart \
    "$OUT/${base}.mp4"
  ffmpeg -y -i "$OUT/${base}.mp4" \
    -c:v libvpx-vp9 -b:v 500k -an \
    "$OUT/${base}.webm"
  ls -lh "$OUT/${base}.mp4" "$OUT/${base}.webm"
}

for f in mjbg.mp4 weekndbg.mp4 frankoceanbg.mp4 homebackground.mov; do
  compress_one "$f"
done

# homebackground.mov → homebackground.mp4 handled by compress_one if named .mov in originals
if [ -f "$SRC/homebackground.mov" ] && [ ! -f "$OUT/homebackground.mp4" ]; then
  compress_one "homebackground.mov"
fi

echo "Done. Copy compressed files to videos/compressed/ for deployment."
