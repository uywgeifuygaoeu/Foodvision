from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path


DEMO_CLASSES = [
    "apple_pie",
    "caesar_salad",
    "cheesecake",
    "chicken_curry",
    "donuts",
    "fried_rice",
    "grilled_salmon",
    "hamburger",
    "ice_cream",
    "lasagna",
    "omelette",
    "pizza",
    "ramen",
    "steak",
    "sushi",
]


@dataclass
class TrainingConfig:
    """Shared model, dataset, and optimization settings."""

    data_dir: Path = Path("data/food-101")
    output_dir: Path = Path("outputs")
    architecture: str = "efficientnet_b0"
    mode: str = "demo"
    demo_classes: list[str] = field(default_factory=lambda: DEMO_CLASSES.copy())
    image_size: int = 224
    batch_size: int = 32
    epochs: int = 12
    learning_rate: float = 1e-3
    weight_decay: float = 1e-4
    num_workers: int = 4
    seed: int = 42
    val_ratio: float = 0.15
    test_ratio: float = 0.15
    max_images_per_class: int | None = None
    freeze_backbone: bool = False
    resume_checkpoint: Path | None = None

    @property
    def selected_classes(self) -> list[str] | None:
        return self.demo_classes if self.mode == "demo" else None
