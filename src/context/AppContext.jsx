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
  agentName: null,
  /** Bey chat URL for iframe — https://bey.chat/{agent_id} (override via BEY_CHAT_EMBED_ORIGIN). */
  agentEmbedUrl: null,
  sessionId: null,
  transcript: [],
  attackPoints: null,
  documentSummary: null,
  /** Set after `endSession` for `/debrief` */
  grades: null,
  sessionDuration: 0,
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
  const [agentName, setAgentName] = useState(initialState.agentName)
  const [agentEmbedUrl, setAgentEmbedUrl] = useState(initialState.agentEmbedUrl)
  const [sessionId, setSessionId] = useState(initialState.sessionId)
  const [transcript, setTranscript] = useState(initialState.transcript)
  const [attackPoints, setAttackPoints] = useState(initialState.attackPoints)
  const [documentSummary, setDocumentSummary] = useState(
    initialState.documentSummary,
  )
  const [grades, setGrades] = useState(initialState.grades)
  const [sessionDuration, setSessionDuration] = useState(
    initialState.sessionDuration,
  )

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
      smePrompt: agentSystemPrompt,
      setSmePrompt: setAgentSystemPrompt,
      greeting: agentGreeting,
      setGreeting: setAgentGreeting,
      roleObjectives: agentRoleObjectives,
      setRoleObjectives: setAgentRoleObjectives,
      conversationFlow: agentConversationFlow,
      setConversationFlow: setAgentConversationFlow,
      startingScript: agentStartingScript,
      setStartingScript: setAgentStartingScript,
      agentId,
      setAgentId,
      agentName,
      setAgentName,
      agentEmbedUrl,
      setAgentEmbedUrl,
      sessionId,
      setSessionId,
      transcript,
      setTranscript,
      attackPoints,
      setAttackPoints,
      documentSummary,
      setDocumentSummary,
      grades,
      setGrades,
      sessionDuration,
      setSessionDuration,
      resetApp: () => {
        setUserId(initialState.userId)
        setScenario(initialState.scenario)
        setAgentSystemPrompt(initialState.agentSystemPrompt)
        setAgentGreeting(initialState.agentGreeting)
        setAgentRoleObjectives(initialState.agentRoleObjectives)
        setAgentConversationFlow(initialState.agentConversationFlow)
        setAgentStartingScript(initialState.agentStartingScript)
        setAgentId(initialState.agentId)
        setAgentName(initialState.agentName)
        setAgentEmbedUrl(initialState.agentEmbedUrl)
        setSessionId(initialState.sessionId)
        setTranscript([...initialState.transcript])
        setAttackPoints(initialState.attackPoints)
        setDocumentSummary(initialState.documentSummary)
        setGrades(initialState.grades)
        setSessionDuration(initialState.sessionDuration)
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
      agentName,
      agentEmbedUrl,
      sessionId,
      transcript,
      attackPoints,
      documentSummary,
      grades,
      sessionDuration,
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
