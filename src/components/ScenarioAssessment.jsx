import React, { useState, useEffect, useRef } from "react";
import { scenarioProgress } from "../utils/scoring.js";

const CLOCK_ICON = () => (
  <svg className="clock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export default function ScenarioAssessment({
  scenarioData,
  responses,
  updateResponse,
  onComplete,
  onBack,
}) {
  const [activeStrandIdx, setActiveStrandIdx] = useState(0);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const questionRef = useRef(null);

  const { total, answered, pct } = scenarioProgress(scenarioData, responses);
  const allAnswered = answered === total;

  const currentStrand = scenarioData[activeStrandIdx];
  const currentQuestion = currentStrand.questions[activeQuestionIdx];

  // Count answered within current strand
  const strandAnswered = currentStrand.questions.filter(
    (q) => responses[q.id] != null && responses[q.id] >= 0
  ).length;
  const strandTotal = currentStrand.questions.length;

  // Navigate to next unanswered or next strand
  const goToNext = () => {
    if (activeQuestionIdx < strandTotal - 1) {
      setActiveQuestionIdx(activeQuestionIdx + 1);
    } else if (activeStrandIdx < scenarioData.length - 1) {
      setActiveStrandIdx(activeStrandIdx + 1);
      setActiveQuestionIdx(0);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToPrev = () => {
    if (activeQuestionIdx > 0) {
      setActiveQuestionIdx(activeQuestionIdx - 1);
    } else if (activeStrandIdx > 0) {
      setActiveStrandIdx(activeStrandIdx - 1);
      setActiveQuestionIdx(scenarioData[activeStrandIdx - 1].questions.length - 1);
    } else {
      onBack();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelect = (optionIdx) => {
    updateResponse(currentQuestion.id, optionIdx);
  };

  const isLastQuestion =
    activeStrandIdx === scenarioData.length - 1 &&
    activeQuestionIdx === strandTotal - 1;

  const selectedOption = responses[currentQuestion.id];

  // Auto-advance when last question of a strand is answered (but not the very last question)
  useEffect(() => {
    if (
      selectedOption != null &&
      !isLastQuestion &&
      activeQuestionIdx === strandTotal - 1 &&
      activeStrandIdx < scenarioData.length - 1
    ) {
      // Small delay to let the user see their selection
      const t = setTimeout(() => {
        setActiveStrandIdx(activeStrandIdx + 1);
        setActiveQuestionIdx(0);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 600);
      return () => clearTimeout(t);
    }
  }, [selectedOption]);

  const overallQuestionNumber =
    scenarioData
      .slice(0, activeStrandIdx)
      .reduce((sum, s) => sum + s.questions.length, 0) +
    activeQuestionIdx +
    1;

  return (
    <div className="stage-container">
      {/* Header */}
      <div className="stage-header">
        <div className="stage-label">Phase 2 of 2</div>
        <h1 className="stage-title">Scenario Assessment</h1>
        <p className="stage-intro">
          Read each scenario carefully and choose the response that best reflects
          what you would actually do. Questions marked with a{" "}
          <CLOCK_ICON /> clock icon are live-decision prompts — respond
          instinctively, as if you were in that moment.
        </p>

        <div className="progress-bar-wrap">
          <div className="progress-bar" style={{ width: `${pct}%` }} />
        </div>
        <p className="progress-label">
          Question {overallQuestionNumber} of {total}
        </p>
      </div>

      {/* Strand tabs */}
      <div className="domain-tabs">
        {scenarioData.map((strand, idx) => {
          const done = strand.questions.every(
            (q) => responses[q.id] != null && responses[q.id] >= 0
          );
          return (
            <button
              key={strand.strandCode}
              className={`domain-tab ${idx === activeStrandIdx ? "active" : ""} ${done ? "complete" : ""}`}
              onClick={() => { setActiveStrandIdx(idx); setActiveQuestionIdx(0); }}
            >
              <span className="domain-tab-short">{strand.strandCode}</span>
              {done && <span className="tab-check">&#10003;</span>}
            </button>
          );
        })}
      </div>

      {/* Current strand info */}
      <div className="scenario-strand-info">
        <span className="strand-code">{currentStrand.strandCode}</span>
        <span className="strand-name">{currentStrand.strandName}</span>
        <span className="strand-progress-small">
          {strandAnswered}/{strandTotal}
        </span>
      </div>

      {currentStrand.intro && activeQuestionIdx === 0 && strandAnswered === 0 && (
        <div className="scenario-strand-intro">
          {currentStrand.intro}
        </div>
      )}

      {/* Question card */}
      <div className="question-card" ref={questionRef}>
        <div className="question-number-row">
          <span className="question-number">
            Question {activeQuestionIdx + 1} of {strandTotal}
          </span>
          {currentQuestion.isLiveDecision && (
            <span className="live-decision-badge">
              <CLOCK_ICON />
              Live Decision
              {currentQuestion.liveDecisionSeconds && (
                <span> — {currentQuestion.liveDecisionSeconds}s</span>
              )}
            </span>
          )}
        </div>

        <p className="question-scenario">{currentQuestion.scenario}</p>

        <div className="options-list">
          {currentQuestion.options.map((optText, idx) => {
            const isSelected = selectedOption === idx;
            return (
              <button
                key={idx}
                className={`option-btn ${isSelected ? "selected" : ""}`}
                onClick={() => handleSelect(idx)}
              >
                <span className="option-letter">
                  {["A", "B", "C", "D"][idx]}
                </span>
                <span className="option-text">{optText}</span>
                {isSelected && <span className="option-check">&#10003;</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="stage-nav">
        <button className="btn btn-ghost" onClick={goToPrev}>
          Back
        </button>

        {isLastQuestion ? (
          <button
            className="btn btn-primary"
            onClick={onComplete}
            disabled={!allAnswered}
            title={!allAnswered ? "Please answer all questions before continuing" : ""}
          >
            View My Report
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={goToNext}
            disabled={selectedOption == null}
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
