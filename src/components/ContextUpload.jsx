import { useCallback, useId, useMemo, useState } from 'react';
import { ArrowLeft, Check, FileText, Upload } from 'lucide-react';
import { getModeConfig } from '../config/modeConfig.js';

export default function ContextUpload({
  mode = 'startup',
  file = null,
  onFileChange,
  onInitialize,
  onBack,
  isLoading = false,
  error = null,
  title,
  description,
  submitLabel,
}) {
  const config = useMemo(() => getModeConfig(mode), [mode]);
  const inputId = useId();
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState(null);

  const resolvedTitle = title ?? config.briefingTitle;
  const resolvedDescription = description ?? config.briefingDescription;
  const resolvedSubmit = submitLabel ?? config.submitLabel;

  const handleFiles = useCallback(
    (files) => {
      const next = files?.[0];
      if (!next) return;
      if (next.type !== 'application/pdf') {
        setLocalError(config.pdfError);
        onFileChange?.(null);
        return;
      }
      setLocalError(null);
      onFileChange?.(next);
    },
    [onFileChange, config.pdfError],
  );

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer?.files);
  };

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
              <Check
                className="h-5 w-5 shrink-0 text-green-400"
                strokeWidth={2}
                aria-hidden
              />
            </div>
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
            disabled={isLoading || !file}
            onClick={() => onInitialize?.()}
            className="mt-8 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-all duration-150 hover:scale-[1.02] hover:bg-blue-500 disabled:pointer-events-none disabled:opacity-40"
          >
            {isLoading ? 'Processing…' : resolvedSubmit}
          </button>
        </div>
      </div>
    </div>
  );
}

