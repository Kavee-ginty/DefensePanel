# Defense Panel

Immersive AI simulation for pitch, viva, and technical interview practice.

## Setup

See **[REQUIREMENTS.md](REQUIREMENTS.md)** for full clone-and-run instructions (Node version, Supabase SQL, env vars, and troubleshooting).

Quick start:

```bash
npm install
cp .env.example .env
```

Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env`, run `supabase/pitch_sessions.sql` in Supabase, enable **Email** auth, then:

## Run

```bash
npm run dev
```

## Flow

1. **Auth** — Login (email/password) or Register (username, email, password)
2. **Lobby** — Select Startup Pitch, Academic Viva, or Technical Interview
3. **Briefing** — Upload mode-specific PDF (deck, thesis, or CV)
4. **Arena** — Startup Pitch: PDF slides + presenter PIP + panelists; other modes: full webcam + panelists
5. **Debrief** — Performance analytics (mock data until API is wired)

## Build

```bash
npm run build
```
