# App Flow Document: The Defense Panel

---

# 1. Global App Architecture & Behaviors

## App Entry Points & Navigation Structure

### Entry Point

Base URL:

```txt
/
```

Routes directly to:

```txt
ModeSelection.jsx
```

Also referred to as:
> The Lobby

---

## Navigation Structure

The application follows a strict linear/sequential flow.

### Required Flow

```txt
Lobby → Upload → Arena → Debrief
```

### Important Rules

- No global navbar
- No free page jumping
- Prevents broken session state
- Maintains immersion during simulations

---

## Page Hierarchy

```txt
/           → Mode Selection
/setup      → Context Upload
/arena      → Live Simulation
/debrief    → Analytics & History
```

---

# Authentication & Access Flows

## Authentication Flow

Hackathon MVP bypass strategy:

```js
user_id: "demo-user-1"
```

### Notes

- No login page
- No signup page
- No OAuth flow
- No password handling

---

## Logout / Session Expiry

Reset methods:

- Hidden developer reset button
- Clearing `localStorage`

Both actions reset the entire app state.

---

## Access Permissions

### `/setup`

Requires:
- Selected mode in memory

Example:
- Startup Pitch
- Academic Viva
- Tech Interview

---

### `/arena`

Requires:
- Valid `session_token`

If accessed directly without a token:

```txt
Redirect → /
```

---

# Global State & Interaction Behaviors

## Loading Behaviors

### Heavy API Calls

Examples:
- GPT-4o parsing
- Context generation

Trigger:
- Full-screen dark overlay
- Pulsing animation
- Text spinner

Example message:

```txt
Extracting logic flaws from document...
```

---

### Data Fetching

Supabase data loading uses:
- Skeleton loaders
- Placeholder cards/charts

---

## Error Flows

### Non-Critical Errors

Example:
- OpenAI timeout during PDF parsing

Behavior:
- Red Toast notification appears

Example:

```txt
Analysis failed. Please try a smaller PDF.
```

User remains on:
```txt
/setup
```

---

### Critical Errors

Example:
- Beyond Presence WebRTC stream disconnects

Behavior:
- Modal appears

Example:

```txt
Connection to panel lost.
```

Then:
```txt
Redirect → /
```

---

## Empty State Flows

If Supabase returns no session history:

Display:
- Minimal futuristic empty-state graphic

Message:

```txt
No defenses recorded yet. Step into the arena.
```

---

## Success Flows

Green Toast notifications:

```txt
Document Parsed Successfully
```

```txt
Session Saved
```

---

## Modal / Pop-up Behavior

Modals are reserved strictly for:
- Destructive actions
- Critical confirmations

### Example

Clicking:

```txt
End Session
```

Triggers:

```txt
Are you sure? This will finalize your score.
```

---

## Mobile Navigation Behavior

### Desktop Priority

The MVP is optimized for:
- Desktop
- 16:9 webcam layouts

---

### Mobile Arena Layout

Instead of split-screen:

- Avatar stacks vertically on top
- User webcam shrinks into a floating corner view

---

# 2. Page-by-Page Breakdown

---

# Page 1: `ModeSelection.jsx` (The Lobby)

## Page Purpose

- Onboarding
- Scenario selection
- Establishes AI simulation context

---

## Incoming Pages

- App entry point
- Returning from `DebriefDashboard.jsx`

---

## Outgoing Pages

```txt
/setup
```

---

## Buttons / Actions

### Mode Cards

Examples:
- Startup Pitch
- Academic Viva
- Tech Interview

### On Click

- Sets global scenario state
- Routes user to `/setup`

---

## API Calls Triggered

### Optional Polish Feature

On mount:

- Fetch total session count from Supabase
- Display welcome-back message

---

## Conditions for Visibility

Always accessible.

---

# Page 2: `ContextUpload.jsx` (The Briefing Room)

## Page Purpose

- Upload user documents
- Initialize AI session

---

## Incoming Pages

```txt
ModeSelection.jsx
```

---

## Outgoing Pages

- `/arena`
- Back to Lobby

---

## Buttons / Actions

### Back Button

Top-left navigation icon.

---

### File Dropzone

Supports:
- PDF drag-and-drop
- Manual upload

---

### Initialize Panel Button

Primary CTA.

### Behavior

Disabled until:
- A valid file is uploaded

---

## API Calls Triggered

### `POST /api/process-document`

Purpose:
- Send PDF to GPT-4o
- Extract weaknesses/context

---

### `POST /api/start-session`

Purpose:
- Create Beyond Presence session
- Return:
  - WebSocket URL
  - `session_token`

---

## Conditions for Visibility

Requires:
- Existing selected scenario in global state

---

# Page 3: `SimulationArena.jsx` (The Defense)

## Page Purpose

Core real-time simulation environment.

Uses:
- WebRTC
- Live AI interruptions
- Webcam streams

---

## Incoming Pages

```txt
ContextUpload.jsx
```

---

## Outgoing Pages

```txt
/debrief
```

---

## Buttons / Actions

### Bottom Control Bar

#### Mute Mic

- Toggles local audio track

---

#### Disable Camera

- Toggles local video track

---

#### End Session

- Red destructive button
- Opens confirmation modal

---

## API / SDK Calls Triggered

### Beyond Presence Connection

```js
@bey-dev/sdk.connect(session_token)
```

Purpose:
- Open WebRTC stream
- Start avatar interaction

---

## Conditions for Visibility

Strictly requires:
- Valid `session_token`

---

# Page 4: `DebriefDashboard.jsx` (The Aftermath)

## Page Purpose

Displays:
- AI-generated feedback
- Session analytics
- Historical progress tracking

---

## Incoming Pages

```txt
SimulationArena.jsx
```

---

## Outgoing Pages

```txt
/
```

---

## Buttons / Actions

### Return to Lobby

Primary CTA to restart the flow.

---

### View Detailed Transcript

Accordion dropdown showing:
- User speech
- AI responses
- Interruptions
- Feedback transcript

---

## API Calls Triggered

### `POST /api/end-session`

Purpose:
- Send transcript to OpenAI
- Generate:
  - Scores
  - Feedback
  - Pacing analysis
- Save results into Supabase

---

### `GET pitch_sessions`

Purpose:
- Fetch historical session data
- Build performance charts

---

## Conditions for Visibility

Requires:
- Completed session
- Available transcript data

---

# 3. User Journey Map (The Happy Path)

---

## Step 1: Arrival

The user opens the app.

They enter:
> The Lobby

They see futuristic scenario cards and select:

```txt
Startup Pitch
```

---

## Step 2: Context Upload

The app routes to:

```txt
/setup
```

The user:
- Drags a PDF business plan into the dropzone
- Clicks:

```txt
Initialize Panel
```

---

## Step 3: Loading State

A dark cinematic overlay appears.

Message:

```txt
GPT-4o is analyzing your revenue model...
```

### Behind the Scenes

The backend:
1. Extracts PDF text
2. Identifies weak claims
3. Generates attack points
4. Creates Beyond Presence avatar session

---

## Step 4: The Arena

The app routes to:

```txt
/arena
```

### Layout

- User webcam feed on left
- Hyper-realistic AI avatar on right

---

## Step 5: The Interaction

The user begins speaking.

They ramble.

The AI interrupts mid-sentence:

```txt
Stop there. Your PDF says you have $10k MRR, but you just claimed $50k. Explain.
```

The interruption occurs through:
- Live WebRTC stream
- Voice Activity Detection
- Beyond Presence avatar responses

---

## Step 6: The Conclusion

The user:
- Finishes the presentation
- Clicks the red:

```txt
End Session
```

button

A confirmation modal appears.

The user confirms.

---

## Step 7: The Analytics

The session ends.

The app routes to:

```txt
/debrief
```

### The Dashboard Displays

- Filler word count
- AI-generated critical feedback
- Pacing analysis
- Historical score chart from Supabase

Example feedback:

```txt
"um" used 12 times
```

The user sees measurable improvement across previous sessions.