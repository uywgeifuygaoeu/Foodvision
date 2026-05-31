import { motion } from "framer-motion";
import type { NutritionGoal } from "../utils/goalAnalysis";

interface RecommendationCardProps {
  recommendation: string;
  suggestions: string[];
  goal: NutritionGoal;
}

import { GOAL_PROFILES } from "../utils/goalAnalysis";

export default function RecommendationCard({ recommendation, suggestions, goal }: RecommendationCardProps) {
  return (
    <motion.article
      className="recommendation-card"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.22 }}
    >
      <div className="recommendation-header">
        <div className="recommendation-icon">✦</div>
        <div>
          <span className="eyebrow">BUILD A BETTER PLATE</span>
          <h3>Small changes, clearer choices.</h3>
          <p>{recommendation}</p>
        </div>
      </div>
      <div className="suggestion-grid">
        {suggestions.map((suggestion, index) => (
          <article key={suggestion}>
            <strong>0{index + 1}</strong>
            <p>{suggestion}</p>
          </article>
        ))}
        <article className="goal-suggestion">
          <strong>GOAL</strong>
          <p>{GOAL_PROFILES[goal].note}</p>
        </article>
      </div>
    </motion.article>
  );
}
