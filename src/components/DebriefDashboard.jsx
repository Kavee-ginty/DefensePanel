import { useId } from 'react';
import { AlertTriangle, Sparkles } from 'lucide-react';

const DEFAULT_SCORE_HISTORY = [
  { label: 'S1', score: 58 },
  { label: 'S2', score: 62 },
  { label: 'S3', score: 68 },
  { label: 'S4', score: 72 },
  { label: 'S5', score: 78 },
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

  return (
    <div className="relative min-h-screen bg-slate-950 px-4 py-10 font-sans text-slate-50 sm:px-8">
      <div
        className="pointer-events-none fixed bottom-6 right-6 text-slate-600/80"
        aria-hidden
      >
        <Sparkles className="h-5 w-5" strokeWidth={1.75} />
      </div>

      <div className="mx-auto max-w-4xl space-y-8">
        <header className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">{headerTitle}</h1>
          {scenario && (
            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-500">
              {scenario}
            </p>
          )}
          {subtitle && (
            <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
          )}
        </header>

        <div
          className={[
            'grid grid-cols-1 gap-4 md:grid-cols-3',
            isLoading ? 'animate-pulse opacity-80' : '',
          ].join(' ')}
        >
          <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-br from-emerald-950/50 to-slate-900/40 p-6 backdrop-blur-md">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Overall score
            </p>
            <p className="mt-2 text-4xl font-semibold tabular-nums text-green-400 drop-shadow-[0_0_12px_rgba(74,222,128,0.35)]">
              {overallScore}/100
            </p>
          </div>

          <div className="relative rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-md">
            <AlertTriangle
              className="absolute right-4 top-4 h-4 w-4 text-amber-500"
              strokeWidth={2}
              aria-hidden
            />
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Filler words
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-slate-50">
              {fillerDisplay}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Total count: {fillerWordCount}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-md">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Duration
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-slate-50">
              {durationLabel}
            </p>
          </div>
        </div>

        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
          <h2 className="text-lg font-semibold tracking-tight">
            Critical feedback
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-200">
            {criticalFeedback ||
              'No feedback recorded for this session.'}
          </p>
        </section>

        <section
          className={[
            'rounded-xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md',
            isLoading ? 'animate-pulse' : '',
          ].join(' ')}
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">
              Score trend (last {history.length} sessions)
              {isLoading && (
                <span className="ml-2 text-xs font-normal text-slate-500">
                  Updating…
                </span>
              )}
            </h2>
            <span className="flex items-center gap-2 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              Overall score
            </span>
          </div>

          <div className="overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              className="h-auto w-full min-w-[520px]"
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
                    />
                    <text
                      x={pad - 8}
                      y={py + 4}
                      textAnchor="end"
                      fill="rgb(148 163 184)"
                      fontSize="10"
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
                    >
                      {p.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </section>

        <div className="flex flex-wrap justify-center gap-3 pb-8">
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
    </div>
  );
}
