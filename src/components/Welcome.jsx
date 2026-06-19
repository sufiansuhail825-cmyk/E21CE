import React from "react";
import "../styles/welcome.css";

const DOMAIN_NAMES = [
  "Pedagogical Innovation",
  "Assessment & Academic Integrity",
  "Student Empowerment & Readiness",
  "Digital Competence",
  "Professional Engagement",
];

const DOMAIN_COLORS = ["#C08A3E", "#1A6B8A", "#1B6B2E", "#006B4F", "#8B1A2E"];

function GrowthRings() {
  // Five concentric arcs, one per domain, suggesting rings of growth.
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const radii = [120, 100, 80, 60, 40];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="growth-rings" role="img" aria-label="Five concentric rings representing the five competency domains">
      {radii.map((r, i) => {
        const circumference = 2 * Math.PI * r;
        const fillFraction = 0.62 + i * 0.07; // varied, intentional, not uniform
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={DOMAIN_COLORS[i]}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${circumference * fillFraction} ${circumference}`}
            transform={`rotate(-90 ${cx} ${cy})`}
            opacity={0.92}
            className="growth-ring"
            style={{ animationDelay: `${i * 0.12}s` }}
          />
        );
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" className="growth-rings__num">5</text>
      <text x={cx} y={cy + 16} textAnchor="middle" className="growth-rings__label">domains</text>
    </svg>
  );
}

export default function Welcome({ onStart }) {
  return (
    <div className="welcome">
      <header className="topbar">
        <div className="topbar__logo-frame">
          <img src="/cal-logo-mark.png" alt="Centre for Advanced Learning, Manav Rachna University" className="topbar__logo" />
        </div>
      </header>

      <main className="welcome__hero">
        <div className="welcome__copy">
          <p className="eyebrow">Educator Competency Self-Assessment</p>
          <h1 className="welcome__title">
            Empowering the<br />21st&nbsp;Century Educator
          </h1>
          <p className="welcome__lede">
            A comprehensive self-assessment mapping your practice across five
            domains of teaching and professional life. Built on Bronfenbrenner's
            ecological systems, refined through CAL's framework validation work.
          </p>

          <div className="welcome__meta">
            <div className="welcome__meta-item">
              <span className="welcome__meta-num">156</span>
              <span className="welcome__meta-label">scenario-based questions</span>
            </div>
            <div className="welcome__meta-item">
              <span className="welcome__meta-num">5</span>
              <span className="welcome__meta-label">competency domains</span>
            </div>
            <div className="welcome__meta-item">
              <span className="welcome__meta-num">26</span>
              <span className="welcome__meta-label">professional strands</span>
            </div>
          </div>

          <button className="btn btn--primary" onClick={onStart}>
            Begin self-assessment
            <span aria-hidden="true">→</span>
          </button>
          <p className="welcome__time">Takes 3–5 hours · save time by completing it across multiple sittings</p>
        </div>

        <div className="welcome__visual">
          <GrowthRings />
          <ul className="welcome__domain-list">
            {DOMAIN_NAMES.map((d, i) => (
              <li key={d}>
                <span className="welcome__dot" style={{ background: DOMAIN_COLORS[i] }} />
                {d}
              </li>
            ))}
          </ul>
        </div>
      </main>

      <footer className="welcome__footer">
        Your responses generate a personalised Educator Competency Report with
        domain-level visualisations, available to download as a PDF immediately
        after you finish.
      </footer>
    </div>
  );
}
