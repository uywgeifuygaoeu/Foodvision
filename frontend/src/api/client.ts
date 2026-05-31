export interface Prediction {
  class: string;
  confidence: number;
}

export interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface MacroDistribution {
  protein: number;
  carbs: number;
  fat: number;
}

export interface AnalysisInsight {
  title: string;
  detail: string;
  tone: "positive" | "neutral" | "watch";
}

export interface MealAnalysis {
  balance_score: number;
  score_label: string;
  meal_tags: string[];
  daily_value_percentages: Nutrition;
  macro_calorie_percentages: MacroDistribution;
  insights: AnalysisInsight[];
  suggestions: string[];
}

export interface PredictionResponse {
  top_predictions: Prediction[];
  nutrition: Nutrition;
  analysis: MealAnalysis;
  recommendation: string;
  model_mode: "mock" | "real" | "frontend-fallback";
  gradcam_image?: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

/** Sends a food image to the FastAPI service and returns normalized prediction data. */
export async function predictFood(file: File): Promise<PredictionResponse> {
  const body = new FormData();
  body.append("file", file);

  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    body,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Prediction failed." }));
    throw new Error(error.detail ?? "Prediction failed.");
  }

  return response.json() as Promise<PredictionResponse>;
}
