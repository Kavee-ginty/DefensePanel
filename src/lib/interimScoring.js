/**
 * Interim scoring until transcript analysis is wired.
 * @param {string} scenarioType - 'pitch' | 'interview' | 'presentation'
 * @param {number} durationSeconds
 * @param {import('./sessionSetup.js').SessionSetupInput | null | undefined} setup
 */
export function buildInterimScores(scenarioType, durationSeconds, setup = null) {
  const duration = Math.max(1, Number(durationSeconds) || 1);
  const base = 58 + Math.min(35, Math.floor(duration / 12));
  const bump = { pitch: 4, presentation: 2, interview: 6 }[scenarioType] ?? 0;

  const difficultyMul = {
    friendly: 1.06,
    standard: 1,
    brutal: 0.94,
  };
  const d = setup?.difficulty ?? 'standard';
  const diffFactor = difficultyMul[d] ?? 1;

  let overall_score = Math.min(
    100,
    Math.max(40, Math.round((base + bump) * diffFactor)),
  );

  const filler_word_count = Math.max(
    2,
    Math.round(duration / 28) + (scenarioType === 'presentation' ? 3 : 0),
  );

  const persona = setup?.panelPersona ?? 'investor';
  const practiceGoal = setup?.practiceGoal ?? 'confidence';
  const sessionFlow = setup?.sessionFlow ?? 'qa';

  /** @type {Record<string, number>} */
  const seeds = {
    clarity: 0.92,
    confidence: 0.9,
    evidence: 0.88,
    structure: 0.91,
    technical_depth: 0.87,
    objection_handling: 0.86,
  };

  if (scenarioType === 'pitch') {
    seeds.evidence += 0.04;
    seeds.objection_handling += 0.03;
  } else if (scenarioType === 'presentation') {
    seeds.evidence += 0.05;
    seeds.structure += 0.03;
    seeds.technical_depth += 0.02;
  } else {
    seeds.technical_depth += 0.06;
    seeds.objection_handling += 0.02;
  }

  if (persona === 'cfo') {
    seeds.evidence += 0.04;
    seeds.structure += 0.02;
  } else if (persona === 'professor') {
    seeds.evidence += 0.05;
    seeds.structure += 0.04;
  } else if (persona === 'investor') {
    seeds.clarity += 0.03;
    seeds.objection_handling += 0.04;
  }

  if (practiceGoal === 'filler') {
    seeds.clarity += 0.03;
    seeds.confidence += 0.02;
  } else if (practiceGoal === 'confidence') {
    seeds.confidence += 0.05;
  } else if (practiceGoal === 'technical') {
    seeds.technical_depth += 0.05;
    seeds.evidence += 0.02;
  } else if (practiceGoal === 'objections') {
    seeds.objection_handling += 0.05;
  }

  if (sessionFlow === 'rapid') {
    seeds.clarity -= 0.03;
    seeds.confidence += 0.02;
  } else if (sessionFlow === 'opening') {
    seeds.structure += 0.03;
  } else if (sessionFlow === 'closing') {
    seeds.structure += 0.02;
    seeds.confidence += 0.02;
  }

  const toScore = (k) => {
    const v = Math.round(overall_score * seeds[k]);
    return Math.min(100, Math.max(35, v));
  };

  let clarity_score = toScore('clarity');
  let confidence_score = toScore('confidence');
  let evidence_score = toScore('evidence');
  let structure_score = toScore('structure');
  let technical_depth_score = toScore('technical_depth');
  let objection_handling_score = toScore('objection_handling');

  const categoryAvg =
    (clarity_score +
      confidence_score +
      evidence_score +
      structure_score +
      technical_depth_score +
      objection_handling_score) /
    6;
  overall_score = Math.min(100, Math.max(40, Math.round((overall_score + categoryAvg) / 2)));

  const critical_feedback = summarizeForLegacy({
    scenarioType,
    overall_score,
    persona,
    practiceGoal,
  });

  const strengths = buildStrengths({
    scenarioType,
    clarity_score,
    confidence_score,
    evidence_score,
    structure_score,
    technical_depth_score,
    objection_handling_score,
    setup,
  });

  const weaknesses = buildWeaknesses({
    scenarioType,
    clarity_score,
    confidence_score,
    evidence_score,
    structure_score,
    technical_depth_score,
    objection_handling_score,
    filler_word_count,
    setup,
  });

  const missed_opportunities = buildMissed({
    scenarioType,
    sessionFlow,
    practiceGoal,
    setup,
  });

  return {
    overall_score,
    filler_word_count,
    critical_feedback,
    clarity_score,
    confidence_score,
    evidence_score,
    structure_score,
    technical_depth_score,
    objection_handling_score,
    strengths,
    weaknesses,
    missed_opportunities,
  };
}

function summarizeForLegacy({
  scenarioType,
  overall_score,
  persona,
  practiceGoal,
}) {
  const p =
    persona === 'professor'
      ? 'thesis-level scrutiny'
      : persona === 'cfo'
        ? 'financial rigor'
        : 'investor-style pressure';
  const g =
    practiceGoal === 'filler'
      ? 'tighter pacing and fewer fillers'
      : practiceGoal === 'technical'
        ? 'deeper technical articulation'
        : practiceGoal === 'objections'
          ? 'cleaner objection handling'
          : 'calmer confidence under fire';
  const sMap = {
    pitch: `Overall ${overall_score}/100 vs ${p}. Double down on proof points and a crisp ask; next rep focus on ${g}.`,
    presentation: `Overall ${overall_score}/100 vs ${p}. Tighten claims-to-evidence links; next rep focus on ${g}.`,
    interview: `Overall ${overall_score}/100 vs ${p}. Make trade-offs explicit earlier; next rep focus on ${g}.`,
  };
  return (
    sMap[scenarioType] ??
    `Overall ${overall_score}/100. Next rep: emphasize structure and ${g}.`
  );
}

function lowestKeys(scores) {
  const entries = Object.entries(scores);
  entries.sort((a, b) => a[1] - b[1]);
  return [entries[0]?.[0], entries[1]?.[0]].filter(Boolean);
}

function highestKeys(scores) {
  const entries = Object.entries(scores);
  entries.sort((a, b) => b[1] - a[1]);
  return [entries[0]?.[0], entries[1]?.[0]].filter(Boolean);
}

const LABEL = {
  clarity_score: 'Clarity',
  confidence_score: 'Confidence',
  evidence_score: 'Evidence',
  structure_score: 'Structure',
  technical_depth_score: 'Technical depth',
  objection_handling_score: 'Objection handling',
};

function buildStrengths({ setup, ...rest }) {
  const scores = {
    clarity_score: rest.clarity_score,
    confidence_score: rest.confidence_score,
    evidence_score: rest.evidence_score,
    structure_score: rest.structure_score,
    technical_depth_score: rest.technical_depth_score,
    objection_handling_score: rest.objection_handling_score,
  };
  const hi = highestKeys(scores);
  const lines = hi.map((k) => `Strong ${LABEL[k] ?? k}: scored ${scores[k]}/100.`);
  if (setup?.customScenario?.trim()) {
    lines.push(
      `You anchored the session to your stated scenario (“${truncate(setup.customScenario.trim(), 80)}”), which keeps the panel focused.`,
    );
  }
  if (lines.length < 2) {
    lines.push('Good endurance for a live panel cadence — you stayed in the room without collapsing into monologue.');
  }
  return lines.join(' ');
}

function buildWeaknesses({
  scenarioType,
  filler_word_count,
  setup,
  ...rest
}) {
  const scores = {
    clarity_score: rest.clarity_score,
    confidence_score: rest.confidence_score,
    evidence_score: rest.evidence_score,
    structure_score: rest.structure_score,
    technical_depth_score: rest.technical_depth_score,
    objection_handling_score: rest.objection_handling_score,
  };
  const lo = lowestKeys(scores);
  const lines = lo.map(
    (k) => `${LABEL[k] ?? k} is the current bottleneck (${scores[k]}/100) — rehearse 3 crisp bullets and one worked example.`,
  );
  if (filler_word_count >= 8) {
    lines.push(
      `Filler density looks high (~${filler_word_count} counts) — insert micro-pauses instead of hedging.`,
    );
  }
  if (scenarioType === 'pitch') {
    lines.push('Under pressure, make unit economics explicit (CAC, payback, gross margin) even if approximate.');
  } else if (scenarioType === 'presentation') {
    lines.push('When challenged on methodology, answer limitations first — then the mitigation — in one breath.');
  } else {
    lines.push('For technical follow-ups, state constraints and trade-offs before implementation details.');
  }
  if (setup?.panelPersona === 'custom' && setup?.customPersona?.trim()) {
    lines.push(
      `Calibrate tone for your custom persona (“${truncate(setup.customPersona.trim(), 60)}”) — match their incentives (risk, career, tenure).`,
    );
  }
  return lines.join(' ');
}

function buildMissed({ scenarioType, sessionFlow, practiceGoal, setup }) {
  const lines = [];
  if (sessionFlow === 'qa' || sessionFlow === 'rapid') {
    lines.push(
      'A missed opportunity: you did not preempt the obvious “why now / why you” attack with one memorable proof artifact (logo, metric, or reference customer).',
    );
  }
  if (practiceGoal === 'objections') {
    lines.push(
      'Missed chance to “label and pivot” — acknowledge the objection, restate the criterion, then answer in one structured paragraph.',
    );
  }
  if (scenarioType === 'interview') {
    lines.push(
      'You could have closed loops by repeating the interviewer’s criterion and mapping your answer directly to it.',
    );
  } else if (scenarioType === 'presentation') {
    lines.push(
      'You could have linked each major claim to a single figure or citation quickly — panels reward retrieval speed.',
    );
  } else {
    lines.push(
      'You could have tightened the close: restate the wedge, the traction proof, and the specific ask in 20 seconds.',
    );
  }
  if (setup?.customPracticeGoal?.trim()) {
    lines.push(
      `Relative to your practice goal (“${truncate(setup.customPracticeGoal.trim(), 90)}”), add one measurable checkpoint next run (time-boxed answer + one metric).`,
    );
  }
  return lines.join(' ');
}

function truncate(s, max) {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}
