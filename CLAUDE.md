# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A real-time interactive app for live events: a QR code on a display screen links participants to a mobile form. They pick or type a word, and it floats up on the display in real time. The UI is in Argentine Spanish.

## Stack

- React + Vite, plain CSS (no UI framework)
- Firebase Realtime Database for sync (no backend)
- Deployed on Netlify
- `qrcode.react` for QR generation, `react-router-dom` v6 for routing

## Dev Commands

```bash
npm install
npm run dev        # local dev server (localhost:5173)
npm run build      # production build → dist/
npm run preview    # preview dist/ at localhost:4173
```

## Routes

| Path | Component | Purpose |
|------|-----------|---------|
| `/` | `Display.jsx` | Big screen — QR code + floating words |
| `/submit` | `Form.jsx` | Mobile form — submit a word |

## Firebase Data Model

All word submissions overwrite a **single node** at `words/latest`:

```js
{ word: "Confianza", ts: 1718000000000 }
```

This is intentional — only the most recent word is kept, not a history. The Display page uses the `ts` field (plus a random suffix) as a unique React key so the same word submitted twice still triggers a new animation.

## Key Implementation Details

- **QR URL** is derived at runtime: `${window.location.origin}/submit` — no hardcoded URL needed.
- **`listenForWord(callback)`** returns the Firebase `unsubscribe` function directly; Display.jsx returns it from `useEffect` as the cleanup.
- **Word animation** lasts 4500ms (CSS keyframe ~4s + 500ms buffer before React state cleanup).
- **`public/_redirects`** must contain `/* /index.html 200` — required for Netlify SPA routing.

## Environment Variables

All in `.env.local` (gitignored). See `.env.example` for the template and `.claude/firebase.md` for setup steps.

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```

On Netlify: **Site Settings → Environment Variables**. Redeploy after adding them.

## Constraints

- No backend — Firebase handles all sync via `onValue` (not `get`).
- Floating word animation is pure CSS keyframes — no animation library.
- Display and Form are fully independent pages with no shared state.
- Access env vars with `import.meta.env.VITE_*` (Vite convention).
