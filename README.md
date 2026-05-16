# The Defense Panel

The Defense Panel is a real-time AI pressure simulator for high-stakes presentations. It combines GPT-4o reasoning, Beyond Presence video agents, WebRTC-style live interaction, and Supabase analytics to help founders, students, and candidates rehearse under hostile questioning.

Built for the Cursor Colombo Buildathon, Best Use of Beyond Presence track.

## What It Does

Most pitch practice tools are passive. The Defense Panel actively listens, detects weak claims, and interrupts the presenter mid-answer with context-aware pressure.

The flagship demo mode is `Startup Pitch`:

1. The user selects a scenario.
2. The user uploads a PDF pitch deck or brief.
3. GPT-4o extracts weak claims, contradictions, technical risks, and attack questions.
4. Beyond Presence avatars enter a live simulation room.
5. The AI panel interrupts vague answers, filler words, inflated metrics, and contradictions.
6. The session ends with a Supabase-powered debrief dashboard showing score, filler count, feedback, and improvement history.

## Core Demo Moment

The expected stage moment:

```txt
User: We have, um, like, 50k MRR and our AI architecture basically scales automatically...

AI Panel: Stop there. Your document does not prove 50k MRR. Where is that number coming from?
```

That interruption is the product.

## Tech Stack

- Frontend: React 18 with Vite
- Styling: Tailwind CSS
- Backend: Vercel Serverless Functions in `/api`
- Database: Supabase PostgreSQL
- AI reasoning: GPT-4o
- Video agents: Beyond Presence / `@bey-dev/sdk`
- Icons: `lucide-react`

## Architecture

```txt
React Frontend
  -> Vercel /api/process-document
  -> GPT-4o context matrix
  -> Vercel /api/start-session
  -> Beyond Presence just-in-time agent creation
  -> Live simulation arena
  -> Vercel /api/end-session
  -> GPT-4o scoring
  -> Supabase pitch_sessions
  -> Debrief dashboard
```

Security rule: OpenAI and Beyond Presence API keys are used only inside Vercel serverless functions. The React frontend never receives secret keys.

## MVP User Flow

```txt
Lobby -> Upload -> Arena -> Debrief
```

- `ModeSelection.jsx`: choose Startup Pitch, Academic Viva, or Technical Interview.
- `ContextUpload.jsx`: upload PDF and initialize the panel.
- `SimulationArena.jsx`: live webcam plus Beyond Presence avatar interaction.
- `DebriefDashboard.jsx`: scores, feedback, filler-word count, and history.

## Database

The MVP uses one table: `pitch_sessions`.

```sql
create table pitch_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id text not null default 'demo-user-1',
  scenario_type text not null,
  document_summary text,
  duration_seconds integer not null,
  filler_word_count integer not null default 0,
  critical_feedback text not null,
  overall_score integer not null,
  is_active boolean not null default true
);
```

The hackathon build intentionally bypasses authentication with:

```js
const USER_ID = "demo-user-1";
```

## PM Deliverables

Member 4 owns the non-core-code demo assets:

- `BeyondPresenceDashboard.md`: external dashboard setup and agent configuration.
- `AIPromptPack.md`: strict system prompts for Beyond Presence and GPT-4o.
- `IntegrationHandoff.md`: API contracts, Supabase SQL, CORS/WebRTC debugging.
- `ProjectOverview.md`: final submission overview.
- `PitchScript.md`: final demo and speaking script.

## Team synchronization (Member 4 PM)

- [`.env.example`](.env.example): safe variable names for local setup (no secrets).
- [`docs/Member2_VercelEnv.md`](docs/Member2_VercelEnv.md): handoff checklist for Vercel secrets (Member 2).
- [`docs/PMAvatarHandoff.md`](docs/PMAvatarHandoff.md): paste avatar UUIDs for deterministic demos.
- [`docs/M1M3_StartSessionIntegration.md`](docs/M1M3_StartSessionIntegration.md): wire arena to `/api/start-session`.
- [`docs/PMIntegrationTest.md`](docs/PMIntegrationTest.md): curl + live interruption script.
- [`docs/DemoVideoFallbackRecording.md`](docs/DemoVideoFallbackRecording.md): 2-minute backup video shot list.

## Environment Variables

Frontend:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Backend:

```env
OPENAI_API_KEY=
BEYOND_PRESENCE_API_KEY=
BEYOND_PRESENCE_API_BASE_URL=https://api.bey.dev
BEYOND_INTERROGATOR_AVATAR_ID=
BEYOND_EVALUATOR_AVATAR_ID=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

`/api/start-session` uses the Beyond Presence API key server-side to list available avatars and create two disposable agents with session-specific prompts. The frontend receives only generated agent IDs and `https://bey.chat/{agent_id}` URLs.

## Demo Fallback

If live WebRTC or venue Wi-Fi fails, the team should switch to a pre-recorded interruption clip while keeping the debrief dashboard and Supabase proof live. The pitch should frame this as network-safe demo mode, not a product failure.