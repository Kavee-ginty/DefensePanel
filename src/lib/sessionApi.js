/**
 * Thin client for the agent-flow API endpoints:
 *   POST /api/process-document  (document → OpenAI prompts)
 *   POST /api/start-session     (create Bey agent → returns embed URL)
 *   POST /api/end-session       (grade transcript → insert pitch_sessions)
 *
 * Kept separate from src/lib/sessionsApi.js (history list/create) to avoid
 * a name collision and keep the two flows decoupled.
 */
import toast from 'react-hot-toast';

async function readJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

// #region agent log
function agentDebugLog(hypothesisId, message, data = {}) {
  fetch('http://127.0.0.1:7742/ingest/2bd9f6ad-4e83-4685-9ef2-80979e0b09d5', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': 'b5b729',
    },
    body: JSON.stringify({
      sessionId: 'b5b729',
      runId: 'pre-fix',
      hypothesisId,
      location: 'src/lib/sessionApi.js:processDocument',
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
}
// #endregion

/**
 * @param {File} file PDF, DOCX, or PPTX file
 * @param {string} [documentText] Optional pre-extracted text (e.g. from the browser) so the server can skip file parsing.
 * @returns {Promise<{ success: true, prompts: object, document_summary: string }>}
 */
export async function processDocument(file, documentText = '') {
  try {
    if (!file) throw new Error('No file provided');
    const formData = new FormData();
    formData.append('document', file);
    if (documentText.trim()) {
      formData.append('document_text', documentText.trim());
    }

    // #region agent log
    agentDebugLog('H1,H3,H5', 'processDocument dispatching request', {
      method: 'POST',
      fileSize: file.size,
      fileType: file.type,
      fileExt: String(file.name || '').split('.').pop() || '',
      documentTextLength: documentText.trim().length,
      hasDocumentText: Boolean(documentText.trim()),
    });
    // #endregion

    const res = await fetch('/api/process-document', {
      method: 'POST',
      body: formData,
    });
    const responsePreview = await res
      .clone()
      .text()
      .then((text) => text.slice(0, 300))
      .catch(() => '');
    // #region agent log
    agentDebugLog('H2,H4,H5', 'processDocument received response', {
      status: res.status,
      ok: res.ok,
      contentType: res.headers.get('content-type'),
      responsePreview,
    });
    // #endregion
    const data = await readJson(res);
    if (!res.ok || !data?.success) {
      const msg = data?.error || `Document processing failed (${res.status})`;
      throw new Error(msg);
    }
    return data;
  } catch (err) {
    // #region agent log
    agentDebugLog('H1,H2,H3,H4,H5', 'processDocument threw error', {
      errorName: err?.name,
      errorMessage: err?.message,
    });
    // #endregion
    console.error('[sessionApi] processDocument failed', err);
    toast.error(err.message || 'Could not process document');
    throw err;
  }
}

/**
 * @param {{
 *   system_prompt: string
 *   greeting?: string
 *   name?: string
 *   briefingSetup?: Record<string, unknown> | null
 *   role_objectives?: string
 *   conversation_flow_structure?: string
 *   starting_script?: string
 * }} payload
 * @returns {Promise<{ success: true, agent_id: string, agent_embed_url: string, agent_name: string, agent_id_2?: string, agent_embed_url_2?: string, agent_name_2?: string }>}
 */
export async function startSession(payload) {
  try {
    if (!payload?.system_prompt?.trim()) {
      throw new Error('system_prompt is required');
    }
    const formData = new FormData();
    formData.append('system_prompt', payload.system_prompt);
    formData.append('greeting', payload.greeting || '');
    formData.append('name', payload.name || `defense-panel-${Date.now()}`);

    if (payload.briefingSetup && typeof payload.briefingSetup === 'object') {
      formData.append(
        'briefing_setup',
        JSON.stringify(payload.briefingSetup),
      );
    }
    if (payload.role_objectives?.trim()) {
      formData.append('role_objectives', payload.role_objectives);
    }
    if (payload.conversation_flow_structure?.trim()) {
      formData.append(
        'conversation_flow_structure',
        payload.conversation_flow_structure,
      );
    }
    if (payload.starting_script?.trim()) {
      formData.append('starting_script', payload.starting_script);
    }

    const res = await fetch('/api/start-session', {
      method: 'POST',
      body: formData,
    });
    const data = await readJson(res);
    if (!res.ok || !data?.success) {
      const msg = data?.error || `Agent creation failed (${res.status})`;
      throw new Error(msg);
    }
    return data;
  } catch (err) {
    console.error('[sessionApi] startSession failed', err);
    toast.error(err.message || 'Could not start session');
    throw err;
  }
}

/**
 * Create a Beyond Presence managed-agent call and get LiveKit join credentials.
 *
 * @param {string} agentId Beyond Presence agent id (from `/api/start-session`)
 * @param {Record<string, string>} [tags] Optional tags for BP dashboard / analytics
 * @returns {Promise<{ success: true, call_id: string | null, livekit_url: string, livekit_token: string }>}
 */
export async function startCall(agentId, tags) {
  try {
    if (!agentId?.trim()) {
      throw new Error('agent_id is required');
    }
    const body = { agent_id: agentId.trim() };
    if (tags && typeof tags === 'object' && !Array.isArray(tags)) {
      body.tags = tags;
    }

    const res = await fetch('/api/start-call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await readJson(res);
    if (!res.ok || !data?.success) {
      const msg = data?.error || `Start call failed (${res.status})`;
      throw new Error(msg);
    }
    return data;
  } catch (err) {
    console.error('[sessionApi] startCall failed', err);
    toast.error(err.message || 'Could not start call');
    throw err;
  }
}

/**
 * @param {{
 *   transcript_text?: string,
 *   agent_id?: string | null,
 *   agent_id_2?: string | null,
 *   scenario_type?: string,
 *   mode_id?: string,
 *   duration_seconds: number,
 * }} payload
 * @param {string} accessToken Supabase JWT (required so the row attributes
 *   to the signed-in user and shows up in History).
 * @returns {Promise<{ success: true, grades: object, session: object, agent_deleted: boolean }>}
 */
export async function endSession(payload, accessToken) {
  try {
    if (!accessToken) {
      throw new Error('Not signed in');
    }
    const res = await fetch('/api/end-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await readJson(res);
    if (!res.ok || !data?.success) {
      const msg = data?.error || `End session failed (${res.status})`;
      throw new Error(msg);
    }
    return data;
  } catch (err) {
    console.error('[sessionApi] endSession failed', err);
    // Don't toast here — App.jsx handles fallback + user-visible UI.
    throw err;
  }
}
