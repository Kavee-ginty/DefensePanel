import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { getDocumentKind } from '../lib/extractDocumentText.js';

function waitForRef(getEl) {
  return new Promise((resolve) => {
    const tick = () => {
      const el = getEl();
      if (el) resolve(el);
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

export default function PdfPresentationView({
  file = null,
  className = '',
  compact = false,
  arena = false,
}) {
  const [objectUrl, setObjectUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [visualReady, setVisualReady] = useState(false);

  const docxContainerRef = useRef(null);
  const pptxContainerRef = useRef(null);
  const pptxBufferRef = useRef(null);

  const kind = useMemo(() => getDocumentKind(file), [file]);

  useEffect(() => {
    if (!file || kind !== 'pdf') {
      setObjectUrl(null);
      setVisualReady(false);
      return undefined;
    }

    const url = URL.createObjectURL(
      new Blob([file], { type: 'application/pdf' }),
    );
    setObjectUrl(url);
    setVisualReady(true);
    return () => URL.revokeObjectURL(url);
  }, [file, kind]);

  useEffect(() => {
    if (!file || kind !== 'docx') return undefined;

    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setVisualReady(false);

    (async () => {
      try {
        const container = await waitForRef(() => docxContainerRef.current);
        if (cancelled) return;

        container.innerHTML = '';
        const { renderAsync } = await import('docx-preview');
        const buffer = await file.arrayBuffer();
        if (cancelled) return;

        await renderAsync(buffer, container, null, {
          className: 'docx-arena',
          inWrapper: true,
          breakPages: true,
          ignoreWidth: false,
          ignoreHeight: false,
          useBase64URL: true,
        });
        if (!cancelled) setVisualReady(true);
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : 'Could not load document.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (docxContainerRef.current) {
        docxContainerRef.current.innerHTML = '';
      }
    };
  }, [file, kind]);

  const renderPptx = useCallback(async () => {
    const container = pptxContainerRef.current;
    if (!container || !file || kind !== 'pptx') return;

    const width = Math.max(
      320,
      container.clientWidth ||
        container.parentElement?.clientWidth ||
        960,
    );
    const height = Math.round(width * (9 / 16));

    container.innerHTML = '';
    const { init } = await import('pptx-preview');
    const viewer = init(container, { width, height });

    if (!pptxBufferRef.current) {
      pptxBufferRef.current = await file.arrayBuffer();
    }
    await viewer.preview(pptxBufferRef.current);
  }, [file, kind]);

  useEffect(() => {
    if (!file || kind !== 'pptx') return undefined;

    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setVisualReady(false);
    pptxBufferRef.current = null;

    (async () => {
      try {
        await waitForRef(() => pptxContainerRef.current);
        if (cancelled) return;

        pptxBufferRef.current = await file.arrayBuffer();
        if (cancelled) return;

        await renderPptx();
        if (!cancelled) setVisualReady(true);
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error
              ? err.message
              : 'Could not load presentation.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      pptxBufferRef.current = null;
      if (pptxContainerRef.current) {
        pptxContainerRef.current.innerHTML = '';
      }
    };
  }, [file, kind, renderPptx]);

  useEffect(() => {
    if (kind !== 'pptx' || !visualReady || loading) return undefined;

    const container = pptxContainerRef.current;
    if (!container) return undefined;

    let timeoutId;
    const observer = new ResizeObserver(() => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        renderPptx().catch(() => {});
      }, 200);
    });

    observer.observe(container);
    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [kind, visualReady, loading, renderPptx]);

  const frameClass = arena
    ? 'absolute inset-0 flex flex-col overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-950 ring-1 ring-zinc-800/80'
    : compact
      ? 'relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-950 ring-1 ring-zinc-800/80'
      : 'relative flex min-h-[280px] w-full flex-col overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-950 ring-1 ring-zinc-800/80 lg:min-h-[min(72vh,720px)]';

  const embedClass = 'h-full min-h-0 w-full flex-1 border-0';

  const embedSrc = objectUrl
    ? `${objectUrl}#toolbar=0&navpanes=0&scrollbar=1`
    : null;

  const showFilename =
    file?.name && (embedSrc || (visualReady && !loadError));

  const loadingOverlay = loading && (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-zinc-950/80 text-zinc-400">
      <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
      <p className="text-sm">Loading presentation…</p>
    </div>
  );

  const renderContent = () => {
    if (loadError) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <FileText className="h-12 w-12 text-red-400/80" aria-hidden />
          <p className="text-sm font-medium text-red-300">{loadError}</p>
        </div>
      );
    }

    if (embedSrc) {
      return (
        <embed
          src={embedSrc}
          type="application/pdf"
          title={file?.name || 'Presentation'}
          className={embedClass}
        />
      );
    }

    if (kind === 'docx') {
      return (
        <div className="relative min-h-0 flex-1">
          {loadingOverlay}
          <div
            ref={docxContainerRef}
            className="docx-arena-host h-full min-h-0 overflow-y-auto"
          />
        </div>
      );
    }

    if (kind === 'pptx') {
      return (
        <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden">
          {loadingOverlay}
          <div
            ref={pptxContainerRef}
            className="flex w-full max-w-full items-center justify-center"
          />
        </div>
      );
    }

    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <FileText className="h-12 w-12 text-zinc-600" aria-hidden />
        <p className="text-sm font-medium text-zinc-300">No presentation loaded</p>
        <p className="max-w-sm text-xs text-zinc-500">
          Upload your pitch deck in the briefing step to display slides here.
        </p>
      </div>
    );
  };

  return (
    <div className={[frameClass, className].join(' ')}>
      {renderContent()}
      {showFilename && (
        <div className="pointer-events-none absolute left-3 top-3 z-20 rounded-full border border-white/10 bg-black/55 px-3 py-1 text-xs font-medium text-zinc-200 backdrop-blur-sm">
          {file.name}
        </div>
      )}
    </div>
  );
}
