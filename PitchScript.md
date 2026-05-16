# Pitch Script

Use this as the final hackathon speaking guide. Keep the live pitch tight and spend most of the time on the interruption demo.

## 30-Second Opener

Most people do not fail important presentations because they lack slides. They fail because they have never practiced under real pressure.

The Defense Panel is a live AI interrogation room. You upload your pitch deck, GPT-4o finds the weak claims, and Beyond Presence avatars interrupt you like real investors, examiners, or interviewers.

This is not passive feedback after the fact. This is pressure while you are speaking.

## Problem

Pitch practice today is too comfortable.

Founders rehearse with mirrors, friendly teammates, or text chatbots. But real investors interrupt. They challenge numbers. They ask why the architecture will not break. They catch contradictions immediately.

Our product recreates that pressure before the real room.

## Solution

The Defense Panel has four steps:

1. Select a scenario.
2. Upload a document.
3. Enter the live defense arena.
4. Get a scored debrief with progress history.

Behind the scenes, GPT-4o extracts weak claims and Beyond Presence turns those attacks into a realistic video panel.

## Live Demo Setup

Say this before clicking into the arena:

```txt
For the demo, I am going to intentionally pitch badly. I will use filler words and inflate a metric so the panel has something to attack.
```

Then say:

```txt
We have, um, like, 50k MRR and our AI architecture basically scales automatically.
```

Expected interruption from The Interrogator:

```txt
Stop there. Your document does not prove 50k MRR. Where is that number coming from?
```

Expected interruption from The Evaluator:

```txt
Stop. Two filler words already. Restart the answer without them.
```

## Demo Narration

After the interruption:

```txt
That is the product moment. The avatar is not waiting politely for a final transcript. It is listening live, detecting weak delivery and unsupported claims, and forcing the presenter to defend in real time.
```

Then end the session and show the debrief:

```txt
After the session, we save the performance metrics to Supabase. The user sees filler words, overall score, critical feedback, and historical progress. This turns a one-time demo into a SaaS training loop.
```

## Technical Explanation

Keep this short:

```txt
The frontend is React and Tailwind. The backend is Vercel serverless functions. OpenAI and Beyond Presence keys never touch the browser. GPT-4o analyzes the uploaded document and final transcript. Beyond Presence powers the live video agents. Supabase stores the session history.
```

## Why Beyond Presence

```txt
The core value is presence. A text chatbot can say your pitch is weak, but it cannot create the feeling of being interrupted by a person across the table. Beyond Presence makes the pressure believable.
```

## Closing

```txt
The Defense Panel helps people build composure before the real moment. We are not optimizing slides. We are training the ability to defend under pressure.
```

## Judge Q&A Prep

### What makes this different from a chatbot?

```txt
The interaction is live, visual, and interruptive. The avatar challenges the user during speech, not after a static prompt-response exchange.
```

### Why use Supabase?

```txt
We need persistent improvement tracking. Supabase lets us store scores, filler count, feedback, and session history quickly without building a heavy backend.
```

### What if WebRTC fails during the demo?

```txt
We designed a fallback: a pre-recorded interruption clip plus a live debrief dashboard. The product architecture still uses Beyond Presence for the real interaction, but the fallback protects the stage demo from venue network issues.
```

### How do you protect API keys?

```txt
All OpenAI and Beyond Presence calls go through Vercel serverless functions. The React frontend receives only browser-safe session data.
```

### Is the data real?

```txt
For the hackathon MVP, the user is hardcoded as demo-user-1 and historical rows may be seeded for the demo. The flow is designed to store real sessions into the same Supabase table.
```

### What would you build next?

```txt
First, full authentication and reusable document libraries. Second, more simulation modes. Third, richer analytics from video and audio signals. Fourth, team dashboards for founders, universities, and accelerators.
```

## Emergency Fallback Talk Track

Use this if the live avatar connection fails:

```txt
Venue networks are often hostile to real-time media, so we prepared a network-safe demo mode. The recorded segment shows the live Beyond Presence interruption behavior, and the dashboard you see now is the same scoring and persistence layer used by the live app.
```

Do not apologize repeatedly. Move quickly to the product value and Supabase proof.
