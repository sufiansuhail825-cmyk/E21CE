import React, { useRef, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { DESCRIPTOR_LEVELS } from "../utils/scoring.js";
import { generatePdf } from "../utils/pdfExport.js";
import { submitReport } from "../utils/submitReport.js";
import "../styles/report.css";

function levelColor(levelKey) {
  const lvl = DESCRIPTOR_LEVELS.find((l) => l.key === levelKey);
  return lvl ? lvl.color : "#999";
}

function DomainBarChart({ domain }) {
  const data = domain.strandAverages
    .filter((s) => s && s.avg != null)
    .map((s) => ({
      name: s.strandCode,
      fullName: s.strandName,
      score: Math.round(s.avg * 100) / 100,
      level: s.level ? s.level.label : "—",
      color: s.level ? s.level.color : "#999",
    }));

  return (
    <div className="domain-chart-card">
      <div className="domain-chart-card__head">
        <h4 style={{ color: domain.color }}>{domain.shortTitle}</h4>
        {domain.avg != null && (
          <span
            className="domain-chart-card__level"
            style={{ background: domain.level.color }}
          >
            {domain.level.label} · {domain.avg.toFixed(1)}
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2DACA" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#5B5648" }} axisLine={{ stroke: "#E2DACA" }} tickLine={false} />
          <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: "#9A937F" }} axisLine={false} tickLine={false} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;
              const d = payload[0].payload;
              return (
                <div className="chart-tooltip">
                  <strong>{d.fullName}</strong>
                  <div>Score: {d.score} / 5</div>
                  <div>{d.level}</div>
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
}

function OverallDistribution({ levelDistribution }) {
  const data = DESCRIPTOR_LEVELS.map((lvl) => ({
    level: lvl.label,
    value: Math.round(levelDistribution[lvl.key]),
    color: lvl.color,
  }));

  const nonZero = data.filter((d) => d.value > 0);

  return (
    <div className="radar-card">
      <h4>Overall Competency Distribution</h4>
      <p className="radar-card__sub">Share of your five domains landing in each descriptor level</p>

      <div className="stacked-bar" role="img" aria-label="Distribution of domains across descriptor levels">
        {nonZero.map((d) => (
          <div
            key={d.level}
            className="stacked-bar__segment"
            style={{ width: `${d.value}%`, background: d.color }}
            title={`${d.level}: ${d.value}%`}
          >
            {d.value >= 12 && <span>{d.value}%</span>}
          </div>
        ))}
      </div>

      <ul className="radar-card__legend" style={{ marginTop: 18 }}>
        {data.map((d) => (
          <li key={d.level}>
            <span className="radar-card__swatch" style={{ background: d.color }} />
            {d.level}: <strong>{d.value}%</strong>
          </li>
        ))}
      </ul>
      <p className="radar-card__note">
        Each segment shows what percentage of your five domains landed in that descriptor
        level. Since there are five domains, values fall in steps of 20%.
      </p>
    </div>
  );
}

export default function Report({ profile, preReflection, postReflection, results, domains, submitted, setSubmitted }) {
  const reportRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [emailStatus, setEmailStatus] = useState("idle"); // idle | sending | sent | error

  const { domainScores, overallAvg, overallLevel, levelDistribution, openResponses } = results;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await generatePdf(reportRef.current, `${profile.name.replace(/\s+/g, "_")}_Educator_Competency_Report.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  const handleSendEmail = async () => {
    if (emailStatus === "sending" || emailStatus === "sent") return;
    setEmailStatus("sending");
    try {
      await submitReport({ profile, preReflection, postReflection, results });
      setEmailStatus("sent");
      setSubmitted(true);
    } catch (e) {
      console.error(e);
      setEmailStatus("error");
    }
  };

  return (
    <div className="report-page">
      <div className="report-toolbar">
        <div>
          <p className="eyebrow">Your Educator Competency Report</p>
          <h2 style={{ fontSize: 26 }}>{profile.name}</h2>
        </div>
        <div className="report-toolbar__actions">
          <button className="btn btn--ghost" onClick={handleSendEmail} disabled={emailStatus === "sending" || emailStatus === "sent"}>
            {emailStatus === "sent" ? "✓ Sent to CAL" : emailStatus === "sending" ? "Sending…" : emailStatus === "error" ? "Retry send" : "Send to CAL"}
          </button>
          <button className="btn btn--primary" onClick={handleDownload} disabled={downloading}>
            {downloading ? "Preparing PDF…" : "Download PDF report ↓"}
          </button>
        </div>
      </div>

      <div className="report-canvas" ref={reportRef}>
        {/* ── Report header ───────────────────────────────────────── */}
        <div className="report-header">
          <div className="report-header__logo-frame">
            <img src="/cal-logo-full.png" alt="Manav Rachna · Centre for Advanced Learning" className="report-header__logo" />
          </div>
          <div className="report-header__text">
            <h1>Educator Competency Report</h1>
            <p className="report-header__sub">Empowering the 21st Century Educator Framework</p>
          </div>
        </div>

        {/* ── Profile summary ─────────────────────────────────────── */}
        <div className="report-profile-grid">
          <div><span>Name</span><strong>{profile.name}</strong></div>
          <div><span>Organisation</span><strong>{profile.organisation}</strong></div>
          <div><span>Department</span><strong>{profile.department || "—"}</strong></div>
          <div><span>Experience</span><strong>{profile.yearsExperience ? `${profile.yearsExperience} years` : "—"}</strong></div>
          <div><span>Level of Delivery</span><strong>{profile.levelOfDelivery || "—"}</strong></div>
          <div><span>Curriculum</span><strong>{profile.curriculum || "—"}</strong></div>
          <div><span>Date</span><strong>{new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</strong></div>
        </div>

        {/* ── Overall score banner ────────────────────────────────── */}
        <div className="report-overall-banner">
          <div>
            <span className="report-overall-banner__label">Overall Competency Score</span>
            <span className="report-overall-banner__score">{overallAvg != null ? overallAvg.toFixed(2) : "—"} / 5</span>
          </div>
          {overallLevel && (
            <span className="report-overall-banner__badge" style={{ background: overallLevel.color }}>
              {overallLevel.label}
            </span>
          )}
        </div>

        {/* ── Overall distribution ────────────────────────────────── */}
        <OverallDistribution levelDistribution={levelDistribution} />

        {/* ── Domain bar charts ───────────────────────────────────── */}
        <h3 className="report-section-title">Domain-Level Competency</h3>
        <div className="domain-chart-grid">
          {domainScores.map((d) => (
            <DomainBarChart key={d.domainKey} domain={d} />
          ))}
        </div>

        {/* ── Reflective evidence ─────────────────────────────────── */}
        <h3 className="report-section-title">Reflective Evidence</h3>
        <p className="report-section-sub">
          Written responses are not scored. They are included here as qualitative context
          to accompany the quantitative results above.
        </p>

        <div className="reflection-block">
          <h4>Pre-Assessment Reflection</h4>
          <ReflectionItem label="Greatest strength" text={preReflection.b1} />
          <ReflectionItem label="Most significant challenge" text={preReflection.b2} />
          <ReflectionItem label="Growth motivation" text={preReflection.b3} />
          <ReflectionItem label="How impact is currently measured" text={preReflection.b4} />
        </div>

        {openResponses.length > 0 && (
          <div className="reflection-block">
            <h4>Domain & Strand Open Responses</h4>
            {openResponses.map((r) => (
              <div key={r.questionId} className="open-response-item">
                <span className="open-response-item__tag">{r.domainTitle.replace(/^Domain \d+: /, "")} · {r.strandCode}</span>
                <p className="open-response-item__q">{r.statement}</p>
                <p className="open-response-item__a">{r.answer}</p>
              </div>
            ))}
          </div>
        )}

        <div className="reflection-block">
          <h4>Post-Assessment Reflection</h4>
          <ReflectionItem label="Highest-rated strand and enabling conditions" text={postReflection.h1} />
          <ReflectionItem label="Lowest-rated strand and the gap it reflects" text={postReflection.h2} />
          <ReflectionItem label="Where self-rating was difficult, and why" text={postReflection.h3} />
          <ReflectionItem label="Professional development goals (next 6 months)" text={postReflection.h4} />
          <ReflectionItem label="Preferred PD support format" text={postReflection.h5} />
        </div>

        <div className="report-footer">
          <p>Empowering the 21st Century Educator · Centre for Advanced Learning · Manav Rachna University, Faridabad</p>
          <p>This report is generated from self-assessed responses and is intended to guide professional development planning. It is confidential.</p>
        </div>
      </div>
    </div>
  );
}

function ReflectionItem({ label, text }) {
  if (!text || !text.trim()) return null;
  return (
    <div className="reflection-item">
      <span className="reflection-item__label">{label}</span>
      <p className="reflection-item__text">{text}</p>
    </div>
  );
}
