import { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, FileText } from 'lucide-react';
import MarketingLayout from '../MarketingLayout.jsx';
import {
  MOCK_SESSION_HISTORY,
  formatDuration,
} from '../../data/mockSessionHistory.js';

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

export default function HistoryPage() {
  const [expandedId, setExpandedId] = useState(null);

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
            Review past defenses — scores, duration, filler words, and panel
            feedback from each run.
          </p>
        </header>

        <ul className="space-y-3">
          {MOCK_SESSION_HISTORY.map((session) => {
            const open = expandedId === session.id;
            return (
              <li
                key={session.id}
                className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedId(open ? null : session.id)
                  }
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-zinc-900/60"
                >
                  <span
                    className={[
                      'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-lg font-bold',
                      scoreColor(session.overall_score),
                    ].join(' ')}
                  >
                    {session.overall_score}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-zinc-100">
                      {session.scenario_type}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                      <span>{formatDate(session.created_at)}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" aria-hidden />
                        {formatDuration(session.duration_seconds)}
                      </span>
                      <span>{session.filler_word_count} filler words</span>
                    </p>
                  </div>
                  {open ? (
                    <ChevronUp className="h-5 w-5 shrink-0 text-zinc-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 shrink-0 text-zinc-500" />
                  )}
                </button>

                {open && (
                  <div className="border-t border-zinc-800 px-5 py-4">
                    <div className="mb-4 flex items-start gap-2">
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                          Document context
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-zinc-300">
                          {session.document_summary}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Critical feedback
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                        {session.critical_feedback}
                      </p>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </MarketingLayout>
  );
}
