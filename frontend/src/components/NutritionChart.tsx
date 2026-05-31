import { motion } from "framer-motion";
import {
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { MealAnalysis, Nutrition } from "../api/client";
import { getDailyGuide, GOAL_PROFILES, type NutritionGoal } from "../utils/goalAnalysis";

interface NutritionChartProps {
  nutrition: Nutrition;
  analysis: MealAnalysis;
  portion: number;
  goal: NutritionGoal;
}

const nutrientCards: Array<[keyof Nutrition, string, string, string]> = [
  ["calories", "Calories", "kcal", "nutrient-peach"],
  ["protein", "Protein", "g", "nutrient-mint"],
  ["carbs", "Carbs", "g", "nutrient-butter"],
  ["fat", "Fat", "g", "nutrient-pink"],
  ["fiber", "Fiber", "g", "nutrient-green"],
];

const dailyGuide: Array<[keyof Nutrition, string]> = [
  ["calories", "Energy"],
  ["protein", "Protein"],
  ["carbs", "Carbohydrates"],
  ["fat", "Fat"],
  ["fiber", "Fiber"],
];

const macroColors = ["#ed735d", "#efb565", "#9ac7a5"];

const scaled = (value: number, portion: number) => Number((value * portion).toFixed(1));

export default function NutritionChart({ nutrition, analysis, portion, goal }: NutritionChartProps) {
  const serving = {
    calories: scaled(nutrition.calories, portion),
    protein: scaled(nutrition.protein, portion),
    carbs: scaled(nutrition.carbs, portion),
    fat: scaled(nutrition.fat, portion),
    fiber: scaled(nutrition.fiber, portion),
  };
  const chartData = [
    { label: "Protein", value: Math.min((serving.protein / 35) * 100, 100) },
    { label: "Carbs", value: Math.min((serving.carbs / 75) * 100, 100) },
    { label: "Fat", value: Math.min((serving.fat / 30) * 100, 100) },
    { label: "Fiber", value: Math.min((serving.fiber / 12) * 100, 100) },
    { label: "Energy", value: Math.min((serving.calories / 650) * 100, 100) },
  ];
  const macroData = [
    { name: "Protein", value: analysis.macro_calorie_percentages.protein },
    { name: "Carbs", value: analysis.macro_calorie_percentages.carbs },
    { name: "Fat", value: analysis.macro_calorie_percentages.fat },
  ];
  const goalGuide = getDailyGuide(nutrition, portion, goal);

  return (
    <motion.section
      className="nutrition-panel"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.14 }}
    >
      <div className="panel-heading">
        <div>
          <span className="eyebrow">NUTRITION BREAKDOWN</span>
          <h3>What is on this plate?</h3>
        </div>
        <span className="estimate-pill">{portion}x estimated serving</span>
      </div>
      <div className="nutrient-grid nutrient-grid-wide">
        {nutrientCards.map(([key, label, unit, color]) => (
          <article className={`nutrient-card ${color}`} key={key}>
            <span>{label}</span>
            <strong>{serving[key]}<small>{unit}</small></strong>
          </article>
        ))}
      </div>
      <div className="nutrition-visual-grid">
        <div className="radar-wrap">
          <span className="chart-title">Relative nutrient profile</span>
          <ResponsiveContainer width="100%" height={245}>
            <RadarChart data={chartData} outerRadius="68%">
              <PolarGrid stroke="#b8d8c1" />
              <PolarAngleAxis dataKey="label" tick={{ fill: "#47645b", fontSize: 12 }} />
              <Radar dataKey="value" stroke="#ec735e" fill="#ffb19d" fillOpacity={0.65} animationDuration={900} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="macro-wrap">
          <span className="chart-title">Macro calorie split</span>
          <div className="macro-chart">
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie data={macroData} dataKey="value" nameKey="name" innerRadius={53} outerRadius={78} paddingAngle={3}>
                  {macroData.map((item, index) => <Cell fill={macroColors[index]} key={item.name} />)}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="macro-legend">
              {macroData.map((item, index) => (
                <span key={item.name}><i style={{ background: macroColors[index] }} />{item.name} {item.value}%</span>
              ))}
            </div>
          </div>
        </div>
        <div className="daily-guide">
          <span className="chart-title">{GOAL_PROFILES[goal].label} daily guide</span>
          <p>Share of the selected goal's daily reference. The marker shows a 25% meal guide.</p>
          {dailyGuide.map(([key, label]) => {
            const percentage = goalGuide[key];
            return (
              <div className="daily-row" key={key}>
                <div><span>{label}</span><strong>{percentage}%</strong></div>
                <div className="daily-track">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(percentage, 100)}%` }} />
                  <i className="daily-reference-line" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
