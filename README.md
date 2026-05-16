# Defense Panel

Immersive AI simulation for pitch, viva, and technical interview practice.

## Setup

See **[REQUIREMENTS.md](REQUIREMENTS.md)** for full clone-and-run instructions (Node 22.13+, all env vars, Supabase SQL, dual-terminal API setup, and troubleshooting).

Quick start:

```bash
npm install
cp .env.example .env
```

Fill in `.env` from `.env.example` (Supabase, OpenAI, Beyond Presence). Run `supabase/pitch_sessions.sql` in Supabase (and optionally `supabase/pitch_sessions_extended.sql` for dashboard/debrief enrichment fields). Enable **Email** auth. For briefing deploy and live agents, also run `npx vercel dev --listen 3000` in a second terminal (see REQUIREMENTS.md).

## Run

```bash
npm run dev
```

## Flow

1. **Auth** — Login (email/password) or Register (username, email, password)
2. **Lobby** — Select Startup Pitch, Academic Viva, or Technical Interview
3. **Briefing** — Upload mode-specific PDF, DOCX, or PPTX context
4. **Arena** — Startup Pitch: multi-format presentation preview + presenter PIP + panelists; other modes: full webcam + panelists
5. **Debrief** — Performance analytics (mock data until API is wired)

## Build

```bash
npm run build
```

## Deploy to Vercel

This repo is configured for one-click deployment as a Vite SPA with serverless functions in `/api`.

### 1. Push to GitHub / GitLab / Bitbucket

```bash
git push
```

### 2. Import the project in Vercel

- Vercel will auto-detect the Vite framework (also pinned in [`vercel.json`](vercel.json)).
- Build command: `npm run build` · Output directory: `dist` · Install: `npm install`.
- Node runtime is pinned to `>=20` via `package.json#engines`.

### 3. Set environment variables (Project Settings -> Environment Variables)

Required for all environments (Production / Preview / Development):

| Variable | Used by |
|---|---|
| `VITE_SUPABASE_URL` | Frontend Supabase client |
| `VITE_SUPABASE_ANON_KEY` | Frontend Supabase client |
| `SUPABASE_URL` | `/api/*` serverless |
| `SUPABASE_ANON_KEY` | `/api/end-session`, `/api/sessions` (JWT verification) |
| `SUPABASE_SERVICE_ROLE_KEY` | `/api/end-session`, `/api/sessions` (admin inserts) |
| `OPENAI_API_KEY` | `/api/process-document`, `/api/end-session` |
| `BEYOND_PRESENCE_API_KEY` | `/api/start-session`, `/api/start-call`, `/api/end-session` |
| `BEY_AVATAR_ID` | `/api/start-session` (Beyond Presence avatar persona) |

Optional:

| Variable | Default | Purpose |
|---|---|---|
| `BEY_CHAT_EMBED_ORIGIN` | `https://bey.chat` | Override the iframe-fallback embed origin |
| `BEY_AVATAR_ID2` | unset | Second Beyond avatar: silent panelist agent + LiveKit slot 2 in the arena |
| `VITE_USE_API_SESSIONS` | unset | Force the frontend to use `/api/sessions` instead of direct Supabase reads. Production already uses `/api/*` automatically. |

Never expose `OPENAI_API_KEY`, `BEYOND_PRESENCE_API_KEY`, or `SUPABASE_SERVICE_ROLE_KEY` to the frontend — only the `VITE_`-prefixed pair is bundled into the client.

### 4. Run Supabase setup

In the Supabase SQL editor, run:

1. `supabase/pitch_sessions.sql`
2. `supabase/pitch_sessions_extended.sql` (debrief scores)
3. `supabase/pitch_sessions_transcript.sql` (Beyond transcript columns)

Enable **Email** auth in Supabase, and add your Vercel domain to the **Site URL** / redirect allowlist.

### 5. Function limits

[`vercel.json`](vercel.json) bumps memory and `maxDuration` for the AI endpoints (`process-document`, `end-session`) so OpenAI + Beyond Presence calls have time to complete. On the Hobby plan max duration is capped at 60s — the values in `vercel.json` stay within that limit.
