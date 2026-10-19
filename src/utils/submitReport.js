/**
 * Sends the dual-phase report payload to the Netlify Function,
 * which emails it to CAL via Resend.
 *
 * payload shape:
 * {
 *   profile          – name, organisation, role, yearsExperience, teachingLevels
 *   preAssessmentSummary – per-domain + per-strand self-assessed scores
 *   scenarioSummary  – per-strand scenario-assessed scores (S1-S6 only)
 *   comparison       – strand-level delta between self and assessed (S1-S6)
 *   submittedAt      – ISO timestamp
 * }
 */
export async function submitReport({ profile, preResults, scenarioResults, comparison }) {
  const payload = {
    profile,
    preAssessmentSummary: {
      overallAvg:   preResults.overallAvg,
      overallLevel: preResults.overallLevel ? preResults.overallLevel.label : null,
      domainScores: preResults.domainScores.map((d) => ({
        domainKey:  d.domainKey,
        title:      d.title,
        shortTitle: d.shortTitle,
        avg:        d.avg,
        level:      d.level ? d.level.label : null,
        strands:    d.strandScores.map((s) => ({
          code:  s.strandCode,
          name:  s.strandName,
          score: s.score,
          level: s.level ? s.level.label : null,
        })),
      })),
      levelDistribution: preResults.levelDistribution,
    },
    scenarioSummary: {
      overallAvg:   scenarioResults.overallAvg,
      overallLevel: scenarioResults.overallLevel ? scenarioResults.overallLevel.label : null,
      strandScores: scenarioResults.strandScores.map((s) => ({
        code:  s.strandCode,
        name:  s.strandName,
        avg:   s.avg,
        level: s.level ? s.level.label : null,
        n:     s.n,
      })),
    },
    comparison: comparison.map((c) => ({
      code:          c.strandCode,
      name:          c.strandName,
      selfScore:     c.selfScore,
      selfLevel:     c.selfLevel ? c.selfLevel.label : null,
      assessedScore: c.assessedScore,
      assessedLevel: c.assessedLevel ? c.assessedLevel.label : null,
      delta:         c.delta,
      direction:     c.direction,
    })),
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
