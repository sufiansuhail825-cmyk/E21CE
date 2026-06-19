import React from "react";

const PROMPTS = [
  { key: "h1", label: "H1. Across all five domains, which strand showed your highest consistent rating? What conditions in your practice enabled this?" },
  { key: "h2", label: "H2. Which strand showed your lowest rating? What specific barrier or gap does this reflect?" },
  { key: "h3", label: "H3. Was there any question where you found it difficult to rate yourself honestly? What does that difficulty reveal?" },
  { key: "h4", label: "H4. Based on your ratings across all domains, identify two to three specific professional development goals you want to pursue in the next six months." },
  { key: "h5", label: "H5. What kind of professional development support would be most useful for you right now? (Workshops, coaching, peer collaboration, online courses, practitioner research, other)" },
];

export default function PostReflection({ values, setValues, onNext, onBack }) {
  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  return (
    <div className="page">
      <p className="eyebrow">Step 4 of 4</p>
      <h2 style={{ fontSize: 30, marginTop: 10, marginBottom: 8 }}>Now that you've finished</h2>
      <p style={{ color: "var(--text-mid)", marginBottom: 32 }}>
        Take time to reflect on the complete picture across all five domains. Be specific and forward-looking —
        your answers here will appear in your final report alongside your scores.
      </p>

      {PROMPTS.map((pr) => (
        <div className="field" key={pr.key}>
          <label htmlFor={pr.key}>{pr.label}</label>
          <textarea id={pr.key} value={values[pr.key]} onChange={set(pr.key)} rows={4} />
        </div>
      ))}

      <div className="nav-row">
        <button className="btn btn--ghost" onClick={onBack}>← Back to assessment</button>
        <button className="btn btn--primary" onClick={onNext}>
          Generate my report →
        </button>
      </div>
    </div>
  );
}
