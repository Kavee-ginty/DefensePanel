import { createContext, useContext, useMemo, useState } from 'react'

const AppContext = createContext(null)

const initialState = {
  userId: 'demo-user-1',
  scenario: null,
  /** Generated agent configuration (from PDF + GPT). */
  agentSystemPrompt: null,
  agentGreeting: null,
  agentRoleObjectives: null,
  agentConversationFlow: null,
  agentStartingScript: null,
  agentId: null,
  /** Bey chat embed URL — https://bey.chat/{agent_id}. */
  agentEmbedUrl: null,
  sessionId: null,
  transcript: [],
  attackPoints: null,
  /** Set after `endSession` for `/debrief` */
  grades: null,
}

export function AppProvider({ children }) {
  const [userId, setUserId] = useState(initialState.userId)
  const [scenario, setScenario] = useState(initialState.scenario)
  const [agentSystemPrompt, setAgentSystemPrompt] = useState(
    initialState.agentSystemPrompt,
  )
  const [agentGreeting, setAgentGreeting] = useState(initialState.agentGreeting)
  const [agentRoleObjectives, setAgentRoleObjectives] = useState(
    initialState.agentRoleObjectives,
  )
  const [agentConversationFlow, setAgentConversationFlow] = useState(
    initialState.agentConversationFlow,
  )
  const [agentStartingScript, setAgentStartingScript] = useState(
    initialState.agentStartingScript,
  )
  const [agentId, setAgentId] = useState(initialState.agentId)
  const [agentEmbedUrl, setAgentEmbedUrl] = useState(initialState.agentEmbedUrl)
  const [sessionId, setSessionId] = useState(initialState.sessionId)
  const [transcript, setTranscript] = useState(initialState.transcript)
  const [attackPoints, setAttackPoints] = useState(initialState.attackPoints)
  const [grades, setGrades] = useState(initialState.grades)

  const value = useMemo(
    () => ({
      userId,
      setUserId,
      scenario,
      setScenario,
      agentSystemPrompt,
      setAgentSystemPrompt,
      agentGreeting,
      setAgentGreeting,
      agentRoleObjectives,
      setAgentRoleObjectives,
      agentConversationFlow,
      setAgentConversationFlow,
      agentStartingScript,
      setAgentStartingScript,
      agentId,
      setAgentId,
      agentEmbedUrl,
      setAgentEmbedUrl,
      sessionId,
      setSessionId,
      transcript,
      setTranscript,
      attackPoints,
      setAttackPoints,
      grades,
      setGrades,
      resetApp: () => {
        setUserId(initialState.userId)
        setScenario(initialState.scenario)
        setAgentSystemPrompt(initialState.agentSystemPrompt)
        setAgentGreeting(initialState.agentGreeting)
        setAgentRoleObjectives(initialState.agentRoleObjectives)
        setAgentConversationFlow(initialState.agentConversationFlow)
        setAgentStartingScript(initialState.agentStartingScript)
        setAgentId(initialState.agentId)
        setAgentEmbedUrl(initialState.agentEmbedUrl)
        setSessionId(initialState.sessionId)
        setTranscript([...initialState.transcript])
        setAttackPoints(initialState.attackPoints)
        setGrades(initialState.grades)
      },
    }),
    [
      userId,
      scenario,
      agentSystemPrompt,
      agentGreeting,
      agentRoleObjectives,
      agentConversationFlow,
      agentStartingScript,
      agentId,
      agentEmbedUrl,
      sessionId,
      transcript,
      attackPoints,
      grades,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- hook colocated with provider for hackathon speed
export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) {
    throw new Error('useApp must be used within AppProvider')
  }
  return ctx
}
