# UI/UX Design Brief: The Defense Panel

> Vision:  
> **"High-Tech Interrogation Room" meets "Premium Video Conferencing."**

---

# 1. Visual Identity & Aesthetics

## Design Style Reference

### Core Style

Linear-style minimalist dark mode.

Inspired by:
- Linear
- Vercel
- Cursor

### Desired Feel

- Sleek
- Professional
- Slightly intimidating
- High-performance
- Developer-focused

### Avoid

- Cheesy cyberpunk aesthetics
- Neon graffiti styles
- Overly flashy effects

### Preferred Direction

- Clean interfaces
- Subtle glowing accents
- Cinematic dark environments

---

## Color Palette (Tailwind Specific)

### Backgrounds

Use deep dark backgrounds to:
- Absorb light
- Focus attention on video feeds
- Increase immersion

Recommended classes:

```txt
bg-black
bg-zinc-950
bg-zinc-900
```

---

### Text Colors

#### Primary Headings

```txt
text-zinc-50
```

#### Secondary Text

```txt
text-zinc-400
```

---

### Accent Colors  
*(The "AI is Thinking" vibe)*

Use:
- Electric blue
- Deep cyan

Recommended classes:

```txt
text-blue-500
ring-blue-500
```

---

### Alert Colors  
*(The "Interruption" vibe)*

Use danger red sparingly for:
- AI interruptions
- Critical grading moments
- Connection errors

Recommended classes:

```txt
bg-red-500/10
border-red-500
```

---

## Typography

### Font Family

Preferred:
- Inter

Fallback:
- System sans-serif

Tailwind:

```txt
font-sans
```

---

### Typography Hierarchy

#### Headings

- Large
- Bold
- Tight tracking
- High contrast

#### Body Copy

- Highly readable
- Spacious line-height
- Minimal visual noise

---

## Icon Style

### Icon Library

```txt
lucide-react
```

### Icon Rules

- Thin-line icons
- Monocolor
- Consistent stroke width
- 2px stroke preferred

---

# 2. Layout & Spatial System

## Layout System

Use:
- Flexbox
- CSS Grid
- Tailwind utilities only

---

## Arena Layout

Desktop layout:

```txt
50 / 50 horizontal split
```

Requirements:
- Symmetrical video feeds
- Equal visual weight
- Full focus on interaction

---

## Dashboard Layout

Use centered constrained containers:

```txt
max-w-4xl
mx-auto
```

Purpose:
- Reduce eye strain
- Improve readability
- Keep analytics focused

---

## Spacing Rules

### Grid System

Follow an 8pt spacing system.

Examples:

```txt
p-4  = 16px
gap-8 = 32px
mb-6 = 24px
```

---

### Layout Philosophy

- Generous breathing room
- Avoid clutter
- Prioritize focus and calmness

---

## Border Radius Rules

### Subtle Curves

Use for:
- Cards
- Video feeds
- Text areas
- Panels

Recommended:

```txt
rounded-lg
rounded-xl
```

---

### Fully Rounded Elements

Use for:
- Avatars
- Tags
- Pills
- Floating controls

Recommended:

```txt
rounded-full
```

---

# 3. Component Design Rules

## Button Styles

### Primary Button  
*(Start Session / Initialize Panel)*

Style:

```txt
bg-blue-600
text-white
shadow-[0_0_15px_rgba(37,99,235,0.5)]
```

Characteristics:
- Strong visual priority
- Subtle glow
- Confident presence

---

### Secondary / Ghost Button

Style:

```txt
border border-zinc-800
hover:bg-zinc-800
```

Characteristics:
- Transparent background
- Minimal distraction
- Lightweight interaction

---

### Destructive Button  
*(End Call)*

Style:

```txt
bg-red-600
```

Rules:
- Use sparingly
- Must feel dangerous and intentional

---

## Form Styles

### Dropzones & Inputs

Use:

```txt
bg-zinc-900/50
border border-zinc-800
focus:ring-2
focus:ring-blue-500
```

Behavior:
- Slightly elevated from background
- Clear active state
- Glowing focus feedback

---

## Card / Table Styles

### Glassmorphism Lite

Cards should resemble:
> Dark glass control panels

Recommended styles:

```txt
bg-zinc-900/40
backdrop-blur-md
border border-white/5
```

---

## Dark / Light Mode Rules

### Strict Dark Mode Only

Light mode is disabled entirely.

Reason:
- Bright UI breaks immersion
- Dark mode reinforces pressure/simulation atmosphere

---

# 4. Interaction & Motion

## Animation Style

### Philosophy

Animations should feel:
- Crisp
- Responsive
- Fast

Avoid:
- Floaty transitions
- Slow cinematic movement

---

## Transition Timing

Recommended:

```txt
duration-150
duration-200
```

---

## Hover / Interaction Behavior

### Buttons

Hover behavior:

```txt
hover:scale-105
transform
transition-all
```

---

### Selectable Cards

Hover behavior:

```txt
hover:border-zinc-500
```

Purpose:
- Increase clarity
- Reinforce interactivity

---

# Microinteractions  
*(Critical for the "Wow" Factor)*

## Audio Pulse

When the user speaks:
- A subtle blue/green ring pulses around the webcam feed

Purpose:
- Simulate live audio activity
- Add realism

---

## The Interruption Flare

When AI interrupts:
- AI video border flashes red for ~0.5 seconds

Purpose:
- Visually reinforce interruption timing

---

## Loading States

Avoid generic loading spinners.

Preferred approaches:
- Skeleton loaders
- Terminal-style progress text

Example:

```txt
> Extracting logic flaws... 84%
```

---

# 5. Platform & Accessibility

## Responsive Design Rules

### Desktop-First Experience

Primary target:
- 16:9 laptop displays
- Desktop presentation environments

---

## Mobile Fallback Behavior

Arena layout stacks vertically:

### Mobile Structure

- AI Avatar → top half
- User webcam → floating picture-in-picture corner

---

# Accessibility Requirements

## Contrast

Maintain:
- High contrast text
- Strong readability

---

## ARIA Requirements

All control buttons must include:

```html
aria-label=""
```

Examples:
- Mute button
- Camera toggle
- End call button

---

# 6. UX Principles

---

## 1. Minimize Clicks (Time to Value)

Goal:
> Reach live simulation in exactly 3 clicks.

### Flow

```txt
Select Mode
→ Upload PDF
→ Start Session
```

---

## 2. Avoid Clutter (The Immersive Arena)

Inside `SimulationArena`:

Remove:
- Headers
- Footers
- Navigation bars
- Unnecessary text

Only show:
- Two video feeds
- Bottom control dock

The experience should feel like:
- Google Meet
- Premium video conferencing software
- High-pressure interview room

---

## 3. Contextual Forgiveness

Accidental actions should not ruin sessions.

### Rule

Clicking:

```txt
End Session
```

must always trigger:
- Confirmation modal
- Secondary confirmation step

---

# 7. Wireframe / Mockup References (Mental Map)

---

# Screen 1: Lobby (`/`)

## Layout

Centered title:

```txt
The Defense Panel
```

Below:
- 3-column grid
- Elegant dark mode cards

### Cards

- Startup Pitch
- Academic Viva
- Tech Interview

---

# Screen 2: Setup (`/setup`)

## Layout

Center:
- Large dashed-border upload zone

Bottom-right:
- Glowing:

```txt
Initialize Panel
```

button

---

# Screen 3: The Arena (`/arena`)

## Background

Pure black immersive canvas.

---

## Left Side

User webcam:
- 16:9 aspect ratio
- Rounded corners

---

## Right Side

Beyond Presence AI Avatar:
- Matching aspect ratio
- Matching border radius

---

## Bottom Center

Floating pill-shaped control dock containing:
- Mute icon
- Video toggle
- End call button

---

# Screen 4: Debrief (`/debrief`)

## Top Row

Three large analytics cards:

```txt
Score: 85/100
Filler Words: 12
Pacing: Good
```

---

## Middle Section

Line chart displaying:
- Score progression over time
- Historical improvement

---

## Bottom Section

Large feedback panel containing:
- AI-generated critique
- Detailed analysis
- Improvement suggestions