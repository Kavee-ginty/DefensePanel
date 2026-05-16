# Product Requirements Document (PRD)

---

# Project Name: The Defense Panel
### Event: Cursor Colombo Buildathon (May 16–17, 2026)
### Track: Best Use of Beyond Presence

---

# 1. Executive Summary & Product Vision

The Defense Panel is an immersive, real-time AI simulation designed to mentally condition individuals for high-stakes, interactive evaluations.

Traditional pitch preparation tools rely on static mirrors or text-based LLM feedback, which fail to replicate the physiological pressure of real-world presentations.

This system combines:

- Continuous WebRTC audio/video streaming
- GPT-4o reasoning and evaluation
- Beyond Presence hyper-realistic avatars
- Supabase-powered performance tracking

The platform actively listens to live presentations, analyzes delivery mechanics, and interrupts users with context-aware, high-pressure questioning.

It simulates the intensity of real judging panels, forcing presenters to think, adapt, and defend in real time.

---

# 2. Target Audience & Primary Use Cases

The platform supports multiple simulation modes.

## Primary Mode

### Startup Founder (VC Pitch)

- Defend revenue models
- Justify traction claims
- Explain technical architecture under pressure

---

## Secondary Modes

### Academic Viva

- Defend thesis methodology
- Answer rigorous academic questioning

### Technical Interview

- Defend resume claims
- Solve spontaneous engineering challenges

---

# 3. Core Features & Functional Requirements

---

# 3.1 Dynamic Context Ingestion Engine

## Description

The AI must understand the user's content before simulation begins.

## Requirements

- Users upload PDF documents:
  - Pitch decks
  - Research papers
  - Resumes

- Backend processing:
  - Vercel serverless function extracts text
  - GPT-4o generates a **Context Matrix**

## Context Matrix Includes

- Core claims
- Logical weaknesses
- Technical risks
- Contradictions

---

# 3.2 Continuous Live Room Streaming (WebRTC)

## Description

The system behaves like a premium video conferencing platform.

## Requirements

- Continuous bidirectional audio/video streaming
- Always-on microphone during sessions
- Voice Activity Detection (VAD)

## Behavior

- Natural speaking flow supported
- Hand gestures allowed
- Real-time audio processing

---

# 3.3 Real-Time Interruption Engine ("Barge-in")

## Description

AI avatars actively interrupt users mid-speech when triggered.

## Trigger Conditions

- Off-topic rambling
- Excessive filler words
- Contradictions vs uploaded PDF

## Requirements

- Sub-second transcription streaming to GPT-4o
- Real-time decision-making engine
- Immediate interruption response

## Beyond Presence Behavior

- Avatar interrupts visually and audibly
- Cuts off user speech stream
- Reclaims speaking control dynamically

---

# 3.4 Multi-Persona Panel Dynamics

## Description

Two AI personas operate simultaneously.

---

## Persona 1: The Subject Matter Expert (Interrogator)

Focus:
- Logic
- Methodology
- Technical accuracy

Behavior:
- Identifies inconsistencies
- Challenges assumptions
- Cross-checks PDF claims

---

## Persona 2: The Evaluator (Ah-Counter)

Focus:
- Delivery quality
- Speech performance
- Filler word detection

Tracks:
- "um"
- "ah"
- "like"

---

# 3.5 Persistent Performance Tracking (Supabase)

## Description

Tracks user improvement over time.

## Workflow

After session completion:

1. Transcript is analyzed by GPT-4o
2. Metrics are generated:
   - Filler word count
   - Pacing score
   - Final feedback summary
3. Data stored in Supabase

## User Outcomes

- Historical performance tracking
- Progress visualization
- Skill improvement over time

---

# 4. User Flow & Screen Architecture

---

# State 1: `ModeSelection.jsx` (The Lobby)

## UI

- Dark-themed dashboard
- Mode selection cards

Examples:
- Startup Pitch
- Academic Viva
- Technical Interview

## Action

User selects a scenario mode.

---

# State 2: `ContextUpload.jsx` (The Briefing Room)

## UI

- Drag-and-drop PDF upload zone
- Clean minimalist interface

## Action

User:
- Uploads PDF
- Clicks **Initialize Panel**

## Logic Flow

- File sent to `/api/process-document`
- Backend:
  - Extracts text
  - Generates attack analysis via GPT-4o
  - Creates Beyond Presence session token

---

# State 3: `SimulationArena.jsx` (The Defense)

## UI

Split-screen boardroom interface:

- Left: User webcam feed
- Right: AI avatar (Beyond Presence)

## Behavior

- Real-time conversation begins
- AI listens continuously
- AI interrupts dynamically when triggered

## Controls

Bottom control bar:

- Mute Audio
- Disable Video
- End Session

---

# State 4: `DebriefDashboard.jsx` (The Aftermath & Analytics)

## UI

- Performance analytics dashboard
- Historical performance chart

## Action

When session ends:

- Data saved to Supabase
- Dashboard refreshes with:
  - Session score
  - Filler word stats
  - AI feedback
  - Progress trends

---

# 5. Technical Architecture & Constraints

---

# 5.1 Frontend (Client)

## Framework

- React (Vite-based setup)

## Styling

- Tailwind CSS
- Dark mode only
- High-tech UI aesthetic

## SDK

- `@bey-dev/sdk`
  - WebRTC handling
  - Avatar rendering
  - Voice streaming

## Media APIs

- `navigator.mediaDevices.getUserMedia`
- HTML5 `<video>` and `<audio>`

---

# 5.2 Backend (API & Orchestration)

## Infrastructure

- Vercel Serverless Functions

## Language

- Node.js or Python

## Database

- Supabase (PostgreSQL)

---

## API Endpoints

### POST `/api/process-document`

- PDF parsing
- GPT-4o summarization
- Context Matrix generation

---

### POST `/api/start-session`

- Inject context into Beyond Presence
- Returns WebRTC session token

---

### POST `/api/end-session`

- Analyzes transcript
- Generates feedback
- Saves session to Supabase

---

# 5.3 AI & Logic Layer

## Avatar Engine

- Beyond Presence
  - Lip-syncing
  - Facial expressions
  - VAD (Voice Activity Detection)
  - Barge-in interruptions

---

## Logic Engine

- OpenAI GPT-4o

### Why

- Fast response time
- Strong instruction following
- Handles aggressive real-time prompts

---

# 6. Database Schema (Supabase)

---

# Table: `pitch_sessions`

Managed via Vercel serverless integration.

---

## Fields

- `id` (uuid, PK)
- `created_at` (timestamp)
- `user_id` (text) → `"demo-user-1"`
- `scenario` (text)
- `document_summary` (text)
- `duration_seconds` (integer)
- `filler_word_count` (integer)
- `critical_feedback` (text)
- `overall_score` (integer)

---

# 7. Success Metrics & Demo Strategy (Hackathon Specific)

---

## The "Wow" Factor

A successful live demo must show:

- Real-time AI interruption
- Zero audio feedback loops
- Stable WebRTC performance

---

## VC Pitch Demo Strategy

Focus entirely on:

- Startup Pitch mode
- Realistic investor interrogation
- Pressure-driven interruptions

---

## SaaS Proof

The Supabase dashboard must demonstrate:

- Persistent memory
- Historical tracking
- Performance improvement over time

This transforms the project from:

> A demo tool

into:

> A real SaaS product
```