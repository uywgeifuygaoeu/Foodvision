import { motion } from "framer-motion";
import type { Nutrition } from "../api/client";

interface BetterPlateCardProps {
  className: string;
  nutrition: Nutrition;
}

const formatClassName = (value: string) => value.replaceAll("_", " ");

function buildPlateSteps(className: string, nutrition: Nutrition) {
  const add =
    nutrition.fiber < 4
      ? "Colorful vegetables or fruit"
      : nutrition.protein < 15
        ? "A clear lean-protein component"
        : "A varied side for texture and color";
  const consider =
    nutrition.fat >= 15 || className === "fried_food"
      ? "A lighter sauce or cooking method"
      : nutrition.carbs >= 45
        ? "A moderate starch portion"
        : "Water and a sensible portion";

  return [
    { label: "Keep", value: formatClassName(className), tone: "keep" },
    { label: "Add", value: add, tone: "add" },
    { label: "Consider", value: consider, tone: "consider" },
  ];
}

export default function BetterPlateCard({ className, nutrition }: BetterPlateCardProps) {
  const steps = buildPlateSteps(className, nutrition);

  return (
    <motion.section
      className="better-plate-card"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div>
        <span className="eyebrow">BUILD A BETTER PLATE</span>
        <h3>A practical plate upgrade.</h3>
        <p>Keep what works, then fill the gaps with one or two realistic changes.</p>
      </div>
      <div className="plate-builder">
        <div className="balanced-plate" aria-label="Suggested balanced plate proportions">
          <span className="plate-half">½<small>vegetables</small></span>
          <span className="plate-quarter plate-quarter-top">¼<small>protein</small></span>
          <span className="plate-quarter plate-quarter-bottom">¼<small>grains</small></span>
        </div>
        <div className="plate-step-grid">
          {steps.map((step) => (
            <article className={`plate-step plate-step-${step.tone}`} key={step.label}>
              <span>{step.label}</span>
              <strong>{step.value}</strong>
            </article>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
