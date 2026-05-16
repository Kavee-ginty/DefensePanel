# Technical Requirements Document (TRD)

## Project: The Defense Panel
### Event: Cursor Colombo Buildathon

---

# 1. Core Tech Stack

## Frontend Tech Stack

- React 18 initialized via Vite
- HTML5 `<video>` and WebRTC
- LiveKit / Beyond Presence SDK for media streaming

---

## Backend Tech Stack

- Vercel Serverless Functions
- Lightweight Node.js or Python functions inside the `/api` directory
- Used for logic bridging and external API communication

---

## Database Choice

- Supabase (PostgreSQL)
- Used for persistent storage of:
  - Session feedback
  - Simulation history
  - Performance evaluations

---

## Hosting / Deployment Platform

- Vercel
  - Hosts the React frontend
  - Hosts serverless backend functions simultaneously

---

# 2. APIs, Services & Integrations

## APIs / Services to Use

### Beyond Presence API & SDK

Used for:
- Hyper-realistic video avatars
- Voice Activity Detection (VAD)
- WebRTC audio/video streaming

---

### OpenAI API (`gpt-4o`)

Used in the backend for:
- Parsing uploaded PDFs
- Generating "Attack Points" context summaries
- Grading transcripts and presentations

---

## Third-Party Integrations

### `pdf-parse`

Used to:
- Extract text from uploaded PDF files
- Prepare content before sending to OpenAI

Alternative lightweight libraries may also be used.

---

# 3. Architecture & Data Flow

## State Management Approach

Use lightweight native React state tools:

- `useState`
- `useRef`
- React Context API

### Global State Examples

- `user_id`
- Current active scenario
- Session state

### Important Notes

- No Redux
- Keep architecture lightweight for hackathon speed

---

## Database ORM Strategy

Use:
- `@supabase/supabase-js`

Use native Supabase query builder directly:

```js
supabase.from('pitch_sessions').insert()
```

Avoid:
- Prisma
- Heavy ORM setups

Reason:
- Faster setup
- Lower complexity

---

## Authentication Method

### Hackathon MVP Approach

Authentication is intentionally bypassed.

Use a persistent hardcoded demo user:

```js
const USER_ID = "demo-user-1";
```

### Deferred Features

OAuth support is postponed until post-hackathon:
- Google Login
- GitHub Login
- Full Supabase Auth flow

---

# 4. Development & Workflow Standards

## File Structure Rules

```txt
/src/components
```

Reusable UI components:
- Buttons
- AvatarFrame
- Cards
- Controls

---

```txt
/src/pages
```

Main application views:
- `ModeSelection.jsx`
- `SimulationArena.jsx`
- `DebriefDashboard.jsx`

---

```txt
/src/lib
```

Utility functions and shared logic:
- Supabase client
- Helper functions
- API utilities

---

```txt
/api
```

Vercel Serverless backend functions:

Examples:
- `/api/process-document`
- `/api/start-session`
- `/api/end-session`

---

## UI Libraries / Frameworks

### Tailwind CSS

Used for:
- All styling
- Responsive layouts
- Dark mode design

---

### lucide-react

Used for lightweight icons:
- Mic
- Camera
- End call
- Upload
- Status indicators

---

## Coding Standards

### React Standards

- Functional components only
- Hooks-based architecture

---

### Styling Standards

- Tailwind utility classes only
- Avoid external CSS files unless absolutely necessary

---

## Version Control Workflow

- GitHub repository
- Single `main` branch workflow
- Fast iteration preferred over heavy branching

---

## CI/CD Setup

### Vercel GitHub Integration

Behavior:
- Every push to `main`
- Automatically triggers production deployment

---

# 5. Security & Environment

## Security Requirements

### Proxy Pattern Architecture

The frontend must never directly contain:
- OpenAI API keys
- Beyond Presence API keys

### Required Flow

```txt
React Frontend
    ↓
Vercel /api endpoint
    ↓
External APIs
```

The backend securely stores and uses all secret credentials.

---

## Environment Variables Needed

### Frontend Variables (Public)

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

---

### Backend Variables (Secret)

```env
BEYOND_PRESENCE_API_KEY=
OPENAI_API_KEY=
```

---

# 6. Performance & Reliability

## Performance Requirements

### Critical Requirement

Sub-second latency for:
- Voice interruptions
- "Barge-in" evaluator responses

### Optimization Goals

- Keep UI thread unblocked
- Minimize unnecessary re-renders
- Optimize WebRTC streaming stability

---

## Caching Strategy

### MVP Caching Approach

Use:
- In-memory caching during active sessions

### Flow

1. PDF uploaded
2. Context summary generated
3. Summary stored temporarily in memory
4. Passed directly into Beyond Presence session

### Important Notes

- No Redis
- No external caching infrastructure required

---

## Scalability Considerations

Using:
- Vercel Serverless
- Supabase

ensures inherent scalability.

### Compute Offloading Strategy

Heavy processing is delegated to:
- OpenAI
- Beyond Presence

The backend primarily acts as:
- Secure traffic router
- Session coordinator

---

## Error Handling Strategy

### API Timeout Handling

If OpenAI processing is slow:

Display Tailwind toast notification:

```txt
Analyzing complex document... please wait.
```

---

### Stream Failure Handling

If WebRTC connection fails:

- Log errors to console
- Display retry UI state

Example:

```txt
Connection Lost - Retrying
```

Use graceful degradation instead of crashing the UI.

---

# 7. AI Coding Instructions (For Cursor)

As a Cursor Buildathon project, the primary IDE is Cursor.

These instructions should be added to:
- Cursor Composer
- `.cursorrules`

---

## Framework Priority

Always write code for:
- React 18
- Vite

Do NOT use:
- Next.js App Router syntax

---

## Styling Rules

Use Tailwind CSS exclusively.

### Visual Style Requirements

Prioritize:
- Dark mode UI
- Neon/glowing accents
- Strong active-state visuals

Recommended Tailwind patterns:

```txt
bg-gray-900
text-white
ring-blue-500
shadow-lg
shadow-red-500/50
```

---

## Media Handling Rules

When implementing `getUserMedia`:

- Always use explicit `try/catch`
- Handle permission-denied states gracefully

Example concerns:
- Camera blocked
- Mic unavailable
- Browser restrictions

---

## Backend Routing Rules

When creating backend APIs:

- Use Vercel Serverless Function syntax
- Place APIs inside `/api`

Do NOT use:
- Express.js
- Custom servers

---

## Simplicity Rules

Prioritize:
- Working demo-ready code
- Fast iteration
- Readability

Avoid:
- Over-engineering
- Deep abstractions
- Unnecessary sub-components

Rule of thumb:

> If a component is readable and under 200 lines, keep it as a single file.