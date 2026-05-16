/**
 * Normalize debrief payloads from pitch_sessions rows: rubric breakdown,
 * categorized narrative, vs-previous-session progress.
 */

function clampScore(n, lo = 0, hi = 100) {
  return Math.min(hi, Math.max(lo, Math.round(Number(n))));
}

/** Deterministic “spread” from overall so UI always has 6 rubric bars in demo. */
export function deriveRubricFromOverall(overall) {
  const o = clampScore(overall ?? 72);
  const spread = [0, -4, 3, -2, 5, -3];
  const keys = [
    'clarity',
    'confidence',
    'evidence',
    'structure',
    'technicalDepth',
    'objectionHandling',
  ];
  return keys.reduce((acc, k, i) => {
    acc[k] = clampScore(o + spread[i % spread.length] + (i % 3));
    return acc;
  }, {});
}

export function rubricFromSession(session) {
  if (!session) return deriveRubricFromOverall(72);
  const fields = {
    clarity: session.clarity_score,
    confidence: session.confidence_score,
    evidence: session.evidence_score,
    structure: session.structure_score,
    technicalDepth: session.technical_depth_score,
    objectionHandling: session.objection_handling_score,
  };
  const hasAny = Object.values(fields).some(
    (v) => typeof v === 'number' && !Number.isNaN(v),
  );
  if (hasAny) {
    const base = deriveRubricFromOverall(session.overall_score);
    return Object.fromEntries(
      Object.entries(fields).map(([k, v]) => [
        k,
        typeof v === 'number' && !Number.isNaN(v) ? clampScore(v) : base[k],
      ]),
    );
  }
  return deriveRubricFromOverall(session.overall_score);
}

function textToBullets(text) {
  if (!text || typeof text !== 'string') return [];
  const t = text.trim();
  if (!t) return [];
  const chunks = t
    .split(/\r?\n+|;/)
    .map((line) =>
      line
        .trim()
        .replace(/^[-*•]\s+/, '')
        .replace(/^\d+\.\s+/, ''),
    )
    .filter(Boolean);
  return (chunks.length ? chunks : [t]).slice(0, 8);
}

/** Build categorized feedback blocks for debrief UI. */
export function buildCategorizedFeedback(session, fallbackNarrative) {
  const hasDb =
    session &&
    typeof session === 'object' &&
    (session.strengths ||
      session.weaknesses ||
      session.missed_opportunities ||
      session.next_steps);

  if (hasDb) {
    return {
      strengths: textToBullets(session.strengths),
      weaknesses: textToBullets(session.weaknesses),
      missedOpportunities: textToBullets(session.missed_opportunities),
      nextSteps: textToBullets(session.next_steps),
    };
  }

  const paragraphs = fallbackNarrative
    ? String(fallbackNarrative)
        .split(/\n+/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const filler = paragraphs[0]?.slice(0, 160) ?? 'Keep momentum on your storyline.';
  const next = paragraphs[paragraphs.length - 1]?.slice(0, 160) ?? filler;

  return {
    strengths: [
      paragraphs[0] ??
        'You stayed engaged with the panel and kept the session moving.',
    ].map((t) => t.slice(0, 280)),
    weaknesses: paragraphs[1]
      ? [paragraphs[1]]
      : [
          'Sharpen specificity: quantify claims with one concrete datapoint whenever possible.',
        ],
    missedOpportunities:
      paragraphs.length > 2
        ? [paragraphs.slice(2, 3)[0]].map((t) => t.slice(0, 280))
        : [
            'Missed anchoring objections early — state risks before the panel cites them.',
          ],
    nextSteps: [next.slice(0, 280)],
  };
}

/** Compare current session to chronological previous saved session overall score. */
export function progressVsPrevious(activeSession, allSessions) {
  if (!activeSession || !Array.isArray(allSessions)) return null;

  const currentScore =
    typeof activeSession.overall_score === 'number'
      ? activeSession.overall_score
      : null;
  if (currentScore === null) return null;

  const sorted = [...allSessions]
    .filter((s) => s?.created_at != null && typeof s.overall_score === 'number')
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  if (sorted.length < 1) return null;

  let prev = null;

  if (activeSession.id) {
    const idx = sorted.findIndex((s) => s.id === activeSession.id);
    if (idx <= 0) return null;
    prev = sorted[idx - 1];
  } else {
    prev = sorted[sorted.length - 1];
    if (!prev) return null;
  }

  const prevScore = prev.overall_score;

  if (prevScore === 0 && currentScore === 0) {
    return { deltaPct: 0, prevScore, currentScore };
  }

  const deltaPct =
    prevScore === 0
      ? null
      : Math.round(((currentScore - prevScore) / prevScore) * 100);

  return {
    deltaPct,
    prevScore,
    currentScore,
  };
}
