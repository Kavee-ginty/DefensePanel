import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, FileText, Loader2 } from 'lucide-react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { getDocumentKind } from '../lib/extractDocumentText.js';

GlobalWorkerOptions.workerSrc = pdfjsWorker;

const PDF_MAX_PAGES = 120;

export default function PdfPresentationView({
  file = null,
  className = '',
  compact = false,
  arena = false,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [docxHost, setDocxHost] = useState(null);
  const [pptxFrame, setPptxFrame] = useState(null);
  const [pptxHost, setPptxHost] = useState(null);
  const [pdfHost, setPdfHost] = useState(null);
  const resizeTimerRef = useRef(null);
  const pdfResizeTimerRef = useRef(null);
  const activePdfDocRef = useRef(null);
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

  const pdfHostRef = useCallback((node) => {
    setPdfHost(node);
  }, []);

  useEffect(() => {
    if (!file || kind !== 'pdf' || !pdfHost) {
      if (pdfHost) pdfHost.innerHTML = '';
      return undefined;
    }

    let gen = 0;
    const bumpGen = () => {
      gen += 1;
      return gen;
    };

    const run = async (token) => {
      setIsLoading(true);
      setLoadError(null);
      let pdfDoc = null;
      try {
        const raw = await file.arrayBuffer();
        if (token !== gen) return;

        const data = new Uint8Array(raw);
        pdfDoc = await getDocument({ data }).promise;
        if (token !== gen) {
          await pdfDoc.destroy();
          return;
        }

        const prevDoc = activePdfDocRef.current;
        if (prevDoc && prevDoc !== pdfDoc) {
          await prevDoc.destroy().catch(() => {});
        }
        activePdfDocRef.current = pdfDoc;
        pdfHost.innerHTML = '';

        const widthBase =
          pdfHost.clientWidth ||
          pdfHost.getBoundingClientRect().width ||
          Math.min(
            typeof window !== 'undefined' ? window.innerWidth - 24 : 360,
            560,
          );

        const dpr = Math.min(
          typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
          2,
        );
        const total = Math.min(pdfDoc.numPages, PDF_MAX_PAGES);

        for (let i = 1; i <= total; i += 1) {
          if (token !== gen) break;
          const page = await pdfDoc.getPage(i);
          const base = page.getViewport({ scale: 1 });
          const scale = Math.min(
            2.5,
            Math.max(0.4, (widthBase - 16) / base.width),
          );
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d', { alpha: false });
          canvas.style.width = `${Math.floor(viewport.width)}px`;
          canvas.style.height = `${Math.floor(viewport.height)}px`;
          canvas.width = Math.floor(viewport.width * dpr);
          canvas.height = Math.floor(viewport.height * dpr);
          canvas.className =
            'mx-auto mb-3 max-w-full rounded border border-zinc-800/90 bg-white shadow-sm';
          if (dpr !== 1) {
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          }
          await page.render({ canvasContext: ctx, viewport }).promise;
          if (token !== gen) break;
          pdfHost.appendChild(canvas);
          page.cleanup();
        }

        if (token === gen && pdfDoc.numPages > PDF_MAX_PAGES) {
          const note = document.createElement('p');
          note.className = 'px-2 pb-4 text-center text-xs text-zinc-500';
          note.textContent = `Showing first ${PDF_MAX_PAGES} pages only.`;
          pdfHost.appendChild(note);
        }

        if (token !== gen && pdfDoc) {
          await pdfDoc.destroy().catch(() => {});
          if (activePdfDocRef.current === pdfDoc) {
            activePdfDocRef.current = null;
          }
        }
      } catch (err) {
        if (token === gen) {
          console.error('[PdfPresentationView] PDF render failed', err);
          setLoadError('Could not preview this PDF.');
        }
        if (pdfDoc) {
          await pdfDoc.destroy().catch(() => {});
          if (activePdfDocRef.current === pdfDoc) {
            activePdfDocRef.current = null;
          }
        }
      } finally {
        if (token === gen) {
          setIsLoading(false);
        }
      }
    };

    const schedule = () => {
      const token = bumpGen();
      requestAnimationFrame(() => {
        void run(token);
      });
    };

    schedule();

    const ro = new ResizeObserver(() => {
      window.clearTimeout(pdfResizeTimerRef.current);
      pdfResizeTimerRef.current = window.setTimeout(schedule, 200);
    });
    ro.observe(pdfHost);

    return () => {
      bumpGen();
      ro.disconnect();
      window.clearTimeout(pdfResizeTimerRef.current);
      void activePdfDocRef.current?.destroy().catch(() => {});
      activePdfDocRef.current = null;
      pdfHost.innerHTML = '';
    };
  }, [file, kind, pdfHost]);

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

  return (
    <div className={[frameClass, className].join(' ')}>
      {file && kind === 'pdf' ? (
        <div className="flex min-h-0 flex-1 flex-col bg-zinc-950">
          <div
            ref={pdfHostRef}
            className="pdf-canvas-host min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 py-4 sm:px-4"
            aria-label={file?.name ? `PDF preview: ${file.name}` : 'PDF preview'}
          />
        </div>
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
