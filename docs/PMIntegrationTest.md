# PM integration test (end-to-end)

Run this **after** Vercel has deployed `main` with `/api/start-session` and env vars set.

## 1. Smoke test `start-session` only

Replace placeholders. Use a minimal JSON body if `/api/process-document` is not ready yet.

```bash
curl -s -X POST "https://YOUR_VERCEL_APP.vercel.app/api/start-session" \
  -H "Content-Type: application/json" \
  -d "{\"scenario\":\"Startup Pitch\",\"user_id\":\"demo-user-1\",\"context_matrix\":{\"document_summary\":\"SaaS MVP\",\"core_claims\":[\"We ship fast\"],\"weak_claims\":[{\"claim\":\"We scale infinitely\",\"why_it_is_weak\":\"No proof\",\"attack_question\":\"What breaks first?\"}],\"revenue_metric\":{\"metric\":\"MRR\",\"value\":\"Not Found\",\"risk\":\"No revenue proof\"},\"technical_risks\":[{\"risk\":\"WebRTC latency\",\"attack_question\":\"Latency budget?\"}],\"contradictions_to_watch\":[\"Do not inflate MRR\"]}}"
```

Expect HTTP **200** and JSON with `agents.interrogator.url` and `agents.evaluator.url`.

## 2. Live interruption script

In the arena (or opening both URLs in two tabs for a crude panel):

Speak clearly:

```txt
We have, um, like, 50k MRR and our AI architecture basically scales automatically.
```

Expected:

- Evaluator-style interruption on filler words.
- Interrogator-style challenge if context says MRR is not 50k.

## 3. Sign-off

- [ ] Both agent URLs load.
- [ ] At least one audible interruption.
- [ ] No API keys in browser responses.

See also [`IntegrationHandoff.md`](../IntegrationHandoff.md) **PM Final Integration Test**.
