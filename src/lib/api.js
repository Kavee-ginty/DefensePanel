async function parseJsonResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.detail || `Request failed with ${response.status}`);
  }

  return data;
}

export async function processDocument(file, scenario = 'Startup Pitch') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('scenario', scenario);

  const response = await fetch('/api/process-document', {
    method: 'POST',
    body: formData,
  });

  return parseJsonResponse(response);
}

export async function startSession({ scenario = 'Startup Pitch', contextMatrix }) {
  const response = await fetch('/api/start-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      scenario,
      user_id: 'demo-user-1',
      context_matrix: contextMatrix,
    }),
  });

  return parseJsonResponse(response);
}

export async function endSession(payload) {
  const response = await fetch('/api/end-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: 'demo-user-1',
      ...payload,
    }),
  });

  return parseJsonResponse(response);
}
