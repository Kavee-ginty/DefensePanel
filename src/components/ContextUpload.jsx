import { useCallback, useId, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, FileText, Loader2, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getModeConfig } from '../config/modeConfig.js';
import {
  extractDocumentText,
  getDocumentKind,
} from '../lib/extractDocumentText.js';
import { processDocument, startSession } from '../lib/sessionApi.js';

export default function ContextUpload({
  mode = 'startup',
  file = null,
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
    if (file.type && file.type !== 'application/pdf') {
      const msg = 'Backend currently only supports PDF uploads.';
      setLocalError(msg);
      toast.error(msg);
      return;
    }

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
      const agentResult = await startSession({
        system_prompt: prompts.system_prompt,
        greeting: prompts.greeting,
      });
      if (!agentResult?.agent_embed_url) {
        throw new Error('Agent creation returned no embed URL');
      }

      onAgentReady?.({
        agentId: agentResult.agent_id,
        agentEmbedUrl: agentResult.agent_embed_url,
        agentName: agentResult.agent_name,
        prompts,
        documentSummary: docResult.document_summary,
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
  }, [file, onAgentReady, onInitialize]);

  const buttonLabel = isDeploying
    ? deployStage ?? 'Processing…'
    : isLoading
      ? 'Processing…'
      : resolvedSubmit;

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-50">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-16">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mb-4 flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to lobby
          </button>
        )}

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 shadow-xl backdrop-blur-md">
          <p className="mb-2 text-center text-xs font-medium uppercase tracking-wider text-blue-400/90">
            {config.title} · Briefing
          </p>
          <h1 className="text-center text-2xl font-bold tracking-tight">
            {resolvedTitle}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-center text-sm leading-relaxed text-zinc-400">
            {resolvedDescription}
          </p>

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
              'mt-8 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-all duration-150',
              'focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 focus-within:ring-offset-zinc-950',
              isDragging
                ? 'border-blue-500 bg-blue-500/5'
                : 'border-zinc-700 bg-zinc-900/50 hover:border-zinc-500',
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
            <span className="mt-3 text-sm font-medium text-zinc-200">
              {config.uploadHint}
            </span>
            <span className="mt-1 text-xs text-zinc-500">
              {config.dropzoneSubtext}
            </span>
          </label>

          {file && (
            <div
              className="mt-4 flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3"
              role="status"
            >
              <FileText
                className="h-5 w-5 shrink-0 text-zinc-300"
                strokeWidth={2}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-100">
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
            <p className="mt-2 text-center text-xs text-zinc-500">
              Extracting text…
            </p>
          )}

          {(error || localError) && (
            <p
              className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-center text-sm text-red-300"
              role="alert"
            >
              {error || localError}
            </p>
          )}

          <button
            type="button"
            disabled={isLoading || isDeploying || !file || isExtracting}
            onClick={handleDeploy}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-all duration-150 hover:scale-[1.02] hover:bg-blue-500 disabled:pointer-events-none disabled:opacity-40"
          >
            {(isLoading || isDeploying) && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            )}
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
