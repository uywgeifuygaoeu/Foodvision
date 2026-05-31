from __future__ import annotations

import random
from pathlib import Path
from typing import Iterable

from torch.utils.data import DataLoader, Dataset
from torchvision import datasets, transforms


def build_transforms(image_size: int) -> dict[str, transforms.Compose]:
    """Create training augmentation and deterministic evaluation transforms."""

    normalize = transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    return {
        "train": transforms.Compose(
            [
                transforms.RandomResizedCrop(image_size, scale=(0.78, 1.0)),
                transforms.RandomHorizontalFlip(),
                transforms.RandomRotation(12),
                transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.12),
                transforms.ToTensor(),
                normalize,
            ]
        ),
        "eval": transforms.Compose(
            [
                transforms.Resize((image_size, image_size)),
                transforms.ToTensor(),
                normalize,
            ]
        ),
    }


def _stratified_indices(
    labels: Iterable[int], val_ratio: float, test_ratio: float, seed: int
) -> tuple[list[int], list[int], list[int]]:
    """Split each class independently to keep train, validation, and test balanced."""

    randomizer = random.Random(seed)
    grouped: dict[int, list[int]] = {}
    for index, label in enumerate(labels):
        grouped.setdefault(label, []).append(index)

    train_indices: list[int] = []
    val_indices: list[int] = []
    test_indices: list[int] = []
    for indices in grouped.values():
        randomizer.shuffle(indices)
        test_count = max(1, round(len(indices) * test_ratio))
        val_count = max(1, round(len(indices) * val_ratio))
        test_indices.extend(indices[:test_count])
        val_indices.extend(indices[test_count : test_count + val_count])
        train_indices.extend(indices[test_count + val_count :])
    return train_indices, val_indices, test_indices


def _limit_samples_per_class(
    samples: list[tuple[str, int]], max_images_per_class: int | None, seed: int
) -> list[tuple[str, int]]:
    """Keep a reproducible, balanced subset for quick local experiments."""

    if max_images_per_class is None:
        return samples
    if max_images_per_class < 3:
        raise ValueError("max_images_per_class must be at least 3 to create train, validation, and test splits.")

    randomizer = random.Random(seed)
    grouped: dict[int, list[tuple[str, int]]] = {}
    for sample in samples:
        grouped.setdefault(sample[1], []).append(sample)

    limited_samples: list[tuple[str, int]] = []
    for label in sorted(grouped):
        class_samples = grouped[label]
        randomizer.shuffle(class_samples)
        limited_samples.extend(class_samples[:max_images_per_class])
    return limited_samples


class TransformSubset(Dataset):
    """Dataset subset that applies a split-specific image transform."""

    def __init__(self, dataset: datasets.ImageFolder, indices: list[int], transform: transforms.Compose) -> None:
        self.dataset = dataset
        self.indices = indices
        self.transform = transform

    def __len__(self) -> int:
        return len(self.indices)

    def __getitem__(self, index: int):
        image_path, label = self.dataset.samples[self.indices[index]]
        image = self.dataset.loader(image_path)
        return self.transform(image), label, str(image_path)


def prepare_imagefolder(
    image_root: Path,
    image_size: int,
    selected_classes: list[str] | None,
    val_ratio: float,
    test_ratio: float,
    seed: int,
    max_images_per_class: int | None = None,
) -> tuple[dict[str, TransformSubset], list[str]]:
    """Load class folders, optionally select demo labels, then build all data splits."""

    if not image_root.exists():
        raise FileNotFoundError(
            f"Dataset folder not found: {image_root}. See README.md for Food-101 preparation steps."
        )

    raw_dataset = datasets.ImageFolder(image_root)
    if selected_classes:
        missing = sorted(set(selected_classes).difference(raw_dataset.classes))
        if missing:
            raise ValueError(f"Selected demo classes are missing from the dataset: {missing}")

        allowed = set(selected_classes)
        class_to_index = {class_name: index for index, class_name in enumerate(selected_classes)}
        samples = [
            (path, class_to_index[raw_dataset.classes[label]])
            for path, label in raw_dataset.samples
            if raw_dataset.classes[label] in allowed
        ]
        raw_dataset.samples = samples
        raw_dataset.imgs = samples
        raw_dataset.targets = [label for _, label in samples]
        raw_dataset.classes = selected_classes
        raw_dataset.class_to_idx = class_to_index

    raw_dataset.samples = _limit_samples_per_class(raw_dataset.samples, max_images_per_class, seed)
    raw_dataset.imgs = raw_dataset.samples
    raw_dataset.targets = [label for _, label in raw_dataset.samples]

    split_indices = _stratified_indices(raw_dataset.targets, val_ratio, test_ratio, seed)
    split_transforms = build_transforms(image_size)
    datasets_by_split = {
        "train": TransformSubset(raw_dataset, split_indices[0], split_transforms["train"]),
        "val": TransformSubset(raw_dataset, split_indices[1], split_transforms["eval"]),
        "test": TransformSubset(raw_dataset, split_indices[2], split_transforms["eval"]),
    }
    return datasets_by_split, raw_dataset.classes


def create_dataloaders(
    datasets_by_split: dict[str, Dataset], batch_size: int, num_workers: int
) -> dict[str, DataLoader]:
    """Build PyTorch data loaders with training shuffle and pinned memory."""

    return {
        split: DataLoader(
            dataset,
            batch_size=batch_size,
            shuffle=split == "train",
            num_workers=num_workers,
            pin_memory=True,
        )
        for split, dataset in datasets_by_split.items()
    }
