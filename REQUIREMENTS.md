# Defense Panel — Requirements & Setup

Use this guide to clone the repo on a new machine and run without environment errors.

## Prerequisites

| Requirement | Version / notes |
|-------------|-----------------|
| **Node.js** | **22.13+** recommended ([nodejs.org](https://nodejs.org)) — avoids `pdfjs-dist` engine warnings from `react-pdftotext` |
| **npm** | 10+ (bundled with Node) |
| **Git** | Any recent version |
| **Browser** | Chromium-based (Chrome, Edge) recommended for WebRTC and inline PDF viewing |
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

### Serverless API (required for briefing deploy + agent + grading)

Set in `.env` for local `vercel dev`, and in the Vercel project dashboard for production. **Do not** prefix with `VITE_`.

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Same project URL as above |
| `SUPABASE_ANON_KEY` | Anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server only) |
| `OPENAI_API_KEY` | Used by `/api/process-document` and `/api/end-session` |
| `BEYOND_PRESENCE_API_KEY` | Used by `/api/start-session` and `/api/end-session` |
| `BEY_AVATAR_ID` | Beyond Presence persona id for the live panelist |

Optional:

| Variable | Description |
|----------|-------------|
| `DEV_API_ORIGIN` | Override Vite proxy target (default `http://127.0.0.1:3000`) |
| `BEY_CHAT_EMBED_ORIGIN` | Override bey.chat embed origin |

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

### Frontend only (auth, lobby, arena UI)

```bash
npm run dev
```

Open the URL shown (default `http://localhost:5173`).

### Full simulation (document processing + live agent)

Run **two terminals** from the project root:

**Terminal 1 — API (port 3000):**

```bash
npx vercel dev --listen 3000
```

Or:

```bash
npm run dev:api
```

**Terminal 2 — Vite (port 5173):**

```bash
npm run dev
```

Vite proxies `/api/*` to port 3000 (`vite.config.js`). Without the API server, briefing deploy and agent creation will fail with `ECONNREFUSED`.

## 5. Build for production

```bash
npm run build
npm run preview
```

Deploy via Vercel (recommended). Set all serverless env vars in the Vercel dashboard.

## 6. App flow (smoke test)

1. **Auth** — Register or log in with email/password.
2. **Lobby** — Choose Startup Pitch, Academic Viva, or Technical Interview.
3. **Briefing** — Upload a document (Startup Pitch: PDF, DOCX, or PPTX; other modes: PDF).
4. **Arena** — Camera/mic required. **Startup Pitch** shows the deck in the main panel (PDF iframe, DOCX visual layout, PPTX visual slides) with presenter webcam PIP. **Academic / Interview** show full webcam only — no deck in the arena.
5. **Debrief** — End session to save (requires Supabase + API) and view scores.
6. **History** — Lists past sessions.

## 7. Troubleshooting

| Symptom | Fix |
|---------|-----|
| `email rate limit exceeded` | Wait or disable email confirmation in Supabase Auth settings for dev; use one test account. |
| `Invalid path` / Supabase URL errors | `VITE_SUPABASE_URL` must be the project root URL only, not the REST path. |
| `ECONNREFUSED` on `/api` | Start `vercel dev` on port 3000 alongside `npm run dev`. |
| History fails with only `npm run dev` | Expected if `VITE_USE_API_SESSIONS=true` without `vercel dev`. Remove that flag or run the API server. |
| Browser **downloads** PDF instead of showing it | Use Chrome/Edge; hard-refresh after pull. Arena uses an inline iframe blob viewer. |
| DOCX/PPTX look like **plain text** only | Hard-refresh; arena uses `docx-preview` / `pptx-preview` in the browser. Complex Office files may need PDF export. |
| Document does not show in pitch arena | Confirm Startup Pitch mode and a supported file type. |
| `EBADENGINE` for `pdfjs-dist` | Upgrade Node to **22.13+**. |
| Camera/mic blocked | Allow permissions in browser site settings for `localhost`. |
| No sessions in History | Complete a simulation, end session while signed in, and confirm SQL + RLS policies ran. |

## 8. Supported upload types

| Type | Briefing (Startup Pitch) | Briefing (Viva / Interview) | Pitch arena display |
|------|--------------------------|-----------------------------|---------------------|
| PDF | Yes | Yes | Inline iframe in main panel |
| DOCX | Yes | No | Visual Word layout (`docx-preview`, browser-only) |
| PPTX | Yes | No | Visual slides (`pptx-preview`, browser-only) |

Arena DOCX/PPTX previews run entirely in the browser. The backend only extracts text for AI prompts via `/api/process-document` — preview libraries are not loaded on the server.
