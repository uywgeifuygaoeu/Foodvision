from pathlib import Path
from typing import Any


SUPPORTED_ARCHITECTURES = {"efficientnet_b0", "resnet18", "resnet50", "mobilenet_v3_small"}


def select_device() -> str:
    """Prefer CUDA, then Apple Silicon MPS, and fall back to CPU."""

    import torch

    if torch.cuda.is_available():
        return "cuda"
    if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def create_model(architecture: str, num_classes: int, pretrained: bool = False) -> Any:
    """Create a torchvision classifier with a task-specific final layer."""

    if architecture not in SUPPORTED_ARCHITECTURES:
        raise ValueError(f"Unsupported architecture: {architecture}")

    import torch.nn as nn
    from torchvision import models

    if architecture == "efficientnet_b0":
        weights = models.EfficientNet_B0_Weights.IMAGENET1K_V1 if pretrained else None
        model = models.efficientnet_b0(weights=weights)
        model.classifier[1] = nn.Linear(model.classifier[1].in_features, num_classes)
    elif architecture == "resnet18":
        weights = models.ResNet18_Weights.IMAGENET1K_V1 if pretrained else None
        model = models.resnet18(weights=weights)
        model.fc = nn.Linear(model.fc.in_features, num_classes)
    elif architecture == "resnet50":
        weights = models.ResNet50_Weights.IMAGENET1K_V2 if pretrained else None
        model = models.resnet50(weights=weights)
        model.fc = nn.Linear(model.fc.in_features, num_classes)
    else:
        weights = models.MobileNet_V3_Small_Weights.IMAGENET1K_V1 if pretrained else None
        model = models.mobilenet_v3_small(weights=weights)
        model.classifier[3] = nn.Linear(model.classifier[3].in_features, num_classes)
    return model


def freeze_feature_extractor(model: Any, architecture: str) -> None:
    """Train only the new classification head for fast transfer-learning runs."""

    for parameter in model.parameters():
        parameter.requires_grad = False

    if architecture in {"resnet18", "resnet50"}:
        head = model.fc
    else:
        head = model.classifier

    for parameter in head.parameters():
        parameter.requires_grad = True


def load_trained_model(model_path: Path, architecture: str, num_classes: int, device: str) -> Any:
    """Load a saved FoodVision checkpoint and prepare it for inference."""

    import torch

    if not model_path.exists():
        raise FileNotFoundError(
            f"Model checkpoint not found at {model_path}. Add best_model.pth or enable USE_MOCK_MODEL."
        )

    checkpoint = torch.load(model_path, map_location=device)
    saved_architecture = checkpoint.get("architecture", architecture) if isinstance(checkpoint, dict) else architecture
    state_dict = checkpoint.get("model_state_dict", checkpoint) if isinstance(checkpoint, dict) else checkpoint

    model = create_model(saved_architecture, num_classes=num_classes, pretrained=False)
    model.load_state_dict(state_dict)
    model.to(device)
    model.eval()
    return model
