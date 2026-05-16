# Beyond Presence Dashboard Setup

This document is the Member 4 runbook for configuring Beyond Presence access for The Defense Panel.

## Project

The current build does not require manually creating dashboard agents for every user session. The Vercel backend creates two disposable, context-aware agents at session start using the Beyond Presence API.

```txt
Demo scenario: Startup Pitch
Primary experience: high-pressure VC defense simulation
```

Use managed video agents for the hackathon demo. The app will connect through Vercel `/api` endpoints so API keys never enter the React frontend.

## Required Dashboard Settings

Record these values after setup and share only non-secret IDs with the backend/WebRTC members. Do not paste the API key into frontend code or public docs.

| Field | Value |
| --- | --- |
| API key owner | Member 4 / PM |
| API key env var | `BEYOND_PRESENCE_API_KEY` |
| API base URL env var | `BEYOND_PRESENCE_API_BASE_URL=https://api.bey.dev` |
| Optional Interrogator avatar ID | `BEYOND_INTERROGATOR_AVATAR_ID=` |
| Optional Evaluator avatar ID | `BEYOND_EVALUATOR_AVATAR_ID=` |
| Language | `en-US` |
| Max session length | `10` minutes |
| Local allowed origin | `http://localhost:5173` |
| Production allowed origin | `PASTE_VERCEL_URL_HERE` |
| Webhook URL, if used | `https://YOUR_VERCEL_DOMAIN/api/beyond-presence-webhook` |

## Dashboard Checklist

1. Sign in to the Beyond Presence dashboard.
2. Generate an API key from dashboard settings.
3. Add the API key to Vercel environment variables only:

```env
BEYOND_PRESENCE_API_KEY=
BEYOND_PRESENCE_API_BASE_URL=https://api.bey.dev
```

4. Optionally choose two stable avatar IDs from the avatar list and add them to Vercel:

```env
BEYOND_INTERROGATOR_AVATAR_ID=
BEYOND_EVALUATOR_AVATAR_ID=
```

If these are not set, `/api/start-session` calls `GET /v1/avatars` and selects available avatars automatically.

5. Add allowed origins:

```txt
http://localhost:5173
https://YOUR_VERCEL_DOMAIN
```

6. Start a session through the app. The backend will create the two agents automatically.
7. Verify the generated agent URLs load and the agents keep answers under 20 seconds.

## Agent 1: The Interrogator

This agent is created automatically by `/api/start-session`. It handles content, business model, revenue, technical architecture, methodology, and contradiction attacks.

```txt
Name: The Interrogator
Role: Skeptical VC and technical subject matter expert
Language: en-US
Greeting: Begin. You have 90 seconds to defend the core claim. I will stop you when the logic fails.
Max session length: 10
Capabilities: webcam_vision if available
LLM: OpenAI or OpenAI-compatible, low-latency model preferred
Temperature: 0.35 to 0.5
```

Avatar guidance:
- Choose the most formal, boardroom-appropriate avatar available.
- Prefer neutral facial expression, direct eye contact, and low emotional warmth.
- Avoid friendly, casual, playful, or customer-support style avatars.

## Agent 2: The Evaluator

This agent is created automatically by `/api/start-session`. It handles delivery pressure, filler-word counting, pacing, rambling, confidence, and speech discipline.

```txt
Name: The Evaluator
Role: Public speaking judge and ah-counter
Language: en-US
Greeting: I am tracking filler words, pace, clarity, and evasiveness. Start when ready.
Max session length: 10
Capabilities: webcam_vision if available
LLM: OpenAI or OpenAI-compatible, low-latency model preferred
Temperature: 0.25 to 0.45
```

Avatar guidance:
- Choose a different formal avatar from The Interrogator so the panel feels multi-persona.
- Prefer calm, severe, professional presence.
- Avoid avatars that appear cheerful, comedic, or overly sympathetic.

## Aggressive Settings

Enable the strongest available equivalents of these settings:

| Capability | Target Setting |
| --- | --- |
| Turn detection | Interrupt as soon as the agent detects a trigger, not only after long silence |
| Barge-in | Enabled |
| Wake word | Disabled for demo unless the platform requires it |
| Response length | Short |
| Latency mode | Lowest latency available |
| Webcam vision | Enabled if stable |
| Conversation analytics | Enabled |
| Call transcripts | Enabled |

If the API or dashboard does not expose a setting directly, enforce it inside the system prompt.

## Test Script

Use this script in a generated agent call:

```txt
Hi, I am pitching Defense Panel. We have, um, like, built a revolutionary platform with 50k MRR, and our architecture is basically AI plus WebRTC and it scales automatically.
```

Expected behavior:

- The Evaluator interrupts after the repeated filler words.
- The Interrogator challenges `50k MRR` if the uploaded context says a different number.
- Both agents avoid generic coaching.
- Responses are short, severe, and specific.

## PM Sign-Off Criteria

The Beyond Presence setup is ready only when:

- `BEYOND_PRESENCE_API_KEY` is stored only in backend/Vercel environment variables.
- `/api/start-session` returns two generated agent IDs and URLs.
- Both generated agents use prompt logic from `api/_lib/agentPromptFactory.js`, derived from `AIPromptPack.md`.
- Optional avatar IDs are recorded in Vercel env if the team wants deterministic avatars.
- Allowed origins include localhost and the final Vercel URL.
- At least one live test produces an audible interruption.
- Members 1-3 know that the frontend must only call Vercel `/api` endpoints, never the Beyond Presence API directly with secret keys.
