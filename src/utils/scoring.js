// ─── Scoring engine ────────────────────────────────────────────────────────
// Two separate scoring paths:
//
//   computePreAssessmentScores(preAssessmentData, responses)
//     responses: { [strandId]: 1|2|3|4|null }  (null = N/A, skip)
//     Returns per-strand, per-domain, and overall averages for the
//     self-assessed baseline (covers all 26 strands).
//
//   computeScenarioScores(scenarioData, responses)
//     responses: { [questionId]: 0|1|2|3 }  (index of chosen option, 0-3)
//     Each option index maps directly to level 1-4 (index+1).
//     Returns per-strand averages for S1-S6 (Domain 1 only).
//
// levelForScore() maps an average (1-4) to a descriptor band.

export const DESCRIPTOR_LEVELS = [
  { key: "emerging",        label: "Emerging",        min: 1,   max: 1.99, color: "#B85C4A" },
  { key: "developing",      label: "Developing",      min: 2,   max: 2.99, color: "#C08A3E" },
  { key: "proficient",      label: "Proficient",      min: 3,   max: 3.99, color: "#5B8C6E" },
  { key: "transformational",label: "Transformational",min: 4,   max: 4,    color: "#2E6F4E" },
];

export function levelForScore(score) {
  if (score == null || Number.isNaN(score)) return null;
  if (score < 2) return DESCRIPTOR_LEVELS[0];
  if (score < 3) return DESCRIPTOR_LEVELS[1];
  if (score < 4) return DESCRIPTOR_LEVELS[2];
  return DESCRIPTOR_LEVELS[3];
}

// ─── Pre-Assessment ────────────────────────────────────────────────────────
// preAssessmentData: the preAssessment.json structure (array of domains)
// responses: { [strand.id]: 1|2|3|4 }  — null/undefined/0 means N/A (excluded)
//
// Returns:
// {
//   strandScores: [{ domainKey, strandCode, strandName, score, level }],
//   domainScores: [{ domainKey, title, shortTitle, bronfenbrenner, color, avg, level, strandScores }],
//   overallAvg: number|null,
//   overallLevel: descriptor|null,
//   levelDistribution: { emerging, developing, proficient, transformational } // % of rated strands
// }

export function computePreAssessmentScores(preAssessmentData, responses) {
  const strandScores = [];
  const domainScores = [];
  const allStrandValues = [];

  preAssessmentData.forEach((domain) => {
    const domainStrandScores = [];

    domain.strands.forEach((strand) => {
      const raw = responses[strand.id];
      // 0, null, undefined, "na" all mean N/A — exclude from scoring
      const score = (raw && raw >= 1 && raw <= 4) ? Number(raw) : null;
      const level = levelForScore(score);

      const entry = {
        domainKey: domain.key,
        domainTitle: domain.title,
        strandCode: strand.code,
        strandName: strand.name,
        strandId: strand.id,
        score,
        level,
      };

      strandScores.push(entry);
      domainStrandScores.push(entry);
      if (score != null) allStrandValues.push(score);
    });

    const rated = domainStrandScores.filter((s) => s.score != null);
    const domainAvg = rated.length
      ? rated.reduce((sum, s) => sum + s.score, 0) / rated.length
      : null;

    domainScores.push({
      domainKey: domain.key,
      title: domain.title,
      shortTitle: domain.shortTitle,
      bronfenbrenner: domain.bronfenbrenner,
      color: domain.color,
      avg: domainAvg,
      level: levelForScore(domainAvg),
      strandScores: domainStrandScores,
    });
  });

  const overallAvg = allStrandValues.length
    ? allStrandValues.reduce((a, b) => a + b, 0) / allStrandValues.length
    : null;

  // Distribution across all RATED strands
  const counts = { emerging: 0, developing: 0, proficient: 0, transformational: 0 };
  strandScores.forEach((s) => {
    if (s.level) counts[s.level.key] += 1;
  });
  const totalRated = strandScores.filter((s) => s.level).length || 1;
  const levelDistribution = {
    emerging:        (counts.emerging        / totalRated) * 100,
    developing:      (counts.developing      / totalRated) * 100,
    proficient:      (counts.proficient      / totalRated) * 100,
    transformational:(counts.transformational/ totalRated) * 100,
  };

  return {
    strandScores,
    domainScores,
    overallAvg,
    overallLevel: levelForScore(overallAvg),
    levelDistribution,
  };
}

// ─── Scenario Assessment ───────────────────────────────────────────────────
// scenarioData: the scenarioAssessment.json structure
// responses: { [questionId]: 0|1|2|3 }  (option index, 0-based → level 1-4)
//
// Returns:
// {
//   strandScores: [{ strandCode, strandName, avg, level, n, questionScores }],
//   overallAvg: number|null,
//   overallLevel: descriptor|null,
// }

export function computeScenarioScores(scenarioData, responses) {
  const strandScores = [];
  const allValues = [];

  scenarioData.forEach((strand) => {
    const questionScores = [];

    strand.questions.forEach((q) => {
      const idx = responses[q.id];
      if (idx != null && idx >= 0 && idx <= 3) {
        const level = idx + 1; // 0→1(Emerging) … 3→4(Transformational)
        questionScores.push({ questionId: q.id, level });
        allValues.push(level);
      }
    });

    const avg = questionScores.length
      ? questionScores.reduce((sum, q) => sum + q.level, 0) / questionScores.length
      : null;

    strandScores.push({
      strandCode: strand.strandCode,
      strandName: strand.strandName,
      domainKey: strand.domainKey,
      avg,
      level: levelForScore(avg),
      n: questionScores.length,
      questionScores,
    });
  });

  const overallAvg = allValues.length
    ? allValues.reduce((a, b) => a + b, 0) / allValues.length
    : null;

  return {
    strandScores,
    overallAvg,
    overallLevel: levelForScore(overallAvg),
  };
}

// ─── Comparison helpers ────────────────────────────────────────────────────
// For the 6 strands covered by both assessments (S1.1–S1.6),
// returns the delta and direction of movement.
export function buildComparison(preResults, scenarioResults) {
  const comparison = [];

  scenarioResults.strandScores.forEach((scenarioStrand) => {
    const preStrand = preResults.strandScores.find(
      (s) => s.strandCode === scenarioStrand.strandCode
    );
    if (!preStrand) return;

    const preSelf  = preStrand.score;
    const assessed = scenarioStrand.avg;
    const delta    = (preSelf != null && assessed != null) ? assessed - preSelf : null;

    comparison.push({
      strandCode:    scenarioStrand.strandCode,
      strandName:    scenarioStrand.strandName,
      selfScore:     preSelf,
      selfLevel:     preStrand.level,
      assessedScore: assessed,
      assessedLevel: scenarioStrand.level,
      delta,
      direction:
        delta == null ? null :
        delta > 0.25  ? "above-self" :
        delta < -0.25 ? "below-self" :
        "aligned",
    });
  });

  return comparison;
}

// ─── Progress helpers ──────────────────────────────────────────────────────
export function preAssessmentProgress(preAssessmentData, responses) {
  let total = 0;
  let answered = 0;
  preAssessmentData.forEach((domain) =>
    domain.strands.forEach((strand) => {
      total += 1;
      const v = responses[strand.id];
      if (v && v >= 1 && v <= 4) answered += 1;
      else if (v === "na" || v === 0) answered += 1; // N/A also counts as answered
    })
  );
  return { total, answered, pct: total ? (answered / total) * 100 : 0 };
}

export function scenarioProgress(scenarioData, responses) {
  let total = 0;
  let answered = 0;
  scenarioData.forEach((strand) =>
    strand.questions.forEach((q) => {
      total += 1;
      const v = responses[q.id];
      if (v != null && v >= 0 && v <= 3) answered += 1;
    })
  );
  return { total, answered, pct: total ? (answered / total) * 100 : 0 };
}
