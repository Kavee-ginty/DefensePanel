# Members 1 & 3 — Wire frontend to `/api/start-session`

## Goal

After PDF/context processing, call the backend so **two disposable Beyond Presence agents** are created. Use returned URLs or IDs in the arena — **never** put `BEYOND_PRESENCE_API_KEY` in React.

## Client helper

Use [`src/lib/api.js`](../src/lib/api.js):

```js
import { startSession } from '../lib/api';

const panel = await startSession({
  scenario: 'Startup Pitch',
  contextMatrix: contextFromProcessDocument, // JSON from `/api/process-document`
});

const interrogatorUrl = panel.agents.interrogator.url; // https://bey.chat/{id}
const evaluatorUrl = panel.agents.evaluator.url;
```

## UX checklist

- [ ] After **Initialize Panel**, POST `/api/process-document`, store `context_matrix` (or full JSON) in React state/context.
- [ ] On **Enter arena**, POST `/api/start-session` with `{ scenario, context_matrix }`.
- [ ] Handle `warnings[]` in the JSON (e.g. single avatar reused).
- [ ] Arena displays **at least one** avatar channel using SDK **or** managed UI URL pattern — coordinate split-screen vs sequential demo.
- [ ] Persist `session_id`, `agents.interrogator.agent_id`, `agents.evaluator.agent_id` for optional `/api/end-session` cleanup + transcript correlation later.

## Response shape (reference)

See [`IntegrationHandoff.md`](../IntegrationHandoff.md) section **API Contract: `/api/start-session`**.

## Verify

- [ ] Browser DevTools **Network**: requests only to same-origin `/api/start-session`, never to `api.bey.dev` from the browser.
- [ ] Opening returned `https://bey.chat/{agent_id}` loads the managed agent experience.
