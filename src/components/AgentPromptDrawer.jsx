import { X } from 'lucide-react'
import Button from './Button.jsx'

function PromptSection({ title, text, tall }) {
  if (!text?.trim()) return null
  const maxH = tall
    ? 'max-h-[min(70vh,36rem)]'
    : 'max-h-48'
  return (
    <div className="mb-6 last:mb-0">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
        {title}
      </h3>
      <pre
        className={`text-sm text-zinc-300 whitespace-pre-wrap break-words font-mono leading-relaxed bg-zinc-950/80 border border-zinc-800 rounded-lg p-3 overflow-y-auto ${maxH}`}
      >
        {text}
      </pre>
    </div>
  )
}

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {string | null} [props.systemPrompt]
 * @param {string | null} [props.greeting]
 * @param {string | null} [props.roleObjectives]
 * @param {string | null} [props.conversationFlow]
 * @param {string | null} [props.startingScript]
 */
export default function AgentPromptDrawer({
  open,
  onClose,
  systemPrompt,
  greeting,
  roleObjectives,
  conversationFlow,
  startingScript,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        type="button"
        aria-label="Close prompt panel"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <aside className="relative w-full max-w-xl h-full bg-zinc-900 border-l border-zinc-800 shadow-2xl flex flex-col">
        <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-100">
            Generated agent config
          </h2>
          <Button variant="ghost" onClick={onClose} className="!p-2">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
          {!systemPrompt?.trim() &&
          !greeting?.trim() &&
          !roleObjectives?.trim() &&
          !conversationFlow?.trim() &&
          !startingScript?.trim() ? (
            <p className="text-zinc-500 text-sm">
              No prompt text is stored in this session. Upload a PDF again from
              the briefing room to generate one.
            </p>
          ) : (
            <>
              <PromptSection
                title="System prompt (sent to Beyond)"
                text={systemPrompt}
                tall
              />
              <PromptSection title="Greeting / opening" text={greeting} />
              <PromptSection title="Role & objectives" text={roleObjectives} />
              <PromptSection
                title="Conversational flow & structure"
                text={conversationFlow}
              />
              <PromptSection title="Starting script" text={startingScript} />
            </>
          )}
        </div>
      </aside>
    </div>
  )
}
