import { useNavigate } from 'react-router-dom'
import Card from '../components/Card.jsx'
import Button from '../components/Button.jsx'
import { useApp } from '../context/AppContext.jsx'

export default function DebriefDashboard() {
  const navigate = useNavigate()
  const { grades, resetApp } = useApp()

  const overall = grades?.overall_score ?? '—'
  const filler = grades?.filler_word_count ?? '—'
  const pacing = grades?.pacing_score ?? '—'
  const feedback =
    grades?.critical_feedback ||
    'Complete a session to see AI-generated feedback here.'

  return (
    <div className="bg-zinc-950 min-h-screen text-zinc-100">
      <div className="max-w-4xl mx-auto px-8 py-12">
        <h1 className="text-3xl font-bold text-zinc-50 mb-2">Debrief</h1>
        <p className="text-zinc-400 mb-8">Session analytics and feedback</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <p className="text-zinc-500 text-sm mb-1">Overall Score</p>
            <p className="text-3xl font-bold text-zinc-50">{overall}</p>
          </Card>
          <Card>
            <p className="text-zinc-500 text-sm mb-1">Filler Words</p>
            <p className="text-3xl font-bold text-zinc-50">{filler}</p>
          </Card>
          <Card>
            <p className="text-zinc-500 text-sm mb-1">Pacing Score</p>
            <p className="text-3xl font-bold text-zinc-50">{pacing}</p>
          </Card>
        </div>

        <Card className="mb-10">
          <p className="text-zinc-500 text-sm mb-3">Critical feedback</p>
          <p className="text-lg text-zinc-200 leading-relaxed whitespace-pre-wrap">
            {feedback}
          </p>
        </Card>

        <Button
          variant="primary"
          onClick={() => {
            resetApp?.()
            navigate('/')
          }}
        >
          Return to Lobby
        </Button>
      </div>
    </div>
  )
}
