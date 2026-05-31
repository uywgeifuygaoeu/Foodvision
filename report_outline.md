# FoodVision Project Report Outline

## 1. Problem Definition

- Motivation: meal photos are easy to capture, but nutrition information is not always easy to interpret.
- Objective: recognize a dish from an uploaded image, return Top-3 predictions, estimate nutrients,
  and provide a short recommendation.
- Target users: students and everyday users seeking quick, friendly food insights.
- Scope statement: nutrition values are approximate per-serving references, not medical advice.

## 2. Data Science Pipeline

Include `pipeline_diagram.mmd` or the rendered `report_assets/pipeline_diagram.png`.

### 2.1 Data Collection

- Public Food-11 image dataset from Kaggle.
- Current expanded training scope: 9,927 images across 11 broad food categories, including meat.
- Optional scale-up path: use the complete Food-101 dataset after the local pipeline is validated.
- Explain dataset license/source and cite the original Food-101 paper.

### 2.2 Preprocessing and Representation

- Stratified train, validation, and test split: 70%, 15%, 15%.
- RGB conversion, resize to 224 x 224 pixels, ImageNet normalization.
- Training augmentation: random resized crop, horizontal flip, rotation, and color jitter.
- `class_mapping.json` keeps training labels consistent with API inference.
- `nutrition.csv` maps each of the 11 deployed classes to an approximate per-serving nutrition profile.

### 2.3 Data Modeling

- Main model: ImageNet-pretrained EfficientNet-B0 with a replaced classifier head.
- Lightweight option: ResNet18 for quick local experiments and demo fallback.
- Training: cross-entropy loss, AdamW optimizer, validation-based best checkpoint selection.
- Discuss why transfer learning is practical for a course timeline.

### 2.4 Evaluation

- Accuracy and Top-3 accuracy.
- Macro precision, recall, and F1-score.
- Confusion matrix and wrong-prediction examples.
- Discuss visually similar foods and dataset limitations.
- Current refined ResNet18 Food-11 result: 94.3% test accuracy, 98.8% Top-3 accuracy,
  and 94.6% macro F1-score across 1,489 held-out images.

## 3. Data Visualization

- Training and validation curves from `source_code/train.py`.
- Confusion matrix and prediction examples from `source_code/evaluate.py`.
- Web UI: animated Top-3 confidence bars, balance score, portion controls, dietary-goal
  controls, nutrient radar chart, macro donut chart, and daily-reference progress bars.
- Explainable analysis: nutrient highlights and rule-based plate-building suggestions.
- Product continuity: browser-local history for the latest eight scans and a same-day overview
  for estimated calories, protein, and fiber.
- Trust signal: show a low-confidence notice below a 55% Top-1 threshold.
- History details: reopen the full locally saved report, delete individual entries, and calculate
  the same-day average balance score.
- Seven-day local trend charts for calories, protein, and balance score.
- Goal-aware analysis: recompute score adjustments, daily reference progress, and prioritized
  suggestions when the user selects a nutrition goal.
- Share card export: render a branded PNG locally in the browser without uploading the meal photo.
- Optional Grad-CAM overlay to explain model attention.

## 4. System Architecture and UI/UX

Include `system_architecture.mmd` or the rendered `report_assets/system_architecture.png`.

- React + Vite frontend for upload, preview, responsive layout, animations, and charts.
- FastAPI backend for validation, inference orchestration, and JSON responses.
- PyTorch inference service with environment-controlled mock and real model modes.
- Local CSV nutrition repository.
- Explain error handling for invalid files, missing models, and unavailable API connections.
- Add final screenshots under `report_assets/ui_screenshots/`.

## 5. Challenges

Use at most four points, as required by the course instructions:

1. Balancing classification quality and training cost with demo/full modes.
2. Keeping training class order consistent across saved checkpoints and backend deployment.
3. Converting model probabilities into friendly, non-medical nutrition guidance.
4. Building a polished web demo that still works before a large model file is deployed.

## 6. References

- Bossard, L., Guillaumin, M., and Van Gool, L. Food-101: Mining Discriminative Components
  with Random Forests. ECCV 2014.
- PyTorch and torchvision documentation.
- FastAPI documentation.
- React, Vite, Framer Motion, and Recharts documentation.
- List all additional third-party libraries used in the final implementation.

## 7. Signed VeriGuide Receipt

Insert the signed VeriGuide receipt here before submitting the final PDF.
