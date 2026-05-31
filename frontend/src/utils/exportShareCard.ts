import type { Nutrition, PredictionResponse } from "../api/client";
import { GOAL_PROFILES, getGoalSuggestions, type NutritionGoal } from "./goalAnalysis";

interface ShareCardInput {
  imageUrl: string;
  result: PredictionResponse;
  nutrition: Nutrition;
  goal: NutritionGoal;
  goalScore: number;
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load the meal image."));
    image.src = src;
  });

function downloadCanvas(canvas: HTMLCanvasElement) {
  const anchor = document.createElement("a");
  anchor.href = canvas.toDataURL("image/png");
  anchor.download = `foodvision-${Date.now()}.png`;
  anchor.click();
}

/** Renders a compact branded report without sending the uploaded image to another service. */
export async function exportShareCard({ imageUrl, result, nutrition, goal, goalScore }: ShareCardInput) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas export is unavailable.");

  const primary = result.top_predictions[0];
  const suggestions = getGoalSuggestions(result.analysis.suggestions, nutrition, goal);
  const mealImage = await loadImage(imageUrl);

  context.fillStyle = "#fff9ee";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#dff4e5";
  context.beginPath();
  context.arc(980, 110, 210, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#ffd8c2";
  context.beginPath();
  context.arc(50, 1250, 250, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#27443b";
  context.font = "900 52px Arial";
  context.fillText("FoodVision", 76, 100);
  context.fillStyle = "#688078";
  context.font = "700 22px Arial";
  context.fillText("AI FOOD & NUTRITION REPORT", 78, 144);

  context.save();
  context.beginPath();
  context.roundRect(76, 202, 928, 430, 34);
  context.clip();
  const scale = Math.max(928 / mealImage.width, 430 / mealImage.height);
  const width = mealImage.width * scale;
  const height = mealImage.height * scale;
  context.drawImage(mealImage, 76 + (928 - width) / 2, 202 + (430 - height) / 2, width, height);
  context.restore();

  context.fillStyle = "#ffffff";
  context.beginPath();
  context.roundRect(76, 670, 928, 184, 28);
  context.fill();
  context.fillStyle = "#688078";
  context.font = "700 20px Arial";
  context.fillText("MOST LIKELY MATCH", 110, 718);
  context.fillStyle = "#27443b";
  context.font = "900 54px Arial";
  context.fillText(primary.class.replaceAll("_", " "), 110, 790);
  context.fillStyle = "#ed735d";
  context.font = "900 60px Arial";
  context.fillText(`${Math.round(primary.confidence * 100)}%`, 790, 790);

  const nutrients = [
    ["Calories", `${nutrition.calories} kcal`],
    ["Protein", `${nutrition.protein} g`],
    ["Carbs", `${nutrition.carbs} g`],
    ["Fiber", `${nutrition.fiber} g`],
  ];
  nutrients.forEach(([label, value], index) => {
    const x = 76 + index * 238;
    context.fillStyle = ["#ffd8c2", "#dff4e5", "#ffe89a", "#ccebcf"][index];
    context.beginPath();
    context.roundRect(x, 884, 214, 126, 22);
    context.fill();
    context.fillStyle = "#688078";
    context.font = "700 17px Arial";
    context.fillText(label.toUpperCase(), x + 20, 924);
    context.fillStyle = "#27443b";
    context.font = "900 30px Arial";
    context.fillText(value, x + 20, 978);
  });

  context.fillStyle = "#27443b";
  context.font = "900 30px Arial";
  context.fillText(`Plate score: ${goalScore}/100`, 78, 1088);
  context.fillStyle = "#688078";
  context.font = "700 20px Arial";
  context.fillText(`Goal: ${GOAL_PROFILES[goal].label}`, 78, 1128);
  context.fillStyle = "#27443b";
  context.font = "700 22px Arial";
  suggestions.slice(0, 2).forEach((suggestion, index) => {
    context.fillText(`${index + 1}. ${suggestion}`, 78, 1196 + index * 42, 920);
  });
  context.fillStyle = "#688078";
  context.font = "600 17px Arial";
  context.fillText("Approximate nutrition reference only. Not medical advice.", 78, 1310);

  downloadCanvas(canvas);
}
