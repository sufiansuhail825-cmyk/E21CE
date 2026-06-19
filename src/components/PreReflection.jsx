import React from "react";

const PROMPTS = [
  { key: "b1", label: "B1. What do you currently consider your greatest strength as an educator? What specific evidence supports this?" },
  { key: "b2", label: "B2. Which aspect of your professional practice do you find most challenging? What do you think is holding you back?" },
  { key: "b3", label: "B3. In which domain or area of teaching are you most motivated to grow this year? Why does this matter to you now?" },
  { key: "b4", label: "B4. How do you currently know whether your teaching is having the impact you intend? What does your evidence look like?" },
];

export default function PreReflection({ values, setValues, onNext, onBack }) {
  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  return (
    <div className="page">
      <p className="eyebrow">Step 2 of 4</p>
      <h2 style={{ fontSize: 30, marginTop: 10, marginBottom: 8 }}>Before you begin</h2>
      <p style={{ color: "var(--text-mid)", marginBottom: 32 }}>
        Take five to ten minutes to reflect honestly. There are no right or wrong answers — write with
        specificity, since precise reflections will serve you better than general ones.
      </p>

      {PROMPTS.map((pr) => (
        <div className="field" key={pr.key}>
          <label htmlFor={pr.key}>{pr.label}</label>
          <textarea id={pr.key} value={values[pr.key]} onChange={set(pr.key)} rows={4} />
        </div>
      ))}

      <div className="nav-row">
        <button className="btn btn--ghost" onClick={onBack}>← Back</button>
        <button className="btn btn--primary" onClick={onNext}>
          Begin the assessment →
        </button>
      </div>
    </div>
  );
}
