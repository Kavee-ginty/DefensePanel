# The Defense Panel

## One-Line Pitch

A multi-persona AI panel that watches you over WebRTC, reads your project document, and challenges you in real time, so you walk into your pitch, viva, or interview having already faced the hardest questions.

---

# Summary

Founders, researchers, and job-seekers routinely fail high-stakes presentations not because they lack knowledge, but because they have never practiced under real adversarial pressure.

The Defense Panel puts you in front of two hyper-realistic Beyond Presence avatars — one interrogating your logic, one tracking your delivery — that have read your actual document and will interrupt you when you waffle or contradict yourself.

Sessions are automatically graded and stored in Supabase so you can track improvement over time. The product runs entirely in the browser via WebRTC with no plugins required.

---

# Submission Details

| Field | Details |
|---|---|
| Track | Best Use of Beyond Presence |
| Beyond Presence Integration | Two live WebRTC avatar agents run in parallel per session, created dynamically via the Beyond Presence REST API with GPT-4o-generated system prompts derived from the user's uploaded document |
| Demo URL | https://defense-panel-two.vercel.app |
| Tech Stack | React 18 · Vite 6 · Vercel Functions · OpenAI GPT-4o · Beyond Presence · LiveKit · Supabase · Dodo Payments |

---

# Problem Statement

## The Problem

Founders preparing investor pitches, postgraduate researchers approaching their viva voce, and candidates facing technical interviews share a common blind spot: they rehearse their material but never rehearse under adversarial, real-time pressure.

When a VC says:

> "Your CAC payback period doesn't add up"

or an examiner says:

> "You contradict your own methodology on page 47"

most people freeze — not because they lack the answer, but because they have never been asked that way before.

If left unsolved:

- Founders lose funding rounds
- PhD candidates fail vivas
- Qualified candidates fail interviews they were capable of passing

## Why It Matters

- Startup pitch success rates for first-time founders hover around 1–3%
- Viva failure and major correction rates exceed 15%
- Technical interview pass rates at top-tier companies are below 20%

Existing practice methods are:
- Expensive
- Difficult to schedule
- Rarely adversarial enough

## Root Cause

The issue is not a lack of preparation tools.

There are:
- Flashcard apps
- Slide coaches
- Interview question banks

But none provide:
- Persistent contextual memory
- Real-time adversarial interruption
- Awareness of the uploaded document
- Dynamic challenge generation

---

# Proposed Solution

## What the Product Does

Users upload:
- Pitch decks
- Theses
- CVs

The backend:
1. Extracts document text
2. Sends it to GPT-4o
3. Generates a structured Context Matrix

Two Beyond Presence avatars are then created:
- **Interrogator** → challenges logic
- **Ah-Counter** → tracks delivery quality

Users enter a live WebRTC arena where both avatars:
- See and hear them
- Interrupt weak answers
- React contextually

At the end:
- GPT-4o grades the transcript
- Results are stored in Supabase

---

# Key Features

| Feature | User Need Addressed |
|---|---|
| Document-aware AI personas | Catch contradictions specific to the user's content |
| Live WebRTC barge-in interruption | Simulates real pressure |
| Dual avatar panel | Separates logic critique from delivery feedback |
| Three simulation modes | Startup Pitch / Viva / Interview |
| Difficulty levels | Friendly / Standard / Brutal |
| Auto-grading & transcript persistence | Tracks improvement over time |
| Inline document preview | Mirrors real presentation setup |
| Vision mode toggle | Optional body-language commentary |

---

# Scope

## In Scope

- Three simulation modes
- Dual Beyond Presence agents
- LiveKit real-time media bridge
- GPT-4o grading pipeline
- Supabase authentication and session history
- PDF / DOCX / PPTX extraction
- Dodo Payments integration
- Public deployment

## Out of Scope

- Native mobile apps
- Enterprise SSO
- Custom avatar creation
- Voice cloning
- Real-time transcript display

---

# Functional Requirements

## Must Have

- Upload PDF/DOCX/PPTX
- GPT-generated Context Matrix within 10 seconds
- Live avatar session
- Context-aware interruptions
- Simulation mode selection
- Auto-generated grading
- Session persistence
- Email/password and Google OAuth authentication
- Session bookmarking
- Difficulty and session-length configuration

## Should Have

- Second avatar observer
- Practice goal selection
- Inline document preview
- Vision mode

## Could Have

- Native mobile apps
- Real-time transcript display
- Collaborative sessions
- Voice/avatar customization
- Email reports

---

# Non-Functional Requirements

## Performance

- Document processing < 10 seconds
- Agent creation < 30 seconds
- Grading < 60 seconds

## Reliability

- Structured error handling
- Frontend toast notifications
- Graceful extraction fallbacks
- Automatic agent cleanup

## Usability

- Single-page application flow
- Minimal controls during session
- Chromium browser recommendation

## Scalability

- Stateless API sessions
- Supabase RLS multi-tenancy
- Serverless auto-scaling

---

# Technical Architecture

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 6 + Tailwind CSS |
| Realtime Media | Beyond Presence + LiveKit |
| Backend | Vercel Functions |
| Parsing | pdf-parse, mammoth, jszip |
| AI | OpenAI GPT-4o |
| Database/Auth | Supabase |
| Payments | Dodo Payments |
| Hosting | Vercel |

---

# Core Data Flow

1. User uploads document
2. Backend extracts text
3. GPT-4o generates Context Matrix
4. User configures session
5. Backend creates Beyond Presence agents
6. Browser launches WebRTC arena
7. Session runs with live interruptions
8. User ends session
9. GPT grades transcript
10. Results saved to Supabase

---

# AI Integration

GPT-4o performs:
- Context extraction
- Persona generation
- Transcript grading

Outputs:
- System prompt
- Greeting
- Role objectives
- Conversation structure
- Starting script
- Document summary

Grading returns:
- Overall score
- Filler word count
- Critical feedback

---

# Known Technical Limitations

- WebRTC interruption latency may vary
- PPTX extraction weak for image-heavy decks
- Dodo sidecar is single-process
- Transcript retrieval may occasionally fail

---

# Security

## Authentication

- Supabase Auth
- JWT verification
- Row Level Security

## Data Handling

- Documents processed in-memory only
- No payment data stored

## Secret Management

Secrets stored only server-side:
- OPENAI_API_KEY
- BEYOND_PRESENCE_API_KEY
- SUPABASE_SERVICE_ROLE_KEY
- DODO_PAYMENTS_API_KEY

## Validation

- MIME validation
- 10MB upload limit
- JSON validation for AI outputs

---

# User Stories

## Startup Founder

> I want to upload my pitch deck and be challenged by an AI investor panel.

## PhD Researcher

> I want to simulate my viva with AI examiners.

## Job Candidate

> I want to practice technical interviews with AI recruiters.

## Returning User

> I want to track my progress across sessions.

---

# Startup Pitch Use Case

1. User uploads deck
2. AI processes document
3. User configures session
4. Arena launches
5. AI interrupts weak reasoning
6. Session continues dynamically
7. Grading begins
8. Feedback dashboard appears
9. Session saved to history

---

# Edge Cases

- Image-heavy PPTX uploads
- Blocked microphone permissions
- Very short sessions
- User leaves session early

---

# Target Users

## Primary Users

- Startup founders
- PhD researchers
- Technical interview candidates

## Market Opportunity

Targets:
- Viva preparation
- Startup fundraising
- Technical interview coaching

---

# Competitive Landscape

| Competitor | Weakness |
|---|---|
| Yoodli / Poised | Delivery analysis only |
| ChatGPT / Claude | No real-time presence |
| Human mock panels | Expensive and hard to schedule |

---

# Business Model

## Freemium SaaS

### Free Tier
- 3 sessions/month
- Standard difficulty
- Single avatar

### Pro Tier
- Unlimited sessions
- Dual avatars
- Brutal difficulty
- Full history

### Pricing
- £12–£18/month
- Annual discount
- Institutional plans

---

# Go-To-Market Strategy

- University outreach
- Startup accelerator partnerships
- Short-form social content
- Sponsor collaborations

---

# Roadmap

## Built
- Dual avatars
- GPT grading
- Session history
- Payments integration

## 0–3 Months
- Real-time transcript display
- Better PPTX extraction
- Progress analytics

## 1 Year
- Voice cloning
- Institutional dashboards
- Native mobile apps

---

# Why This Project Leads the Track

## Technical Edge

- Dynamic document-generated prompts
- Dual Beyond Presence agents
- Real-time contextual interruptions
- Full AI orchestration lifecycle

## Problem-Solution Fit

Every feature directly supports adversarial practice under pressure.

## Execution Quality

- Public deployment
- Working production stack
- End-to-end integration
- Payments + persistence included

## Real-World Potential

Applicable to:
- Startups
- Academia
- Technical hiring

The product has:
- Clear monetization
- Viral demo moments
- Institutional expansion potential

---

# Team & Roles

| Member | Responsibility |
|---|---|
| Kaveesha Ginodh | Team leadership, coordination, debugging |
| Dulaksha Dulan | UI/UX and frontend |
| Thesaru Praneeth | Backend and AI integration |
| Prabuddha Paranawithana | Payments and database architecture |

---

# Why This Team

The team covers:
- Frontend
- Backend
- AI
- Infrastructure
- Payments
- Deployment

All integrated into a working production-grade system within 24 hours.
--- 

## Setup

See **[REQUIREMENTS.md](REQUIREMENTS.md)** for full clone-and-run instructions (Node 22.13+, all env vars, Supabase SQL, dual-terminal API setup, and troubleshooting).

Quick start:

```bash
npm install
cp .env.example .env
```

Fill in `.env` from `.env.example` (Supabase, OpenAI, Beyond Presence). Run `supabase/pitch_sessions.sql` in Supabase (and optionally `supabase/pitch_sessions_extended.sql` for dashboard/debrief enrichment fields). Enable **Email** auth. For briefing deploy and live agents, also run `npx vercel dev --listen 3000` in a second terminal (see REQUIREMENTS.md).

## Run

```bash
npm run dev
```

## Flow

1. **Auth** — Login (email/password) or Register (username, email, password)
2. **Lobby** — Select Startup Pitch, Academic Viva, or Technical Interview
3. **Briefing** — Upload mode-specific PDF, DOCX, or PPTX context
4. **Arena** — Startup Pitch: multi-format presentation preview + presenter PIP + panelists; other modes: full webcam + panelists
5. **Debrief** — Performance analytics (mock data until API is wired)

## Build

```bash
npm run build
```

## Deploy to Vercel

This repo is configured for one-click deployment as a Vite SPA with serverless functions in `/api`.

### 1. Push to GitHub / GitLab / Bitbucket

```bash
git push
```

### 2. Import the project in Vercel

- Vercel will auto-detect the Vite framework (also pinned in [`vercel.json`](vercel.json)).
- Build command: `npm run build` · Output directory: `dist` · Install: `npm install`.
- Node runtime is pinned to `>=20` via `package.json#engines`.

### 3. Set environment variables (Project Settings -> Environment Variables)

Required for all environments (Production / Preview / Development):

| Variable | Used by |
|---|---|
| `VITE_SUPABASE_URL` | Frontend Supabase client |
| `VITE_SUPABASE_ANON_KEY` | Frontend Supabase client |
| `SUPABASE_URL` | `/api/*` serverless |
| `SUPABASE_ANON_KEY` | `/api/end-session`, `/api/sessions` (JWT verification) |
| `SUPABASE_SERVICE_ROLE_KEY` | `/api/end-session`, `/api/sessions` (admin inserts) |
| `OPENAI_API_KEY` | `/api/process-document`, `/api/end-session` |
| `BEYOND_PRESENCE_API_KEY` | `/api/start-session`, `/api/start-call`, `/api/end-session` |
| `BEY_AVATAR_ID` | `/api/start-session` (Beyond Presence avatar persona) |
| `DODO_PAYMENTS_API_KEY` | `/api/create-checkout` (Dodo Payments secret key) |
| `DODO_API_URL` | `/api/create-checkout` (e.g. `https://test.dodopayments.com` or `https://live.dodopayments.com`) |
| `PRODUCT_ID` | `/api/create-checkout` (default Dodo product) |

Optional:

| Variable | Default | Purpose |
|---|---|---|
| `BEY_CHAT_EMBED_ORIGIN` | `https://bey.chat` | Override the iframe-fallback embed origin |
| `BEY_AVATAR_ID2` | unset | Second Beyond avatar: silent panelist agent + LiveKit slot 2 in the arena |
| `VITE_USE_API_SESSIONS` | unset | Force the frontend to use `/api/sessions` instead of direct Supabase reads. Production already uses `/api/*` automatically. |
| `FRONTEND_URL` | request origin | Fallback `return_url` host for `/api/create-checkout` after payment |
| `VITE_DODO_API_URL` | unset | Point Pricing checkout at the standalone `dodo/` Express gateway instead of `/api/create-checkout` |

Never expose `OPENAI_API_KEY`, `BEYOND_PRESENCE_API_KEY`, or `SUPABASE_SERVICE_ROLE_KEY` to the frontend — only the `VITE_`-prefixed pair is bundled into the client.

### 4. Run Supabase setup

In the Supabase SQL editor, run:

1. `supabase/pitch_sessions.sql`
2. `supabase/pitch_sessions_extended.sql` (debrief scores)
3. `supabase/pitch_sessions_transcript.sql` (Beyond transcript columns)

Enable **Email** auth in Supabase, and add your Vercel domain to the **Site URL** / redirect allowlist.

### 5. Function limits

[`vercel.json`](vercel.json) bumps memory and `maxDuration` for the AI endpoints (`process-document`, `end-session`) so OpenAI + Beyond Presence calls have time to complete. On the Hobby plan max duration is capped at 60s — the values in `vercel.json` stay within that limit.
