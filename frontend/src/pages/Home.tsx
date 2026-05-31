import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { MealAnalysis, Nutrition, PredictionResponse } from "../api/client";
import { predictFood } from "../api/client";
import Footer from "../components/Footer";
import Hero from "../components/Hero";
import HistoryDashboard from "../components/HistoryDashboard";
import type { HistoryEntry } from "../components/HistoryDashboard";
import Navbar from "../components/Navbar";
import PredictionResult from "../components/PredictionResult";

function createFallbackAnalysis(
  nutrition: Nutrition,
  balanceScore: number,
  mealTags: string[],
  suggestions: string[],
): MealAnalysis {
  const macroCalories = {
    protein: nutrition.protein * 4,
    carbs: nutrition.carbs * 4,
    fat: nutrition.fat * 9,
  };
  const macroTotal = Object.values(macroCalories).reduce((total, value) => total + value, 0) || 1;

  return {
    balance_score: balanceScore,
    score_label: balanceScore >= 78 ? "Great foundation" : "Good with a small tweak",
    meal_tags: mealTags,
    daily_value_percentages: {
      calories: Number(((nutrition.calories / 2000) * 100).toFixed(1)),
      protein: Number(((nutrition.protein / 50) * 100).toFixed(1)),
      carbs: Number(((nutrition.carbs / 275) * 100).toFixed(1)),
      fat: Number(((nutrition.fat / 78) * 100).toFixed(1)),
      fiber: Number(((nutrition.fiber / 28) * 100).toFixed(1)),
    },
    macro_calorie_percentages: {
      protein: Number(((macroCalories.protein / macroTotal) * 100).toFixed(1)),
      carbs: Number(((macroCalories.carbs / macroTotal) * 100).toFixed(1)),
      fat: Number(((macroCalories.fat / macroTotal) * 100).toFixed(1)),
    },
    insights: [
      {
        title: "Protein",
        detail: `${nutrition.protein}g per estimated serving. Add a lean protein source when this is your main meal.`,
        tone: nutrition.protein >= 20 ? "positive" : "neutral",
      },
      {
        title: "Fiber",
        detail: `${nutrition.fiber}g per estimated serving. Colorful vegetables or fruit can improve this.`,
        tone: nutrition.fiber >= 4 ? "positive" : "watch",
      },
      {
        title: "Energy balance",
        detail: `About ${nutrition.calories} kcal before drinks or side dishes. Keep the full plate varied.`,
        tone: "neutral",
      },
    ],
    suggestions,
  };
}

const friedNutrition = { calories: 312, protein: 8, carbs: 35, fat: 16, fiber: 3 };
const vegetableNutrition = { calories: 95, protein: 3, carbs: 20, fat: 1, fiber: 5 };
const seafoodNutrition = { calories: 180, protein: 24, carbs: 3, fat: 7, fiber: 0.5 };
const HISTORY_STORAGE_KEY = "foodvision-analysis-history";
const MAX_HISTORY_ENTRIES = 8;

function loadHistory(): HistoryEntry[] {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // The main analysis must keep working when browser storage is unavailable or full.
  }
}

/** Creates a small thumbnail so recent analyses fit comfortably in browser local storage. */
async function createHistoryThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the image."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Could not create a thumbnail."));
      image.onload = () => {
        const maxSide = 180;
        const ratio = Math.min(maxSide / image.width, maxSide / image.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * ratio));
        canvas.height = Math.max(1, Math.round(image.height * ratio));
        canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

const mockDishes: PredictionResponse[] = [
  {
    top_predictions: [
      { class: "fried_food", confidence: 0.91 },
      { class: "bread", confidence: 0.05 },
      { class: "dessert", confidence: 0.02 },
    ],
    nutrition: friedNutrition,
    analysis: createFallbackAnalysis(friedNutrition, 60, ["richer choice"], [
      "Add one colorful vegetable or fruit serving for more fiber.",
      "Pair it with eggs, seafood, tofu, or another lean protein source.",
      "Choose a lighter cooking method or keep rich sauces on the side.",
    ]),
    recommendation:
      "This meal is relatively rich. Add vegetables and a lighter protein source to build a more balanced plate.",
    model_mode: "frontend-fallback",
  },
  {
    top_predictions: [
      { class: "vegetable_fruit", confidence: 0.87 },
      { class: "soup", confidence: 0.08 },
      { class: "dairy_product", confidence: 0.03 },
    ],
    nutrition: vegetableNutrition,
    analysis: createFallbackAnalysis(vegetableNutrition, 90, ["fiber friendly", "lighter energy"], [
      "Add eggs, seafood, tofu, or another protein source if this is your main meal.",
      "Keep the plate colorful and varied.",
    ]),
    recommendation: "A vegetable-rich choice with useful fiber. Add a lean protein if this is your main meal.",
    model_mode: "frontend-fallback",
  },
  {
    top_predictions: [
      { class: "seafood", confidence: 0.84 },
      { class: "rice", confidence: 0.09 },
      { class: "noodles_pasta", confidence: 0.04 },
    ],
    nutrition: seafoodNutrition,
    analysis: createFallbackAnalysis(seafoodNutrition, 80, ["high protein", "lighter energy"], [
      "Add one colorful vegetable or fruit serving for more fiber.",
      "Choose a whole-grain side for a steadier carbohydrate source.",
    ]),
    recommendation: "This is a useful high-protein choice. Add vegetables or fruit for more fiber.",
    model_mode: "frontend-fallback",
  },
];

/** Keeps the frontend demonstrable even before the API or trained model is available. */
function createFrontendFallback(file: File): PredictionResponse {
  const hash = [...file.name].reduce((total, char) => total + char.charCodeAt(0), 0);
  return mockDishes[hash % mockDishes.length];
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (result && resultImageUrl) {
      document.getElementById("nutrition-insights")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result, resultImageUrl]);

  const handleFileAccepted = (nextFile: File) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
    setResultImageUrl(null);
    setResult(null);
    setNotice(null);
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setResultImageUrl(null);
    setResult(null);
    setNotice(null);
  };

  const handleAnalyze = async () => {
    if (!file) {
      setNotice("Choose a meal photo before starting the analysis.");
      return;
    }
    setAnalyzing(true);
    setNotice(null);
    try {
      const response = await predictFood(file);
      setResult(response);
      setResultImageUrl(previewUrl);
      try {
        const thumbnail = await createHistoryThumbnail(file);
        const historyEntry: HistoryEntry = {
          id: `${Date.now()}-${file.name}`,
          analyzedAt: new Date().toISOString(),
          imageUrl: thumbnail,
          className: response.top_predictions[0].class,
          calories: response.nutrition.calories,
          protein: response.nutrition.protein,
          fiber: response.nutrition.fiber,
          balanceScore: response.analysis.balance_score,
          report: response,
        };
        setHistory((current) => {
          const next = [historyEntry, ...current].slice(0, MAX_HISTORY_ENTRIES);
          saveHistory(next);
          return next;
        });
      } catch {
        // Thumbnail creation is optional and must not replace a successful model result.
      }
    } catch (error) {
      const allowFallback = import.meta.env.VITE_ENABLE_FRONTEND_MOCK_FALLBACK !== "false";
      if (!allowFallback) {
        setNotice(error instanceof Error ? error.message : "The backend could not be reached.");
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 700));
      setResult(createFrontendFallback(file));
      setResultImageUrl(previewUrl);
      setNotice("Backend is offline, so FoodVision is showing a frontend demo prediction.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleViewDemo = () => {
    setResult(mockDishes[0]);
    setResultImageUrl("/demo-pizza.svg");
    setNotice("Showing a built-in example. Upload your own meal photo when you are ready.");
  };

  return (
    <>
      <Navbar />
      <main>
        <Hero
          previewUrl={previewUrl}
          analyzing={analyzing}
          onFileAccepted={handleFileAccepted}
          onAnalyze={handleAnalyze}
          onReset={handleReset}
          onViewDemo={handleViewDemo}
        />
        {notice && (
          <div className="container">
            <p className="notice page-notice">{notice}</p>
          </div>
        )}
        <section id="nutrition-insights" className="section-shell insights-section workspace-section">
          <div className="container">
            {result && resultImageUrl ? (
              <>
                <div className="workspace-heading">
                  <div>
                    <span className="section-kicker">YOUR FOODVISION REPORT</span>
                    <h2>One photo, a clearer plate.</h2>
                  </div>
                  <button className="button button-outline" onClick={() => document.getElementById("scan")?.scrollIntoView({ behavior: "smooth" })}>
                    Scan another meal
                  </button>
                </div>
                <PredictionResult imageUrl={resultImageUrl} result={result} />
              </>
            ) : (
              <motion.div
                className="analysis-preview"
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <div>
                  <span className="section-kicker">MORE THAN A LABEL</span>
                  <h2>Your meal report appears here.</h2>
                  <p>FoodVision turns one recognition result into a practical nutrition review.</p>
                </div>
                <div className="preview-feature-grid">
                  <article><strong>01</strong><span>Balance score</span></article>
                  <article><strong>02</strong><span>Portion control</span></article>
                  <article><strong>03</strong><span>Daily guide</span></article>
                  <article><strong>04</strong><span>Actionable tips</span></article>
                </div>
              </motion.div>
            )}
          </div>
        </section>
        {history.length > 0 && (
          <HistoryDashboard
            entries={history}
            onOpen={(entry) => {
              if (!entry.report) return;
              setResult(entry.report);
              setResultImageUrl(entry.imageUrl);
              setNotice(`Reopened your ${entry.className.replaceAll("_", " ")} analysis from history.`);
              requestAnimationFrame(() => {
                document.getElementById("nutrition-insights")?.scrollIntoView({ behavior: "smooth", block: "start" });
              });
            }}
            onDelete={(id) => {
              setHistory((current) => {
                const next = current.filter((entry) => entry.id !== id);
                saveHistory(next);
                return next;
              });
            }}
            onClear={() => {
              try {
                localStorage.removeItem(HISTORY_STORAGE_KEY);
              } catch {
                // State still clears when browser storage is unavailable.
              }
              setHistory([]);
            }}
          />
        )}
        <section id="about" className="section-shell method-section">
          <div className="container method-grid">
            <div>
              <span className="section-kicker">HOW THE ANALYSIS WORKS</span>
              <h2>Simple on the surface. Structured underneath.</h2>
            </div>
            <div className="method-points">
              <article><strong>1</strong><p>ResNet18 identifies one of 11 broad everyday food categories.</p></article>
              <article><strong>2</strong><p>A local nutrition table estimates a representative serving.</p></article>
              <article><strong>3</strong><p>Rule-based analysis translates nutrients into understandable next steps.</p></article>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
