# 24-Hour Execution Plan: The Defense Panel

> Start Time: 10:00 AM Today  
> Goal: Build a fully functional, demo-ready AI simulation system in 24 hours

---

# Team Roles

## Member 1 (M1): Frontend & Avatars

Focus:
- React UI implementation
- Tailwind styling
- Beyond Presence SDK integration
- Webcam + avatar rendering

---

## Member 2 (M2): Backend & AI

Focus:
- Vercel `/api` endpoints
- OpenAI integration (GPT-4o)
- Supabase database logic
- Session orchestration

---

## Member 3 (M3): Architect & UI System Owner

Focus:
- GitHub repository management
- React page structure
- UI flow wiring
- Frontend ↔ backend integration coordination

---

## Member 4 (M4): Team Leader (You)

Focus:
- Beyond Presence AI prompt design
- Agent behavior tuning
- Demo video recording
- Final pitch presentation
- Overall system testing and orchestration

---

# 24-Hour Timeline

---

# 10:00 AM – 12:00 PM (Hours 1–2)
## Scaffolding & Setup

### M3
- Create GitHub repo: `the-defense-panel`
- Initialize React (Vite)
- Setup Tailwind CSS
- Push initial structure to `main`

---

### M2
- Setup Vercel project
- Create `/api` folder structure
- Initialize Supabase project
- Create `pitch_sessions` table

---

### M1
- Clone repository
- Install Beyond Presence SDK:
```bash
@bey-dev/sdk
```
- Create placeholder UI components

---

### M4
- Create Beyond Presence agents:
  - Evaluator
  - Expert
- Write strict AI system prompts
- Generate API keys for backend usage

---

# 12:00 PM – 3:00 PM (Hours 3–5)
## Core UI & AI Brain Development

---

### M1 + M3
Build UI screens:

- `ModeSelection.jsx`
- `SimulationArena.jsx`

Focus:
- Dark premium UI
- Layout correctness
- Ignore real data initially

---

### M2
Build backend endpoint:

```txt
POST /api/process-document
```

Responsibilities:
- Accept PDF
- Extract text
- Send to GPT-4o
- Return summary ("Attack Points")

---

### M4
- Create sample startup pitch script
- Design test presentation in Canva
- Prepare demo scenario flow

---

# 3:00 PM – 7:00 PM (Hours 6–9)
## Critical Integration Phase (WebRTC)

---

### M1 + M3
Integrate:

- Beyond Presence SDK
- Webcam activation
- Avatar streaming
- `SimulationArena` real-time UI

Goal:
> Live AI avatar visible on screen

---

### M2
Build:

```txt
POST /api/start-session
```

Responsibilities:
- Inject AI prompts
- Pass PDF summary
- Initialize Beyond Presence session
- Return session_token

---

### M4
Live testing:
- Speak to AI
- Use filler words intentionally
- Trigger interruptions
- Tune AI aggressiveness prompts

---

# 7:00 PM – 10:00 PM (Hours 10–12)
## Analytics & Safety Net Layer

---

### M1 + M3
Build:

- `DebriefDashboard.jsx`
- Score display UI
- Feedback visualization

---

### M2
Build:

```txt
POST /api/end-session
```

Responsibilities:
- Analyze transcript via GPT-4o
- Save results to Supabase
- Return:
  - score
  - filler word count
  - feedback

---

### M4 (Critical Task)

STOP CODING.

Do:

- Run full system test
- Record 2-minute demo video:
  - AI interruption moment
  - Live simulation proof

Backup purpose:
> If live demo fails, this video saves the project.

---

# 10:00 PM – 6:00 AM (Overnight Phase)
## Bug Fixing & Stability

---

### M2 + M3
- Fix UI bugs
- Fix API crashes
- Improve responsiveness
- Polish dark mode visuals

---

### M1 + M4
- Rest cycle (mandatory rotation)
- Avoid burnout
- Rotate teams if needed

---

# 6:00 AM – 9:00 AM (May 17)
## Final Polish & Submission Prep

---

### M1 + M2
- Final cleanup
- Fix deployment issues
- Deploy to Vercel
- Verify production URL stability

---

### M3
- Write `README.md`
- Prepare submission documentation
- Ensure GitHub repo is clean and structured

---

### M4
- Step away from screens
- Rehearse pitch presentation aloud
- Time delivery:
  - Reserve final 1 minute for live demo

---

# 10:00 AM — Submission Deadline

---

## Final Deliverables

Submit:

- GitHub repository link
- Live Vercel deployment link
- Demo video backup
- Project documentation

---

## Final State

At this point:

- System is deployed
- Demo is rehearsed
- Backup is ready
- Pitch is locked

---

## Execution Principle

> Speed beats perfection.  
> Stability beats features.  
> Demo beats architecture.
```