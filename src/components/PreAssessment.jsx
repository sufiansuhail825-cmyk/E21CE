import React, { useState } from "react";
import { preAssessmentProgress } from "../utils/scoring.js";

const LEVELS = [
  { value: 1, key: "emerging",        label: "Emerging" },
  { value: 2, key: "developing",      label: "Developing" },
  { value: 3, key: "proficient",      label: "Proficient" },
  { value: 4, key: "transformational",label: "Transformational" },
  { value: "na",                      label: "Not Applicable" },
];

const LEVEL_COLORS = {
  emerging:         "#B85C4A",
  developing:       "#C08A3E",
  proficient:       "#5B8C6E",
  transformational: "#2E6F4E",
};

export default function PreAssessment({ preAssessmentData, responses, updateResponse, onComplete, onBack }) {
  const [activeDomainIdx, setActiveDomainIdx] = useState(0);
  const [expandedStrand, setExpandedStrand] = useState(null);

  const { total, answered, pct } = preAssessmentProgress(preAssessmentData, responses);
  const allAnswered = answered === total;

  const currentDomain = preAssessmentData[activeDomainIdx];

  const domainComplete = (domain) =>
    domain.strands.every((s) => {
      const v = responses[s.id];
      return (v && v >= 1 && v <= 4) || v === "na" || v === 0;
    });

  const handleSelect = (strandId, value) => {
    updateResponse(strandId, value);
  };

  return (
    <div className="stage-container">
      <div className="stage-header">
        <div className="stage-label">Phase 1 of 2</div>
        <h1 className="stage-title">Self-Assessment</h1>
        <p className="stage-intro">
          For each strand, read the four descriptor levels and select the one that
          best reflects your current practice. Choose <strong>Not Applicable</strong> if
          the strand does not apply to your role.
        </p>
        <div className="progress-bar-wrap">
          <div className="progress-bar" style={{ width: `${pct}%` }} />
        </div>
        <p className="progress-label">{answered} of {total} strands rated</p>
      </div>

      {/* Domain tabs */}
      <div className="domain-tabs">
        {preAssessmentData.map((domain, idx) => (
          <button
            key={domain.key}
            className={`domain-tab ${idx === activeDomainIdx ? "active" : ""} ${domainComplete(domain) ? "complete" : ""}`}
            style={idx === activeDomainIdx ? { borderBottomColor: domain.color } : {}}
            onClick={() => { setActiveDomainIdx(idx); setExpandedStrand(null); }}
          >
            <span className="domain-tab-short">{domain.shortTitle}</span>
            {domainComplete(domain) && <span className="tab-check">&#10003;</span>}
          </button>
        ))}
      </div>

      {/* Domain header */}
      <div className="domain-section" style={{ borderTopColor: currentDomain.color }}>
        <div className="domain-meta">
          <span
            className="bronfenbrenner-badge"
            style={{ background: currentDomain.color }}
          >
            {currentDomain.bronfenbrenner}
          </span>
          <h2 className="domain-title">{currentDomain.title}</h2>
        </div>

        {/* Strands */}
        {currentDomain.strands.map((strand) => {
          const selected = responses[strand.id];
          const isExpanded = expandedStrand === strand.id;

          return (
            <div
              key={strand.id}
              className={`strand-card ${selected ? "strand-answered" : ""}`}
            >
              <div
                className="strand-header"
                onClick={() => setExpandedStrand(isExpanded ? null : strand.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setExpandedStrand(isExpanded ? null : strand.id)}
              >
                <div className="strand-title-row">
                  <span className="strand-code">{strand.code}</span>
                  <span className="strand-name">{strand.name}</span>
                </div>
                <div className="strand-header-right">
                  {selected && (
                    <span
                      className="strand-selected-badge"
                      style={{
                        background:
                          selected === "na"
                            ? "#888"
                            : LEVEL_COLORS[LEVELS.find((l) => l.value === selected)?.key],
                      }}
                    >
                      {selected === "na" ? "N/A" : LEVELS.find((l) => l.value === selected)?.label}
                    </span>
                  )}
                  <span className="expand-icon">{isExpanded ? "▲" : "▼"}</span>
                </div>
              </div>

              {isExpanded && (
                <div className="strand-body">
                  {/* Descriptor cards */}
                  <div className="descriptor-grid">
                    {LEVELS.filter((l) => l.key).map((level) => {
                      const descriptorText = strand.descriptors[level.key];
                      const isSelected = selected === level.value;
                      return (
                        <button
                          key={level.key}
                          className={`descriptor-card ${isSelected ? "selected" : ""}`}
                          style={{
                            borderColor: isSelected ? LEVEL_COLORS[level.key] : undefined,
                            background: isSelected ? `${LEVEL_COLORS[level.key]}18` : undefined,
                          }}
                          onClick={() => handleSelect(strand.id, level.value)}
                        >
                          <div
                            className="descriptor-label"
                            style={{ color: LEVEL_COLORS[level.key] }}
                          >
                            {level.label}
                          </div>
                          <p className="descriptor-text">{descriptorText}</p>
                          {isSelected && (
                            <div
                              className="descriptor-check"
                              style={{ color: LEVEL_COLORS[level.key] }}
                            >
                              &#10003; Selected
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* N/A option */}
                  <div className="na-row">
                    <button
                      className={`na-btn ${selected === "na" ? "selected" : ""}`}
                      onClick={() => handleSelect(strand.id, "na")}
                    >
                      {selected === "na" ? "✓ " : ""}Not Applicable to My Role
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="stage-nav">
        <button
          className="btn btn-ghost"
          onClick={() => {
            if (activeDomainIdx > 0) {
              setActiveDomainIdx(activeDomainIdx - 1);
              setExpandedStrand(null);
            } else {
              onBack();
            }
          }}
        >
          Back
        </button>

        {activeDomainIdx < preAssessmentData.length - 1 ? (
          <button
            className="btn btn-primary"
            onClick={() => { setActiveDomainIdx(activeDomainIdx + 1); setExpandedStrand(null); }}
          >
            Next Domain
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={onComplete}
            disabled={!allAnswered}
            title={!allAnswered ? "Please rate all strands before continuing" : ""}
          >
            Continue to Scenario Assessment
          </button>
        )}
      </div>
    </div>
  );
}
