import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';

export default function PdfPresentationView({ file = null, className = '' }) {
  const [objectUrl, setObjectUrl] = useState(null);

  useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div
      className={[
        'relative flex min-h-[280px] w-full flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 ring-1 ring-zinc-800/80 lg:min-h-[min(72vh,720px)]',
        className,
      ].join(' ')}
    >
      {objectUrl ? (
        <iframe
          src={objectUrl}
          title={file?.name || 'Presentation'}
          className="h-full min-h-[280px] w-full flex-1 border-0 lg:min-h-[min(72vh,720px)]"
        />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <FileText className="h-12 w-12 text-zinc-600" aria-hidden />
          <p className="text-sm font-medium text-zinc-300">No presentation loaded</p>
          <p className="max-w-sm text-xs text-zinc-500">
            Upload your pitch deck in the briefing step to display slides here.
          </p>
        </div>
      )}

      {file?.name && (
        <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/55 px-3 py-1 text-xs font-medium text-zinc-200 backdrop-blur-sm">
          {file.name}
        </div>
      )}
    </div>
  );
}
