from __future__ import annotations

import argparse
import json
import logging
import random
import sys
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
from torch.optim import AdamW
from torch.optim.lr_scheduler import ReduceLROnPlateau

from config import TrainingConfig
from dataset import create_dataloaders, prepare_imagefolder
from visualization import plot_training_history

BACKEND_DIR = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from app.model_loader import create_model, freeze_feature_extractor, select_device  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Fine-tune a FoodVision image classifier.")
    parser.add_argument("--data-dir", type=Path, default=Path("data/food-101"))
    parser.add_argument("--output-dir", type=Path, default=Path("outputs"))
    parser.add_argument("--mode", choices=["demo", "full"], default="demo")
    parser.add_argument(
        "--quick",
        action="store_true",
        help="Use a fast local profile: demo classes, ResNet18, 200 images per class, 4 epochs, and a frozen backbone.",
    )
    parser.add_argument(
        "--architecture",
        choices=["efficientnet_b0", "resnet18", "resnet50", "mobilenet_v3_small"],
        default=None,
    )
    parser.add_argument("--epochs", type=int, default=None)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--num-workers", type=int, default=4)
    parser.add_argument("--learning-rate", type=float, default=1e-3)
    parser.add_argument(
        "--max-images-per-class",
        type=int,
        default=None,
        help="Optionally cap each class for balanced, faster experiments.",
    )
    parser.add_argument(
        "--freeze-backbone",
        action="store_true",
        help="Train only the classifier head instead of fine-tuning the entire model.",
    )
    parser.add_argument(
        "--resume",
        type=Path,
        default=None,
        help="Load an existing FoodVision checkpoint before fine-tuning.",
    )
    return parser.parse_args()


def configure_logging(output_dir: Path) -> None:
    """Log both to the console and a file that can be cited in the report."""

    output_dir.mkdir(parents=True, exist_ok=True)
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(message)s",
        handlers=[logging.StreamHandler(), logging.FileHandler(output_dir / "training.log")],
    )


def set_seed(seed: int) -> None:
    """Reduce avoidable experiment variance across reruns."""

    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def run_epoch(
    model: nn.Module,
    loader,
    criterion: nn.Module,
    device: torch.device,
    optimizer: AdamW | None = None,
) -> tuple[float, float]:
    """Run one train or validation epoch and return average loss and accuracy."""

    is_training = optimizer is not None
    model.train(is_training)
    running_loss = 0.0
    correct = 0
    total = 0
    for images, labels, _ in loader:
        images, labels = images.to(device), labels.to(device)
        if is_training:
            optimizer.zero_grad(set_to_none=True)
        with torch.set_grad_enabled(is_training):
            logits = model(images)
            loss = criterion(logits, labels)
            if is_training:
                loss.backward()
                optimizer.step()
        running_loss += loss.item() * labels.size(0)
        correct += (logits.argmax(dim=1) == labels).sum().item()
        total += labels.size(0)
    return running_loss / total, correct / total


def train(config: TrainingConfig) -> Path:
    """Train, checkpoint the best model, and save curves plus class metadata."""

    configure_logging(config.output_dir)
    set_seed(config.seed)
    device = torch.device(select_device())
    logging.info("Using device: %s", device)

    split_datasets, class_names = prepare_imagefolder(
        image_root=config.data_dir,
        image_size=config.image_size,
        selected_classes=config.selected_classes,
        val_ratio=config.val_ratio,
        test_ratio=config.test_ratio,
        seed=config.seed,
        max_images_per_class=config.max_images_per_class,
    )
    loaders = create_dataloaders(split_datasets, config.batch_size, config.num_workers)
    logging.info("Classes: %d | split sizes: %s", len(class_names), {key: len(value) for key, value in split_datasets.items()})

    model = create_model(
        config.architecture,
        num_classes=len(class_names),
        pretrained=config.resume_checkpoint is None,
    )
    if config.resume_checkpoint is not None:
        checkpoint = torch.load(config.resume_checkpoint, map_location=device)
        checkpoint_classes = checkpoint.get("class_names")
        if checkpoint_classes and checkpoint_classes != class_names:
            raise ValueError(
                "Resume checkpoint classes do not match the current dataset. "
                f"checkpoint={checkpoint_classes}, dataset={class_names}"
            )
        model.load_state_dict(checkpoint["model_state_dict"])
        logging.info("Loaded resume checkpoint: %s", config.resume_checkpoint)
    model = model.to(device)
    if config.freeze_backbone:
        freeze_feature_extractor(model, config.architecture)
        logging.info("Quick transfer learning: feature extractor frozen; training classifier head only.")
    criterion = nn.CrossEntropyLoss()
    trainable_parameters = [parameter for parameter in model.parameters() if parameter.requires_grad]
    optimizer = AdamW(trainable_parameters, lr=config.learning_rate, weight_decay=config.weight_decay)
    scheduler = ReduceLROnPlateau(optimizer, mode="max", patience=2, factor=0.35)
    history: dict[str, list[float]] = {"train_loss": [], "val_loss": [], "val_accuracy": []}
    best_accuracy = -1.0
    checkpoint_path = config.output_dir / "best_model.pth"

    for epoch in range(1, config.epochs + 1):
        train_loss, train_accuracy = run_epoch(model, loaders["train"], criterion, device, optimizer)
        val_loss, val_accuracy = run_epoch(model, loaders["val"], criterion, device)
        scheduler.step(val_accuracy)
        history["train_loss"].append(train_loss)
        history["val_loss"].append(val_loss)
        history["val_accuracy"].append(val_accuracy)
        logging.info(
            "Epoch %02d/%02d | train loss %.4f acc %.4f | val loss %.4f acc %.4f",
            epoch,
            config.epochs,
            train_loss,
            train_accuracy,
            val_loss,
            val_accuracy,
        )
        if val_accuracy > best_accuracy:
            best_accuracy = val_accuracy
            torch.save(
                {
                    "model_state_dict": model.state_dict(),
                    "architecture": config.architecture,
                    "class_names": class_names,
                    "epoch": epoch,
                    "best_val_accuracy": best_accuracy,
                },
                checkpoint_path,
            )
            logging.info("Saved best checkpoint: %s", checkpoint_path)

    plot_training_history(history, config.output_dir)
    (config.output_dir / "history.json").write_text(json.dumps(history, indent=2), encoding="utf-8")
    (config.output_dir / "class_mapping.json").write_text(
        json.dumps({str(index): value for index, value in enumerate(class_names)}, indent=2),
        encoding="utf-8",
    )
    return checkpoint_path


if __name__ == "__main__":
    arguments = parse_args()
    architecture = arguments.architecture or ("resnet18" if arguments.quick else "efficientnet_b0")
    epochs = arguments.epochs if arguments.epochs is not None else (4 if arguments.quick else 12)
    max_images_per_class = (
        arguments.max_images_per_class
        if arguments.max_images_per_class is not None
        else (200 if arguments.quick else None)
    )
    training_config = TrainingConfig(
        data_dir=arguments.data_dir,
        output_dir=arguments.output_dir,
        mode="demo" if arguments.quick else arguments.mode,
        architecture=architecture,
        epochs=epochs,
        batch_size=arguments.batch_size,
        num_workers=arguments.num_workers,
        learning_rate=arguments.learning_rate,
        max_images_per_class=max_images_per_class,
        freeze_backbone=arguments.freeze_backbone or arguments.quick,
        resume_checkpoint=arguments.resume,
    )
    train(training_config)
