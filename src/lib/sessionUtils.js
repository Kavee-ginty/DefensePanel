/** App mode ids → DB scenario_type */
export const MODE_TO_SCENARIO = {
  startup: 'pitch',
  interview: 'interview',
  academic: 'presentation',
};

export const SCENARIO_LABELS = {
  pitch: 'Pitch',
  interview: 'Interview',
  presentation: 'Presentation',
};

export function modeToScenarioType(modeId) {
  return MODE_TO_SCENARIO[modeId] ?? 'pitch';
}

export function formatScenarioLabel(scenarioType) {
  return (
    SCENARIO_LABELS[scenarioType] ??
    scenarioType?.charAt(0).toUpperCase() + scenarioType?.slice(1) ??
    'Session'
  );
}

export function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function sessionToDebriefProps(session) {
  if (!session) return {};
  return {
    scenario: formatScenarioLabel(session.scenario_type),
    endedAt: session.created_at,
    overallScore: session.overall_score,
    fillerWordCount: session.filler_word_count,
    fillerDisplay: `${session.filler_word_count} 'Ums'`,
    durationLabel: formatDuration(session.duration_seconds),
    criticalFeedback: session.critical_feedback,
  };
}

export function buildScoreHistoryFromSessions(sessions, limit = 10) {
  const sorted = [...sessions]
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .slice(-limit);
  return sorted.map((s, i) => ({
    label: `S${i + 1}`,
    score: s.overall_score,
  }));
}
