# Member 2 — Vercel environment variables (secret handoff)

Member 4 (PM) must share secrets **only** with Member 2 through a private channel (1Password, encrypted DM, or Vercel project invite where M2 adds vars themselves). **Never** paste keys into Slack/GitHub/issues/README.

## Steps for Member 2

1. Open Vercel project → **Settings** → **Environment Variables**.
2. Add each variable below for **Production** (and **Preview** if you test PR previews).

## Required variables

| Variable | Where used | Notes |
|----------|------------|------|
| `BEYOND_PRESENCE_API_KEY` | `/api/start-session`, Beyond Presence client | Header `x-api-key` on `https://api.bey.dev` |
| `BEYOND_PRESENCE_API_BASE_URL` | Optional override | Default `https://api.bey.dev` |
| `OPENAI_API_KEY` | `/api/process-document`, `/api/end-session` | Never expose to frontend |
| `SUPABASE_URL` | `/api/end-session` | Same project URL as frontend anon URL root |
| `SUPABASE_SERVICE_ROLE_KEY` | `/api/end-session` inserts | **Secret** — server only |

## Optional demo consistency

| Variable | Purpose |
|----------|---------|
| `BEYOND_INTERROGATOR_AVATAR_ID` | Formal avatar for The Interrogator |
| `BEYOND_EVALUATOR_AVATAR_ID` | Different formal avatar for The Evaluator |

If omitted, `GET /v1/avatars` selects available avatars automatically.

## Frontend public (also in Vercel but safe for browser)

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Supabase anon reads from React |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |

## PM checklist

- [ ] M2 confirms all vars exist on Production deployment.
- [ ] Redeploy after changing secrets (or trigger redeploy).
- [ ] Confirm `curl`/browser never receives `BEYOND_PRESENCE_API_KEY` or `OPENAI_API_KEY` in responses.

See repository root [`.env.example`](../.env.example) for local naming parity.
