# Defense Panel

Immersive AI simulation for pitch, viva, and technical interview practice.

## Setup

```bash
npm install
cp .env.example .env
```

Add your Supabase credentials to `.env`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

In the [Supabase dashboard](https://supabase.com/dashboard), enable **Email** auth for sign-up and login.

## Run

```bash
npm run dev
```

## Flow

1. **Auth** — Login (email/password) or Register (username, email, password)
2. **Lobby** — Select Startup Pitch, Academic Viva, or Technical Interview
3. **Briefing** — Upload mode-specific PDF (deck, thesis, or CV)
4. **Arena** — Large user webcam + two Beyond Presence panel slots
5. **Debrief** — Performance analytics (mock data until API is wired)

## Build

```bash
npm run build
```
