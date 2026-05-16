import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Eye,
  FileText,
  Loader2,
  SlidersHorizontal,
  Timer,
  Upload,
  Users,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getModeConfig } from '../config/modeConfig.js';
import {
  extractDocumentText,
  getDocumentKind,
} from '../lib/extractDocumentText.js';
import { processDocument, startSession } from '../lib/sessionApi.js';

const SESSION_MINUTES = [3, 5, 10, 15];
const DIFFICULTY_OPTIONS = [
  { id: 'friendly', label: 'Friendly' },
  { id: 'standard', label: 'Standard' },
  { id: 'brutal', label: 'Brutal' },
];
/** Persona options per simulation mode (ids must match api/_lib/briefingPrompt.js). */
const PERSONAS_BY_MODE = {
  startup: [
    { id: 'investor', label: 'Investor' },
    { id: 'cto', label: 'CTO' },
    { id: 'cfo', label: 'CFO' },
  ],
  academic: [
    { id: 'professor', label: 'Professor' },
    { id: 'research_critic', label: 'Research Critic' },
    { id: 'external_examiner', label: 'External Examiner' },
  ],
  interview: [
    { id: 'interviewer', label: 'Interviewer' },
    { id: 'hiring_manager', label: 'Hiring Manager' },
  ],
};
const PRACTICE_GOALS = [
  { id: 'filler_words', label: 'Reduce filler words' },
  { id: 'confidence', label: 'Improve confidence' },
  { id: 'technical_depth', label: 'Improve technical depth' },
  { id: 'objections', label: 'Handle objections' },
];

export default function ContextUpload({
  mode = 'startup',
  file = null,
  briefingSetup = null,
  onBriefingSetupChange,
  onFileChange,
  onInitialize,
  onAgentReady,
  onBack,
  isLoading = false,
  error = null,
  title,
  description,
  submitLabel,
}) {
  const config = useMemo(() => getModeConfig(mode), [mode]);
  const inputId = useId();
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStage, setDeployStage] = useState(null);

  const resolvedTitle = title ?? config.briefingTitle;
  const resolvedDescription = description ?? config.briefingDescription;
  const resolvedSubmit = submitLabel ?? config.submitLabel;

  const mergeSetup = (partial) =>
    typeof onBriefingSetupChange === 'function'
      ? onBriefingSetupChange({ ...(briefingSetup ?? {}), ...partial })
      : undefined;

  const difficulty = briefingSetup?.difficulty ?? 'standard';
  const sessionMinutes = briefingSetup?.sessionMinutes ?? 5;
  const panelPersona = briefingSetup?.panelPersona ?? 'investor';
  const practiceGoals = briefingSetup?.practiceGoals ?? [];
  const visionMode = Boolean(briefingSetup?.visionMode);

  const personasForMode = useMemo(
    () => PERSONAS_BY_MODE[mode] ?? PERSONAS_BY_MODE.startup,
    [mode],
  );

  useEffect(() => {
    const allowed = personasForMode.map((p) => p.id);
    const current = String(briefingSetup?.panelPersona ?? '');
    if (allowed.includes(current)) return;
    const first = personasForMode[0]?.id;
    if (first && typeof onBriefingSetupChange === 'function') {
      onBriefingSetupChange({
        ...(briefingSetup ?? {}),
        panelPersona: first,
      });
    }
  }, [mode, personasForMode, briefingSetup, onBriefingSetupChange]);

  const toggleGoal = (goalId) => {
    const goals = [...(briefingSetup?.practiceGoals ?? [])];
    const ix = goals.indexOf(goalId);
    if (ix >= 0) goals.splice(ix, 1);
    else goals.push(goalId);
    mergeSetup({ practiceGoals: goals });
  };

  const clearFile = useCallback(() => {
    onFileChange?.(null);
    setLocalError(null);
    setIsExtracting(false);
    if (inputRef.current) inputRef.current.value = '';
  }, [onFileChange]);

  const handleFiles = useCallback(
    async (files) => {
      const next = files?.[0];
      if (!next) return;

      if (!getDocumentKind(next)) {
        setLocalError(config.fileError);
        clearFile();
        return;
      }

      setLocalError(null);
      onFileChange?.(next);
      setIsExtracting(true);

      try {
        const text = await extractDocumentText(next);
        console.log('[Defense Panel] extracted text:', text);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Could not extract text from file.';
        setLocalError(message);
        onFileChange?.(null);
        if (inputRef.current) inputRef.current.value = '';
      } finally {
        setIsExtracting(false);
      }
    },
    [onFileChange, config.fileError, clearFile],
  );

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer?.files);
  };

  const handleDeploy = useCallback(async () => {
    if (!file) return;

    setLocalError(null);
    setIsDeploying(true);

    try {
      setDeployStage('Reading document with GPT-4o…');
      const docResult = await processDocument(file);
      const prompts = docResult?.prompts;
      if (!prompts?.system_prompt) {
        throw new Error('Document processing returned no system prompt');
      }

      setDeployStage('Deploying defense panel agent…');
      const setupSnapshot = {
        difficulty: briefingSetup?.difficulty ?? 'standard',
        sessionMinutes: briefingSetup?.sessionMinutes ?? 5,
        panelPersona: briefingSetup?.panelPersona ?? 'investor',
        practiceGoals: [...(briefingSetup?.practiceGoals ?? [])],
        visionMode: Boolean(briefingSetup?.visionMode),
      };

      const agentResult = await startSession({
        system_prompt: prompts.system_prompt,
        greeting: prompts.greeting,
        briefingSetup: setupSnapshot,
        role_objectives: prompts.role_objectives,
        conversation_flow_structure: prompts.conversation_flow_structure,
        starting_script: prompts.starting_script,
      });
      if (!agentResult?.agent_embed_url) {
        throw new Error('Agent creation returned no embed URL');
      }

      onAgentReady?.({
        agentId: agentResult.agent_id,
        agentEmbedUrl: agentResult.agent_embed_url,
        agentName: agentResult.agent_name,
        agentId2: agentResult.agent_id_2 ?? null,
        agentEmbedUrl2: agentResult.agent_embed_url_2 ?? null,
        agentName2: agentResult.agent_name_2 ?? null,
        prompts,
        documentSummary: docResult.document_summary,
        briefingSetup: setupSnapshot,
      });

      toast.success('Panel deployed — entering arena');
      onInitialize?.();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not deploy the panel.';
      setLocalError(message);
    } finally {
      setIsDeploying(false);
      setDeployStage(null);
    }
  }, [file, briefingSetup, onAgentReady, onInitialize]);

  const buttonLabel = isDeploying
    ? deployStage ?? 'Processing…'
    : isLoading
      ? 'Processing…'
      : resolvedSubmit;

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-50">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-14 text-[17px] leading-relaxed lg:justify-center lg:py-16">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mb-6 flex items-center gap-2 text-[15px] text-zinc-400 hover:text-zinc-200 sm:text-base lg:mb-8"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to lobby
          </button>
        )}

        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-8 text-[17px] leading-relaxed shadow-xl backdrop-blur-md lg:p-10">
          <header className="border-b border-zinc-800/70 pb-8 text-center">
            <p className="mb-2 text-base font-medium uppercase tracking-wider text-blue-400/90">
              {config.title} · Briefing
            </p>
            <h1 className="text-[1.875rem] font-bold tracking-tight lg:text-[2.125rem]">
              {resolvedTitle}
            </h1>
            <p className="mx-auto mt-4 max-w-3xl text-lg leading-relaxed text-zinc-400">
              {resolvedDescription}
            </p>
          </header>

          <div className="mt-8 grid grid-cols-1 gap-10 lg:mt-10 lg:grid-cols-2 lg:gap-10 lg:items-start">
            {/* Left: setup controls */}
            <section className="space-y-8 text-left">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-400/90">
                  Pre-session setup
                </p>
                <p className="mt-1 max-w-xl text-[15px] text-zinc-500 sm:text-base">
                  Optional preferences for rehearsal context. These controls do not alter
                  the agent embed call — purely for UX and pacing.
                </p>
              </div>

              <div>
                <div className="mb-3 flex items-center gap-2 text-[15px] font-semibold uppercase tracking-wide text-zinc-500 sm:text-base">
                  <SlidersHorizontal className="h-4 w-4 shrink-0" aria-hidden />
                  Difficulty
                </div>
                <div className="flex flex-wrap gap-2">
                  {DIFFICULTY_OPTIONS.map(({ id: did, label }) => (
                    <button
                      key={did}
                      type="button"
                      onClick={() => mergeSetup({ difficulty: did })}
                      className={[
                        'rounded-lg px-4 py-2 text-[15px] font-medium transition-colors sm:text-base',
                        difficulty === did
                          ? 'bg-blue-600 text-white ring-2 ring-blue-400/70'
                          : 'border border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:border-zinc-500',
                      ].join(' ')}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center gap-2 text-[15px] font-semibold uppercase tracking-wide text-zinc-500 sm:text-base">
                  <Timer className="h-4 w-4 shrink-0" aria-hidden />
                  Session time (minutes)
                </div>
                <div className="flex flex-wrap gap-2">
                  {SESSION_MINUTES.map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => mergeSetup({ sessionMinutes: mins })}
                      className={[
                        'min-w-[3.25rem] rounded-lg px-3 py-2 text-[15px] font-semibold tabular-nums transition-colors sm:text-base',
                        sessionMinutes === mins
                          ? 'bg-cyan-600 text-white ring-2 ring-cyan-400/60'
                          : 'border border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:border-zinc-500',
                      ].join(' ')}
                    >
                      {mins}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center gap-2 text-[15px] font-semibold uppercase tracking-wide text-zinc-500 sm:text-base">
                  <Users className="h-4 w-4 shrink-0" aria-hidden />
                  Panel personas
                </div>
                <div className="flex flex-wrap gap-2">
                  {personasForMode.map(({ id: pid, label }) => (
                    <button
                      key={pid}
                      type="button"
                      onClick={() => mergeSetup({ panelPersona: pid })}
                      className={[
                        'rounded-lg px-4 py-2 text-[15px] font-medium transition-colors sm:text-base',
                        panelPersona === pid
                          ? 'bg-violet-600 text-white ring-2 ring-violet-400/60'
                          : 'border border-zinc-700 bg-zinc-900/60 text-zinc-300 hover:border-zinc-500',
                      ].join(' ')}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 text-[15px] font-semibold uppercase tracking-wide text-zinc-500 sm:text-base">
                  Practice goals
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {PRACTICE_GOALS.map(({ id: gid, label }) => (
                    <label
                      key={gid}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-3 text-[15px] text-zinc-200 hover:border-zinc-600 sm:text-base"
                    >
                      <input
                        type="checkbox"
                        checked={practiceGoals.includes(gid)}
                        onChange={() => toggleGoal(gid)}
                        className="size-4 rounded border-zinc-600 bg-zinc-950 accent-blue-500"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </section>

            {/* Right: materials + vision */}
            <div className="space-y-6 border-t border-zinc-800/70 pt-8 lg:border-l lg:border-t-0 lg:border-zinc-800/70 lg:pl-10 lg:pt-0">
              <div className="text-left">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-400/90">
                  Materials
                </p>
                <p className="mt-1 max-w-xl text-[15px] text-zinc-500 sm:text-base">
                  Upload one document to anchor the simulation context before you deploy.
                </p>
              </div>

              <label
                htmlFor={inputId}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDragLeave={(e) => {
                  e.preventDefault();
                  if (!e.currentTarget.contains(e.relatedTarget)) {
                    setIsDragging(false);
                  }
                }}
                onDrop={onDrop}
                className={[
                  'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-all duration-150',
                  'focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 focus-within:ring-offset-zinc-950',
                  isDragging
                    ? 'border-blue-500 bg-blue-500/5'
                    : 'border-zinc-800/80 bg-zinc-900/50 hover:border-zinc-500',
                ].join(' ')}
              >
                <input
                  ref={inputRef}
                  id={inputId}
                  type="file"
                  accept={config.accept}
                  className="sr-only"
                  onChange={(e) => handleFiles(e.target.files)}
                />
                <Upload
                  className="h-10 w-10 text-zinc-500"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <span className="mt-3 text-lg font-medium text-zinc-200">
                  {config.uploadHint}
                </span>
                <span className="mt-1 text-[15px] text-zinc-500 sm:text-base">
                  {config.dropzoneSubtext}
                </span>
              </label>

              {file && (
                <div
                  className="flex items-center gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/50 px-4 py-3"
                  role="status"
                >
                  <FileText
                    className="h-5 w-5 shrink-0 text-zinc-300"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-zinc-100 sm:text-base">
                    {file.name}
                  </span>
                  {isExtracting ? (
                    <>
                      <Loader2
                        className="h-5 w-5 shrink-0 animate-spin text-blue-400"
                        aria-hidden
                      />
                      <span className="sr-only">Extracting text</span>
                    </>
                  ) : (
                    <Check
                      className="h-5 w-5 shrink-0 text-green-400"
                      strokeWidth={2}
                      aria-hidden
                    />
                  )}
                  <button
                    type="button"
                    onClick={clearFile}
                    disabled={isExtracting}
                    className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 disabled:pointer-events-none disabled:opacity-40"
                    aria-label="Remove file"
                  >
                    <X className="h-5 w-5" strokeWidth={2} aria-hidden />
                  </button>
                </div>
              )}

              {file && isExtracting && (
                <p className="text-center text-[15px] text-zinc-500 sm:text-base">
                  Extracting text…
                </p>
              )}

              <label className="flex cursor-pointer flex-col gap-3 rounded-xl border border-amber-500/35 bg-amber-500/[0.07] px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
                <span className="flex items-start gap-3">
                  <Eye className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden />
                  <span>
                    <span className="font-medium text-zinc-100">
                      Vision mode
                    </span>
                    <span className="mt-1 block text-[15px] leading-relaxed text-zinc-500 sm:text-base">
                      Enables camera-focused rehearsal when your environment supports it —
                      demo note: may add latency vs lean audio-only runs.
                    </span>
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={visionMode}
                  onChange={(e) => mergeSetup({ visionMode: e.target.checked })}
                  className="mt-2 size-5 shrink-0 cursor-pointer accent-amber-500 sm:mt-0"
                  aria-label="Vision mode toggle"
                />
              </label>
            </div>
          </div>

          {(error || localError) && (
            <p
              className="mt-8 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-center text-base text-red-300"
              role="alert"
            >
              {error || localError}
            </p>
          )}

          <div className="mt-10 flex justify-center border-t border-zinc-800/70 pt-10 lg:mt-12 lg:pt-12">
            <button
              type="button"
              disabled={isLoading || isDeploying || !file || isExtracting}
              onClick={handleDeploy}
              className="flex w-full max-w-lg items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-lg font-semibold text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-colors duration-150 hover:bg-blue-500 disabled:pointer-events-none disabled:opacity-40"
            >
              {(isLoading || isDeploying) && (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              )}
              {buttonLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
