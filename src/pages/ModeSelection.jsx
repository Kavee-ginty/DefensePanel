import { Link, useNavigate } from 'react-router-dom'
import Card from '../components/Card.jsx'
import { useApp } from '../context/AppContext.jsx'

const MODES = [
  {
    key: 'Startup Pitch',
    title: 'Startup Pitch',
    desc: 'Defend your deck against a skeptical VC panel.',
  },
  {
    key: 'Academic Viva',
    title: 'Academic Viva',
    desc: 'Oral defense of your thesis with sharp follow-ups.',
  },
  {
    key: 'Tech Interview',
    title: 'Tech Interview',
    desc: 'System design and depth — stay precise under pressure.',
  },
]

export default function ModeSelection() {
  const navigate = useNavigate()
  const { setScenario } = useApp()

  return (
    <div className="min-h-screen bg-black text-zinc-50 flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-4xl w-full text-center mb-12">
        <h1 className="text-4xl font-bold text-zinc-50 mb-3">
          The Defense Panel
        </h1>
        <p className="text-zinc-400 text-lg">Choose your simulation mode</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => {
              setScenario(m.key)
              navigate('/setup')
            }}
            className="text-left rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Card className="h-full hover:border-zinc-500 cursor-pointer transition-colors">
              <h2 className="text-xl font-semibold text-white mb-2">{m.title}</h2>
              <p className="text-zinc-400 text-sm leading-relaxed">{m.desc}</p>
            </Card>
          </button>
        ))}
      </div>

      <p className="mt-14 text-center text-sm">
        <Link
          to="/agent-test"
          className="text-zinc-500 underline hover:text-zinc-400 focus-visible:outline focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
        >
          Open Bey agent test page
        </Link>
      </p>
    </div>
  )
}
