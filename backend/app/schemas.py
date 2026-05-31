from typing import Literal

from pydantic import BaseModel, Field


class PredictionItem(BaseModel):
    """A ranked food class returned by the image classifier."""

    class_name: str = Field(serialization_alias="class")
    confidence: float = Field(ge=0.0, le=1.0)

    model_config = {"populate_by_name": True}


class NutritionInfo(BaseModel):
    """Approximate nutrients for one representative serving."""

    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: float


class MacroDistribution(BaseModel):
    """Percentage of macro calories contributed by each nutrient."""

    protein: float
    carbs: float
    fat: float


class AnalysisInsight(BaseModel):
    """A short, UI-ready explanation of one nutrition signal."""

    title: str
    detail: str
    tone: Literal["positive", "neutral", "watch"]


class MealAnalysis(BaseModel):
    """Derived meal-level signals for the nutrition analysis workspace."""

    balance_score: int = Field(ge=0, le=100)
    score_label: str
    meal_tags: list[str]
    daily_value_percentages: NutritionInfo
    macro_calorie_percentages: MacroDistribution
    insights: list[AnalysisInsight]
    suggestions: list[str]


class PredictionResponse(BaseModel):
    """Complete prediction payload consumed by the React frontend."""

    top_predictions: list[PredictionItem]
    nutrition: NutritionInfo
    analysis: MealAnalysis
    recommendation: str
    model_mode: Literal["mock", "real"]
    gradcam_image: str | None = None


class HealthResponse(BaseModel):
    """Runtime status used by local checks and deployment probes."""

    status: str
    model_mode: Literal["mock", "real"]
    model_ready: bool
    detail: str


class ClassesResponse(BaseModel):
    """Food labels supported by the active classifier."""

    classes: list[str]
    count: int
