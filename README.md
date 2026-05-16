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
