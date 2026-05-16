import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, FileText, Loader2 } from 'lucide-react';
import { getDocumentKind } from '../lib/extractDocumentText.js';

export default function PdfPresentationView({
  file = null,
  className = '',
  compact = false,
  arena = false,
}) {
  const [objectUrl, setObjectUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [docxHost, setDocxHost] = useState(null);
  const [pptxFrame, setPptxFrame] = useState(null);
  const [pptxHost, setPptxHost] = useState(null);
  const resizeTimerRef = useRef(null);
  const kind = useMemo(() => getDocumentKind(file), [file]);

  const docxRef = useCallback((node) => {
    setDocxHost(node);
  }, []);

  const pptxFrameRef = useCallback((node) => {
    setPptxFrame(node);
  }, []);

  const pptxHostRef = useCallback((node) => {
    setPptxHost(node);
  }, []);

  useEffect(() => {
    if (!file || kind === 'pdf' || !kind) {
      setIsLoading(false);
      setLoadError(null);
    }
  }, [file, kind]);

  useEffect(() => {
    if (!file || kind !== 'pdf') {
      setObjectUrl(null);
      return undefined;
    }

    const url = URL.createObjectURL(
      new Blob([file], { type: 'application/pdf' }),
    );
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file, kind]);

  useEffect(() => {
    if (!file || kind !== 'docx' || !docxHost) {
      if (docxHost) docxHost.innerHTML = '';
      return undefined;
    }

    let cancelled = false;
    docxHost.innerHTML = '';
    setIsLoading(true);
    setLoadError(null);

    (async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const { renderAsync } = await import('docx-preview');
        if (cancelled) return;
        await renderAsync(arrayBuffer, docxHost, null, {
          className: 'docx-arena',
          inWrapper: true,
          breakPages: true,
          ignoreWidth: false,
          ignoreHeight: false,
          useBase64URL: true,
        });
      } catch (err) {
        if (!cancelled) {
          console.error('[PdfPresentationView] DOCX preview failed', err);
          setLoadError('Could not preview this Word document.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      docxHost.innerHTML = '';
    };
  }, [file, kind, docxHost]);

  useEffect(() => {
    if (!file || kind !== 'pptx' || !pptxFrame || !pptxHost) {
      if (pptxHost) pptxHost.innerHTML = '';
      return undefined;
    }

    let cancelled = false;
    let observer = null;
    let arrayBuffer = null;

    const renderPreview = async ({ showLoading = false } = {}) => {
      if (cancelled) return;
      if (pptxFrame.clientWidth <= 0) return;

      if (showLoading) {
        setIsLoading(true);
        setLoadError(null);
      }

      try {
        if (!arrayBuffer) arrayBuffer = await file.arrayBuffer();
        const width = Math.max(320, Math.min(pptxFrame.clientWidth - 32, 1100));
        const height = Math.round((width * 9) / 16);
        const { init } = await import('pptx-preview');
        if (cancelled) return;
        pptxHost.innerHTML = '';
        const viewer = init(pptxHost, { width, height });
        await viewer.preview(arrayBuffer);
      } catch (err) {
        if (!cancelled) {
          console.error('[PdfPresentationView] PPTX preview failed', err);
          setLoadError('Could not preview this PowerPoint deck.');
        }
      } finally {
        if (!cancelled && showLoading) setIsLoading(false);
      }
    };

    const scheduleRender = (showLoading = false) => {
      requestAnimationFrame(() => {
        if (!cancelled) void renderPreview({ showLoading });
      });
    };

    scheduleRender(true);

    observer = new ResizeObserver(() => {
      window.clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = window.setTimeout(() => {
        scheduleRender(false);
      }, 180);
    });
    observer.observe(pptxFrame);

    return () => {
      cancelled = true;
      observer?.disconnect();
      window.clearTimeout(resizeTimerRef.current);
      pptxHost.innerHTML = '';
    };
  }, [file, kind, pptxFrame, pptxHost]);

  const frameClass = arena
    ? 'absolute inset-0 flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 ring-1 ring-zinc-800/80'
    : compact
      ? 'relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 ring-1 ring-zinc-800/80'
      : 'relative flex min-h-[280px] w-full flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 ring-1 ring-zinc-800/80 lg:min-h-[min(72vh,720px)]';

  const viewerClass = 'h-full min-h-0 w-full flex-1 border-0 bg-zinc-950';

  const pdfSrc = objectUrl
    ? `${objectUrl}#toolbar=0&navpanes=0&scrollbar=1`
    : null;

  return (
    <div className={[frameClass, className].join(' ')}>
      {pdfSrc ? (
        <iframe
          src={pdfSrc}
          title={file?.name || 'Presentation'}
          className={viewerClass}
        />
      ) : file && kind === 'docx' ? (
        <div className="flex min-h-0 flex-1 flex-col bg-zinc-950">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
            <div ref={docxRef} className="docx-preview-host min-w-0" />
          </div>
        </div>
      ) : file && kind === 'pptx' ? (
        <div
          ref={pptxFrameRef}
          className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-zinc-950 p-4 sm:p-6"
        >
          <div ref={pptxHostRef} className="pptx-preview-host" />
        </div>
      ) : file && kind ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <FileText className="h-12 w-12 text-zinc-600" aria-hidden />
          <p className="max-w-sm text-xs text-zinc-500">
            This file type is not supported in the arena preview.
          </p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <FileText className="h-12 w-12 text-zinc-600" aria-hidden />
          <p className="text-sm font-medium text-zinc-300">
            No presentation loaded
          </p>
          <p className="max-w-sm text-xs text-zinc-500">
            Upload your pitch deck in the briefing step to display slides here.
          </p>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-zinc-950/85 text-center backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" aria-hidden />
          <p className="text-sm font-medium text-zinc-200">
            Loading presentation preview…
          </p>
        </div>
      )}

      {loadError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-zinc-950/90 px-6 text-center">
          <AlertTriangle className="h-10 w-10 text-amber-400" aria-hidden />
          <p className="text-sm font-medium text-zinc-200">{loadError}</p>
          <p className="max-w-sm text-xs text-zinc-500">
            Try exporting to PDF if this document uses unsupported Office
            features.
          </p>
        </div>
      )}
    </div>
  );
}
