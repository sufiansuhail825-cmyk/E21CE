// ─── Scoring engine ────────────────────────────────────────────────────────
// Only Likert (type "L") responses feed numeric scoring. Open responses
// ("O" type) are never converted into a score — they are surfaced verbatim
// in the report as qualitative evidence. This is a deliberate, documented
// choice: see project notes. Do not introduce keyword/length heuristics here.

export const DESCRIPTOR_LEVELS = [
  { key: "emerging", label: "Emerging", min: 1, max: 1.9, color: "#B85C4A" },
  { key: "developing", label: "Developing", min: 2, max: 2.9, color: "#C08A3E" },
  { key: "proficient", label: "Proficient", min: 3, max: 3.9, color: "#5B8C6E" },
  { key: "transformational", label: "Transformational", min: 4, max: 5, color: "#2E6F4E" },
];

export function levelForScore(score) {
  if (score == null || Number.isNaN(score)) return null;
  if (score < 2) return DESCRIPTOR_LEVELS[0];
  if (score < 3) return DESCRIPTOR_LEVELS[1];
  if (score < 4) return DESCRIPTOR_LEVELS[2];
  return DESCRIPTOR_LEVELS[3];
}

/**
 * responses: { [questionId]: number (1-5) for Likert, string for Open }
 * domains: the questions.json structure
 *
 * Returns:
 * {
 *   strandScores: [{ domainKey, strandCode, strandName, avg, level, n }],
 *   domainScores: [{ domainKey, title, avg, level, strandAverages: [...] }],
 *   overallAvg: number,
 *   levelDistribution: { emerging: %, developing: %, proficient: %, transformational: % } // across domains
 *   openResponses: [{ domainKey, domainTitle, strandCode, strandName, questionId, statement, scenario, answer }]
 * }
 */
export function computeScores(domains, responses) {
  const strandScores = [];
  const domainScores = [];
  const openResponses = [];
  let allDomainAverages = [];

  domains.forEach((domain) => {
    const strandAverages = [];

    domain.strands.forEach((strand) => {
      const likertQs = strand.questions.filter((q) => q.type === "L");
      const openQs = strand.questions.filter((q) => q.type === "O");

      const values = likertQs
        .map((q) => responses[q.id])
        .filter((v) => typeof v === "number" && !Number.isNaN(v));

      const avg = values.length
        ? values.reduce((a, b) => a + b, 0) / values.length
        : null;

      const level = levelForScore(avg);

      strandScores.push({
        domainKey: domain.key,
        domainTitle: domain.title,
        strandCode: strand.code,
        strandName: strand.name,
        avg,
        level,
        n: values.length,
      });

      if (avg != null) strandAverages.push(avg);

      openQs.forEach((q) => {
        const answer = responses[q.id];
        if (answer && String(answer).trim().length > 0) {
          openResponses.push({
            domainKey: domain.key,
            domainTitle: domain.title,
            strandCode: strand.code,
            strandName: strand.name,
            questionId: q.id,
            statement: q.statement,
            scenario: q.scenario || null,
            answer: String(answer).trim(),
          });
        }
      });
    });

    const domainAvg = strandAverages.length
      ? strandAverages.reduce((a, b) => a + b, 0) / strandAverages.length
      : null;

    const domainLevel = levelForScore(domainAvg);

    if (domainAvg != null) allDomainAverages.push(domainAvg);

    domainScores.push({
      domainKey: domain.key,
      title: domain.title,
      shortTitle: domain.shortTitle,
      bronfenbrenner: domain.bronfenbrenner,
      color: domain.color,
      avg: domainAvg,
      level: domainLevel,
      strandAverages: domain.strands.map((s, i) => {
        const match = strandScores.find(
          (ss) => ss.domainKey === domain.key && ss.strandCode === s.code
        );
        return match;
      }),
    });
  });

  const overallAvg = allDomainAverages.length
    ? allDomainAverages.reduce((a, b) => a + b, 0) / allDomainAverages.length
    : null;

  // Level distribution: % of the 5 domains that fall into each descriptor level
  const counts = { emerging: 0, developing: 0, proficient: 0, transformational: 0 };
  domainScores.forEach((d) => {
    if (d.level) counts[d.level.key] += 1;
  });
  const totalDomains = domainScores.filter((d) => d.level).length || 1;
  const levelDistribution = {
    emerging: (counts.emerging / totalDomains) * 100,
    developing: (counts.developing / totalDomains) * 100,
    proficient: (counts.proficient / totalDomains) * 100,
    transformational: (counts.transformational / totalDomains) * 100,
  };

  return {
    strandScores,
    domainScores,
    overallAvg,
    overallLevel: levelForScore(overallAvg),
    levelDistribution,
    openResponses,
  };
}

export function completionStats(domains, responses) {
  let total = 0;
  let answered = 0;
  domains.forEach((d) =>
    d.strands.forEach((s) =>
      s.questions.forEach((q) => {
        total += 1;
        const v = responses[q.id];
        if (q.type === "L" && typeof v === "number") answered += 1;
        if (q.type === "O" && typeof v === "string" && v.trim().length > 0) answered += 1;
      })
    )
  );
  return { total, answered, pct: total ? (answered / total) * 100 : 0 };
}
