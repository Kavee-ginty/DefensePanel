const { createAgent } = require('./_lib/beyondPresenceClient');
const { buildEvaluatorPrompt, buildInterrogatorPrompt } = require('./_lib/agentPromptFactory');
const { selectPanelAvatars } = require('./_lib/avatarSelector');

const USER_ID = 'demo-user-1';

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function parseBody(body) {
  if (!body) {
    return {};
  }

  if (typeof body === 'string') {
    return JSON.parse(body);
  }

  return body;
}

function safeScenarioName(scenario) {
  return String(scenario || 'Startup Pitch')
    .replace(/[^a-zA-Z0-9 -]/g, '')
    .trim()
    .slice(0, 40) || 'Startup Pitch';
}

function makeAgentName(role, scenario) {
  return `${role} - ${safeScenarioName(scenario)} - ${Date.now()}`.slice(0, 100);
}

function agentUrl(agentId) {
  return `https://bey.chat/${agentId}`;
}

async function createAgentWithRetry(config, warnings) {
  try {
    return await createAgent(config);
  } catch (error) {
    if (error.status !== 422) {
      throw error;
    }

    warnings.push(
      `Retried ${config.name} with minimum Beyond Presence fields after validation rejected optional settings.`,
    );

    return createAgent({
      name: config.name,
      avatar_id: config.avatar_id,
      system_prompt: config.system_prompt,
      language: config.language,
      greeting: config.greeting,
      max_session_length_minutes: config.max_session_length_minutes,
    });
  }
}

module.exports = async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const body = parseBody(req.body);
    const scenario = body.scenario || 'Startup Pitch';
    const userId = body.user_id || USER_ID;
    const contextMatrix = body.context_matrix || body.contextMatrix;

    if (userId !== USER_ID) {
      return res.status(400).json({ error: `MVP only supports user_id "${USER_ID}".` });
    }

    if (!contextMatrix || typeof contextMatrix !== 'object') {
      return res.status(400).json({
        error: 'Missing context_matrix. Call /api/process-document first or send the mock context matrix.',
      });
    }

    const warnings = [];
    const avatarSelection = await selectPanelAvatars();
    warnings.push(...avatarSelection.warnings);

    const interrogatorPrompt = buildInterrogatorPrompt(contextMatrix, scenario);
    const evaluatorPrompt = buildEvaluatorPrompt(contextMatrix, scenario);

    const commonAgentFields = {
      language: 'en-US',
      max_session_length_minutes: 10,
      capabilities: [{ type: 'webcam_vision' }],
      llm: { type: 'openai' },
    };

    const [interrogatorAgent, evaluatorAgent] = await Promise.all([
      createAgentWithRetry(
        {
          ...commonAgentFields,
          name: makeAgentName('The Interrogator', scenario),
          avatar_id: avatarSelection.interrogatorAvatarId,
          system_prompt: interrogatorPrompt,
          greeting: 'Begin. You have 90 seconds to defend the core claim. I will stop you when the logic fails.',
        },
        warnings,
      ),
      createAgentWithRetry(
        {
          ...commonAgentFields,
          name: makeAgentName('The Evaluator', scenario),
          avatar_id: avatarSelection.evaluatorAvatarId,
          system_prompt: evaluatorPrompt,
          greeting: 'I am tracking filler words, pace, clarity, and evasiveness. Start when ready.',
        },
        warnings,
      ),
    ]);

    return res.status(200).json({
      session_id: `defense-session-${Date.now()}`,
      user_id: USER_ID,
      scenario,
      agents: {
        interrogator: {
          agent_id: interrogatorAgent.id,
          avatar_id: interrogatorAgent.avatar_id || avatarSelection.interrogatorAvatarId,
          url: agentUrl(interrogatorAgent.id),
          name: 'The Interrogator',
        },
        evaluator: {
          agent_id: evaluatorAgent.id,
          avatar_id: evaluatorAgent.avatar_id || avatarSelection.evaluatorAvatarId,
          url: agentUrl(evaluatorAgent.id),
          name: 'The Evaluator',
        },
      },
      context_summary: contextMatrix.document_summary || '',
      avatar_source: avatarSelection.source,
      warnings,
    });
  } catch (error) {
    console.error('start-session failed:', error);

    return res.status(error.status || 500).json({
      error: 'Failed to create Beyond Presence defense panel.',
      detail: error.message,
    });
  }
};
