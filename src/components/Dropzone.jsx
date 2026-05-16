import { useCallback, useState } from 'react'

export default function Dropzone({ onFileAccepted, loading }) {
  const [dragOver, setDragOver] = useState(false)
  const [successName, setSuccessName] = useState(null)

  const acceptPdf = useCallback(
    async (file) => {
      if (!file || file.type !== 'application/pdf') {
        return
      }
      setSuccessName(file.name)
      await onFileAccepted?.(file)
    },
    [onFileAccepted],
  )

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) void acceptPdf(file)
  }

  const onChange = (e) => {
    const file = e.target.files?.[0]
    if (file) void acceptPdf(file)
  }

  const borderClass = loading
    ? 'border-zinc-700'
    : dragOver
      ? 'border-blue-500'
      : 'border-zinc-700 border-dashed'

  return (
    <div
      className={`bg-zinc-900/50 rounded-xl min-h-48 flex items-center justify-center border-2 ${borderClass} transition-colors`}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 px-6 py-8 text-center w-full h-full min-h-48">
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={onChange}
          disabled={loading}
        />
        {loading ? (
          <span className="text-zinc-300 font-mono text-sm">
            &gt; Analyzing document...
          </span>
        ) : successName ? (
          <span className="text-emerald-400 text-sm font-medium break-all max-w-full px-2">
            {successName}
          </span>
        ) : (
          <>
            <span className="text-zinc-200 text-sm">
              Drop a PDF here or click to upload
            </span>
            <span className="text-zinc-500 text-xs">PDF only</span>
          </>
        )}
      </label>
    </div>
  )
}
