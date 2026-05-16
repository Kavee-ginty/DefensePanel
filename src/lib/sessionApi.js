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

/**
 * @param {File} file PDF, DOCX, or PPTX file
 * @returns {Promise<{ success: true, prompts: object, document_summary: string }>}
 */
export async function processDocument(file) {
  try {
    if (!file) throw new Error('No file provided');
    const formData = new FormData();
    formData.append('document', file);

    const res = await fetch('/api/process-document', {
      method: 'POST',
      body: formData,
    });
    const data = await readJson(res);
    if (!res.ok || !data?.success) {
      const msg = data?.error || `Document processing failed (${res.status})`;
      throw new Error(msg);
    }
    return data;
  } catch (err) {
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
 * @returns {Promise<{ success: true, agent_id: string, agent_embed_url: string, agent_name: string }>}
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
 * @param {{
 *   transcript_text?: string,
 *   agent_id?: string | null,
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
