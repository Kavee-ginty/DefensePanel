const DEFAULT_BASE_URL = 'https://api.bey.dev';

function getConfig() {
  const apiKey = process.env.BEYOND_PRESENCE_API_KEY;
  const baseUrl = process.env.BEYOND_PRESENCE_API_BASE_URL || DEFAULT_BASE_URL;

  if (!apiKey) {
    throw new Error('Missing BEYOND_PRESENCE_API_KEY. Add it to Vercel server environment variables.');
  }

  return {
    apiKey,
    baseUrl: baseUrl.replace(/\/$/, ''),
  };
}

async function requestBeyondPresence(path, options = {}) {
  const { apiKey, baseUrl } = getConfig();
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      ...(options.headers || {}),
    },
  });

  const responseText = await response.text();
  let data = null;

  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch (_error) {
      data = { raw: responseText };
    }
  }

  if (!response.ok) {
    const error = new Error(
      `Beyond Presence API error ${response.status}: ${JSON.stringify(data || {})}`,
    );
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

async function listAvailableAvatars({ limit = 50 } = {}) {
  const data = await requestBeyondPresence(`/v1/avatars?limit=${limit}`, {
    method: 'GET',
  });

  return Array.isArray(data?.data) ? data.data : [];
}

async function createAgent(agentConfig) {
  return requestBeyondPresence('/v1/agents', {
    method: 'POST',
    body: JSON.stringify(agentConfig),
  });
}

async function deleteAgent(agentId) {
  if (!agentId) {
    return null;
  }

  return requestBeyondPresence(`/v1/agents/${encodeURIComponent(agentId)}`, {
    method: 'DELETE',
  });
}

module.exports = {
  createAgent,
  deleteAgent,
  listAvailableAvatars,
};
