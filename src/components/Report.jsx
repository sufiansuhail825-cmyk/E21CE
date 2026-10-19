import React, { useRef, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { DESCRIPTOR_LEVELS } from "../utils/scoring.js";
import { generatePdf } from "../utils/pdfExport.js";
import { submitReport } from "../utils/submitReport.js";
import "../styles/report.css";

function levelColor(key) {
  const lvl = DESCRIPTOR_LEVELS.find((l) => l.key === key);
  return lvl ? lvl.color : "#999";
}

// ─── Self-assessment bar chart (all 26 strands, one domain at a time) ───────
function PreAssessmentChart({ domainScores }) {
  return (
    <div className="domain-chart-grid">
      {domainScores.map((domain) => {
        if (!domain.strandScores) return null;
        const data = domain.strandScores
          .filter((s) => s.score != null)
          .map((s) => ({
            name: s.strandCode,
            fullName: s.strandName,
            score: s.score,
            color: s.level ? s.level.color : "#ccc",
            level: s.level ? s.level.label : "N/A",
          }));
        if (!data.length) return null;
        return (
          <div key={domain.domainKey} className="domain-chart-card">
            <div className="domain-chart-card__head">
              <h4 style={{ color: domain.color }}>{domain.shortTitle}</h4>
              {domain.avg != null && domain.level && (
                <span className="domain-chart-card__level" style={{ background: domain.level.color }}>
                  {domain.level.label} · {domain.avg.toFixed(1)}
                </span>
              )}
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2DACA" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#5B5648" }} axisLine={{ stroke: "#E2DACA" }} tickLine={false} />
                <YAxis domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} tick={{ fontSize: 11, fill: "#9A937F" }} axisLine={false} tickLine={false} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="chart-tooltip">
                        <strong>{d.fullName}</strong>
                        <div>Level: {d.level}</div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={46}>
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <ul className="domain-chart-card__legend">
              {data.map((d) => (
                <li key={d.name}><strong>{d.name}</strong> — {d.fullName}</li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

// ─── Scenario assessment bar chart (S1-S6 only) ─────────────────────────────
function ScenarioChart({ strandScores }) {
  const data = strandScores
    .filter((s) => s.avg != null)
    .map((s) => ({
      name: s.strandCode,
      fullName: s.strandName,
      score: Math.round(s.avg * 100) / 100,
      color: s.level ? s.level.color : "#ccc",
      level: s.level ? s.level.label : "—",
    }));

  return (
    <div className="domain-chart-card" style={{ maxWidth: 700 }}>
      <div className="domain-chart-card__head">
        <h4>Domain 1: Pedagogical Innovation (S1-S6)</h4>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2DACA" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#5B5648" }} axisLine={{ stroke: "#E2DACA" }} tickLine={false} />
          <YAxis domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} tick={{ fontSize: 11, fill: "#9A937F" }} axisLine={false} tickLine={false} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;
              const d = payload[0].payload;
              return (
                <div className="chart-tooltip">
                  <strong>{d.fullName}</strong>
                  <div>Score: {d.score.toFixed(2)}</div>
                  <div>{d.level}</div>
                </div>
              );
            }}
          />
          <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={60}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <ul className="domain-chart-card__legend">
        {data.map((d) => (
          <li key={d.name}><strong>{d.name}</strong> — {d.fullName}</li>
        ))}
      </ul>
    </div>
  );
}

// ─── Comparison table (S1.1-S1.6 where both scores exist) ────────────────────
function ComparisonTable({ comparison }) {
  if (!comparison || comparison.length === 0) return null;

  const directionIcon = (dir) => {
    if (dir === "above-self") return { icon: "▲", color: "#2E6F4E", label: "Higher than self-assessment" };
    if (dir === "below-self") return { icon: "▼", color: "#B85C4A", label: "Lower than self-assessment" };
    return { icon: "≈", color: "#5B5648", label: "Aligned with self-assessment" };
  };

  return (
    <div className="comparison-table-wrap">
      <table className="comparison-table">
        <thead>
          <tr>
            <th>Strand</th>
            <th>Self-Assessed</th>
            <th>Scenario Result</th>
            <th>Alignment</th>
          </tr>
        </thead>
        <tbody>
          {comparison.map((c) => {
            const { icon, color, label } = directionIcon(c.direction);
            return (
              <tr key={c.strandCode}>
                <td>
                  <strong>{c.strandCode}</strong>
                  <br />
                  <span className="comparison-strand-name">{c.strandName}</span>
                </td>
                <td>
                  {c.selfLevel ? (
                    <span
                      className="comparison-badge"
                      style={{ background: c.selfLevel.color }}
                    >
                      {c.selfLevel.label}
                    </span>
                  ) : "—"}
                  {c.selfScore && (
                    <span className="comparison-score"> ({c.selfScore})</span>
                  )}
                </td>
                <td>
                  {c.assessedLevel ? (
                    <span
                      className="comparison-badge"
                      style={{ background: c.assessedLevel.color }}
                    >
                      {c.assessedLevel.label}
                    </span>
                  ) : "—"}
                  {c.assessedScore != null && (
                    <span className="comparison-score"> ({c.assessedScore.toFixed(2)})</span>
                  )}
                </td>
                <td>
                  <span style={{ color, fontWeight: 600 }}>
                    {icon}
                  </span>
                  <span className="comparison-dir-label">{label}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="comparison-note">
        Alignment is calculated based on the difference between self-assessed and
        scenario-assessed scores. A difference of ±0.25 or less is considered aligned.
      </p>
    </div>
  );
}

// ─── Level distribution stacked bar ─────────────────────────────────────────
function LevelDistribution({ levelDistribution, label }) {
  const data = DESCRIPTOR_LEVELS.map((lvl) => ({
    level: lvl.label,
    value: Math.round(levelDistribution[lvl.key]),
    color: lvl.color,
  })).filter((d) => d.value > 0);

  return (
    <div className="radar-card">
      <h4>{label || "Competency Distribution"}</h4>
      <div className="stacked-bar">
        {data.map((d) => (
          <div
            key={d.level}
            className="stacked-bar__segment"
            style={{ width: `${d.value}%`, background: d.color }}
            title={`${d.level}: ${d.value}%`}
          >
            {d.value >= 14 && <span>{d.value}%</span>}
          </div>
        ))}
      </div>
      <ul className="radar-card__legend" style={{ marginTop: 12 }}>
        {DESCRIPTOR_LEVELS.map((lvl) => (
          <li key={lvl.key}>
            <span className="radar-card__swatch" style={{ background: lvl.color }} />
            {lvl.label}: <strong>{Math.round(levelDistribution[lvl.key])}%</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Main Report component ───────────────────────────────────────────────────
export default function Report({
  profile,
  preResults,
  scenarioResults,
  comparison,
  submitted,
  setSubmitted,
}) {
  const reportRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [emailStatus, setEmailStatus] = useState("idle");

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await generatePdf(
        reportRef.current,
        `${(profile.name || "Educator").replace(/\s+/g, "_")}_E21CE_Report.pdf`
      );
    } finally {
      setDownloading(false);
    }
  };

  const handleSendEmail = async () => {
    if (emailStatus === "sending" || emailStatus === "sent") return;
    setEmailStatus("sending");
    try {
      await submitReport({ profile, preResults, scenarioResults, comparison });
      setEmailStatus("sent");
      setSubmitted(true);
    } catch (e) {
      console.error(e);
      setEmailStatus("error");
    }
  };

  const teachingLevels = Array.isArray(profile.teachingLevels)
    ? profile.teachingLevels.join(", ")
    : profile.teachingLevels || "—";

  return (
    <div className="report-page">
      {/* ── Toolbar (outside printable area) ─────────────────────── */}
      <div className="report-toolbar">
        <div>
          <p className="eyebrow">Educator Competency Report</p>
          <h2>{profile.name}</h2>
        </div>
        <div className="report-toolbar__actions">
          <button
            className="btn btn--ghost"
            onClick={handleSendEmail}
            disabled={emailStatus === "sending" || emailStatus === "sent"}
          >
            {emailStatus === "sent"
              ? "✓ Sent to CAL"
              : emailStatus === "sending"
              ? "Sending…"
              : emailStatus === "error"
              ? "Retry send"
              : "Send to CAL"}
          </button>
          <button
            className="btn btn--primary"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? "Preparing PDF…" : "Download PDF report ↓"}
          </button>
        </div>
      </div>

      {/* ── Printable canvas ─────────────────────────────────────── */}
      <div className="report-canvas" ref={reportRef}>

        {/* Report header */}
        <div className="report-header">
          <div className="report-header__logo-frame">
            <img
              src="/cal-logo-full.png"
              alt="Manav Rachna · Centre for Advanced Learning"
              className="report-header__logo"
            />
          </div>
          <div className="report-header__text">
            <h1>Educator Competency Report</h1>
            <p className="report-header__sub">
              Empowering the 21st Century Educator (E21CE) Framework
            </p>
          </div>
        </div>

        {/* Profile summary */}
        <div className="report-profile-grid">
          <div><span>Name</span><strong>{profile.name}</strong></div>
          <div><span>Organisation</span><strong>{profile.organisation}</strong></div>
          <div><span>Role</span><strong>{profile.role || "—"}</strong></div>
          <div><span>Teaching Levels</span><strong>{teachingLevels}</strong></div>
          <div><span>Experience</span><strong>{profile.yearsExperience || "—"}</strong></div>
          <div>
            <span>Date</span>
            <strong>
              {new Date().toLocaleDateString("en-IN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </strong>
          </div>
        </div>

        {/* ── Section 1: Self-Assessment Baseline ────────────────── */}
        <div className="report-section-divider">
          <h2 className="report-section-heading">
            Part 1: Self-Assessment Baseline
          </h2>
          <p className="report-section-desc">
            Your self-rated competency across all 26 strands of the E21CE Framework,
            grouped by domain. These scores represent how you perceive your current
            practice before the scenario-based assessment.
          </p>
        </div>

        {/* Overall pre-assessment score */}
        <div className="report-overall-banner">
          <div>
            <span className="report-overall-banner__label">
              Self-Assessed Overall Average
            </span>
            <span className="report-overall-banner__score">
              {preResults.overallAvg != null
                ? preResults.overallAvg.toFixed(2)
                : "—"}{" "}
              / 4
            </span>
          </div>
          {preResults.overallLevel && (
            <span
              className="report-overall-banner__badge"
              style={{ background: preResults.overallLevel.color }}
            >
              {preResults.overallLevel.label}
            </span>
          )}
        </div>

        <LevelDistribution
          levelDistribution={preResults.levelDistribution}
          label="Self-Assessment — Distribution Across All 26 Strands"
        />

        <h3 className="report-section-title">
          Domain-Level Self-Assessment Results
        </h3>
        <PreAssessmentChart domainScores={preResults.domainScores} />

        {/* ── Section 2: Scenario Assessment ─────────────────────── */}
        <div className="report-section-divider">
          <h2 className="report-section-heading">
            Part 2: Scenario-Based Assessment
          </h2>
          <p className="report-section-desc">
            Your responses to 48 real-world teaching scenarios across the 6 strands
            of Domain 1 (Pedagogical Innovation). Each scenario had four response
            options mapped to the four descriptor levels. This gives an objective
            picture of your practice in action.
          </p>
          <p className="report-section-desc">
            Note: The scenario assessment covers Domain 1 strands only (S1.1-S1.6).
            Domains 2-5 are covered by the self-assessment above.
          </p>
        </div>

        {/* Overall scenario score */}
        <div className="report-overall-banner">
          <div>
            <span className="report-overall-banner__label">
              Scenario-Assessed Overall Average (Domain 1)
            </span>
            <span className="report-overall-banner__score">
              {scenarioResults.overallAvg != null
                ? scenarioResults.overallAvg.toFixed(2)
                : "—"}{" "}
              / 4
            </span>
          </div>
          {scenarioResults.overallLevel && (
            <span
              className="report-overall-banner__badge"
              style={{ background: scenarioResults.overallLevel.color }}
            >
              {scenarioResults.overallLevel.label}
            </span>
          )}
        </div>

        <ScenarioChart strandScores={scenarioResults.strandScores} />

        {/* ── Section 3: Comparison ───────────────────────────────── */}
        <div className="report-section-divider">
          <h2 className="report-section-heading">
            Part 3: Self vs. Scenario Comparison
          </h2>
          <p className="report-section-desc">
            For the 6 Domain 1 strands covered by both phases, this table shows
            where your self-assessed rating aligns with — or diverges from — your
            scenario-based result. Divergences are not a judgment; they reveal where
            reflection and targeted development can have the most impact.
          </p>
        </div>

        <ComparisonTable comparison={comparison} />

        {/* ── Descriptor key ──────────────────────────────────────── */}
        <div className="report-descriptor-key">
          <h3 className="report-section-title">Descriptor Levels Reference</h3>
          <div className="descriptor-key-grid">
            {DESCRIPTOR_LEVELS.map((lvl) => (
              <div key={lvl.key} className="descriptor-key-card" style={{ borderTopColor: lvl.color }}>
                <span className="descriptor-key-label" style={{ color: lvl.color }}>
                  {lvl.label}
                </span>
                <span className="descriptor-key-range">Level {lvl.min === lvl.max ? lvl.min : `${lvl.min}–${lvl.max}`}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Report footer ───────────────────────────────────────── */}
        <div className="report-footer">
          <p>
            Empowering the 21st Century Educator · Centre for Advanced Learning ·
            Manav Rachna University, Faridabad
          </p>
          <p>
            This report is generated from self-assessed and scenario-based responses
            and is intended to guide professional development planning. It is
            confidential.
          </p>
        </div>
      </div>
    </div>
  );
}
