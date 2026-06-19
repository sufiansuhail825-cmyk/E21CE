// Netlify Function: send-report
// Receives the assessment submission, formats it into an HTML email, and
// sends it via Resend to the configured CAL inbox.
//
// Required environment variable (set in Netlify dashboard, never in code):
//   RESEND_API_KEY   — API key from https://resend.com
//   REPORT_TO_EMAIL  — the inbox that should receive every submission
//   REPORT_FROM_EMAIL — a verified sending address/domain in Resend
//
// This function does NOT attach a generated PDF (that would require
// re-rendering charts server-side, which is a separate, heavier build).
// It sends a complete, readable HTML summary of every score, level, and
// open response instead, plus the respondent's own contact details so CAL
// can follow up directly.

function levelLabel(level) {
  return level || "—";
}

function fmt(n) {
  return typeof n === "number" ? n.toFixed(2) : "—";
}

function buildHtml(payload) {
  const { profile, preReflection, postReflection, summary, openResponses } = payload;

  const domainRows = summary.domainScores
    .map((d) => {
      const strandRows = d.strands
        .map(
          (s) => `
        <tr>
          <td style="padding:6px 10px;font-size:13px;color:#444;">${s.code} — ${s.name}</td>
          <td style="padding:6px 10px;font-size:13px;text-align:center;">${fmt(s.avg)}</td>
          <td style="padding:6px 10px;font-size:13px;text-align:center;">${levelLabel(s.level)}</td>
        </tr>`
        )
        .join("");

      return `
      <h3 style="margin:24px 0 8px;font-family:Georgia,serif;color:#16213E;">${d.title}</h3>
      <p style="margin:0 0 10px;font-size:14px;color:#555;">
        Domain average: <strong>${fmt(d.avg)}</strong> / 5 &nbsp;·&nbsp; Level: <strong>${levelLabel(d.level)}</strong>
      </p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e2dcca;">
        <thead>
          <tr style="background:#f3ede0;">
            <th style="padding:6px 10px;font-size:12px;text-align:left;">Strand</th>
            <th style="padding:6px 10px;font-size:12px;">Score</th>
            <th style="padding:6px 10px;font-size:12px;">Level</th>
          </tr>
        </thead>
        <tbody>${strandRows}</tbody>
      </table>`;
    })
    .join("");

  const openResponsesHtml = (openResponses || [])
    .map(
      (r) => `
      <div style="margin-bottom:16px;padding:12px 14px;background:#fbf8f2;border-left:3px solid #C08A3E;">
        <div style="font-size:11px;color:#C08A3E;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px;">
          ${r.domainTitle.replace(/^Domain \d+: /, "")} · ${r.strandCode}
        </div>
        <div style="font-size:13px;color:#16213E;font-weight:600;margin-bottom:6px;">${r.statement}</div>
        <div style="font-size:14px;color:#333;white-space:pre-wrap;">${r.answer}</div>
      </div>`
    )
    .join("");

  const preReflectionHtml = [
    ["Greatest strength", preReflection.b1],
    ["Most significant challenge", preReflection.b2],
    ["Growth motivation", preReflection.b3],
    ["How impact is currently measured", preReflection.b4],
  ]
    .filter(([, v]) => v && v.trim())
    .map(([label, v]) => `<p style="margin:0 0 10px;"><strong>${label}:</strong><br/>${v}</p>`)
    .join("");

  const postReflectionHtml = [
    ["Highest-rated strand & enabling conditions", postReflection.h1],
    ["Lowest-rated strand & the gap it reflects", postReflection.h2],
    ["Where self-rating was difficult", postReflection.h3],
    ["PD goals (next 6 months)", postReflection.h4],
    ["Preferred PD support format", postReflection.h5],
  ]
    .filter(([, v]) => v && v.trim())
    .map(([label, v]) => `<p style="margin:0 0 10px;"><strong>${label}:</strong><br/>${v}</p>`)
    .join("");

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:700px;margin:0 auto;color:#222;">
    <div style="background:#16213E;color:#fff;padding:24px 28px;border-radius:8px 8px 0 0;">
      <p style="margin:0;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:#C08A3E;">
        Centre for Advanced Learning · Manav Rachna University
      </p>
      <h1 style="margin:8px 0 0;font-family:Georgia,serif;font-size:24px;">New Educator Competency Submission</h1>
    </div>

    <div style="padding:24px 28px;border:1px solid #e2dcca;border-top:none;">
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr><td style="padding:4px 0;font-size:13px;color:#888;width:160px;">Name</td><td style="padding:4px 0;font-size:14px;font-weight:600;">${profile.name}</td></tr>
        <tr><td style="padding:4px 0;font-size:13px;color:#888;">Organisation</td><td style="padding:4px 0;font-size:14px;">${profile.organisation}</td></tr>
        <tr><td style="padding:4px 0;font-size:13px;color:#888;">Department</td><td style="padding:4px 0;font-size:14px;">${profile.department || "—"}</td></tr>
        <tr><td style="padding:4px 0;font-size:13px;color:#888;">Experience</td><td style="padding:4px 0;font-size:14px;">${profile.yearsExperience || "—"} years</td></tr>
        <tr><td style="padding:4px 0;font-size:13px;color:#888;">Level of Delivery</td><td style="padding:4px 0;font-size:14px;">${profile.levelOfDelivery || "—"}</td></tr>
        <tr><td style="padding:4px 0;font-size:13px;color:#888;">Curriculum</td><td style="padding:4px 0;font-size:14px;">${profile.curriculum || "—"}</td></tr>
        <tr><td style="padding:4px 0;font-size:13px;color:#888;">Submitted</td><td style="padding:4px 0;font-size:14px;">${new Date(payload.submittedAt).toLocaleString("en-IN")}</td></tr>
      </table>

      <div style="background:#f3ede0;padding:14px 18px;border-radius:8px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:14px;color:#555;">Overall Competency Score</span>
        <span style="font-family:Georgia,serif;font-size:22px;color:#16213E;font-weight:700;">${fmt(summary.overallAvg)} / 5 — ${levelLabel(summary.overallLevel)}</span>
      </div>

      <h2 style="font-family:Georgia,serif;color:#16213E;border-bottom:2px solid #C08A3E;padding-bottom:6px;">Domain & Strand Scores</h2>
      ${domainRows}

      <h2 style="font-family:Georgia,serif;color:#16213E;border-bottom:2px solid #C08A3E;padding-bottom:6px;margin-top:32px;">Pre-Assessment Reflection</h2>
      ${preReflectionHtml || "<p style='color:#999;font-size:13px;'>No responses provided.</p>"}

      <h2 style="font-family:Georgia,serif;color:#16213E;border-bottom:2px solid #C08A3E;padding-bottom:6px;margin-top:32px;">Strand Open Responses</h2>
      ${openResponsesHtml || "<p style='color:#999;font-size:13px;'>No responses provided.</p>"}

      <h2 style="font-family:Georgia,serif;color:#16213E;border-bottom:2px solid #C08A3E;padding-bottom:6px;margin-top:32px;">Post-Assessment Reflection</h2>
      ${postReflectionHtml || "<p style='color:#999;font-size:13px;'>No responses provided.</p>"}

      <p style="margin-top:32px;font-size:11px;color:#999;">
        This submission was generated automatically by the Empowering the 21st Century Educator
        self-assessment tool. The respondent also received their own downloadable PDF report.
      </p>
    </div>
  </div>`;
}

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const REPORT_TO_EMAIL = process.env.REPORT_TO_EMAIL;
  const REPORT_FROM_EMAIL = process.env.REPORT_FROM_EMAIL || "onboarding@resend.dev";

  if (!RESEND_API_KEY || !REPORT_TO_EMAIL) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server is not configured with RESEND_API_KEY or REPORT_TO_EMAIL." }),
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body." }) };
  }

  if (!payload || !payload.profile || !payload.profile.name) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing profile.name in payload." }) };
  }

  const html = buildHtml(payload);
  const subject = `Educator Competency Submission — ${payload.profile.name} (${payload.profile.organisation || "CAL"})`;

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
