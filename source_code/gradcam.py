from __future__ import annotations

from pathlib import Path

import matplotlib.cm as cm
import numpy as np
import torch
from PIL import Image


def find_target_layer(model: torch.nn.Module, architecture: str) -> torch.nn.Module:
    """Return the final convolutional block for supported torchvision classifiers."""

    if architecture == "efficientnet_b0":
        return model.features[-1]
    if architecture in {"resnet18", "resnet50"}:
        return model.layer4[-1]
    if architecture == "mobilenet_v3_small":
        return model.features[-1]
    raise ValueError(f"Grad-CAM target layer is not configured for {architecture}.")


def generate_gradcam(
    model: torch.nn.Module,
    input_tensor: torch.Tensor,
    original_image: Image.Image,
    target_layer: torch.nn.Module,
    output_path: Path,
) -> Path:
    """Generate a Grad-CAM overlay for the model's highest-scoring food class."""

    activations: list[torch.Tensor] = []
    gradients: list[torch.Tensor] = []
    forward_hook = target_layer.register_forward_hook(lambda _m, _i, output: activations.append(output))
    backward_hook = target_layer.register_full_backward_hook(lambda _m, _gi, output: gradients.append(output[0]))
    try:
        model.zero_grad(set_to_none=True)
        logits = model(input_tensor)
        target_class = logits[0].argmax()
        logits[0, target_class].backward()
        weights = gradients[0].mean(dim=(2, 3), keepdim=True)
        heatmap = torch.relu((weights * activations[0]).sum(dim=1)).squeeze()
        heatmap = heatmap / (heatmap.max() + 1e-8)
        heatmap_image = Image.fromarray(np.uint8(heatmap.detach().cpu().numpy() * 255)).resize(original_image.size)
        colored = cm.get_cmap("jet")(np.asarray(heatmap_image) / 255.0)[..., :3]
        base = np.asarray(original_image.convert("RGB"), dtype=np.float32) / 255.0
        overlay = np.uint8(np.clip(0.58 * base + 0.42 * colored, 0, 1) * 255)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        Image.fromarray(overlay).save(output_path)
        return output_path
    finally:
        forward_hook.remove()
        backward_hook.remove()
