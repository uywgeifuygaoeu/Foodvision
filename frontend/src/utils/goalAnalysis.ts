import type { Nutrition } from "../api/client";

export type NutritionGoal = "balanced" | "high-protein" | "lighter" | "lower-carb";

interface GoalProfile {
  label: string;
  note: string;
  targets: Nutrition;
}

export const GOAL_PROFILES: Record<NutritionGoal, GoalProfile> = {
  balanced: {
    label: "Balanced",
    note: "Focus on variety across the full plate.",
    targets: { calories: 2000, protein: 50, carbs: 275, fat: 78, fiber: 28 },
  },
  "high-protein": {
    label: "High protein",
    note: "Prioritize a clear lean-protein component.",
    targets: { calories: 2100, protein: 100, carbs: 240, fat: 75, fiber: 30 },
  },
  lighter: {
    label: "Lighter meal",
    note: "Keep energy-dense extras and sauces moderate.",
    targets: { calories: 1600, protein: 65, carbs: 190, fat: 60, fiber: 28 },
  },
  "lower-carb": {
    label: "Lower carb",
    note: "Use vegetables to replace part of the starch portion.",
    targets: { calories: 1900, protein: 90, carbs: 130, fat: 75, fiber: 30 },
  },
};

const clamp = (value: number) => Math.max(0, Math.min(100, value));

export function calculateGoalScore(baseScore: number, nutrition: Nutrition, goal: NutritionGoal) {
  if (goal === "high-protein") {
    return clamp(baseScore + (nutrition.protein >= 20 ? 9 : nutrition.protein < 15 ? -9 : 0));
  }
  if (goal === "lighter") {
    const energyAdjustment = nutrition.calories <= 220 ? 8 : nutrition.calories >= 300 ? -8 : 0;
    return clamp(baseScore + energyAdjustment + (nutrition.fat >= 15 ? -4 : 0));
  }
  if (goal === "lower-carb") {
    return clamp(baseScore + (nutrition.carbs <= 30 ? 8 : nutrition.carbs >= 45 ? -9 : 0));
  }
  return baseScore;
}

export function getScoreLabel(score: number) {
  return score >= 78 ? "Great foundation" : score >= 62 ? "Good with a small tweak" : "Build a more balanced plate";
}

export function getGoalSuggestions(baseSuggestions: string[], nutrition: Nutrition, goal: NutritionGoal) {
  const prioritized: string[] = [];
  if (goal === "high-protein") {
    prioritized.push(
      nutrition.protein >= 20
        ? "Keep this protein source and add vegetables for a more complete plate."
        : "Add eggs, seafood, tofu, or another lean protein source.",
    );
  }
  if (goal === "lighter") {
    prioritized.push(
      nutrition.calories >= 300 || nutrition.fat >= 15
        ? "Reduce rich sauces or choose a lighter cooking method."
        : "This can work as a lighter base; add vegetables for volume.",
    );
  }
  if (goal === "lower-carb") {
    prioritized.push(
      nutrition.carbs >= 45
        ? "Replace part of the starch portion with vegetables."
        : "The carbohydrate load is moderate; keep sides vegetable-forward.",
    );
  }
  return [...new Set([...prioritized, ...baseSuggestions])].slice(0, 3);
}

export function getDailyGuide(nutrition: Nutrition, portion: number, goal: NutritionGoal): Nutrition {
  const targets = GOAL_PROFILES[goal].targets;
  return {
    calories: Number(((nutrition.calories * portion / targets.calories) * 100).toFixed(1)),
    protein: Number(((nutrition.protein * portion / targets.protein) * 100).toFixed(1)),
    carbs: Number(((nutrition.carbs * portion / targets.carbs) * 100).toFixed(1)),
    fat: Number(((nutrition.fat * portion / targets.fat) * 100).toFixed(1)),
    fiber: Number(((nutrition.fiber * portion / targets.fiber) * 100).toFixed(1)),
  };
}
