import { Link } from 'react-router-dom'
import AvatarView from '../components/AvatarView.jsx'
import Button from '../components/Button.jsx'

/** Temporary: embed a fixed Beyond Presence agent for manual testing. */
const BEY_TEST_EMBED_URL =
  'https://bey.chat/8e4c9c7f-f75d-48de-a176-b28b97485444'

export default function AgentTestPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      <header className="shrink-0 border-b border-zinc-800 px-4 py-3 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-zinc-50">Agent test</h1>
          <p className="text-xs text-zinc-500 font-mono break-all">
            {BEY_TEST_EMBED_URL}
          </p>
        </div>
        <Link to="/">
          <Button variant="ghost">Back to lobby</Button>
        </Link>
      </header>

      <main className="flex-1 min-h-0 p-4 flex flex-col">
        <p className="text-zinc-500 text-sm mb-3">
          Allow camera and microphone when the browser prompts. Use fullscreen on
          the embed if needed. If the iframe stays blank, try opening the agent
          directly:{' '}
          <a
            href={BEY_TEST_EMBED_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline hover:text-blue-300"
          >
            bey.chat (new tab)
          </a>
          .
        </p>
        <div className="flex-1 min-h-[70vh] max-w-5xl mx-auto w-full">
          <AvatarView embedUrl={BEY_TEST_EMBED_URL} label="Bey test agent" />
        </div>
      </main>
    </div>
  )
}
