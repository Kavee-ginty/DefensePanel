import { createContext, useContext, useMemo, useState } from 'react'

const AppContext = createContext(null)

const initialState = {
  userId: 'demo-user-1',
  scenario: null,
  smePrompt: null,
  evaluatorPrompt: null,
  smeAgentId: null,
  evaluatorAgentId: null,
  sessionId: null,
  transcript: [],
  attackPoints: null,
  /** Set after `endSession` for `/debrief` */
  grades: null,
}

export function AppProvider({ children }) {
  const [userId, setUserId] = useState(initialState.userId)
  const [scenario, setScenario] = useState(initialState.scenario)
  const [smePrompt, setSmePrompt] = useState(initialState.smePrompt)
  const [evaluatorPrompt, setEvaluatorPrompt] = useState(
    initialState.evaluatorPrompt,
  )
  const [smeAgentId, setSmeAgentId] = useState(initialState.smeAgentId)
  const [evaluatorAgentId, setEvaluatorAgentId] = useState(
    initialState.evaluatorAgentId,
  )
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
      smePrompt,
      setSmePrompt,
      evaluatorPrompt,
      setEvaluatorPrompt,
      smeAgentId,
      setSmeAgentId,
      evaluatorAgentId,
      setEvaluatorAgentId,
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
        setSmePrompt(initialState.smePrompt)
        setEvaluatorPrompt(initialState.evaluatorPrompt)
        setSmeAgentId(initialState.smeAgentId)
        setEvaluatorAgentId(initialState.evaluatorAgentId)
        setSessionId(initialState.sessionId)
        setTranscript([...initialState.transcript])
        setAttackPoints(initialState.attackPoints)
        setGrades(initialState.grades)
      },
    }),
    [
      userId,
      scenario,
      smePrompt,
      evaluatorPrompt,
      smeAgentId,
      evaluatorAgentId,
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
