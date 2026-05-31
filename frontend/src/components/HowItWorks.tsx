import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    icon: "↥",
    title: "Upload your food photo",
    text: "Choose a clear photo of your meal from your phone or laptop.",
    color: "step-peach",
  },
  {
    number: "02",
    icon: "✦",
    title: "AI recognizes the dish",
    text: "A fine-tuned image classifier ranks the most likely food categories.",
    color: "step-butter",
  },
  {
    number: "03",
    icon: "◎",
    title: "Get nutrition insights",
    text: "Explore estimated nutrients and a friendly recommendation for balance.",
    color: "step-mint",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="section-shell how-section">
      <div className="container">
        <div className="section-heading centered">
          <span className="section-kicker">THREE SIMPLE STEPS</span>
          <h2>From meal photo to mindful choice.</h2>
          <p>FoodVision turns model output into insights that are clear enough to act on.</p>
        </div>
        <div className="steps-grid">
          {steps.map((step, index) => (
            <motion.article
              key={step.number}
              className={`step-card ${step.color}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ delay: index * 0.12 }}
            >
              <span className="step-number">{step.number}</span>
              <div className="step-icon">{step.icon}</div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
