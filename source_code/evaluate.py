from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np
import torch
from sklearn.metrics import accuracy_score, confusion_matrix, precision_recall_fscore_support

from config import TrainingConfig
from dataset import create_dataloaders, prepare_imagefolder
from visualization import plot_confusion_matrix, plot_prediction_examples

BACKEND_DIR = Path(__file__).resolve().parents[1] / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from app.model_loader import load_trained_model, select_device  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate a saved FoodVision checkpoint.")
    parser.add_argument("--checkpoint", type=Path, required=True)
    parser.add_argument("--data-dir", type=Path, default=Path("data/food-101"))
    parser.add_argument("--output-dir", type=Path, default=Path("outputs/evaluation"))
    parser.add_argument("--mode", choices=["demo", "full"], default="demo")
    parser.add_argument(
        "--quick",
        action="store_true",
        help="Evaluate the same 15-class, 200-images-per-class subset used by train.py --quick.",
    )
    parser.add_argument("--max-images-per-class", type=int, default=None)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--num-workers", type=int, default=4)
    return parser.parse_args()


def evaluate(arguments: argparse.Namespace) -> dict[str, float]:
    """Compute report metrics and save plots for model error analysis."""

    max_images_per_class = (
        arguments.max_images_per_class
        if arguments.max_images_per_class is not None
        else (200 if arguments.quick else None)
    )
    config = TrainingConfig(
        data_dir=arguments.data_dir,
        mode="demo" if arguments.quick else arguments.mode,
        max_images_per_class=max_images_per_class,
    )
    split_datasets, class_names = prepare_imagefolder(
        config.data_dir,
        config.image_size,
        config.selected_classes,
        config.val_ratio,
        config.test_ratio,
        config.seed,
        config.max_images_per_class,
    )
    test_loader = create_dataloaders(split_datasets, arguments.batch_size, arguments.num_workers)["test"]
    device = select_device()
    checkpoint = torch.load(arguments.checkpoint, map_location=device)
    architecture = checkpoint.get("architecture", config.architecture)
    model = load_trained_model(arguments.checkpoint, architecture, len(class_names), device)

    actual: list[int] = []
    predicted: list[int] = []
    top3_correct = 0
    examples: list[tuple[str, str, str, float]] = []
    mistakes: list[tuple[str, str, str, float]] = []
    with torch.inference_mode():
        for images, labels, paths in test_loader:
            probabilities = torch.softmax(model(images.to(device)), dim=1).cpu()
            scores, top_indices = probabilities.topk(min(3, len(class_names)), dim=1)
            top1 = top_indices[:, 0]
            actual.extend(labels.tolist())
            predicted.extend(top1.tolist())
            top3_correct += (top_indices == labels.unsqueeze(1)).any(dim=1).sum().item()
            for path, truth, prediction, confidence in zip(
                paths, labels.tolist(), top1.tolist(), scores[:, 0].tolist(), strict=True
            ):
                example = (path, class_names[truth], class_names[prediction], confidence)
                if len(examples) < 9:
                    examples.append(example)
                if truth != prediction and len(mistakes) < 9:
                    mistakes.append(example)

    accuracy = accuracy_score(actual, predicted)
    precision, recall, f1, _ = precision_recall_fscore_support(
        actual, predicted, average="macro", zero_division=0
    )
    metrics = {
        "accuracy": accuracy,
        "top3_accuracy": top3_correct / len(actual),
        "macro_precision": precision,
        "macro_recall": recall,
        "macro_f1": f1,
        "test_samples": len(actual),
    }
    arguments.output_dir.mkdir(parents=True, exist_ok=True)
    (arguments.output_dir / "metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    plot_confusion_matrix(
        confusion_matrix(actual, predicted, labels=np.arange(len(class_names))),
        class_names,
        arguments.output_dir / "confusion_matrix.png",
    )
    plot_prediction_examples(examples, arguments.output_dir / "sample_predictions.png", "Sample predictions")
    plot_prediction_examples(mistakes, arguments.output_dir / "wrong_predictions.png", "Wrong predictions")
    return metrics


if __name__ == "__main__":
    print(json.dumps(evaluate(parse_args()), indent=2))
