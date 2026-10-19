// Netlify Function: send-report
// Receives the dual-phase assessment submission, formats it into a readable
// HTML email, and sends it via Resend to the configured CAL inbox.
//
// Required environment variables (set in Netlify dashboard, never in code):
//   RESEND_API_KEY    — API key from https://resend.com
//   REPORT_TO_EMAIL   — the inbox that receives every submission (e.g. cal@mru.edu.in)
//   REPORT_FROM_EMAIL — a verified sending address/domain in Resend
//
// Payload shape (from submitReport.js):
// {
//   profile:               { name, organisation, role, yearsExperience, teachingLevels }
//   preAssessmentSummary:  { overallAvg, overallLevel, domainScores[{...strands}], levelDistribution }
//   scenarioSummary:       { overallAvg, overallLevel, strandScores }
//   comparison:            [{ code, name, selfScore, selfLevel, assessedScore, assessedLevel, delta, direction }]
//   submittedAt:           ISO timestamp
// }

function fmt(n) {
  return typeof n === "number" ? n.toFixed(2) : "—";
}

function esc(str) {
  return String(str || "—")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildHtml(payload) {
  const { profile, preAssessmentSummary, scenarioSummary, comparison, submittedAt } = payload;

  // ── Profile block ──────────────────────────────────────────────────────────
  const teachingLevels = Array.isArray(profile.teachingLevels)
    ? profile.teachingLevels.join(", ")
    : profile.teachingLevels || "—";

  // ── Pre-assessment domain rows ─────────────────────────────────────────────
  const preDomainRows = (preAssessmentSummary.domainScores || [])
    .map((d) => {
      const strandRows = (d.strands || [])
        .map(
          (s) => `
        <tr>
          <td style="padding:5px 10px;font-size:12px;color:#555;padding-left:28px;">
            ${esc(s.code)} — ${esc(s.name)}
          </td>
          <td style="padding:5px 10px;font-size:12px;text-align:center;">${s.score != null ? s.score : "N/A"}</td>
          <td style="padding:5px 10px;font-size:12px;text-align:center;">${esc(s.level)}</td>
        </tr>`
        )
        .join("");

      return `
      <tr style="background:#f3ede0;">
        <td style="padding:7px 10px;font-size:13px;font-weight:700;color:#16213E;">${esc(d.title)}</td>
        <td style="padding:7px 10px;font-size:13px;text-align:center;">${fmt(d.avg)}</td>
        <td style="padding:7px 10px;font-size:13px;text-align:center;">${esc(d.level)}</td>
      </tr>
      ${strandRows}`;
    })
    .join("");

  // ── Scenario strand rows ───────────────────────────────────────────────────
  const scenarioStrandRows = (scenarioSummary.strandScores || [])
    .map(
      (s) => `
    <tr>
      <td style="padding:6px 10px;font-size:13px;">${esc(s.code)} — ${esc(s.name)}</td>
      <td style="padding:6px 10px;font-size:13px;text-align:center;">${fmt(s.avg)}</td>
      <td style="padding:6px 10px;font-size:13px;text-align:center;">${esc(s.level)}</td>
      <td style="padding:6px 10px;font-size:12px;color:#888;text-align:center;">${s.n != null ? `${s.n} qs` : "—"}</td>
    </tr>`
    )
    .join("");

  // ── Comparison rows ────────────────────────────────────────────────────────
  const dirIcon = (dir) => {
    if (dir === "above-self") return "▲ Higher";
    if (dir === "below-self") return "▼ Lower";
    return "≈ Aligned";
  };
  const comparisonRows = (comparison || [])
    .map(
      (c) => `
    <tr>
      <td style="padding:6px 10px;font-size:12px;">${esc(c.code)}<br/><span style="color:#888;">${esc(c.name)}</span></td>
      <td style="padding:6px 10px;font-size:12px;text-align:center;">${c.selfScore != null ? c.selfScore : "—"} (${esc(c.selfLevel)})</td>
      <td style="padding:6px 10px;font-size:12px;text-align:center;">${c.assessedScore != null ? fmt(c.assessedScore) : "—"} (${esc(c.assessedLevel)})</td>
      <td style="padding:6px 10px;font-size:12px;text-align:center;">${dirIcon(c.direction)}</td>
    </tr>`
    )
    .join("");

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:700px;margin:0 auto;color:#222;">
    <div style="background:#16213E;color:#fff;padding:24px 28px;border-radius:8px 8px 0 0;">
      <p style="margin:0;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:#C08A3E;">
        Centre for Advanced Learning · Manav Rachna University
      </p>
      <h1 style="margin:8px 0 4px;font-family:Georgia,serif;font-size:22px;">
        New E21CE Submission
      </h1>
      <p style="margin:0;font-size:14px;color:#ccc;">Empowering the 21st Century Educator Framework</p>
    </div>

    <div style="padding:24px 28px;border:1px solid #e2dcca;border-top:none;">

      <!-- Profile -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr><td style="padding:4px 0;font-size:12px;color:#888;width:150px;">Name</td>
            <td style="padding:4px 0;font-size:14px;font-weight:700;">${esc(profile.name)}</td></tr>
        <tr><td style="padding:4px 0;font-size:12px;color:#888;">Organisation</td>
            <td style="padding:4px 0;font-size:13px;">${esc(profile.organisation)}</td></tr>
        <tr><td style="padding:4px 0;font-size:12px;color:#888;">Role</td>
            <td style="padding:4px 0;font-size:13px;">${esc(profile.role)}</td></tr>
        <tr><td style="padding:4px 0;font-size:12px;color:#888;">Teaching Levels</td>
            <td style="padding:4px 0;font-size:13px;">${esc(teachingLevels)}</td></tr>
        <tr><td style="padding:4px 0;font-size:12px;color:#888;">Experience</td>
            <td style="padding:4px 0;font-size:13px;">${esc(profile.yearsExperience)}</td></tr>
        <tr><td style="padding:4px 0;font-size:12px;color:#888;">Submitted</td>
            <td style="padding:4px 0;font-size:13px;">${new Date(submittedAt).toLocaleString("en-IN")}</td></tr>
      </table>

      <!-- Overall scores banner -->
      <table style="width:100%;background:#f3ede0;border-radius:8px;border-collapse:collapse;margin-bottom:28px;">
        <tr>
          <td style="padding:14px 18px;">
            <div style="font-size:12px;color:#888;margin-bottom:2px;">Self-Assessed Overall (26 strands)</div>
            <div style="font-family:Georgia,serif;font-size:20px;color:#16213E;font-weight:700;">
              ${fmt(preAssessmentSummary.overallAvg)} / 4 — ${esc(preAssessmentSummary.overallLevel)}
            </div>
          </td>
          <td style="padding:14px 18px;border-left:1px solid #e2dcca;">
            <div style="font-size:12px;color:#888;margin-bottom:2px;">Scenario-Assessed Overall (Domain 1)</div>
            <div style="font-family:Georgia,serif;font-size:20px;color:#16213E;font-weight:700;">
              ${fmt(scenarioSummary.overallAvg)} / 4 — ${esc(scenarioSummary.overallLevel)}
            </div>
          </td>
        </tr>
      </table>

      <!-- Part 1: Self-Assessment -->
      <h2 style="font-family:Georgia,serif;color:#16213E;border-bottom:2px solid #C08A3E;padding-bottom:6px;font-size:18px;">
        Part 1: Self-Assessment (All 26 Strands)
      </h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:28px;border:1px solid #e2dcca;">
        <thead>
          <tr style="background:#16213E;color:#fff;">
            <th style="padding:7px 10px;font-size:12px;text-align:left;">Domain / Strand</th>
            <th style="padding:7px 10px;font-size:12px;text-align:center;">Score</th>
            <th style="padding:7px 10px;font-size:12px;text-align:center;">Level</th>
          </tr>
        </thead>
        <tbody>${preDomainRows}</tbody>
      </table>

      <!-- Part 2: Scenario Assessment -->
      <h2 style="font-family:Georgia,serif;color:#16213E;border-bottom:2px solid #C08A3E;padding-bottom:6px;font-size:18px;">
        Part 2: Scenario-Based Assessment (Domain 1, S1.1-S1.6)
      </h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:28px;border:1px solid #e2dcca;">
        <thead>
          <tr style="background:#16213E;color:#fff;">
            <th style="padding:7px 10px;font-size:12px;text-align:left;">Strand</th>
            <th style="padding:7px 10px;font-size:12px;text-align:center;">Score</th>
            <th style="padding:7px 10px;font-size:12px;text-align:center;">Level</th>
            <th style="padding:7px 10px;font-size:12px;text-align:center;">Questions</th>
          </tr>
        </thead>
        <tbody>${scenarioStrandRows}</tbody>
      </table>

      <!-- Part 3: Comparison -->
      <h2 style="font-family:Georgia,serif;color:#16213E;border-bottom:2px solid #C08A3E;padding-bottom:6px;font-size:18px;">
        Part 3: Self vs. Scenario Comparison
      </h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:28px;border:1px solid #e2dcca;">
        <thead>
          <tr style="background:#16213E;color:#fff;">
            <th style="padding:7px 10px;font-size:12px;text-align:left;">Strand</th>
            <th style="padding:7px 10px;font-size:12px;text-align:center;">Self</th>
            <th style="padding:7px 10px;font-size:12px;text-align:center;">Scenario</th>
            <th style="padding:7px 10px;font-size:12px;text-align:center;">Alignment</th>
          </tr>
        </thead>
        <tbody>${comparisonRows}</tbody>
      </table>

      <p style="margin-top:32px;font-size:11px;color:#999;border-top:1px solid #e2dcca;padding-top:12px;">
        Generated automatically by the E21CE self-assessment platform. The respondent
        also received a downloadable PDF report. Scores are on a 1-4 scale
        (Emerging/Developing/Proficient/Transformational).
      </p>
    </div>
  </div>`;
}

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const RESEND_API_KEY   = process.env.RESEND_API_KEY;
  const REPORT_TO_EMAIL  = process.env.REPORT_TO_EMAIL;
  const REPORT_FROM_EMAIL = process.env.REPORT_FROM_EMAIL || "onboarding@resend.dev";

  if (!RESEND_API_KEY || !REPORT_TO_EMAIL) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server not configured with RESEND_API_KEY or REPORT_TO_EMAIL." }),
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body." }) };
  }

  if (!payload?.profile?.name) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing profile.name in payload." }) };
  }

  const html = buildHtml(payload);
  const subject = `E21CE Submission — ${payload.profile.name} (${payload.profile.organisation || "unknown org"})`;

  try {
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: REPORT_FROM_EMAIL,
        to: [REPORT_TO_EMAIL],
        subject,
        html,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      return { statusCode: 502, body: JSON.stringify({ error: "Resend API error", detail: errText }) };
    }

    const data = await resendRes.json();
    return { statusCode: 200, body: JSON.stringify({ ok: true, id: data.id }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to send email", detail: String(err) }) };
  }
}
