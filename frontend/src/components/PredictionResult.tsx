import { useState } from "react";
import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import type { PredictionResponse } from "../api/client";
import BetterPlateCard from "./BetterPlateCard";
import NutritionChart from "./NutritionChart";
import RecommendationCard from "./RecommendationCard";
import { exportShareCard } from "../utils/exportShareCard";
import {
  calculateGoalScore,
  getGoalSuggestions,
  getScoreLabel,
  GOAL_PROFILES,
  type NutritionGoal,
} from "../utils/goalAnalysis";

interface PredictionResultProps {
  imageUrl: string;
  result: PredictionResponse;
}

const goals: Array<[NutritionGoal, string]> = [
  ["balanced", "Balanced"],
  ["high-protein", "High protein"],
  ["lighter", "Lighter meal"],
  ["lower-carb", "Lower carb"],
];

const portions = [0.5, 1, 1.5, 2];

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
};

export default function PredictionResult({ imageUrl, result }: PredictionResultProps) {
  const primary = result.top_predictions[0];
  const [portion, setPortion] = useState(1);
  const [goal, setGoal] = useState<NutritionGoal>("balanced");
  const [exportError, setExportError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const confidenceLabel = primary.confidence >= 0.8 ? "Strong match" : primary.confidence >= 0.55 ? "Likely match" : "Review alternatives";
  const servingNutrition = {
    calories: Number((result.nutrition.calories * portion).toFixed(1)),
    protein: Number((result.nutrition.protein * portion).toFixed(1)),
    carbs: Number((result.nutrition.carbs * portion).toFixed(1)),
    fat: Number((result.nutrition.fat * portion).toFixed(1)),
    fiber: Number((result.nutrition.fiber * portion).toFixed(1)),
  };
  const goalScore = calculateGoalScore(result.analysis.balance_score, servingNutrition, goal);
  const goalSuggestions = getGoalSuggestions(result.analysis.suggestions, servingNutrition, goal);

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      await exportShareCard({ imageUrl, result, nutrition: servingNutrition, goal, goalScore });
    } catch {
      setExportError("The share card could not be generated in this browser.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="visible" className="results-stack">
      <motion.section variants={item} className="prediction-panel">
        <div className="result-image-wrap">
          <img src={imageUrl} alt="Analyzed meal" className="result-image" />
          <span className="image-label">YOUR PHOTO</span>
        </div>
        <div className="prediction-copy">
          <span className="eyebrow">AI PREDICTION SUMMARY</span>
          <div className="primary-prediction">
            <div>
              <h3>{primary.class.replaceAll("_", " ")}</h3>
              <p>{confidenceLabel}</p>
            </div>
            <strong>{Math.round(primary.confidence * 100)}%</strong>
          </div>
          <div className="prediction-bars">
            {result.top_predictions.map((prediction, index) => (
              <div className="prediction-row" key={prediction.class}>
                <div>
                  <span>{index + 1}. {prediction.class.replaceAll("_", " ")}</span>
                  <strong>{Math.round(prediction.confidence * 100)}%</strong>
                </div>
                <div className="bar-track">
                  <motion.div
                    className={`bar-fill bar-fill-${index + 1}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${prediction.confidence * 100}%` }}
                    transition={{ delay: 0.18 + index * 0.12, duration: 0.7 }}
                  />
                </div>
              </div>
            ))}
          </div>
          {primary.confidence < 0.55 && (
            <div className="confidence-warning">
              <strong>Low confidence result</strong>
              <p>We are not fully certain. Please confirm the closest match.</p>
            </div>
          )}
          <div className="meal-tags">
            {result.analysis.meal_tags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
          <p className="model-mode">Mode: {result.model_mode} · estimated serving</p>
        </div>
      </motion.section>

      <motion.section variants={item} className="analysis-toolbar">
        <div className="score-card">
          <div className="score-ring" style={{ "--score": `${goalScore * 3.6}deg` } as CSSProperties}>
            <strong>{goalScore}</strong>
            <span>/ 100</span>
          </div>
          <div>
            <span className="eyebrow">PLATE BALANCE SCORE</span>
            <h3>{getScoreLabel(goalScore)}</h3>
            <p>Adjusted for your {GOAL_PROFILES[goal].label.toLowerCase()} goal.</p>
          </div>
        </div>
        <div className="control-card">
          <div>
            <span className="eyebrow">ESTIMATED PORTION</span>
            <div className="choice-row">
              {portions.map((value) => (
                <button className={portion === value ? "choice-active" : ""} key={value} onClick={() => setPortion(value)}>
                  {value}x
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="eyebrow">YOUR GOAL</span>
            <div className="choice-row goal-row">
              {goals.map(([value, label]) => (
                <button className={goal === value ? "choice-active" : ""} key={value} onClick={() => setGoal(value)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="export-control">
            <button className="button button-primary" onClick={handleExport} disabled={exporting}>
              {exporting ? "Preparing PNG..." : "Export share card"}
            </button>
            {exportError && <small>{exportError}</small>}
          </div>
        </div>
      </motion.section>

      <NutritionChart nutrition={result.nutrition} analysis={result.analysis} portion={portion} goal={goal} />

      <motion.section variants={item} className="insight-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">WHY THIS SCORE?</span>
            <h3>Three signals worth noticing.</h3>
          </div>
        </div>
        <div className="insight-grid">
          {result.analysis.insights.map((insight) => (
            <article className={`insight-card insight-${insight.tone}`} key={insight.title}>
              <span>{insight.title}</span>
              <p>{insight.detail}</p>
            </article>
          ))}
        </div>
      </motion.section>

      <BetterPlateCard className={primary.class} nutrition={servingNutrition} />

      <RecommendationCard
        recommendation={result.recommendation}
        suggestions={goalSuggestions}
        goal={goal}
      />
    </motion.div>
  );
}
