import json
import os
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .inference import MockModelService, TorchModelService
from .nutrition import NutritionRepository
from .schemas import ClassesResponse, HealthResponse, PredictionResponse
from .utils import read_valid_image, resolve_path

BACKEND_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BACKEND_DIR / "data"
USE_MOCK_MODEL = os.getenv("USE_MOCK_MODEL", "true").lower() == "true"
MODEL_ARCHITECTURE = os.getenv("MODEL_ARCHITECTURE", "efficientnet_b0")
MODEL_PATH = resolve_path(os.getenv("MODEL_PATH", "models/best_model.pth"), BACKEND_DIR)


def load_classes() -> list[str]:
    """Load labels in the exact order used by the model classifier head."""

    mapping_path = DATA_DIR / "class_mapping.json"
    mapping = json.loads(mapping_path.read_text(encoding="utf-8"))
    return [mapping[str(index)] for index in range(len(mapping))]


classes = load_classes()
nutrition_repository = NutritionRepository(DATA_DIR / "nutrition.csv")
model_service: Any | None = None
model_error: str | None = None

app = FastAPI(
    title="FoodVision API",
    description="Food image recognition and nutrition recommendation service.",
    version="0.1.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def initialize_model() -> None:
    """Initialize mock or real inference while keeping health checks available on failure."""

    global model_service, model_error
    try:
        model_service = (
            MockModelService(classes)
            if USE_MOCK_MODEL
            else TorchModelService(classes, MODEL_ARCHITECTURE, MODEL_PATH)
        )
        model_error = None
    except Exception as exc:  # Health endpoint exposes actionable startup failures.
        model_service = None
        model_error = str(exc)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    """Report whether the configured model is ready to accept requests."""

    return HealthResponse(
        status="ok" if model_service else "degraded",
        model_mode="mock" if USE_MOCK_MODEL else "real",
        model_ready=model_service is not None,
        detail=model_error or "FoodVision API is ready.",
    )


@app.get("/classes", response_model=ClassesResponse)
def supported_classes() -> ClassesResponse:
    """Return model labels for UI hints and integration checks."""

    return ClassesResponse(classes=classes, count=len(classes))


@app.post("/predict", response_model=PredictionResponse, response_model_by_alias=True)
async def predict(file: UploadFile) -> PredictionResponse:
    """Validate an image, classify it, and attach mapped nutrition advice."""

    if model_service is None:
        raise HTTPException(status_code=503, detail=model_error or "Model service is unavailable.")
    _, image = await read_valid_image(file)
    top_predictions = model_service.predict(image, file.filename or "uploaded-image")
    nutrition = nutrition_repository.get(top_predictions[0].class_name)
    return PredictionResponse(
        top_predictions=top_predictions,
        nutrition=nutrition,
        analysis=nutrition_repository.analyze(top_predictions[0].class_name, nutrition),
        recommendation=nutrition_repository.recommend(nutrition),
        model_mode="mock" if USE_MOCK_MODEL else "real",
    )
