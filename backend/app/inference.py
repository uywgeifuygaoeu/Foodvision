import hashlib
from pathlib import Path

import numpy as np
from PIL import Image

from .model_loader import load_trained_model, select_device
from .schemas import PredictionItem


class MockModelService:
    """Returns stable image-dependent demo predictions without a checkpoint."""

    def __init__(self, classes: list[str]) -> None:
        self.classes = classes

    def predict(self, image: Image.Image, filename: str) -> list[PredictionItem]:
        pixels = np.asarray(image.resize((32, 32)), dtype=np.uint8)
        seed_bytes = filename.encode("utf-8") + pixels.mean(axis=(0, 1)).astype(np.uint8).tobytes()
        seed = int(hashlib.sha256(seed_bytes).hexdigest()[:8], 16)
        indices = [seed % len(self.classes), (seed + 5) % len(self.classes), (seed + 9) % len(self.classes)]
        scores = [0.88, 0.08, 0.03]
        return [
            PredictionItem(class_name=self.classes[index], confidence=score)
            for index, score in zip(indices, scores, strict=True)
        ]


class TorchModelService:
    """Runs preprocessing and Top-3 inference for a trained torchvision model."""

    def __init__(self, classes: list[str], architecture: str, model_path: Path) -> None:
        import torch
        from torchvision import transforms

        self.classes = classes
        self.device = select_device()
        self.model = load_trained_model(model_path, architecture, len(classes), self.device)
        self.transform = transforms.Compose(
            [
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
            ]
        )

    def predict(self, image: Image.Image, filename: str) -> list[PredictionItem]:
        import torch

        del filename
        tensor = self.transform(image).unsqueeze(0).to(self.device)
        with torch.inference_mode():
            probabilities = torch.softmax(self.model(tensor), dim=1)[0]
            scores, indices = probabilities.topk(min(3, len(self.classes)))
        return [
            PredictionItem(class_name=self.classes[index], confidence=float(score))
            for score, index in zip(scores.cpu().tolist(), indices.cpu().tolist(), strict=True)
        ]
