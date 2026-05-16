# Updates since commit `ad20bd7951200b6474d164299c2361437c000fe4`

This document describes **all committed changes** on branch **`Agent`** from **after** base commit `ad20bd7` (*Update agent embed URL handling…*) through **current `HEAD`** (`d6769f3`), plus **local uncommitted changes** present in the working tree at the time this file was generated.

Use it to **replay or merge** the same behavior onto another branch without guessing what moved.

---

## Reference points

| Ref | Full SHA | Description |
|-----|-----------|-------------|
| **Base (exclusive)** | `ad20bd7951200b6474d164299c2361437c000fe4` | Embed URL / chat origin work (*not* listed as changed in `ad20bd7..HEAD` diff below — that commit is the starting line only). |
| **HEAD (inclusive)** | `d6769f37d76bc7cc8398c6bb694d222363b44487` | Latest commit included in the sections below. |
| **Branch** | `Agent` | Where these commits currently live (when this doc was written). |

---

## Commits included (`ad20bd7..HEAD`), chronological

These three commits are everything **after** `ad20bd7` up to `HEAD`:

| Order | Short SHA | Full SHA | Message |
|-------|-----------|----------|---------|
| 1 | `2de97a7` | `2de97a7bc1068944bea1f6369cda10140347b550` | Enhance agent creation and document processing… |
| 2 | `47be2dd` | `47be2dd98a76ba3ba2cbf3d62350770f2a40954d` | Refactor `start-session` API and enhance logging… |
| 3 | `d6769f3` | `d6769f37d76bc7cc8398c6bb694d222363b44487` | Update `process-document` and `start-session` APIs… |

---

## Files touched in `ad20bd7..HEAD` (committed)

```
 api/process-document.js     |  28 ++--
 api/start-session.js        | 119 +++++++++++---
 src/lib/api.js              |   9 ++
 src/pages/ContextUpload.jsx | 375 ++++++++++++++++++++++++++++++++------------
 4 files changed, 404 insertions(+), 127 deletions(-)
```

---

## 1. `api/process-document.js`

### `system_prompt` length guidance

- **Before:** Model instructed that `system_prompt` must be **under 900 characters**.
- **After:** **`UNDER 2500 characters`** (same bullet requirements: project name, 3 technical claims, 2 budget/timeline figures, 2 team roles, closing interrogation instructions).

### `conversation_flow_structure`

Replaced the older five generic steps with an **interrupt-heavy panel simulation** script:

- Step 1: Immediate intro; ask for core technical approach in one sentence; **speak first**.
- Step 2: Interrupt on first **unverified** claim with **“Hold on —”** and document-grounded challenge.
- Step 3: Call out **filler words** after repeated use; forced redo line.
- Step 4: After **~20 seconds** without a clear point: **“What is your actual point?”**
- Step 5: Close with **single biggest risk** question; **no vague answers**.

### `starting_script`

- **Before:** 2–3 sentences; softer briefing style.
- **After:** **Exactly 3 sentences max**, explicit structure:
  1. Reviewed full proposal + **project name**.
  2. One **technical component** + one **number or budget** figure from the document.
  3. Sharp question on **most ambitious / risky** component.
- **Constraints:** **No “Hello”**, **no pleasantries**; must **start with** `I have reviewed...`

*(Extracted text truncation / OpenAI call / JSON schema keys unchanged in spirit — still six keys.)*

---

## 2. `api/start-session.js`

### Beyond Presence request shape

`createAgent` now builds a richer JSON body aligned with Beyond’s agent creation parameters:

| Field | Source |
|-------|--------|
| `avatar_id` | `process.env.BEY_AVATAR_ID` |
| `name` | Form field `name`, default `defense-panel-<timestamp>` |
| `system_prompt` | **Merged** string (see below) |
| `conversational_flow` | Form `conversation_flow` |
| `starting_script` | Form `starting_script` |
| `greeting` | **`starting_script` if non-empty, else** form `greeting` |
| `max_session_length_minutes` | Form `max_session_length`, parsed integer, default **5** |

### Merged `system_prompt` (Beyond-facing)

Server constructs:

```text
[ROLE & OBJECTIVE]
<system_prompt from form, trimmed>

[CONVERSATIONAL FLOW]
<conversation_flow from form>
```

If `conversation_flow` is empty, the `[CONVERSATIONAL FLOW]` block is omitted.

So Beyond receives **one long `system_prompt`** that embeds role + flow, while **`conversational_flow` and `starting_script` remain separate** JSON fields in the same POST body.

### Multipart form fields accepted

| Field | Required | Notes |
|-------|-----------|--------|
| `system_prompt` | **Yes** | Trimmed; empty → error. |
| `greeting` | No | Used when `starting_script` is empty for `greeting` in Beyond body. |
| `conversation_flow` | No | Also merged into `system_prompt` when present. |
| `starting_script` | No | Overrides `greeting` in Beyond body when set. |
| `name` | No | Agent display name for Beyond. |
| `max_session_length` | No | String integer; invalid → **5**. |

### Logging / debugging

- `preview50()` helper — logs first 50 chars of string inputs.
- Logs **incoming** form-derived values (lengths / previews).
- Logs **full Beyond request body** (pretty JSON).
- Reads response as **text first**, then attempts `JSON.parse`; logs raw body and parsed object.
- Error paths still surface Beyond error messages when present.

### Embed URL (unchanged relative to these three commits)

Still uses:

- `BEY_CHAT_EMBED_ORIGIN` (default `https://bey.chat`, trailing slash stripped)
- Embed: `${chatOrigin}/${agent_id}`

*(That env-based embed behavior ties back to commit `ad20bd7`; this doc only tracks **later** commits.)*

---

## 3. `src/lib/api.js` *(committed portion)*

`startSession` **multipart** payload extended:

- Adds **`conversation_flow`**, **`starting_script`**, **`max_session_length`** to `FormData`.
- Keeps existing **`system_prompt`**, **`greeting`**, **`name`** (`defense-panel-<timestamp>`).
- Adds **`console.log`** loop listing FormData keys (first ~80 chars per string value).

*`processDocument` / `endSession` unchanged in the committed range.*

---

## 4. `src/pages/ContextUpload.jsx`

### Flow model

Replaces “upload → immediate busy → done” with explicit **stages**:

| Stage | Behavior |
|-------|-----------|
| `upload` | Dropzone, **session duration** picker (3 / 5 / 10 / 15 minutes), **Analyze Document** button (requires file). |
| `loading` | Overlay while **`processDocument(file)`** runs (plus staged status messages / delays). |
| `preview` | **Three editable textareas**: Role & Objective (`system_prompt`), Conversational Flow, Starting Script — fed from GPT output. Back / **Initialize Panel**. |
| `creating` | Overlay while **`startSession`** runs with edited prompts + duration. |

### Session duration

- UI stores minutes (`selectedDuration`).
- On initialize: `setSessionDuration(selectedDuration * 60)` seconds in app context.
- Passed to API as **`max_session_length`** (minutes) in `startSession`.

### Panel initialization

`startSession` called with:

- `system_prompt`: **edited** textarea (`editedSystemPrompt`)
- `greeting`: from preview prompts (`previewPrompts.greeting`)
- `conversation_flow`: **`editedConvFlow`**
- `starting_script`: **`editedStartingScript`**
- `max_session_length`: **`selectedDuration`**

On success: updates agent context, sets session id (`crypto.randomUUID` fallback), toast success, **`navigate('/arena')`**.

### Context wiring

`savePromptsToContext` now also sets **`setAgentConversationFlow`** and **`setAgentStartingScript`** from document analysis results.

---

## How to apply this on another branch

### Option A — Merge

From your target branch:

```bash
git fetch origin
git merge Agent
```

Resolve conflicts if any (likely in the four files above).

### Option B — Cherry-pick (preserves individual commits)

```bash
git cherry-pick 2de97a7bc1068944bea1f6369cda10140347b550 47be2dd98a76ba3ba2cbf3d62350770f2a40954d d6769f37d76bc7cc8398c6bb694d222363b44487
```

Order must stay **2de97a7 → 47be2dd → d6769f3** (oldest of the three first).

### Option C — Export patches

```bash
git format-patch -o patches ad20bd7951200b6474d164299c2361437c000fe4..HEAD
# Then on other branch:
git am patches/*.patch
```

---

## Appendix A — Uncommitted working-tree changes (not in `HEAD`)

At generation time, **`git status`** showed additional edits **not** included in `d6769f3`. Bring these over manually if you want **local dev / PDF proxy UX** fixes as well:

| File | Purpose |
|------|---------|
| [`package.json`](package.json) | Scripts `dev:api` (`vercel dev --listen 3000`), `dev:all` (`concurrently`); devDependencies **`vercel`**, **`concurrently`**. |
| [`package-lock.json`](package-lock.json) | Lockfile updates from those installs. |
| [`README.md`](README.md) | Documents `dev:api`, `dev:all`, proxy / “Document API not running” troubleshooting. |
| [`.env.example`](.env.example) | Note to run `npm run dev:api` alongside `DEV_API_ORIGIN`. |
| [`src/lib/api.js`](src/lib/api.js) | **Beyond committed scope:** `readJsonResponse`, clearer toasts when **`/api` proxy target is down**, real API error messages for `processDocument`; improved **`startSession`** / **`endSession`** handling when response is non-JSON or empty. |

To capture them as commits on `Agent` before porting:

```bash
git add package.json package-lock.json README.md .env.example src/lib/api.js
git commit -m "Dev tooling and clearer API client errors for local PDF flow"
```

Then merge or cherry-pick that commit on the other branch too.

---

## Appendix B — Quick verification checklist (after porting)

1. **`POST /api/process-document`** with a text-based PDF returns `success: true` and six prompt fields when `OPENAI_API_KEY` is set.
2. **Setup page:** duration chips → preview → **Initialize Panel** sends multipart fields expected by `start-session`.
3. Beyond agent creates without error when **`BEYOND_PRESENCE_API_KEY`** and **`BEY_AVATAR_ID`** are set.
4. Arena loads **`agent_embed_url`** built from **`BEY_CHAT_EMBED_ORIGIN`** + agent id.

---

*Generated for syncing `Agent` changes after `ad20bd7` onto other branches. Update Appendix A if your working tree diverges.*
