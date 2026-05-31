# Training Data Is Stored Separately

Training images are not required to run the FoodVision web application.

The local training archive was moved next to this project:

```text
../foodvision_training_archive/data/
```

The deployed application only needs:

```text
backend/models/best_model.pth
backend/data/class_mapping.json
backend/data/nutrition.csv
```

To retrain the model, use the external image folder:

```text
../foodvision_training_archive/data/food11-expanded/images/
```
