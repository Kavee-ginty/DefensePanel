import { useId, useMemo } from 'react';
import {
  AlertTriangle,
  Bookmark,
  FileDown,
  Loader2,
  Sparkles,
} from 'lucide-react';
import {
  buildCategorizedFeedback,
  progressVsPrevious,
  rubricFromSession,
} from '../lib/debriefHelpers.js';

const DEFAULT_SCORE_HISTORY = [
  { label: 'S1', score: 58 },
  { label: 'S2', score: 62 },
  { label: 'S3', score: 68 },
  { label: 'S4', score: 72 },
  { label: 'S5', score: 78 },
];

const RUBRIC_KEYS = [
  { key: 'clarity', label: 'Clarity' },
  { key: 'confidence', label: 'Confidence' },
  { key: 'evidence', label: 'Evidence' },
  { key: 'structure', label: 'Structure' },
  { key: 'technicalDepth', label: 'Technical depth' },
  { key: 'objectionHandling', label: 'Objection handling' },
];

function formatEndedAt(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function buildPath(points, width, height, pad, maxY) {
  if (!points.length) return '';
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const step = innerW / Math.max(1, points.length - 1);
  return points
    .map((v, i) => {
      const px = pad + i * step;
      const py = pad + innerH - (v / maxY) * innerH;
      return `${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`;
    })
    .join(' ');
}

function buildAreaPath(linePath, width, height, pad) {
  if (!linePath) return '';
  const lastY = height - pad;
  return `${linePath} L ${width - pad} ${lastY} L ${pad} ${lastY} Z`;
}

export default function DebriefDashboard({
  headerTitle = 'Defense Terminated',
  scenario = null,
  endedAt = new Date(),
  subtitleTime = '',
  overallScore = 82,
  fillerWordCount = 14,
  fillerDisplay = `14 'Ums'`,
  durationLabel = '04:12',
  criticalFeedback = '',
  scoreHistory = DEFAULT_SCORE_HISTORY,
  isLoading = false,
  onReturn,
  onGoHistory,
  sessionRecord = null,
  allSessions = [],
  patchSessionBookmark = null,
  bookmarkUpdatingSessionId = null,
}) {
  const chartGradientId = useId().replace(/:/g, '');
  const ended =
    endedAt instanceof Date ? endedAt : new Date(endedAt);
  const subtitle =
    subtitleTime || (endedAt ? formatEndedAt(ended) : '');

  const chartW = 640;
  const chartH = 220;
  const pad = 36;
  const maxY = 100;
  const ys = [0, 20, 40, 60, 80, 100];

  const history =
    scoreHistory?.length > 0 ? scoreHistory : DEFAULT_SCORE_HISTORY;
  const scores = history.map((p) => p.score);
  const pathScore = buildPath(scores, chartW, chartH, pad, maxY);
  const areaScore = buildAreaPath(pathScore, chartW, chartH, pad);

  const gradingRow = useMemo(
    () => ({
      ...sessionRecord,
      overall_score: sessionRecord?.overall_score ?? overallScore,
      clarity_score: sessionRecord?.clarity_score,
      confidence_score: sessionRecord?.confidence_score,
      evidence_score: sessionRecord?.evidence_score,
      structure_score: sessionRecord?.structure_score,
      technical_depth_score: sessionRecord?.technical_depth_score,
      objection_handling_score: sessionRecord?.objection_handling_score,
      strengths: sessionRecord?.strengths,
      weaknesses: sessionRecord?.weaknesses,
      missed_opportunities: sessionRecord?.missed_opportunities,
      next_steps: sessionRecord?.next_steps,
    }),
    [sessionRecord, overallScore],
  );

  const rubricScores = useMemo(() => rubricFromSession(gradingRow), [gradingRow]);
  const categories = useMemo(
    () => buildCategorizedFeedback(gradingRow, criticalFeedback),
    [gradingRow, criticalFeedback],
  );
  const progress = useMemo(
    () => progressVsPrevious(gradingRow, allSessions),
    [gradingRow, allSessions],
  );

  const sessionId = gradingRow?.id ?? null;

  const bookmarked = Boolean(sessionRecord?.bookmarked);

  const bookmarkBusy =
    Boolean(sessionId) && bookmarkUpdatingSessionId === sessionId;

  const handleBookmarkClick = async () => {
    if (!sessionId || !patchSessionBookmark || bookmarkBusy) return;
    await patchSessionBookmark(sessionId, !bookmarked);
  };

  const handleExportPdf = () => {
    window.print();
  };

  return (
    <div className="relative min-h-screen bg-slate-950 px-6 py-12 font-sans text-slate-50 lg:px-10 lg:py-14 print:bg-white print:px-0 print:py-2 print:text-slate-950">
      <div
        className="pointer-events-none fixed bottom-6 right-6 text-slate-600/80 no-print print:hidden"
        aria-hidden
      >
        <Sparkles className="h-5 w-5" strokeWidth={1.75} />
      </div>

      {isLoading ? (
        <div
          className="no-print mx-auto flex min-h-[min(70vh,36rem)] max-w-6xl flex-col items-center justify-center gap-5 px-6 py-16 text-center"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <Loader2
            className="h-12 w-12 shrink-0 animate-spin text-cyan-400"
            strokeWidth={2}
            aria-hidden
          />
          <div className="space-y-2">
            <p className="text-lg font-semibold tracking-tight text-slate-100 sm:text-xl">
              Analysing your performance…
            </p>
            <p className="max-w-md text-sm text-slate-500">
              Hang tight while we compile your scores and feedback.
            </p>
          </div>
        </div>
      ) : (
      <div
        id="debrief-print-root"
        className="mx-auto max-w-6xl space-y-8 print:max-w-none print:space-y-2"
      >
        <header className="text-center">
          <h1 className="text-3xl font-bold tracking-tight print:text-2xl">
            {headerTitle}
          </h1>
          {scenario && (
            <p className="mt-1 text-sm font-medium uppercase tracking-wider text-slate-500 print:text-[10px] print:text-slate-700">
              {scenario}
            </p>
          )}
          {subtitle && (
            <p className="mt-2 text-base text-slate-400 print:text-xs print:text-slate-600">
              {subtitle}
            </p>
          )}
        </header>

        {progress != null && progress.deltaPct != null && (
          <div className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-3 text-center text-sm text-cyan-100 print:border-slate-300 print:bg-slate-100 print:px-3 print:py-2 print:text-xs print:text-slate-800">
            {progress.deltaPct >= 0 ? 'You improved ' : 'Overall score changed by '}
            <span className="font-semibold tabular-nums text-cyan-50 print:text-slate-900">
              {progress.deltaPct >= 0
                ? `${progress.deltaPct}%`
                : `${Math.abs(progress.deltaPct)}%`}
            </span>
            {progress.deltaPct >= 0
              ? ` since your previous session`
              : ` compared with your previous session`}
            {' — '}
            overall {progress.prevScore} → {progress.currentScore}.
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 print:gap-2">
          <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-br from-emerald-950/50 to-slate-900/40 p-6 backdrop-blur-md print:border-slate-200 print:bg-slate-50 print:p-4 print:py-3">
            <p className="text-sm font-medium uppercase tracking-wider text-slate-400 print:text-[10px] print:text-slate-700">
              Overall score
            </p>
            <p className="mt-2 text-4xl font-semibold tabular-nums text-green-400 drop-shadow-[0_0_12px_rgba(74,222,128,0.35)] print:text-emerald-700 print:drop-shadow-none">
              {overallScore}/100
            </p>
          </div>

          <div className="relative rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-md print:border-slate-200 print:bg-white print:p-4 print:py-3">
            <AlertTriangle
              className="absolute right-4 top-4 h-4 w-4 text-amber-500 print:hidden"
              strokeWidth={2}
              aria-hidden
            />
            <p className="text-sm font-medium uppercase tracking-wider text-slate-400 print:text-[10px] print:text-slate-700">
              Filler words
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-slate-50 print:text-slate-900">
              {fillerDisplay}
            </p>
            <p className="mt-1 text-sm text-slate-500 print:text-[10px] print:text-slate-600">
              Total count: {fillerWordCount}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-md print:border-slate-200 print:bg-white print:p-4 print:py-3">
            <p className="text-sm font-medium uppercase tracking-wider text-slate-400 print:text-[10px] print:text-slate-700">
              Duration
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-slate-50 print:text-slate-900">
              {durationLabel}
            </p>
          </div>
        </div>

        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md print:border-slate-200 print:bg-slate-50 print:p-4">
          <h2 className="text-lg font-semibold tracking-tight print:mb-1 print:text-sm">
            Scoring breakdown
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 print:mt-2 print:gap-2">
            {RUBRIC_KEYS.map(({ key, label }) => (
              <div
                key={key}
                className="rounded-xl border border-slate-700/80 bg-slate-950/40 p-4 print:border-slate-200 print:bg-white print:p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-400 print:text-[10px] print:text-slate-700">
                    {label}
                  </p>
                  <p className="text-lg font-bold tabular-nums text-cyan-300 print:text-base print:text-slate-900">
                    {rubricScores[key]}/100
                  </p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800 print:mt-1 print:bg-slate-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 print:from-slate-700 print:to-slate-700"
                    style={{ width: `${rubricScores[key]}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 print:gap-2">
          {[
            {
              title: 'Strengths',
              items: categories.strengths,
              border: 'border-emerald-500/40',
              bg: 'from-emerald-950/40 to-slate-900/30',
            },
            {
              title: 'Weaknesses',
              items: categories.weaknesses,
              border: 'border-rose-500/35',
              bg: 'from-rose-950/40 to-slate-900/30',
            },
            {
              title: 'Missed opportunities',
              items: categories.missedOpportunities,
              border: 'border-amber-500/35',
              bg: 'from-amber-950/40 to-slate-900/30',
            },
            {
              title: 'What to improve (next steps)',
              items: categories.nextSteps,
              border: 'border-indigo-500/35',
              bg: 'from-indigo-950/40 to-slate-900/30',
            },
          ].map(({ title, items, border, bg }) => (
            <div
              key={title}
              className={[
                'rounded-xl border bg-gradient-to-br p-5 backdrop-blur-md print:p-4',
                border,
                bg,
                'print:border-slate-200 print:bg-white',
              ].join(' ')}
            >
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300 print:text-[11px] print:text-slate-800">
                {title}
              </h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-200 print:mt-2 print:space-y-0.5 print:text-[11px] print:leading-snug print:text-slate-800">
                {items?.length ? (
                  items.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))
                ) : (
                  <li className="text-slate-500 print:text-slate-500">
                    No notes for this category yet.
                  </li>
                )}
              </ul>
            </div>
          ))}
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md print:border-slate-200 print:bg-slate-50 print:p-4">
          <h2 className="text-lg font-semibold tracking-tight print:text-sm">
            Critical feedback
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-200 print:mt-2 print:text-[11px] print:leading-snug print:text-slate-800">
            {criticalFeedback ||
              'No feedback recorded for this session.'}
          </p>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md print:border-slate-200 print:bg-slate-50 print:p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:mb-2">
            <h2 className="text-lg font-semibold tracking-tight print:text-sm">
              Score trend (last {history.length} sessions)
            </h2>
            <span className="flex items-center gap-2 text-sm text-slate-400 print:text-[10px] print:text-slate-600">
              <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] print:shadow-none" />
              Overall score
            </span>
          </div>

          <div className="debrief-chart-print overflow-x-auto print:overflow-visible">
            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              className="h-auto w-full min-w-[520px] print:min-w-0"
              role="img"
              aria-label="Overall score progression for last sessions"
            >
              <defs>
                <linearGradient
                  id={`fillScore-${chartGradientId}`}
                  x1="0"
                  x2="0"
                  y1="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="rgb(34 211 238)"
                    stopOpacity="0.35"
                  />
                  <stop
                    offset="100%"
                    stopColor="rgb(34 211 238)"
                    stopOpacity="0"
                  />
                </linearGradient>
                <filter
                  id={`lineGlow-${chartGradientId}`}
                  x="-30%"
                  y="-30%"
                  width="160%"
                  height="160%"
                >
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {ys.map((y) => {
                const py =
                  pad + (chartH - pad * 2) - (y / maxY) * (chartH - pad * 2);
                return (
                  <g key={y}>
                    <line
                      x1={pad}
                      x2={chartW - pad}
                      y1={py}
                      y2={py}
                      stroke="rgb(30 41 59 / 0.45)"
                      strokeWidth={1}
                      className="print:stroke-slate-300"
                    />
                    <text
                      x={pad - 8}
                      y={py + 4}
                      textAnchor="end"
                      fill="rgb(148 163 184)"
                      fontSize="10"
                      className="print:fill-slate-600"
                    >
                      {y}
                    </text>
                  </g>
                );
              })}

              {areaScore ? (
                <path
                  d={areaScore}
                  fill={`url(#fillScore-${chartGradientId})`}
                  stroke="none"
                />
              ) : null}

              <path
                d={pathScore}
                fill="none"
                stroke="rgb(34 211 238)"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                filter={`url(#lineGlow-${chartGradientId})`}
                className="print:stroke-slate-800 print:[filter:none]"
              />

              {history.map((p, i) => {
                const innerW = chartW - pad * 2;
                const step = innerW / Math.max(1, history.length - 1);
                const px = pad + i * step;
                const py =
                  pad +
                  (chartH - pad * 2) -
                  (p.score / maxY) * (chartH - pad * 2);
                return (
                  <g key={p.label + i}>
                    <circle cx={px} cy={py} r={4} fill="rgb(34 211 238)" />
                    <text
                      x={px}
                      y={chartH - 8}
                      textAnchor="middle"
                      fill="rgb(148 163 184)"
                      fontSize="10"
                      className="print:fill-slate-600"
                    >
                      {p.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </section>

        <div className="no-print flex flex-wrap justify-center gap-3 pb-8 print:hidden">
          <button
            type="button"
            disabled={!sessionId || !patchSessionBookmark || bookmarkBusy}
            onClick={() => void handleBookmarkClick()}
            title={
              !sessionId
                ? 'Bookmark is available after the session is saved.'
                : undefined
            }
            className={[
              'flex items-center gap-2 rounded-xl border px-6 py-3 text-sm font-semibold transition-colors',
              bookmarked
                ? 'border-amber-500/60 bg-amber-500/15 text-amber-100'
                : 'border-slate-700 bg-slate-900/40 text-slate-100 hover:border-slate-500',
              !sessionId || !patchSessionBookmark
                ? 'pointer-events-none opacity-40'
                : '',
              bookmarkBusy ? 'opacity-70' : '',
            ].join(' ')}
          >
            {bookmarkBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Bookmark
                className="h-4 w-4"
                strokeWidth={2}
                fill={bookmarked ? 'currentColor' : 'none'}
                aria-hidden
              />
            )}
            {bookmarked ? 'Bookmarked' : 'Bookmark debrief'}
          </button>
          <button
            type="button"
            onClick={handleExportPdf}
            className="flex items-center gap-2 rounded-xl border border-blue-700/70 bg-blue-950/60 px-6 py-3 text-sm font-semibold text-blue-50 transition-colors hover:border-blue-500 hover:bg-blue-900/50"
          >
            <FileDown className="h-4 w-4" aria-hidden />
            Export debrief as PDF
          </button>
          <button
            type="button"
            onClick={() => onReturn?.()}
            className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-[0_0_15px_rgba(37,99,235,0.35)] transition-colors hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            Return to Lobby
          </button>
          <button
            type="button"
            onClick={() => onGoHistory?.()}
            className="rounded-xl border border-slate-700 bg-slate-900/40 px-8 py-3 text-sm font-medium text-slate-100 transition-colors hover:border-slate-500 hover:bg-slate-900/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            Session History
          </button>
        </div>
      </div>
      )}
    </div>
  );
}
