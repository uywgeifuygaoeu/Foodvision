from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from PIL import Image

BACKEND_DIR = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from app.inference import TorchModelService  # noqa: E402


def load_classes(mapping_path: Path) -> list[str]:
    """Load labels in classifier index order."""

    mapping = json.loads(mapping_path.read_text(encoding="utf-8"))
    return [mapping[str(index)] for index in range(len(mapping))]


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run Top-3 FoodVision inference for one image.")
    parser.add_argument("image", type=Path)
    parser.add_argument("--checkpoint", type=Path, required=True)
    parser.add_argument("--mapping", type=Path, default=BACKEND_DIR / "data/class_mapping.json")
    parser.add_argument("--architecture", default="efficientnet_b0")
    arguments = parser.parse_args()

    service = TorchModelService(load_classes(arguments.mapping), arguments.architecture, arguments.checkpoint)
    predictions = service.predict(Image.open(arguments.image).convert("RGB"), arguments.image.name)
    print(json.dumps([item.model_dump(by_alias=True) for item in predictions], indent=2))
