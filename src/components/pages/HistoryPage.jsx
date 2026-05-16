import { Bookmark, Clock, Layers, Loader2, Sparkles } from 'lucide-react';
import MarketingLayout from '../MarketingLayout.jsx';
import {
  formatDuration,
  formatScenarioLabel,
} from '../../lib/sessionUtils.js';

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function scoreColor(score) {
  if (score >= 80) return 'text-green-400 border-green-500/30 bg-green-500/10';
  if (score >= 70) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
  return 'text-red-300 border-red-500/30 bg-red-500/10';
}

function excerpt(text, max = 156) {
  if (!text || typeof text !== 'string') return null;
  const t = text.replace(/\s+/g, ' ').trim();
  if (!t) return null;
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function formatTitleCase(slug) {
  if (!slug || typeof slug !== 'string') return null;
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

/** @param {{ practice_goals?: unknown }} session */
function formatPracticeGoalsSnippet(session) {
  const pg = session?.practice_goals;
  if (!pg) return null;
  if (Array.isArray(pg) && pg.length) {
    const labels = pg
      .map((g) =>
        typeof g === 'object' && g?.label ? g.label : String(g),
      )
      .filter(Boolean)
      .slice(0, 3);
    if (labels.length) return labels.join(' · ');
  }
  if (typeof pg === 'string') {
    return excerpt(pg, 64);
  }
  return null;
}

function RubricTrail({ session }) {
  const parts = [];
  const push = (label, val) => {
    if (typeof val === 'number' && !Number.isNaN(val))
      parts.push({ label, val });
  };
  push('C', session?.clarity_score);
  push('Conf', session?.confidence_score);
  push('E', session?.evidence_score);
  push('St', session?.structure_score);
  push('Tech', session?.technical_depth_score);
  push('Obj', session?.objection_handling_score);
  if (!parts.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      <span className="mr-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-600">
        <Sparkles className="h-3 w-3" aria-hidden />
        Rubric
      </span>
      {parts.map(({ label, val }) => (
        <span
          key={label}
          className="rounded-md border border-cyan-500/25 bg-cyan-500/[0.08] px-2 py-0.5 font-mono text-[10px] font-medium tabular-nums text-cyan-300"
        >
          {label}:{val}
        </span>
      ))}
    </div>
  );
}

export default function HistoryPage({
  sessions = [],
  loading = false,
  error = null,
  onRetry,
  onOpenSession,
  patchSessionBookmark = null,
  bookmarkUpdatingSessionId = null,
}) {
  return (
    <MarketingLayout>
      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <header className="mb-10 max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-widest text-blue-400">
            History
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Previous sessions
          </h1>
          <p className="mt-4 text-base text-zinc-400">
            Tap a session for full debrief; bookmark persists to your account.
          </p>
        </header>

        {loading && sessions.length === 0 && (
          <div className="flex items-center justify-center gap-2 py-16 text-zinc-400">
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
            <span className="text-sm">Loading sessions…</span>
          </div>
        )}

        {error && !loading && sessions.length === 0 && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
            {onRetry && (
              <button
                type="button"
                onClick={() => onRetry()}
                className="mt-3 block text-xs font-medium text-blue-400 hover:text-blue-300"
              >
                Try again
              </button>
            )}
            <p className="mt-2 text-xs text-zinc-500">
              {import.meta.env.PROD
                ? 'Production uses /api routes. Set SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY on Vercel, then redeploy.'
                : 'Ensure pitch_sessions exists (run supabase/pitch_sessions.sql and optional extensions) and you are signed in. Local dev reads Supabase directly; set VITE_USE_API_SESSIONS=true only if you also run vercel dev.'}
            </p>
          </div>
        )}

        {!loading && !error && sessions.length === 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-6 py-12 text-center">
            <p className="text-sm font-medium text-zinc-300">No sessions yet</p>
            <p className="mt-2 text-xs text-zinc-500">
              Complete a simulation and end the session to see it here.
            </p>
          </div>
        )}

        {sessions.length > 0 && (
          <ul className="space-y-3">
            {loading && (
              <li className="flex justify-center py-2 text-xs text-zinc-500">
                <Loader2 className="mr-2 h-3 w-3 animate-spin" aria-hidden />
                Refreshing…
              </li>
            )}
            {sessions.map((session) => {
              const summary = excerpt(session?.critical_feedback);
              const goalsSnippet = formatPracticeGoalsSnippet(session);
              const bookmarked = Boolean(session.bookmarked);
              const bookmarkBusy =
                Boolean(session.id) &&
                bookmarkUpdatingSessionId === session.id;

              return (
                <li key={session.id ?? session.created_at}>
                  <div className="flex flex-wrap items-stretch overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm transition-colors hover:border-zinc-600 sm:flex-nowrap">
                    <button
                      type="button"
                      onClick={() => onOpenSession?.(session)}
                      className="flex min-w-0 flex-1 flex-wrap items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-zinc-900/70"
                    >
                      <span
                        className={[
                          'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-lg font-bold',
                          scoreColor(session.overall_score),
                        ].join(' ')}
                      >
                        {session.overall_score ?? '—'}
                      </span>

                      <div className="min-w-0 flex-1 md:pr-2">
                        <p className="font-medium text-zinc-100">
                          {formatScenarioLabel(session.scenario_type)}
                        </p>
                        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                          <span>{formatDate(session.created_at)}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" aria-hidden />
                            {formatDuration(session.duration_seconds)}
                          </span>
                          <span>{session.filler_word_count ?? 0} filler words</span>
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {session.difficulty ? (
                            <span className="inline-flex items-center gap-1 rounded-lg border border-zinc-700/80 bg-zinc-900/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                              <Layers className="h-3 w-3" aria-hidden />
                              {formatTitleCase(session.difficulty)}
                            </span>
                          ) : null}
                          {session.panel_persona ? (
                            <span className="rounded-lg border border-violet-500/30 bg-violet-500/[0.08] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-violet-300">
                              Persona · {formatTitleCase(session.panel_persona)}
                            </span>
                          ) : null}
                          {typeof session.session_minutes === 'number' ? (
                            <span className="rounded-lg border border-cyan-500/30 bg-cyan-500/[0.08] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-cyan-300">
                              Target · {session.session_minutes}m
                            </span>
                          ) : null}
                          {session.vision_mode ? (
                            <span className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-200">
                              Vision
                            </span>
                          ) : null}
                        </div>

                        {goalsSnippet && (
                          <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
                            Goals:{' '}
                            <span className="text-zinc-400">{goalsSnippet}</span>
                          </p>
                        )}

                        {summary && (
                          <p className="mt-2 text-sm leading-snug text-zinc-400">
                            {summary}
                          </p>
                        )}

                        <RubricTrail session={session} />
                      </div>

                      <span className="ml-auto mt-2 shrink-0 self-center rounded-lg px-2 py-1 text-xs font-medium text-blue-400 sm:mt-0 sm:self-start">
                        View debrief
                      </span>
                    </button>

                    {patchSessionBookmark && session.id ? (
                      <div className="flex shrink-0 items-center justify-center border-t border-zinc-800 px-3 py-3 sm:flex-col sm:border-l sm:border-t-0">
                        <button
                          type="button"
                          aria-label={
                            bookmarked ? 'Remove bookmark' : 'Bookmark session'
                          }
                          aria-pressed={bookmarked}
                          disabled={bookmarkBusy}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            void patchSessionBookmark(session.id, !bookmarked);
                          }}
                          className={[
                            'flex h-11 w-11 items-center justify-center rounded-xl border transition-colors',
                            bookmarked
                              ? 'border-amber-500/60 bg-amber-500/15 text-amber-200'
                              : 'border-zinc-700 bg-zinc-900/60 text-zinc-400 hover:border-zinc-500 hover:text-zinc-100',
                            bookmarkBusy ? 'opacity-60' : '',
                          ].join(' ')}
                        >
                          {bookmarkBusy ? (
                            <Loader2
                              className="h-5 w-5 animate-spin"
                              aria-hidden
                            />
                          ) : (
                            <Bookmark
                              className="h-5 w-5"
                              strokeWidth={2}
                              fill={bookmarked ? 'currentColor' : 'none'}
                              aria-hidden
                            />
                          )}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </MarketingLayout>
  );
}
