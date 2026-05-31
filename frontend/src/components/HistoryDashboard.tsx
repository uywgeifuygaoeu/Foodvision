import { motion } from "framer-motion";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PredictionResponse } from "../api/client";

export interface HistoryEntry {
  id: string;
  analyzedAt: string;
  imageUrl: string;
  className: string;
  calories: number;
  protein: number;
  fiber: number;
  balanceScore: number;
  report?: PredictionResponse;
}

interface HistoryDashboardProps {
  entries: HistoryEntry[];
  onClear: () => void;
  onDelete: (id: string) => void;
  onOpen: (entry: HistoryEntry) => void;
}

const isToday = (value: string) => new Date(value).toDateString() === new Date().toDateString();
const formatClassName = (value: string) => value.replaceAll("_", " ");
const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

function buildWeeklyTrend(entries: HistoryEntry[]) {
  return Array.from({ length: 8 }, (_, index) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (7 - index));
    const matching = entries.filter((entry) => dayKey(new Date(entry.analyzedAt)) === dayKey(day));
    const scoreTotal = matching.reduce((total, entry) => total + entry.balanceScore, 0);
    return {
      day: day.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" }),
      calories: Math.round(matching.reduce((total, entry) => total + entry.calories, 0)),
      protein: Number(matching.reduce((total, entry) => total + entry.protein, 0).toFixed(1)),
      score: matching.length ? Math.round(scoreTotal / matching.length) : 0,
    };
  });
}

const trendCards = [
  ["calories", "Energy", "#ed735d", "kcal"],
  ["protein", "Protein", "#76aa86", "g"],
  ["score", "Balance score", "#e1ac42", "/100"],
] as const;

export default function HistoryDashboard({ entries, onClear, onDelete, onOpen }: HistoryDashboardProps) {
  const todayEntries = entries.filter((entry) => isToday(entry.analyzedAt));
  const total = todayEntries.reduce(
    (summary, entry) => ({
      calories: summary.calories + entry.calories,
      protein: summary.protein + entry.protein,
      fiber: summary.fiber + entry.fiber,
      score: summary.score + entry.balanceScore,
    }),
    { calories: 0, protein: 0, fiber: 0, score: 0 },
  );
  const averageScore = todayEntries.length ? Math.round(total.score / todayEntries.length) : 0;
  const trend = buildWeeklyTrend(entries);

  return (
    <section id="history" className="section-shell history-section">
      <div className="container">
        <div className="history-heading">
          <div>
            <span className="section-kicker">TODAY OVERVIEW</span>
            <h2>A simple view of your day.</h2>
            <p>Your latest meal scans stay on this device only.</p>
          </div>
          <button className="button button-outline" onClick={onClear}>Clear history</button>
        </div>
        <div className="today-grid">
          <article><span>Meals scanned</span><strong>{todayEntries.length}</strong><small>today</small></article>
          <article><span>Estimated energy</span><strong>{Math.round(total.calories)}</strong><small>kcal</small></article>
          <article><span>Protein</span><strong>{Number(total.protein.toFixed(1))}</strong><small>g</small></article>
          <article><span>Fiber</span><strong>{Number(total.fiber.toFixed(1))}</strong><small>g</small></article>
          <article><span>Average score</span><strong>{averageScore}</strong><small>/ 100</small></article>
        </div>

        <div className="trend-heading">
          <span className="eyebrow">TODAY + PREVIOUS 7 DAYS</span>
          <p>Local trends from saved meal scans. Today is always shown on the right.</p>
        </div>
        <div className="trend-grid">
          {trendCards.map(([key, label, color, unit]) => (
            <article className="trend-card" key={key}>
              <div><span>{label}</span><small>{unit}</small></div>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={trend}>
                  <CartesianGrid stroke="#e6e6dc" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    padding={{ left: 10, right: 10 }}
                    tick={{ fill: "#82948e", fontSize: 10 }}
                  />
                  <YAxis hide domain={[0, "auto"]} />
                  <Tooltip />
                  <Line dataKey={key} type="monotone" stroke={color} strokeWidth={3} dot={{ fill: color, r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </article>
          ))}
        </div>

        <div className="history-list-heading">
          <span className="eyebrow">RECENT ANALYSES</span>
          <span>{entries.length} saved locally</span>
        </div>
        <div className="history-grid">
          {entries.map((entry, index) => (
            <motion.article
              className={`history-card ${entry.report ? "history-card-clickable" : ""}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => entry.report && onOpen(entry)}
              onKeyDown={(event) => event.key === "Enter" && entry.report && onOpen(entry)}
              role={entry.report ? "button" : undefined}
              tabIndex={entry.report ? 0 : undefined}
              key={entry.id}
            >
              <img src={entry.imageUrl} alt={formatClassName(entry.className)} />
              <div>
                <span>{new Date(entry.analyzedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                <h3>{formatClassName(entry.className)}</h3>
                <p>{Math.round(entry.calories)} kcal · score {entry.balanceScore}</p>
                <small>{entry.report ? "View full report" : "Summary only"}</small>
              </div>
              <button
                className="history-delete"
                aria-label={`Delete ${formatClassName(entry.className)} analysis`}
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(entry.id);
                }}
              >
                ×
              </button>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
