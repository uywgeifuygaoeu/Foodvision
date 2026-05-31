from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns
from PIL import Image


def plot_training_history(history: dict[str, list[float]], output_dir: Path) -> None:
    """Save loss and validation accuracy curves for the project report."""

    output_dir.mkdir(parents=True, exist_ok=True)
    epochs = range(1, len(history["train_loss"]) + 1)

    figure, axes = plt.subplots(1, 2, figsize=(12, 4.5))
    axes[0].plot(epochs, history["train_loss"], marker="o", label="Train loss")
    axes[0].plot(epochs, history["val_loss"], marker="o", label="Validation loss")
    axes[0].set(title="Training Loss", xlabel="Epoch", ylabel="Cross-entropy loss")
    axes[0].legend()

    axes[1].plot(epochs, history["val_accuracy"], marker="o", color="#ed735d")
    axes[1].set(title="Validation Accuracy", xlabel="Epoch", ylabel="Accuracy")
    figure.tight_layout()
    figure.savefig(output_dir / "training_curves.png", dpi=180)
    plt.close(figure)


def plot_confusion_matrix(matrix: np.ndarray, class_names: list[str], output_path: Path) -> None:
    """Render a labeled confusion matrix for error analysis."""

    figure_size = max(8, len(class_names) * 0.62)
    figure, axis = plt.subplots(figsize=(figure_size, figure_size))
    sns.heatmap(matrix, cmap="YlGnBu", xticklabels=class_names, yticklabels=class_names, ax=axis)
    axis.set(title="Food Classification Confusion Matrix", xlabel="Predicted", ylabel="Actual")
    figure.tight_layout()
    figure.savefig(output_path, dpi=180)
    plt.close(figure)


def plot_prediction_examples(
    examples: list[tuple[str, str, str, float]],
    output_path: Path,
    title: str,
) -> None:
    """Create an image grid showing predictions or selected model errors."""

    if not examples:
        return
    count = min(len(examples), 9)
    columns = 3
    rows = int(np.ceil(count / columns))
    figure, axes = plt.subplots(rows, columns, figsize=(12, 3.7 * rows))
    flat_axes = np.atleast_1d(axes).ravel()
    for axis, (path, truth, prediction, confidence) in zip(flat_axes, examples[:count], strict=False):
        axis.imshow(Image.open(path).convert("RGB"))
        axis.set_title(f"True: {truth}\nPred: {prediction} ({confidence:.1%})", fontsize=9)
        axis.axis("off")
    for axis in flat_axes[count:]:
        axis.axis("off")
    figure.suptitle(title)
    figure.tight_layout()
    figure.savefig(output_path, dpi=180)
    plt.close(figure)
