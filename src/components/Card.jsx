export default function Card({ children, className = '' }) {
  return (
    <div
      className={`bg-zinc-900/40 border border-white/5 rounded-xl p-6 backdrop-blur-sm ${className}`.trim()}
    >
      {children}
    </div>
  )
}
