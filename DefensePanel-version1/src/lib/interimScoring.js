/** Interim MVP scoring until OpenAI transcript analysis is wired. */
export function buildInterimScores(scenarioType, durationSeconds) {
  const base = 58 + Math.min(35, Math.floor(durationSeconds / 12));
  const bump = { pitch: 4, presentation: 2, interview: 6 }[scenarioType] ?? 0;
  const overall_score = Math.min(100, Math.max(40, base + bump));
  const filler_word_count = Math.max(
    2,
    Math.round(durationSeconds / 28) +
      (scenarioType === 'presentation' ? 3 : 0),
  );
  const feedbackByScenario = {
    pitch:
      'Strong narrative flow, but tighten unit economics when pressed on CAC and churn. Name one comparable and a concrete payback period next time.',
    presentation:
      'Methodology was clear; defend sample size and limitations with more confidence. Prepare a sharper ablation or significance answer.',
    interview:
      'Good depth on stack choices; slow down during system design and state trade-offs earlier. Verbalize your thinking before diving into code.',
  };
  const critical_feedback =
    feedbackByScenario[scenarioType] ??
    'Solid session. Focus on shorter answers under pressure and anticipate follow-up challenges.';
  return { overall_score, filler_word_count, critical_feedback };
}
