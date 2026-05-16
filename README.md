# DefencePanel (DefensePanel)

A hackathon-style **Defense Panel** prototype: pick a scenario, upload a PDF, let **GPT-4o** draft agent instructions from the document text, create a **Beyond Presence** video agent, talk to it in the arena, then end the session for grading and storage.

## Current stack

- **Frontend:** React 19 + Vite 8, React Router 7, Tailwind CSS 4, `react-hot-toast`
- **Backend:** Vercel-style serverless handlers under [`api/`](api/) (`@vercel/node` when deployed on Vercel)
- **Integrations:** OpenAI (`gpt-4o`), Beyond Presence (`https://api.bey.dev`), Supabase (session row insert)
- **PDF:** `pdf-parse` + `formidable` for multipart uploads

## Scripts

```bash
npm run dev       # Vite dev server (proxies /api → DEV_API_ORIGIN, default http://127.0.0.1:3000)
npm run dev:api   # Local serverless API (`vercel dev` on port 3000) — run alongside `npm run dev`
npm run dev:all   # Runs dev:api + dev together (same as two terminals)
npm run build     # Production client bundle → dist/
npm run lint     # ESLint
npm run preview  # Preview production build locally
```

## App routes

Defined in [`src/main.jsx`](src/main.jsx):

| Path | Page |
|------|------|
| `/` | Mode selection lobby |
| `/setup` (after mode) | PDF upload → process → create agent → go to arena |
| `/arena` | Webcam + Beyond iframe |
| `/debrief` | Scores and feedback after end session |
| `/agent-test` | **Temporary** fixed Bey embed URL for manual testing |

## High-level flow

```mermaid
flowchart LR
  upload["Upload PDF"] --> processDoc["POST /api/process-document"]
  processDoc --> gptConfig["GPT: role flow greeting system_prompt"]
  gptConfig --> start["POST /api/start-session"]
  start --> beyCreate["Beyond: create agent"]
  beyCreate --> arena["Arena iframe"]
  arena --> end["POST /api/end-session"]
  end --> grade["GPT: grade transcript"]
  end --> supa["Supabase: pitch_sessions"]
  end --> del["Beyond: DELETE agent"]
```

## API routes

| Route | Role |
|-------|------|
| [`api/process-document.js`](api/process-document.js) | Accepts PDF (`multipart`, field `pdf`), extracts text, calls OpenAI to return JSON: `role_objectives`, `conversation_flow_structure`, `starting_script`, `system_prompt`, `greeting`, `document_summary`. |
| [`api/start-session.js`](api/start-session.js) | Accepts `multipart`: `system_prompt`, `greeting`, optional `name`, optional `pdf`. Creates **one** Beyond agent (`POST /v1/agents`). Best-effort knowledge PDF upload (see env). Returns `agent_id`, `agent_embed_url`. |
| [`api/end-session.js`](api/end-session.js) | Loads transcript via Beyond **Calls** API when possible, grades with OpenAI, inserts into Supabase, then attempts **`DELETE /v1/agents/{id}`**. Response may include `agent_deleted`, `agent_delete_status`, `bey_call_id`. |

## Environment variables

Copy [`.env.example`](.env.example) to `.env` and fill values. **Never commit real secrets.**

**Local Vite:** `DEV_API_ORIGIN` is where `/api/*` is proxied during `npm run dev` (e.g. `http://127.0.0.1:3000` when using `vercel dev`).

**Server-only (Vercel / `vercel dev`):**

- `OPENAI_API_KEY`
- `BEYOND_PRESENCE_API_KEY`
- `BEY_AVATAR_ID` (required to create agents)
- `BEY_CHAT_EMBED_ORIGIN` (optional, default `https://bey.chat`)
- `BEY_KNOWLEDGE_UPLOAD_URL` (optional; see limitations below)

**Supabase (used in `end-session`):** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must match a project where you created `pitch_sessions` and optional transcript columns.

## Supabase

Run the migration in [`supabase/pitch_sessions_transcript_columns.sql`](supabase/pitch_sessions_transcript_columns.sql) if you want `transcript_text`, `transcript_json`, and `bey_call_id` on `pitch_sessions`. Without these columns, end-session inserts can fail until you align the table schema.

## Local development notes

1. From this folder (`DefensePanel/`): `npm install`
2. **PDF / `/api` routes:** start the API locally with **`npm run dev:api`** (wraps `vercel dev --listen 3000`). Ensure `.env` has `OPENAI_API_KEY` (and other keys as needed). **Or** deploy to Vercel and set `DEV_API_ORIGIN` in `.env` to that deployment URL so Vite can proxy `/api`.
3. Start the UI: **`npm run dev`** and open the URL Vite prints (often `http://127.0.0.1:5173`). If you see “Document API is not running”, the proxy target (default `127.0.0.1:3000`) has nothing listening — run step 2 or fix `DEV_API_ORIGIN`.
4. **One command:** `npm run dev:all` runs API + Vite together (same responsibility as two terminals).
5. For a quick Bey smoke test without PDF flow, open **`/agent-test`**.

---

## Known limitations / current gaps (important)

These are **intentional honesty notes** for the current codebase state:

1. **Agent configuration is not precise enough**  
   Behavior comes from GPT-generated `system_prompt` / `greeting` plus whatever Beyond enforces in the hosted stack. Output quality varies with PDF extraction, truncation, and model behavior. This is **not** a guaranteed match to dashboard “manual” tuning.

2. **PDF is not reliably attached to the agent knowledge base**  
   After agent creation, the app only **attempts** an upload to guessed or `BEY_KNOWLEDGE_UPLOAD_URL` endpoints (see [`api/start-session.js`](api/start-session.js)). There is **no confirmed public, documented** knowledge-file API in-repo; failures fall back to **prompt-only** context from extracted text. **Do not assume** the same behavior as uploading a PDF in the Beyond dashboard.

3. **Agent deletion after “end session” is not guaranteed**  
   [`api/end-session.js`](api/end-session.js) calls `DELETE /v1/agents/{id}` after a successful Supabase insert, but failures (wrong API path, permissions, network, rate limits) can still leave agents in your Beyond account. The JSON response exposes `agent_deleted` / `agent_delete_status` for debugging. **Verify in the Beyond dashboard** if you need certainty.

---

## Repository layout (essentials)

```
DefensePanel/
├── api/                 # Serverless routes (Vercel)
├── src/
│   ├── pages/           # Lobby, setup, arena, debrief, agent-test
│   ├── components/      # UI + Bey iframe wrapper
│   ├── context/         # React session/agent state
│   └── lib/             # Client fetch helpers
├── supabase/            # SQL snippets for pitch_sessions
└── vite.config.js       # Proxies /api → DEV_API_ORIGIN
```

## License / status

Prototype / demo quality; expect rough edges and API drift with Beyond Presence and OpenAI.
