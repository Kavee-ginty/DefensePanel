/**
 * Briefing preferences → text appended to the Beyond Presence agent system prompt.
 * Shared logic for POST /api/start-session (server-side composition).
 */

const SESSION_MINUTES_ALLOWED = new Set([3, 5, 10, 15])

const DIFFICULTY_LINES = {
  friendly:
    'Friendly difficulty: be constructive and encouraging while still probing claims; avoid harsh insults; give brief hints when the user is stuck.',
  standard:
    'Standard difficulty: professional skepticism; challenge weak logic and vague metrics without being abusive.',
  brutal:
    'Brutal difficulty: maximum pressure; interrupt evasive answers; challenge every vague metric; no hand-holding.',
}

const PERSONA_LINES = {
  investor:
    'Panel persona — Investor: prioritize traction, market size, revenue model, defensibility, unit economics, and competitive moat.',
  cfo:
    'Panel persona — CFO: prioritize budgets, burn, runway, cost structure, financial assumptions, and risk to cash flow.',
  professor:
    'Panel persona — Professor: prioritize methodology, evidence, limitations, citations to the document, and intellectual rigor.',
}

const GOAL_LINES = {
  filler_words:
    'Practice goal — Reduce filler words: call out "um", "uh", "like", "basically", and similar; ask them to restate crisply.',
  confidence:
    'Practice goal — Improve confidence: push for concise assertions; discourage hedging; demand direct answers.',
  technical_depth:
    'Practice goal — Improve technical depth: ask for specifics on architecture, data flow, failure modes, and trade-offs.',
  objections:
    'Practice goal — Handle objections: simulate pushback on pricing, timing, team, and competition; force rebuttals.',
}

const MAX_COMPOSED_SYSTEM_PROMPT = 14_000

/**
 * @typedef {{
 *   difficulty: 'friendly'|'standard'|'brutal',
 *   sessionMinutes: number,
 *   panelPersona: 'investor'|'cfo'|'professor',
 *   practiceGoals: string[],
 *   visionMode: boolean,
 * }} BriefingSetup
 */

/**
 * @param {unknown} raw JSON string from multipart field
 * @returns {BriefingSetup | null}
 */
export function parseBriefingSetup(raw) {
  if (!raw || typeof raw !== 'string' || !raw.trim()) return null
  try {
    const obj = JSON.parse(raw)
    if (!obj || typeof obj !== 'object') return null
    return normalizeBriefingSetup(obj)
  } catch {
    return null
  }
}

/**
 * @param {Record<string, unknown>} s
 * @returns {BriefingSetup}
 */
function normalizeBriefingSetup(s) {
  const minutes = Number(s.sessionMinutes)
  const sessionMinutes = SESSION_MINUTES_ALLOWED.has(minutes) ? minutes : 5
  const d = String(s.difficulty || 'standard')
  const difficulty = ['friendly', 'standard', 'brutal'].includes(d)
    ? /** @type {'friendly'|'standard'|'brutal'} */ (d)
    : 'standard'
  const pp = String(s.panelPersona || 'investor')
  const panelPersona = ['investor', 'cfo', 'professor'].includes(pp)
    ? /** @type {'investor'|'cfo'|'professor'} */ (pp)
    : 'investor'
  const practiceGoals = Array.isArray(s.practiceGoals)
    ? s.practiceGoals.filter((g) => typeof g === 'string' && g.trim())
    : []
  return {
    difficulty,
    sessionMinutes,
    panelPersona,
    practiceGoals,
    visionMode: Boolean(s.visionMode),
  }
}

/**
 * @param {BriefingSetup | null} setup
 * @returns {string}
 */
export function buildPreferenceInstructions(setup) {
  if (!setup) return ''

  const lines = []
  lines.push('SESSION PREFERENCES (from user briefing — honor these throughout):')
  lines.push(DIFFICULTY_LINES[setup.difficulty] ?? DIFFICULTY_LINES.standard)
  lines.push(
    `Target session length: ${setup.sessionMinutes} minutes. Pace questions accordingly; do not drag past this feel.`,
  )
  lines.push(PERSONA_LINES[setup.panelPersona] ?? PERSONA_LINES.investor)

  if (setup.practiceGoals?.length) {
    const goalText = setup.practiceGoals
      .map((id) => GOAL_LINES[id])
      .filter(Boolean)
    if (goalText.length) {
      lines.push('Practice goals:')
      goalText.forEach((g) => lines.push(`- ${g}`))
    }
  }

  if (setup.visionMode) {
    lines.push(
      'Vision mode is ON: the user may be on camera — you may reference presentation presence, clarity, and confidence when relevant; keep remarks brief.',
    )
  } else {
    lines.push(
      'Vision mode is OFF: focus on verbal answers and document-backed logic; do not insist on visual appearance.',
    )
  }

  return lines.join('\n')
}

/**
 * Assemble the final system prompt sent to Beyond Presence.
 *
 * @param {{
 *   systemPrompt: string
 *   roleObjectives?: string
 *   conversationFlowStructure?: string
 *   startingScript?: string
 *   briefingSetup?: BriefingSetup | null
 * }} p
 * @returns {string}
 */
export function composeAgentSystemPrompt(p) {
  const base = String(p.systemPrompt || '').trim()
  const blocks = [base]

  const ro = String(p.roleObjectives || '').trim()
  if (ro) {
    blocks.push('\n\nROLE OBJECTIVES (from document analysis):\n' + ro)
  }
  const cf = String(p.conversationFlowStructure || '').trim()
  if (cf) {
    blocks.push('\n\nCONVERSATION FLOW (from document analysis):\n' + cf)
  }
  const ss = String(p.startingScript || '').trim()
  if (ss) {
    blocks.push('\n\nSTARTING SCRIPT HINTS (from document analysis):\n' + ss)
  }

  const pref = buildPreferenceInstructions(p.briefingSetup ?? null)
  if (pref) {
    blocks.push('\n\n' + pref)
  }

  let out = blocks.join('')
  if (out.length > MAX_COMPOSED_SYSTEM_PROMPT) {
    out =
      out.slice(0, MAX_COMPOSED_SYSTEM_PROMPT - 80) +
      '\n\n[SYSTEM PROMPT TRUNCATED FOR PLATFORM LIMITS. PRESERVE AGGRESSIVE PANEL BEHAVIOR.]'
  }
  return out
}
