/** @typedef {'friendly'|'standard'|'brutal'} Difficulty */
/** @typedef {'investor'|'cfo'|'professor'|'custom'} PanelPersona */
/** @typedef {'filler'|'confidence'|'technical'|'objections'|'custom'} PracticeGoal */
/** @typedef {'opening'|'qa'|'rapid'|'closing'|'custom'} SessionFlow */

/**
 * @typedef {object} SessionSetupInput
 * @property {Difficulty} [difficulty]
 * @property {PanelPersona} [panelPersona]
 * @property {string} [customPersona]
 * @property {string} [customScenario]
 * @property {PracticeGoal} [practiceGoal]
 * @property {string} [customPracticeGoal]
 * @property {SessionFlow} [sessionFlow]
 * @property {string} [customSessionFlow]
 */

export const DEFAULT_SESSION_SETUP = {
  difficulty: /** @type {Difficulty} */ ('standard'),
  panelPersona: /** @type {PanelPersona} */ ('investor'),
  customPersona: '',
  customScenario: '',
  practiceGoal: /** @type {PracticeGoal} */ ('confidence'),
  customPracticeGoal: '',
  sessionFlow: /** @type {SessionFlow} */ ('qa'),
  customSessionFlow: '',
};

export const DIFFICULTY_OPTIONS = [
  { id: 'friendly', label: 'Friendly' },
  { id: 'standard', label: 'Standard' },
  { id: 'brutal', label: 'Brutal' },
];

export const PERSONA_OPTIONS = [
  { id: 'investor', label: 'Investor' },
  { id: 'cfo', label: 'CFO' },
  { id: 'professor', label: 'Professor' },
  { id: 'custom', label: 'Custom' },
];

export const PRACTICE_GOAL_OPTIONS = [
  { id: 'filler', label: 'Reduce filler words' },
  { id: 'confidence', label: 'Improve confidence' },
  { id: 'technical', label: 'Improve technical depth' },
  { id: 'objections', label: 'Handle objections' },
  { id: 'custom', label: 'Custom' },
];

export const SESSION_FLOW_OPTIONS = [
  { id: 'opening', label: 'Opening pitch' },
  { id: 'qa', label: 'Q&A' },
  { id: 'rapid', label: 'Rapid fire' },
  { id: 'closing', label: 'Closing statement' },
  { id: 'custom', label: 'Custom' },
];
