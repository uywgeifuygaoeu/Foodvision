#!/usr/bin/env sh
set -eu

RELEASE_URL="https://github.com/uywgeifuygaoeu/Foodvision/releases/download/v1.0.0"
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
MODEL_PATH="${1:-$SCRIPT_DIR/best_model.pth}"
TMP_DIR="${TMPDIR:-/tmp}/foodvision-model-$$"
EXPECTED_SHA256="3fc516729e957509a40d9cce19c6df29edf6fa24a7b0356971bb80488b8e4769"
PART_NUMBERS="00 01 02 03 04 05 06 07 08 09 10 11 12 13 14 15 16 17 18 19 20 21"

cleanup() {
  rm -rf "$TMP_DIR"
}

trap cleanup EXIT INT TERM
mkdir -p "$TMP_DIR"

echo "Downloading trained FoodVision checkpoint..."
for number in $PART_NUMBERS; do
  part="best_model.pth.part-$number"
  echo "  $part"
  curl -L --fail --retry 3 --retry-delay 2 --progress-bar \
    "$RELEASE_URL/$part" \
    -o "$TMP_DIR/$part"
done

cat "$TMP_DIR"/best_model.pth.part-* > "$MODEL_PATH"
actual_sha256="$(shasum -a 256 "$MODEL_PATH" | awk '{print $1}')"
if [ "$actual_sha256" != "$EXPECTED_SHA256" ]; then
  rm -f "$MODEL_PATH"
  echo "Checkpoint checksum verification failed." >&2
  exit 1
fi

echo "Saved verified checkpoint to $MODEL_PATH"
