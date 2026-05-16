# Integration Handoff

This is the PM-to-engineering contract for wiring Beyond Presence, GPT-4o, Supabase, and the React demo.

## Ownership

| Area | Owner | PM Check |
| --- | --- | --- |
| Beyond Presence access | Member 4 | API key exists, optional avatar IDs recorded |
| Frontend arena | Members 1/3 | Calls Vercel APIs only, renders avatar and webcam |
| Vercel APIs | Member 2 | Secrets stay server-side, returns SDK-safe payload |
| Supabase | Member 4 + Member 2 | `pitch_sessions` exists and receives demo rows |
| Final demo | Member 4 | Interruption works, fallback is ready |

## Environment Variables

Frontend public variables:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Backend secret variables:

```env
OPENAI_API_KEY=
BEYOND_PRESENCE_API_KEY=
BEYOND_PRESENCE_API_BASE_URL=https://api.bey.dev
BEYOND_INTERROGATOR_AVATAR_ID=
BEYOND_EVALUATOR_AVATAR_ID=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_URL=
```

Rules:
- Never put `OPENAI_API_KEY` in React code.
- Never put `BEYOND_PRESENCE_API_KEY` in React code.
- Vercel `/api` functions are the only place secret API keys may be used.
- The MVP user is always `demo-user-1`.

## API Contract: `/api/process-document`

Purpose:
- Accept a PDF.
- Extract text.
- Ask GPT-4o for the context matrix from `AIPromptPack.md`.
- Return attack-ready JSON for the panel.

Request:

```txt
POST /api/process-document
Content-Type: multipart/form-data

file: PDF
scenario: Startup Pitch
```

Response:

```json
{
  "document_summary": "The presenter is pitching...",
  "scenario_fit": "Startup Pitch",
  "core_claims": ["..."],
  "weak_claims": [
    {
      "claim": "...",
      "why_it_is_weak": "...",
      "attack_question": "..."
    }
  ],
  "revenue_metric": {
    "metric": "MRR",
    "value": "$10k",
    "risk": "..."
  },
  "technical_risks": [
    {
      "risk": "...",
      "attack_question": "..."
    }
  ],
  "contradictions_to_watch": ["..."],
  "panel_seed_questions": ["..."]
}
```

Demo fallback:
- If PDF parsing or OpenAI fails, return the emergency mock context from `AIPromptPack.md`.
- Show the user a non-blocking warning, but continue the demo.

## API Contract: `/api/start-session`

Purpose:
- Create two disposable Beyond Presence agents for the session.
- Select avatars from env fallback IDs or `GET /v1/avatars`.
- Inject session-specific context into both agent prompts.
- Return only browser-safe agent IDs and direct URLs.

Request:

```json
{
  "scenario": "Startup Pitch",
  "user_id": "demo-user-1",
  "context_matrix": {
    "document_summary": "...",
    "core_claims": ["..."],
    "weak_claims": ["..."],
    "revenue_metric": {
      "metric": "MRR",
      "value": "$10k",
      "risk": "..."
    },
    "technical_risks": ["..."],
    "contradictions_to_watch": ["..."]
  }
}
```

Backend behavior:

1. Load `BEYOND_PRESENCE_API_KEY` from server env.
2. Load optional `BEYOND_INTERROGATOR_AVATAR_ID` and `BEYOND_EVALUATOR_AVATAR_ID`.
3. If avatar IDs are missing, call Beyond Presence `GET /v1/avatars?limit=50`.
4. Build prompts with `api/_lib/agentPromptFactory.js`.
5. Create both agents in parallel with Beyond Presence `POST /v1/agents`.
6. Return generated IDs and `https://bey.chat/{agent_id}` URLs.

Response shape:

```json
{
  "session_id": "defense-session-...",
  "user_id": "demo-user-1",
  "scenario": "Startup Pitch",
  "agents": {
    "interrogator": {
      "agent_id": "agent_id",
      "avatar_id": "avatar_id",
      "url": "https://bey.chat/agent_id",
      "name": "The Interrogator"
    },
    "evaluator": {
      "agent_id": "agent_id",
      "avatar_id": "avatar_id",
      "url": "https://bey.chat/agent_id",
      "name": "The Evaluator"
    }
  },
  "context_summary": "short summary for UI",
  "avatar_source": "env | api | env-and-api",
  "warnings": []
}
```

Beyond Presence calls used:

```txt
GET https://api.bey.dev/v1/avatars?limit=50
POST https://api.bey.dev/v1/agents
```

## API Contract: `/api/end-session`

Purpose:
- Analyze the transcript with GPT-4o.
- Insert final metrics into Supabase.
- Return the latest session and history for the debrief dashboard.
- Optionally delete disposable Beyond Presence agents after the debrief is saved.

Request:

```json
{
  "user_id": "demo-user-1",
  "scenario_type": "Startup Pitch",
  "document_summary": "short context summary",
  "duration_seconds": 245,
  "interrogator_agent_id": "generated_agent_id",
  "evaluator_agent_id": "generated_agent_id",
  "transcript": [
    {
      "speaker": "user",
      "text": "..."
    },
    {
      "speaker": "interrogator",
      "text": "Stop there..."
    }
  ]
}
```

Cleanup rule:
- If `interrogator_agent_id` and `evaluator_agent_id` are present, call Beyond Presence `DELETE /v1/agents/{id}` after saving the session.
- If cleanup fails, log it but still return the debrief. Do not break the user flow because cleanup failed.

Supabase insert:

```js
await supabase.from('pitch_sessions').insert({
  user_id: 'demo-user-1',
  scenario_type: 'Startup Pitch',
  document_summary,
  duration_seconds,
  filler_word_count,
  critical_feedback,
  overall_score,
  is_active: true
});
```

Response:

```json
{
  "session": {
    "overall_score": 82,
    "filler_word_count": 8,
    "critical_feedback": "Strong opening, but..."
  },
  "history": []
}
```

## Supabase MVP Schema

Run this in Supabase SQL editor.

```sql
create extension if not exists "pgcrypto";

create table if not exists pitch_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id text not null default 'demo-user-1',
  scenario_type text not null,
  document_summary text,
  duration_seconds integer not null check (duration_seconds > 0),
  filler_word_count integer not null default 0 check (filler_word_count >= 0),
  critical_feedback text not null,
  overall_score integer not null check (overall_score >= 0 and overall_score <= 100),
  is_active boolean not null default true
);

create index if not exists pitch_sessions_user_created_idx
  on pitch_sessions (user_id, created_at desc);
```

Optional demo seed rows:

```sql
insert into pitch_sessions (
  user_id,
  scenario_type,
  document_summary,
  duration_seconds,
  filler_word_count,
  critical_feedback,
  overall_score,
  is_active
) values
  (
    'demo-user-1',
    'Startup Pitch',
    'Early demo pitch with vague traction claims and incomplete technical defense.',
    180,
    18,
    'The presenter relied on generic AI language and failed to defend the latency path.',
    54,
    true
  ),
  (
    'demo-user-1',
    'Startup Pitch',
    'Second run improved technical clarity but still struggled with revenue proof.',
    225,
    11,
    'The presenter answered architecture questions better but inflated the business model.',
    68,
    true
  ),
  (
    'demo-user-1',
    'Startup Pitch',
    'Final rehearsal showed tighter answers and stronger handling of interruption pressure.',
    245,
    6,
    'The presenter gave concise answers and defended the proxy architecture clearly.',
    84,
    true
  );
```

## CORS and Origin Checklist

If WebRTC or API calls fail in browser:

1. Confirm Vercel environment variables exist in the active deployment.
2. Confirm Beyond Presence allowed origins include:

```txt
http://localhost:5173
https://YOUR_VERCEL_DOMAIN
```

3. Confirm API responses include the needed CORS headers if endpoints are called cross-origin.
4. Confirm the frontend calls relative paths in production:

```txt
/api/process-document
/api/start-session
/api/end-session
```

5. Confirm the app is running over HTTPS for deployed WebRTC.
6. Confirm browser permissions for camera and microphone are granted.
7. Confirm the venue network does not block WebRTC, WebSocket, or LiveKit-style traffic.

## Debug Playbook

### Symptom: Camera or microphone blocked

Likely causes:
- Browser permission denied.
- Insecure origin.
- Another app owns the device.

PM demo action:
- Switch browser profile or open a clean Chrome window.
- Use deployed HTTPS URL.
- If still blocked, run the smoke-and-mirrors fallback video.

### Symptom: CORS error from `/api/start-session`

Likely causes:
- Calling a different origin directly.
- Vercel endpoint missing CORS headers.
- Beyond Presence API called from browser.

Fix:
- Frontend must call local `/api/start-session`.
- Backend calls Beyond Presence with secret key.
- Add the Vercel URL to Beyond Presence dashboard allowed origins.

### Symptom: Agent appears but does not interrupt

Likely causes:
- Prompt too polite.
- Barge-in or turn detection setting disabled.
- Agent waits for silence before responding.

Fix:
- Re-paste prompts from `AIPromptPack.md`.
- Enable the most aggressive turn detection and interruption settings.
- Test with the filler-word script in `BeyondPresenceDashboard.md`.

### Symptom: Audio echo or feedback loop

Likely causes:
- Speaker output feeding into microphone.
- Two tabs open with the same session.
- Laptop speakers too loud.

Fix:
- Use headphones for final demo.
- Close duplicate tabs.
- Keep only one active arena session.
- Lower system volume.

### Symptom: WebRTC connects locally but fails on Vercel

Likely causes:
- Production origin not allowlisted.
- HTTPS/WebSocket policy issue.
- Env vars missing in production.

Fix:
- Add production URL to Beyond Presence dashboard.
- Redeploy after env var changes.
- Test the public Vercel URL before the final pitch.

## PM Final Integration Test

Run this exact test before stage prep:

1. Open the deployed Vercel app.
2. Select `Startup Pitch`.
3. Upload a fake or real pitch PDF.
4. Start the panel.
5. Say:

```txt
We have, um, like, 50k MRR and our AI architecture basically scales automatically.
```

6. Confirm the agent interrupts.
7. End session.
8. Confirm Supabase has a new `pitch_sessions` row.
9. Confirm Debrief shows score, filler count, feedback, and historical trend.

If step 6 fails, do not keep debugging under pressure. Use the fallback:
- Play or embed a pre-recorded interruption demo.
- Keep Supabase/debrief live.
- Pitch it as the same flow with a network-safe demo mode.
