# Training Outputs Are Stored Separately

Intermediate checkpoints, logs, and evaluation output were moved outside the shareable
application folder:

```text
../../foodvision_training_archive/source_code_outputs/
```

The currently deployed model remains available at:

```text
../../backend/models/best_model.pth
```
