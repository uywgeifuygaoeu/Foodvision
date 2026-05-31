import { motion } from "framer-motion";
import UploadCard from "./UploadCard";

interface HeroProps {
  previewUrl: string | null;
  analyzing: boolean;
  onFileAccepted: (file: File) => void;
  onAnalyze: () => void;
  onReset: () => void;
  onViewDemo: () => void;
}

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

export default function Hero({ onViewDemo, ...uploadProps }: HeroProps) {
  return (
    <section id="home" className="hero section-shell">
      <div className="hero-blob hero-blob-left" />
      <div className="hero-blob hero-blob-right" />
      <div className="container hero-grid">
        <motion.div
          className="hero-copy"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <span className="section-kicker">YOUR FRIENDLY AI NUTRITION GUIDE</span>
          <h1>
            Know Your Food,
            <span>Eat Smarter.</span>
          </h1>
          <p>
            Upload one meal photo. Get the likely food category, a nutrition profile, a balance
            score, and practical ways to improve the plate.
          </p>
          <div className="hero-actions">
            <button className="button button-primary" onClick={() => scrollTo("scan")}>
              Scan a meal
            </button>
            <button className="button button-outline" onClick={onViewDemo}>
              View Demo
            </button>
          </div>
          <div className="hero-notes">
            <span>11 everyday food categories</span>
            <span>Meal balance score</span>
            <span>Personalized tips</span>
          </div>
        </motion.div>
        <motion.div
          className="hero-upload-wrap"
          initial={{ opacity: 0, y: 34 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.7 }}
        >
          <div className="floating-food floating-food-tomato">🍅</div>
          <div className="floating-food floating-food-leaf">🌿</div>
          <UploadCard compact {...uploadProps} />
          <div className="hero-sticker">
            <strong>AI</strong>
            <span>powered</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
