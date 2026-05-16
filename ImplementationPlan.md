# Implementation Plan: The Defense Panel

## 1. Milestones, Timelines & Priority Levels

This plan is structured around a ruthless 10-Hour Core Sprint, leaving the remaining 14 hours for polishing the pitch deck, recording the safety demo video, and resting.

| Milestone | Phase Focus | Duration | Priority |
|---|---|---|---|
| M1: Ground Zero | Env setup, Repo init, DB Schema | Hours 1-2 | CRITICAL |
| M2: The Brains | Vercel APIs, OpenAI logic, Context upload | Hours 3-5 | CRITICAL |
| M3: The Arena | Frontend UI, Beyond Presence WebRTC | Hours 6-8 | CRITICAL |
| M4: The Aftermath | Supabase integration, Debrief Dashboard | Hours 9-10 | HIGH |
| M5: Stage Prep | Demo recording, Pitch rehearsal | Hours 11-14 | CRITICAL |

---

## 2. Project Setup & Environment (Hours 1-2)

### Repo Initialization

- The Team Leader (PM) creates a single GitHub repository: `the-defense-panel`
- Invite all 4 team members

### Git Commit Strategy

- Trunk-based development
- Everyone pushes directly to `main`
- Use strict commit prefixes:
  - `feat:`
  - `fix:`
  - `ui:`
  - `api:`

### Environment Setup

#### Frontend

```bash
npm create vite@latest . -- --template react
```

#### Tailwind

```bash
npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p
```

### Dependency Installation

```bash
npm install lucide-react @bey-dev/sdk @supabase/supabase-js
npm install pdf-parse
```

> Use `pdf-parse` or an equivalent package for the Vercel backend.

### Database Setup (Supabase)

- Create a new Supabase project
- Run the SQL snippet from the Backend Schema to create the `pitch_sessions` table

### Authentication Implementation

Bypass applied. Do not build a login flow.

```js
const USER_ID = "demo-user-1";
```

Use a global React context or constant.

---

## 3. Backend API Sequence (Hours 3-5)

Build these serverless functions in the `/api` directory for Vercel deployment.

### `/api/process-document` (Priority: High)

**Action:**
- Accepts a PDF
- Extracts text
- Sends content to OpenAI GPT-4o
- Generates a context summary ("Attack Points")

---

### `/api/start-session` (Priority: Critical)

**Action:**
- Takes the OpenAI summary
- Injects it into the Beyond Presence Agent configuration
- Returns the WebRTC `session_token`

---

### `/api/end-session` (Priority: Medium)

**Action:**
- Fetches the final transcript
- Sends transcript to OpenAI for grading
  - Counts filler words
  - Assesses pacing
- Executes:

```js
supabase.from('pitch_sessions').insert()
```

---

## 4. Frontend Page & Component Build Order (Hours 6-8)

Do not build pages simultaneously.

Build them in the exact order the data flows.

### Component Build Order (Bottom-Up)

- `Button.jsx`
- `Card.jsx`
- `Dropzone.jsx`
- `AvatarView.jsx`
  - Beyond Presence SDK wrapper
- `ArenaControls.jsx`
  - Mute / Video / End Call buttons

---

### Frontend Page Build Order (The Flow)

#### `ModeSelection.jsx`

- Static UI
- Sets scenario state

#### `ContextUpload.jsx`

- Integrates `Dropzone.jsx`
- Wires upload flow to `/api/process-document`

#### `SimulationArena.jsx`

The hardest view.

Combine:
- `AvatarView.jsx`
- Local webcam feed
- `ArenaControls.jsx`

#### `DebriefDashboard.jsx`

- Wires to `/api/end-session`
- Fetches Supabase history

---

## 5. Integration Order & Task Dependencies

### Dependency 1

`ContextUpload` cannot be completed until:

```txt
/api/process-document
```

returns a valid response.

### Dependency 2

`SimulationArena` cannot connect without the `session_token` from:

```txt
/api/start-session
```

### Integration Strategy

The Backend Developer (M2) must mock API responses immediately using fake JSON responses.

This allows Frontend Developers (M1 & M3) to continue UI development without waiting for:
- OpenAI keys
- Beyond Presence configuration

Swap mocked responses with live APIs at Hour 7.

---

## 6. AI Prompt Sequence (For the Team Leader / PM)

As the PM, you are responsible for scripting the AI.

To make the Evaluator persona truly terrifying and effective, channel the highest standards of professional public speaking evaluation.

Do not use generic instructions.

---

### The Parser Prompt  
*(Backend - `/api/process-document`)*

```txt
You are a rigorous technical auditor. Read this document and extract the 3 weakest logical claims, the most ambitious revenue metric, and the core tech stack. Output strictly as JSON.
```

---

### The Evaluator Prompt  
*(Beyond Presence Dashboard)*

```txt
You are an elite speech evaluator judging a final-tier mastery presentation. Actively listen to the user. You must immediately interrupt them if they use filler words (um, ah) more than twice. If their pacing is rushed, demand they slow down. Maintain a strict, unimpressed, but professional tone. You are not a chatbot; you are a critical judge.
```

---

### The Expert Prompt  
*(Beyond Presence Dashboard)*

```txt
You are a skeptical venture capitalist. Using the context provided, interrogate the user on their technical architecture and revenue model. If they give a vague answer, interrupt and demand specifics.
```

---

## 7. Testing, Deployment & Risk Management (Hours 9-10)

### Testing Phases

#### Unit API Test

Use:
- Postman
- Thunder Client

Verify all Vercel endpoints return:

```txt
200 OK
```

---

#### VAD (Voice Activity Detection) Test

- M1 and M3 sit in the Arena
- Talk over each other intentionally
- Verify Beyond Presence "barge-in" triggers correctly without echo

---

#### End-to-End Run

The PM should:
1. Upload a fake PDF
2. Present poorly on purpose
3. Get interrupted
4. End the call
5. Verify the score appears in Supabase

---

## Deployment Stages

- Vercel handles CI/CD automatically
- Every push to `main` deploys to a preview URL

At Hour 8:
- Test the live Vercel URL
- Do not rely only on localhost
- Verify WebRTC streams function over the public internet

---

## Risk Areas & Rollback Strategy

### Risk 1: Venue Wi-Fi Drops / WebRTC Latency

**Issue:**
- Video avatars require high bandwidth

**Mitigation:**
- Use the 2-minute pre-recorded demo video

---

### Risk 2: OpenAI Rate Limits

**Issue:**
- Free-tier keys may hit limits quickly during testing

**Mitigation:**
- Hardcode a fake "Attack Points" summary during development
- Only use live OpenAI calls during final testing hours

---

### Risk 3: Deployment Crash

**Issue:**
- A bad commit breaks the Vercel build minutes before deadline

### Rollback Strategy

1. Open the Vercel dashboard
2. Navigate to **Deployments**
3. Find the last successful (green) build
4. Click the three dots
5. Select:

```txt
Promote to Production
```

> Do not attempt emergency code fixes under pressure.