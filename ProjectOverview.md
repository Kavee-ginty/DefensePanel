# Project Overview

## Project Name

The Defense Panel

## Event

Cursor Colombo Buildathon, Best Use of Beyond Presence track

## One-Line Pitch

The Defense Panel turns pitch practice into a live AI interrogation room where Beyond Presence avatars interrupt weak answers in real time and GPT-4o turns the session into measurable performance feedback.

## Problem

People rehearse important presentations in low-pressure environments. They practice in front of mirrors, friends, static slide notes, or text chatbots. None of those tools recreate the physiological stress of a real investor meeting, viva defense, or technical interview.

The result is predictable:
- Presenters ramble under pressure.
- They overuse filler words.
- They inflate metrics without evidence.
- They fail when interrupted by a real evaluator.
- They leave practice sessions without measurable improvement data.

## Solution

The Defense Panel creates a high-pressure live simulation:

1. The user uploads a pitch deck, research paper, or resume.
2. GPT-4o extracts claims, weak points, contradictions, metrics, and technical risks.
3. Beyond Presence agents join the simulation as realistic panelists.
4. The panel listens to the user through a live audio/video interface.
5. The agents interrupt when the user rambles, uses filler words, makes vague claims, or contradicts the uploaded document.
6. GPT-4o scores the transcript.
7. Supabase stores session results so progress is visible over time.

## Why Beyond Presence Matters

The core value of this project depends on presence. A text chatbot cannot create the same pressure as a human-like avatar making eye contact, speaking over the presenter, and forcing an immediate answer.

Beyond Presence enables:
- Hyper-realistic evaluator avatars.
- Live conversational pressure.
- A panel-like experience instead of a static chat window.
- More memorable demo impact for judges.

## Target Users

Primary:
- Startup founders preparing for VC pitches.

Secondary:
- Students preparing for academic viva defenses.
- Engineers preparing for technical interviews.
- Sales teams practicing enterprise demos.
- Executives rehearsing board presentations.

## MVP Scope

The hackathon MVP focuses on the highest-impact path:

```txt
Startup Pitch -> PDF Upload -> Live AI Panel -> Debrief Dashboard
```

The MVP intentionally avoids:
- Login and signup flows.
- Complex multi-user workspaces.
- Long-term document management.
- Heavy backend frameworks.

The user is hardcoded as:

```txt
demo-user-1
```

## Product Flow

```txt
Lobby
  -> user selects Startup Pitch

Briefing Room
  -> user uploads a PDF
  -> GPT-4o extracts attack points

Defense Arena
  -> webcam feed on one side
  -> Beyond Presence avatar on the other
  -> AI interrupts weak speaking in real time

Aftermath Dashboard
  -> score
  -> filler word count
  -> critical feedback
  -> historical progress
```

## AI Panel

The MVP uses two strict personas:

### The Interrogator

A skeptical VC and technical subject matter expert. This agent attacks:
- Unsupported revenue claims.
- Vague architecture answers.
- Scalability assumptions.
- Contradictions against the uploaded PDF.
- Missing proof.

### The Evaluator

A cold public-speaking judge and ah-counter. This agent attacks:
- Filler words.
- Rambling.
- Weak pacing.
- Hedging.
- Lack of concise conclusions.

## Technical Architecture

Frontend:
- React 18 with Vite.
- Tailwind CSS.
- Desktop-first arena UI.
- Local webcam and microphone handling.

Backend:
- Vercel Serverless Functions in `/api`.
- `/api/process-document` for PDF parsing and context extraction.
- `/api/start-session` for Beyond Presence session/agent setup.
- `/api/end-session` for scoring and Supabase insert.

AI and media:
- GPT-4o for document analysis and scoring.
- Beyond Presence for video avatars and live panel behavior.

Database:
- Supabase PostgreSQL.
- Single MVP table: `pitch_sessions`.

## Security Model

The frontend never stores or uses secret API keys.

```txt
React Frontend
  -> Vercel Serverless API
  -> OpenAI / Beyond Presence / Supabase
```

Required server-side secrets:

```env
OPENAI_API_KEY=
BEYOND_PRESENCE_API_KEY=
BEYOND_PRESENCE_API_BASE_URL=https://api.bey.dev
SUPABASE_SERVICE_ROLE_KEY=
```

Optional server-side avatar fallbacks:

```env
BEYOND_INTERROGATOR_AVATAR_ID=
BEYOND_EVALUATOR_AVATAR_ID=
```

## Demo Script Summary

The presenter intentionally gives a weak answer:

```txt
We have, um, like, 50k MRR and our AI architecture basically scales automatically.
```

The expected AI interruption:

```txt
Stop there. Your document does not prove 50k MRR. Where is that number coming from?
```

This moment proves the product is not passive feedback. It is active pressure conditioning.

## Success Metrics

The demo succeeds if judges see:

- A realistic Beyond Presence avatar in the live arena.
- A clear AI interruption during the presentation.
- A strict panel tone, not a generic assistant tone.
- A saved Supabase session row.
- A debrief dashboard showing score, filler count, feedback, and improvement history.

## Hackathon Differentiator

The Defense Panel is not another slide-review chatbot. It is an interactive performance simulator where the AI does what real judges do: interrupts, challenges, and forces the presenter to defend under pressure.

That makes Beyond Presence central to the product, not decorative.
