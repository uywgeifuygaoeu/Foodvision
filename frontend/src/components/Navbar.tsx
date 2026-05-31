import { useState } from "react";

const links = [
  ["Scan", "scan"],
  ["Analysis", "nutrition-insights"],
  ["History", "history"],
  ["Method", "about"],
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const navigate = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setOpen(false);
  };

  return (
    <header className="navbar-shell">
      <nav className="navbar container">
        <button className="brand" onClick={() => navigate("home")} aria-label="FoodVision home">
          <span className="brand-mark">F</span>
          <span>FoodVision</span>
        </button>
        <button
          className="menu-toggle"
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle navigation"
          aria-expanded={open}
        >
          <span />
          <span />
          <span />
        </button>
        <div className={`nav-links ${open ? "nav-links-open" : ""}`}>
          {links.map(([label, id]) => (
            <button key={id} onClick={() => navigate(id)}>
              {label}
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
}
