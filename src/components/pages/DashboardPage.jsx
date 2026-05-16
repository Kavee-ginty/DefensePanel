import { Activity, Flame, Loader2, TrendingUp, Trophy } from 'lucide-react';
import MarketingLayout from '../MarketingLayout.jsx';
import { formatDuration, formatScenarioLabel } from '../../lib/sessionUtils.js';

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/** Sort oldest → newest by created_at */
function sortSessionsChronologically(sessions) {
  return [...sessions].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at),
  );
}

function improvementStreak(sessions) {
  const sorted = sortSessionsChronologically(sessions).filter(
    (s) => s.overall_score != null,
  );
  if (sorted.length < 2) return 0;
  let streak = 0;
  for (let i = sorted.length - 1; i > 0; i -= 1) {
    if (sorted[i].overall_score > sorted[i - 1].overall_score) {
      streak += 1;
    } else if (sorted[i].overall_score <= sorted[i - 1].overall_score) {
      break;
    }
  }
  return streak;
}

function bestScenarioByAvg(sessions) {
  const buckets = {};
  sessions.forEach((s) => {
    const key = s.scenario_type ?? 'unknown';
    if (!buckets[key]) buckets[key] = { scores: [], label: formatScenarioLabel(key) };
    if (typeof s.overall_score === 'number') buckets[key].scores.push(s.overall_score);
  });
  let bestKey = null;
  let bestAvg = -1;
  let bestCount = 0;
  Object.entries(buckets).forEach(([key, { scores, label }]) => {
    if (!scores.length) return;
    const avg =
      scores.reduce((a, b) => a + b, 0) / scores.length;
    const count = scores.length;
    if (avg > bestAvg || (avg === bestAvg && count > bestCount)) {
      bestAvg = avg;
      bestCount = count;
      bestKey = label;
    }
  });
  if (bestKey == null) return { label: '—', avg: null };
  return { label: bestKey, avg: Math.round(bestAvg * 10) / 10 };
}

export default function DashboardPage({
  sessions = [],
  loading = false,
  error = null,
  onRetry,
  onGoHistory,
}) {
  const chron = sortSessionsChronologically(sessions);
  const streak = improvementStreak(sessions);
  const total = sessions.length;
  const scoreSum = sessions.reduce(
    (acc, s) => acc + (typeof s.overall_score === 'number' ? s.overall_score : 0),
    0,
  );
  const avgScore =
    total > 0 ? Math.round((scoreSum / total) * 10) / 10 : null;
  const best = bestScenarioByAvg(sessions);

  const recent = [...sessions]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const lastImprovementPct = (() => {
    const withScores = chron.filter((s) => typeof s.overall_score === 'number');
    if (withScores.length < 2) return null;
    const prev = withScores[withScores.length - 2].overall_score;
    const curr = withScores[withScores.length - 1].overall_score;
    if (prev === 0 && curr === 0) return 0;
    if (prev === 0) return null;
    return Math.round(((curr - prev) / prev) * 100);
  })();

  return (
    <MarketingLayout>
      <div className="mx-auto max-w-6xl px-6 py-16 text-[17px] leading-relaxed sm:py-20">
        <header className="mb-10 max-w-4xl">
          <p className="text-base font-medium uppercase tracking-widest text-blue-400">
            Dashboard
          </p>
          <h1 className="mt-3 text-[2rem] font-bold tracking-tight sm:text-[2.375rem]">
            Practice performance
          </h1>
          <p className="mt-4 text-xl text-zinc-400">
            Totals and trends pulled from your saved sessions. Jump to history for
            full debrief detail.
          </p>
          {onGoHistory && (
            <button
              type="button"
              onClick={() => onGoHistory()}
              className="mt-5 text-lg font-medium text-blue-400 hover:text-blue-300"
            >
              Open session history
            </button>
          )}
        </header>

        {loading && sessions.length === 0 && (
          <div className="flex items-center justify-center gap-2 py-16 text-zinc-400">
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
            <span className="text-base">Loading dashboard…</span>
          </div>
        )}

        {error && !loading && sessions.length === 0 && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-base text-red-300">
            {error}
            {onRetry && (
              <button
                type="button"
                onClick={() => onRetry()}
                className="mt-3 block text-sm font-medium text-blue-400 hover:text-blue-300"
              >
                Try again
              </button>
            )}
          </div>
        )}

        {!loading && !error && sessions.length === 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-6 py-12 text-center">
            <p className="text-base font-medium text-zinc-300">No data yet</p>
            <p className="mt-2 text-sm text-zinc-500">
              Complete simulations to populate your dashboard.
            </p>
          </div>
        )}

        {sessions.length > 0 && (
          <>
            <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
                  <Activity className="h-4 w-4 text-cyan-400" aria-hidden />
                  Total sessions
                </div>
                <p className="mt-3 text-3xl font-semibold tabular-nums text-zinc-50">
                  {total}
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
                  <TrendingUp className="h-4 w-4 text-emerald-400" aria-hidden />
                  Average score
                </div>
                <p className="mt-3 text-3xl font-semibold tabular-nums text-zinc-50">
                  {avgScore !== null ? `${avgScore}` : '—'}
                  <span className="text-lg text-zinc-500"> /100</span>
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
                  <Trophy className="h-4 w-4 text-amber-400" aria-hidden />
                  Best scenario
                </div>
                <p className="mt-3 text-xl font-semibold text-zinc-50">
                  {best.label}
                </p>
                {best.avg != null && (
                  <p className="mt-1 text-sm text-zinc-500">
                    Avg {best.avg} across your runs
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
                  <Flame className="h-4 w-4 text-orange-400" aria-hidden />
                  Improvement streak
                </div>
                <p className="mt-3 text-3xl font-semibold tabular-nums text-zinc-50">
                  {streak}
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  Consecutive score gains (vs prior session)
                </p>
              </div>
            </div>

            {lastImprovementPct != null && (
              <p className="-mt-6 mb-10 rounded-lg border border-zinc-800/80 bg-zinc-900/30 px-4 py-3 text-base text-zinc-300">
                Compared to your previous pitch:{' '}
                <span className="font-semibold text-emerald-400">
                  {lastImprovementPct >= 0 ? '+' : ''}
                  {lastImprovementPct}% overall
                </span>
              </p>
            )}

            <section>
              <h2 className="mb-4 text-base font-semibold uppercase tracking-widest text-zinc-500">
                Recent sessions
              </h2>
              <ul className="space-y-3">
                {recent.map((session) => (
                  <li
                    key={session.id ?? `${session.created_at}-${session.overall_score}`}
                  >
                    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-4 backdrop-blur-sm">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900/70 text-lg font-bold text-zinc-100">
                        {session.overall_score ?? '—'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-zinc-100">
                          {formatScenarioLabel(session.scenario_type)}
                        </p>
                        <p className="mt-1 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
                          <span>{formatDate(session.created_at)}</span>
                          <span className="flex items-center gap-1">
                            {formatDuration(session.duration_seconds ?? 0)}
                          </span>
                          {typeof session.clarity_score === 'number' && (
                            <span>
                              Detail scores in debrief · C {session.clarity_score}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </MarketingLayout>
  );
}
