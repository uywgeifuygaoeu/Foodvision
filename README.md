# FoodVision: Food Recognition and Nutrition Recommendation System

FoodVision is a full-stack data science course project for IEMS5726AB Data Science in
Practice. A user uploads a meal photo and receives:

- Top-3 food class predictions with confidence scores
- Approximate calories, protein, carbohydrates, fat, and fiber
- A meal balance score, explainable nutrient highlights, and practical recommendations
- Portion and dietary-goal controls for exploring the result
- Animated prediction bars, a nutrient radar chart, a macro donut chart, and daily-guide bars
- A visual `Keep / Add / Consider` plate-building guide
- Up to eight recent analyses stored locally in the browser, with a daily nutrition overview
- A low-confidence warning when the leading prediction is below 55%
- Clickable history cards that reopen the full saved report, plus single-entry deletion
- Seven-day local trend charts for calories, protein, and average balance score
- Goal-linked scores and daily guides for balanced, high-protein, lighter, and lower-carb plans
- A browser-generated PNG share card that keeps meal images on the user's device
- Optional Grad-CAM support for model attention visualization

The project is built as a deployable application rather than a notebook-only experiment.
It includes data preparation, training, evaluation, inference, a FastAPI backend, and a
responsive React frontend. Nutrition values are approximate references, not medical advice.

## Shareable Folder

The `foodvision/` directory is intentionally compact for application sharing. The trained
deployment checkpoint is published as a GitHub Release asset. Download it after cloning:

```bash
./backend/models/download_model.sh
```

Training images, intermediate checkpoints, and local machine dependencies are not needed to
run the application. They are stored separately in the sibling local-only directory:

```text
../foodvision_training_archive/
```

When another user clones the repository, they can download the trained model without
retraining. Python packages and frontend packages should be installed on that user's machine
using the setup commands below.

## Project Structure

```text
foodvision/
├── backend/                 # FastAPI app, nutrition mapping, model loader, Dockerfile
├── frontend/                # React + Vite + TypeScript branded web interface
├── source_code/             # Training, evaluation, CLI inference, plots, Grad-CAM
├── application/             # Course deployment handoff and external model link
├── report_assets/           # Rendered diagrams and final UI screenshot placeholders
├── report_outline.md        # Course report structure
├── demo_script.md           # Under-10-minute presentation script
├── system_architecture.mmd  # Mermaid architecture source
├── pipeline_diagram.mmd     # Mermaid data pipeline source
└── docker-compose.yml       # Local two-service demo deployment
```

## Quick Start: Mock Demo

Mock mode makes the complete upload and result flow runnable before training a model.

### 1. Start the backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
USE_MOCK_MODEL=true uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. Useful checks:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/classes
```

### 2. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The frontend reads its API base URL from:

```text
frontend/.env
```

If the backend is unavailable, the frontend can still show a clearly labeled fallback
prediction when `VITE_ENABLE_FRONTEND_MOCK_FALLBACK=true`.

## API Contract

### `POST /predict`

Upload one JPG, PNG, or WEBP image as multipart field `file`.

Example response:

```json
{
  "top_predictions": [
    { "class": "meat", "confidence": 0.91 },
    { "class": "fried_food", "confidence": 0.04 },
    { "class": "bread", "confidence": 0.02 }
  ],
  "nutrition": {
    "calories": 266,
    "protein": 11,
    "carbs": 33,
    "fat": 10,
    "fiber": 2.3
  },
  "analysis": {
    "balance_score": 70,
    "score_label": "Good with a small tweak",
    "meal_tags": ["high protein", "richer choice"],
    "daily_value_percentages": {
      "calories": 12.5,
      "protein": 52,
      "carbs": 0,
      "fat": 21.8,
      "fiber": 0
    },
    "macro_calorie_percentages": {
      "protein": 40.5,
      "carbs": 0,
      "fat": 59.5
    },
    "insights": [],
    "suggestions": ["Add one colorful vegetable or fruit serving for more fiber."]
  },
  "recommendation": "Add vegetables or fruit to bring more fiber to the plate.",
  "model_mode": "mock",
  "gradcam_image": null
}
```

### `GET /health`

Reports whether the configured mock or real model is ready.

### `GET /classes`

Returns supported demo classes in classifier index order.

## Dataset Preparation

The currently deployed model uses a balanced subset of the public
[Food-11 image dataset](https://www.kaggle.com/datasets/trolukovich/food11-image-dataset).
The expanded local subset contains 9,927 images across 11 broad categories, including an explicit
`meat` class. This improves everyday recognition coverage while remaining practical for
local iteration.

The scripts expect this image folder layout:

```text
../foodvision_training_archive/data/food11-expanded/images/
├── bread/
├── meat/
├── seafood/
└── ...
```

Train the current tiny dataset with:

```bash
python train.py \
  --data-dir ../../foodvision_training_archive/data/food11-expanded/images \
  --output-dir ../../foodvision_training_archive/source_code_outputs/resnet18_food11 \
  --mode full \
  --architecture resnet18 \
  --epochs 4 \
  --freeze-backbone
```

Then refine the full network from the best classifier-head checkpoint:

```bash
python train.py \
  --data-dir ../../foodvision_training_archive/data/food11-expanded/images \
  --output-dir ../../foodvision_training_archive/source_code_outputs/resnet18_food11_refined \
  --mode full \
  --architecture resnet18 \
  --epochs 3 \
  --learning-rate 1e-4 \
  --resume ../../foodvision_training_archive/source_code_outputs/resnet18_food11/best_model.pth
```

`--mode full` means every class present in the supplied folder. The original
[Food-101](https://data.vision.ee.ethz.ch/cvl/datasets_extra/food-101/) archive remains an
optional scale-up path.

The dataset code performs a stratified 70/15/15 train, validation, and test split. Training
uses ImageNet normalization and augmentations: crop, flip, rotation, and color jitter.

The included `backend/data/nutrition.csv` currently matches the deployed Food-11 categories.
Before deploying a different checkpoint, update the CSV so every deployed class has an
approximate nutrition row.

The currently deployed refined ResNet18 checkpoint reaches 94.3% test accuracy, 98.8%
Top-3 accuracy, and 94.6% macro F1-score across 1,489 held-out images.

## Train a Model

Install requirements:

```bash
cd source_code
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Fastest practical real-model run

Start here for a local course demo:

```bash
python train.py \
  --data-dir ../../foodvision_training_archive/data/food11-expanded/images \
  --output-dir ../../foodvision_training_archive/source_code_outputs/resnet18_food11 \
  --mode full \
  --architecture resnet18 \
  --epochs 4 \
  --freeze-backbone
```

The `--quick` profile uses:

- the 11 broad Food-11 categories, including meat and seafood
- an expanded local subset of 9,927 images
- ImageNet-pretrained ResNet18
- four epochs
- a frozen feature extractor, so only the new classifier head is trained
- CUDA on NVIDIA machines, MPS on Apple Silicon Macs, or CPU as a fallback

For an even faster smoke test, cap the subset at 100 images per class:

```bash
python train.py \
  --data-dir /absolute/path/to/food-101/images \
  --output-dir outputs/resnet18_smoke \
  --quick \
  --max-images-per-class 100 \
  --epochs 3
```

Evaluate the quick checkpoint against the matching balanced subset:

```bash
python evaluate.py \
  --checkpoint ../../foodvision_training_archive/source_code_outputs/resnet18_food11_expanded_refined/best_model.pth \
  --data-dir ../../foodvision_training_archive/data/food11-expanded/images \
  --output-dir ../../foodvision_training_archive/source_code_outputs/resnet18_food11_expanded_refined/evaluation \
  --mode full
```

Use the commands below only after the fast path works.

Train the primary EfficientNet-B0 model:

```bash
python train.py \
  --data-dir /absolute/path/to/food-101/images \
  --output-dir outputs/efficientnet_demo \
  --mode demo \
  --architecture efficientnet_b0 \
  --epochs 12
```

Train a lightweight local model:

```bash
python train.py \
  --data-dir /absolute/path/to/food-101/images \
  --output-dir outputs/resnet18_demo \
  --mode demo \
  --architecture resnet18 \
  --epochs 8
```

Each training run saves:

- `best_model.pth`
- `training.log`
- `training_curves.png`
- `history.json`
- `class_mapping.json`

## Evaluate a Model

Evaluate the currently deployed Food-11 model:

```bash
python evaluate.py \
  --checkpoint ../../foodvision_training_archive/source_code_outputs/resnet18_food11_expanded_refined/best_model.pth \
  --data-dir ../../foodvision_training_archive/data/food11-expanded/images \
  --output-dir ../../foodvision_training_archive/source_code_outputs/resnet18_food11_expanded_refined/evaluation \
  --mode full
```

Evaluation saves:

- Accuracy
- Top-3 accuracy
- Macro precision, recall, and F1-score
- Confusion matrix
- Sample predictions
- Wrong-prediction examples

## Switch to Real Model Mode

1. Copy the trained checkpoint:

```bash
cp ../foodvision_training_archive/source_code_outputs/resnet18_food11_expanded_refined/best_model.pth backend/models/best_model.pth
```

2. Copy the matching label order:

```bash
cp ../foodvision_training_archive/source_code_outputs/resnet18_food11_expanded_refined/class_mapping.json backend/data/class_mapping.json
```

3. Start the backend:

```bash
cd backend
USE_MOCK_MODEL=false \
MODEL_ARCHITECTURE=resnet18 \
MODEL_PATH=models/best_model.pth \
uvicorn app.main:app --reload --port 8000
```

The trained checkpoint is available as a GitHub Release asset. Run
`./backend/models/download_model.sh` after cloning so the application can use real inference
without retraining. The same URL is listed in `application/model_link.txt`.

## Docker Demo

```bash
docker compose up --build
```

Then open `http://localhost:5173`.

## Report and Demonstration

- Use `report_outline.md` for the final PDF report.
- Use `demo_script.md` for an 8 to 9 minute demonstration video.
- Render the Mermaid files or use the prepared PNGs under `report_assets/`.
- Add final UI screenshots under `report_assets/ui_screenshots/`.
- Insert the signed VeriGuide receipt before submitting the report PDF.
