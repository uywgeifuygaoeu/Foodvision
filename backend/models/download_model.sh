#!/usr/bin/env sh
set -eu

MODEL_URL="https://github.com/uywgeifuygaoeu/Foodvision/releases/download/v1.0.0/best_model.pth"
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"

echo "Downloading trained FoodVision checkpoint..."
curl -L --fail --progress-bar "$MODEL_URL" -o "$SCRIPT_DIR/best_model.pth"
echo "Saved checkpoint to $SCRIPT_DIR/best_model.pth"
