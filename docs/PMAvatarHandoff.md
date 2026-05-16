# PM — Avatar IDs handoff (Member 4 → Member 2)

Pick **two different**, formal boardroom-style avatars in the Beyond Presence dashboard (or note IDs from `GET https://api.bey.dev/v1/avatars` with your API key). Paste UUIDs below and send **only this section** to Member 2 (no API keys in the same message if avoidable).

| Role | Avatar display name (optional) | Avatar ID (UUID) |
|------|-------------------------------|------------------|
| The Interrogator | | |
| The Evaluator | | |

Member 2 sets in Vercel:

```env
BEYOND_INTERROGATOR_AVATAR_ID=paste-uuid-here
BEYOND_EVALUATOR_AVATAR_ID=paste-uuid-here
```

Then redeploy. If these vars stay empty, the backend auto-selects the first two **available** avatars from the API.
