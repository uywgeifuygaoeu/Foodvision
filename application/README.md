# FoodVision Application Package

This folder is the deployment handoff required by the course submission structure.

The runnable application code is organized in:

```text
../backend/
../frontend/
../docker-compose.yml
```

The trained deployment checkpoint is published as a GitHub Release asset. Download it with:

```bash
../backend/models/download_model.sh
```

The resulting checkpoint path is `../backend/models/best_model.pth`. The direct download URL
is listed in `model_link.txt`.

For a presentation without a checkpoint, keep `USE_MOCK_MODEL=true`. The web flow remains
fully demonstrable and the result area clearly reports mock mode.
