import React, { useState, useMemo } from "react";
import "../styles/assessment.css";

const SCALE = [
  { value: 1, label: "Rarely / Not yet" },
  { value: 2, label: "Sometimes" },
  { value: 3, label: "Often" },
  { value: 4, label: "Consistently" },
  { value: 5, label: "I lead / mentor others" },
];

function LikertQuestion({ question, value, onChange }) {
  return (
    <div className="q-block">
      <div className="q-block__head">
        <span className="q-block__num">Q{question.id}</span>
        {question.scenario && (
          <p className="q-block__scenario">
            <strong>Scenario:</strong> {question.scenario}
          </p>
        )}
      </div>
      <p className="q-block__statement">{question.statement}</p>
      <div className="likert-row">
        {SCALE.map((s) => (
          <button
            key={s.value}
            type="button"
            className={`likert-opt ${value === s.value ? "likert-opt--selected" : ""}`}
            onClick={() => onChange(s.value)}
            aria-pressed={value === s.value}
          >
            <span className="likert-opt__num">{s.value}</span>
            <span className="likert-opt__label">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function OpenQuestion({ question, value, onChange }) {
  return (
    <div className="q-block q-block--open">
      <div className="q-block__head">
        <span className="q-block__num q-block__num--open">Q{question.id}</span>
        <span className="q-block__tag">Open response</span>
      </div>
      <p className="q-block__statement">{question.statement}</p>
      <textarea
        rows={4}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write a specific, concrete example from your practice…"
      />
    </div>
  );
}

export default function Assessment({ domains, responses, updateResponse, stats, onComplete, onBack }) {
  // Flatten into a list of { domainIdx, strandIdx } steps, one step per strand
  const steps = useMemo(() => {
    const list = [];
    domains.forEach((d, di) => d.strands.forEach((s, si) => list.push({ di, si })));
    return list;
  }, [domains]);

  const [stepIdx, setStepIdx] = useState(0);
  const current = steps[stepIdx];
  const domain = domains[current.di];
  const strand = domain.strands[current.si];

  const isLastStep = stepIdx === steps.length - 1;
  const isFirstStep = stepIdx === 0;

  const strandAnswered = strand.questions.every((q) => {
    const v = responses[q.id];
    if (q.type === "L") return typeof v === "number";
    return typeof v === "string" && v.trim().length > 0;
  });

  const goNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setStepIdx((i) => i + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goPrev = () => {
    if (isFirstStep) {
      onBack();
    } else {
      setStepIdx((i) => i - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const domainProgress = domains.map((d, di) => {
    const domainSteps = steps.filter((s) => s.di === di);
    const completedSteps = domainSteps.filter((s) => {
      const str = d.strands[s.si];
      return str.questions.every((q) => {
        const v = responses[q.id];
        if (q.type === "L") return typeof v === "number";
        return typeof v === "string" && v.trim().length > 0;
      });
    });
    return completedSteps.length / domainSteps.length;
  });

  return (
    <div className="assessment-layout">
      <aside className="rail">
        <div className="rail__inner">
          {domains.map((d, di) => (
            <div key={d.key} className={`rail__domain ${di === current.di ? "rail__domain--active" : ""}`}>
              <div className="rail__domain-head">
                <span className="rail__domain-dot" style={{ background: d.color }} />
                <span className="rail__domain-name">{d.shortTitle}</span>
              </div>
              <div className="rail__track">
                <div
                  className="rail__fill"
                  style={{ width: `${domainProgress[di] * 100}%`, background: d.color }}
                />
              </div>
            </div>
          ))}
          <div className="rail__overall">
            <span className="rail__overall-pct">{Math.round(stats.pct)}%</span>
            <span className="rail__overall-label">complete</span>
          </div>
        </div>
      </aside>

      <div className="assessment-main page">
        <div className="assessment-header" style={{ borderLeft: `4px solid ${domain.color}` }}>
          <p className="eyebrow" style={{ color: domain.color }}>{domain.title}</p>
          <h3 className="assessment-strand-name">{strand.code} · {strand.name}</h3>
          <p className="assessment-bronfenbrenner">Bronfenbrenner System: {domain.bronfenbrenner}</p>
        </div>

        {strand.questions.map((q) =>
          q.type === "L" ? (
            <LikertQuestion
              key={q.id}
              question={q}
              value={responses[q.id]}
              onChange={(val) => updateResponse(q.id, val)}
            />
          ) : (
            <OpenQuestion
              key={q.id}
              question={q}
              value={responses[q.id]}
              onChange={(val) => updateResponse(q.id, val)}
            />
          )
        )}

        <div className="nav-row">
          <button className="btn btn--ghost" onClick={goPrev}>
            ← {isFirstStep ? "Back to reflection" : "Previous strand"}
          </button>
          <button className="btn btn--primary" onClick={goNext} disabled={!strandAnswered}>
            {isLastStep ? "Finish assessment →" : "Next strand →"}
          </button>
        </div>
        {!strandAnswered && (
          <p className="field__hint" style={{ textAlign: "right", marginTop: 10 }}>
            Answer all questions in this strand to continue.
          </p>
        )}
      </div>
    </div>
  );
}
