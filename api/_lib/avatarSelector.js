const { listAvailableAvatars } = require('./beyondPresenceClient');

function uniqueById(avatars) {
  const seen = new Set();
  return avatars.filter((avatar) => {
    if (!avatar?.id || seen.has(avatar.id)) {
      return false;
    }

    seen.add(avatar.id);
    return true;
  });
}

function getAvailableAvatars(avatars) {
  return uniqueById(avatars).filter((avatar) => avatar.status === 'available');
}

async function selectPanelAvatars() {
  const envInterrogatorAvatarId = process.env.BEYOND_INTERROGATOR_AVATAR_ID;
  const envEvaluatorAvatarId = process.env.BEYOND_EVALUATOR_AVATAR_ID;
  const warnings = [];

  if (envInterrogatorAvatarId && envEvaluatorAvatarId) {
    if (envInterrogatorAvatarId === envEvaluatorAvatarId) {
      warnings.push('Both panel roles use the same env avatar ID.');
    }

    return {
      interrogatorAvatarId: envInterrogatorAvatarId,
      evaluatorAvatarId: envEvaluatorAvatarId,
      warnings,
      source: 'env',
    };
  }

  const avatars = getAvailableAvatars(await listAvailableAvatars({ limit: 50 }));

  if (avatars.length === 0) {
    throw new Error(
      'No available Beyond Presence avatars found. Add BEYOND_INTERROGATOR_AVATAR_ID and BEYOND_EVALUATOR_AVATAR_ID or enable public avatars.',
    );
  }

  const interrogatorAvatarId = envInterrogatorAvatarId || avatars[0].id;
  let evaluatorAvatarId = envEvaluatorAvatarId;

  if (!evaluatorAvatarId) {
    const differentAvatar = avatars.find((avatar) => avatar.id !== interrogatorAvatarId);
    evaluatorAvatarId = differentAvatar?.id || interrogatorAvatarId;
  }

  if (interrogatorAvatarId === evaluatorAvatarId) {
    warnings.push('Only one usable avatar was available, so both panel roles use the same avatar.');
  }

  return {
    interrogatorAvatarId,
    evaluatorAvatarId,
    warnings,
    source: envInterrogatorAvatarId || envEvaluatorAvatarId ? 'env-and-api' : 'api',
  };
}

module.exports = {
  selectPanelAvatars,
};
