# Beyond Presence Dashboard Setup

This document is the Member 4 runbook for configuring the external Beyond Presence dashboard for The Defense Panel.

## Project

Create a Beyond Presence project or workspace entry:

```txt
Project name: The Defense Panel
Demo scenario: Startup Pitch
Primary experience: high-pressure VC defense simulation
```

Use managed video agents for the hackathon demo. The app will connect through Vercel `/api` endpoints so API keys never enter the React frontend.

## Required Dashboard Settings

Record these values immediately after setup and share them with the backend/WebRTC members through your team channel, not in public frontend code.

| Field | Value |
| --- | --- |
| Beyond Presence project name | The Defense Panel |
| API key owner | Member 4 / PM |
| Interrogator agent ID | `PASTE_AGENT_ID_HERE` |
| Evaluator agent ID | `PASTE_AGENT_ID_HERE` |
| Interrogator avatar ID | `PASTE_AVATAR_ID_HERE` |
| Evaluator avatar ID | `PASTE_AVATAR_ID_HERE` |
| Language | `en-US` |
| Max session length | `10` minutes |
| Local allowed origin | `http://localhost:5173` |
| Production allowed origin | `PASTE_VERCEL_URL_HERE` |
| Webhook URL, if used | `https://YOUR_VERCEL_DOMAIN/api/beyond-presence-webhook` |

## Dashboard Checklist

1. Sign in to the Beyond Presence dashboard.
2. Create or select the project named `The Defense Panel`.
3. Generate an API key from dashboard settings.
4. Add the API key to Vercel environment variables only:

```env
BEYOND_PRESENCE_API_KEY=
```

5. Add allowed origins:

```txt
http://localhost:5173
https://YOUR_VERCEL_DOMAIN
```

6. Create the two managed agents listed below.
7. Test each agent in the dashboard before wiring the app.
8. Verify the agents interrupt quickly and keep answers under 20 seconds.

## Agent 1: The Interrogator

Use this agent for content, business model, revenue, technical architecture, methodology, and contradiction attacks.

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

Use this agent for delivery pressure, filler-word counting, pacing, rambling, confidence, and speech discipline.

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

If the dashboard does not expose a setting directly, enforce it inside the system prompt.

## Test Script

Use this script in the dashboard test call:

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

- Both agents can be called from the dashboard.
- Both agents use the exact prompts from `AIPromptPack.md`.
- Agent IDs and avatar IDs are recorded in this file or a private PM handoff note.
- Allowed origins include localhost and the final Vercel URL.
- At least one live test produces an audible interruption.
- Members 1-3 know that the frontend must only call Vercel `/api` endpoints, never the Beyond Presence API directly with secret keys.
