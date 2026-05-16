# Defense Panel — Requirements & Setup

Use this guide to clone the repo on a new machine and run without environment errors.

## Prerequisites

| Requirement | Version / notes |
|-------------|-----------------|
| **Node.js** | 20 LTS or newer ([nodejs.org](https://nodejs.org)) |
| **npm** | 10+ (bundled with Node) |
| **Git** | Any recent version |
| **Browser** | Chromium-based (Chrome, Edge) recommended for WebRTC and PDF viewing |
| **Supabase** | Free project at [supabase.com/dashboard](https://supabase.com/dashboard) |

## 1. Clone and install

```bash
git clone <your-repo-url>
cd DefensePanel
npm install
```

If you see `Failed to resolve import "jszip"` or similar, run `npm install` again — all runtime deps are listed in `package.json`.

## 2. Environment variables

Copy the example file and edit `.env`:

```bash
cp .env.example .env
```

### Frontend (required for login and local History)

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Project URL only, e.g. `https://abcdefgh.supabase.co` — **do not** append `/rest/v1/` |
| `VITE_SUPABASE_ANON_KEY` | Anon/public key from Supabase → Project Settings → API |

### Optional (local dev)

| Variable | Description |
|----------|-------------|
| `VITE_USE_API_SESSIONS=true` | Use Vercel `/api` routes instead of direct Supabase. Requires `vercel dev` on port 3000. Leave unset for normal `npm run dev`. |

### Production API (Vercel only — no `VITE_` prefix)

Set in the Vercel project dashboard:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 3. Supabase database

1. Open your project → **SQL Editor** → New query.
2. Paste and run the contents of [`supabase/pitch_sessions.sql`](supabase/pitch_sessions.sql).
3. If you already had an older table schema, run [`supabase/pitch_sessions_migration.sql`](supabase/pitch_sessions_migration.sql) instead.

### Authentication

1. Supabase → **Authentication** → **Providers**.
2. Enable **Email** (sign-up and sign-in).
3. Create a test user under **Users** or register in the app.

Row Level Security on `pitch_sessions` requires a signed-in user to read/write their own rows.

## 4. Run locally

```bash
npm run dev
```

Open the URL shown (default `http://localhost:5173`).

### Optional: test serverless API locally

```bash
npm run dev:api
```

Runs Vercel dev (API on port 3000). Only needed if `VITE_USE_API_SESSIONS=true`.

## 5. Build for production

```bash
npm run build
npm run preview
```

Deploy the `dist` folder via Vercel (or any static host). Configure the production Supabase env vars on Vercel for `/api/sessions` routes.

## 6. App flow (smoke test)

1. **Auth** — Register or log in with email/password.
2. **Lobby** — Choose Startup Pitch, Academic Viva, or Technical Interview.
3. **Briefing** — Upload PDF, DOCX, or PPTX (see arena note below).
4. **Arena** — Camera/mic permission required. Startup Pitch shows PDF slides in the main panel; other modes show full webcam only.
5. **Debrief** — End session to save (requires Supabase) and view scores.
6. **History** — Lists past sessions (direct Supabase in dev by default).

## 7. Troubleshooting

| Symptom | Fix |
|---------|-----|
| `email rate limit exceeded` | Wait or disable email confirmation in Supabase Auth settings for dev; use one test account. |
| `Invalid path` / Supabase URL errors | `VITE_SUPABASE_URL` must be the project root URL only, not the REST path. |
| History fails with only `npm run dev` | Expected if `VITE_USE_API_SESSIONS=true` without `vercel dev`. Remove that flag or run `npm run dev:api`. |
| `ECONNREFUSED` on `/api` | Start `vercel dev` or use direct Supabase (default in dev). |
| PDF does not show in pitch arena | Upload a **`.pdf`** file. DOCX/PPTX are for AI context only, not slide view. |
| Browser downloads PDF instead of showing it | Use Chrome/Edge; ensure file is PDF. Report if issue persists after latest build. |
| Camera/mic blocked | Allow permissions in browser site settings for `localhost`. |
| No sessions in History | Complete a simulation, end session while signed in, and confirm SQL + RLS policies ran. |

## 8. Supported upload types

| Type | Briefing | Pitch arena display |
|------|----------|---------------------|
| PDF | Yes | Slides in main presentation panel |
| DOCX | Yes | Context only (message in arena) |
| PPTX | Yes | Context only (message in arena) |
