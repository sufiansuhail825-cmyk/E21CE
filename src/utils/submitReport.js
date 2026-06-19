/**
 * Sends the report payload to the Netlify Function, which emails it to CAL
 * via Resend. The PDF itself is generated client-side again here (separately
 * from the user's own download) so the emailed copy matches what the report
 * canvas currently renders.
 */
export async function submitReport({ profile, preReflection, postReflection, results }) {
  const payload = {
    profile,
    preReflection,
    postReflection,
    summary: {
      overallAvg: results.overallAvg,
      overallLevel: results.overallLevel ? results.overallLevel.label : null,
      domainScores: results.domainScores.map((d) => ({
        title: d.title,
        avg: d.avg,
        level: d.level ? d.level.label : null,
        strands: d.strandAverages
          .filter(Boolean)
          .map((s) => ({
            code: s.strandCode,
            name: s.strandName,
            avg: s.avg,
            level: s.level ? s.level.label : null,
          })),
      })),
      levelDistribution: results.levelDistribution,
    },
    openResponses: results.openResponses,
    submittedAt: new Date().toISOString(),
  };

  const res = await fetch("/.netlify/functions/send-report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Submission failed: ${res.status} ${text}`);
  }

  return res.json();
}
