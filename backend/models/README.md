# Model Checkpoints

The trained deployment checkpoint is published as chunked GitHub Release assets. Download,
rebuild, and verify it after cloning:

```bash
./backend/models/download_model.sh
```

For real inference, place the exported checkpoint at:

```text
backend/models/best_model.pth
```

The currently deployed Food-11 checkpoint uses `resnet18`. Override this with
`MODEL_ARCHITECTURE=efficientnet_b0`, `resnet50`, or `mobilenet_v3_small` when needed.

The training script in `source_code/train.py` creates a compatible checkpoint with:

- `model_state_dict`
- `architecture`
- `class_names`
- best validation accuracy and epoch metadata

When deploying a checkpoint with different classes, also update
`backend/data/nutrition.csv` so each deployed class has an approximate nutrition mapping.
