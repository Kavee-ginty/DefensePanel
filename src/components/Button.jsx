import { Loader2 } from 'lucide-react'

const variants = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:hover:bg-blue-600',
  ghost:
    'border border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-50',
  danger:
    'bg-red-600 text-white hover:bg-red-500 disabled:opacity-50 disabled:hover:bg-red-600',
}

export default function Button({
  children,
  variant = 'primary',
  onClick,
  disabled,
  loading,
  type = 'button',
  className = '',
}) {
  const base =
    'rounded-lg px-4 py-2 font-medium transition-all duration-150 inline-flex items-center justify-center gap-2'
  const cls = `${base} ${variants[variant] ?? variants.primary} ${className}`.trim()

  return (
    <button
      type={type}
      className={cls}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : null}
      {children}
    </button>
  )
}
