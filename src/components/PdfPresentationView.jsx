import { useEffect, useMemo, useState } from 'react';
import { FileText } from 'lucide-react';
import { getDocumentKind } from '../lib/extractDocumentText.js';

export default function PdfPresentationView({
  file = null,
  className = '',
  compact = false,
  arena = false,
}) {
  const [objectUrl, setObjectUrl] = useState(null);
  const kind = useMemo(() => getDocumentKind(file), [file]);

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

  const frameClass = arena
    ? 'absolute inset-0 flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 ring-1 ring-zinc-800/80'
    : compact
      ? 'relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 ring-1 ring-zinc-800/80'
      : 'relative flex min-h-[280px] w-full flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 ring-1 ring-zinc-800/80 lg:min-h-[min(72vh,720px)]';

  const embedClass = 'h-full min-h-0 w-full flex-1 border-0';

  const embedSrc = objectUrl
    ? `${objectUrl}#toolbar=0&navpanes=0&scrollbar=1`
    : null;

  return (
    <div className={[frameClass, className].join(' ')}>
      {embedSrc ? (
        <embed
          src={embedSrc}
          type="application/pdf"
          title={file?.name || 'Presentation'}
          className={embedClass}
        />
      ) : file && kind && kind !== 'pdf' ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <FileText className="h-12 w-12 text-zinc-600" aria-hidden />
          <p className="text-sm font-medium text-zinc-300">
            {file.name}
          </p>
          <p className="max-w-sm text-xs text-zinc-500">
            Only PDF files display as slides in the arena. Word and PowerPoint
            uploads are used for AI context during the session.
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

      {file?.name && embedSrc && (
        <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/10 bg-black/55 px-3 py-1 text-xs font-medium text-zinc-200 backdrop-blur-sm">
          {file.name}
        </div>
      )}
    </div>
  );
}
