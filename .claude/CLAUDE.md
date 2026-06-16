# QR Word App

A real-time interactive app where a QR code on a display screen links to a form. Users scan the QR code, type or select a word, and it appears floating on the display screen live.

## Stack

- **Frontend:** React + Vite
- **Realtime sync:** Firebase Realtime Database
- **Deployment:** Netlify
- **QR Code:** `qrcode.react`
- **Styling:** Plain CSS (no framework needed)

## Project Structure

```
qr-word-app/
├── .claude/
│   ├── firebase.md       # Firebase setup instructions
│   └── deployment.md     # Netlify deployment instructions
├── src/
│   ├── pages/
│   │   ├── Display.jsx   # QR code + floating words screen
│   │   └── Form.jsx      # Word submission form (mobile)
│   ├── firebase.js       # Firebase init + helpers
│   ├── App.jsx           # Router: / = Display, /submit = Form
│   ├── App.css
│   └── main.jsx
├── public/
│   └── _redirects        # Netlify SPA routing fix
├── .env.example          # Firebase env var template
├── .env.local            # Local secrets (gitignored)
├── index.html
├── vite.config.js
└── package.json
```

## Routes

| Path | Component | Purpose |
|------|-----------|---------|
| `/` | `Display.jsx` | Big screen — shows QR + floating words |
| `/submit` | `Form.jsx` | Mobile form — pick or type a word |

## Environment Variables

All Firebase config values go in `.env.local` (never commit this):

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```

On Netlify, add these same keys under **Site Settings → Environment Variables**.

## Key Behaviours

- The QR code on the Display page encodes the full public URL + `/submit`
- When a word is submitted via the form, it writes to Firebase `/words/latest`
- The Display page listens to `/words/latest` in real time and animates the new word floating up
- Words fade out after ~4 seconds
- The form has ~10 preset word buttons + a free-text input

## Dev Commands

```bash
npm install
npm run dev        # local dev server
npm run build      # production build → dist/
npm run preview    # preview production build locally
```

## Notes for Claude Code

- Keep components small and focused — Display and Form are independent pages
- Use `onValue` from Firebase SDK for real-time listening (not `get`)
- The floating word animation is pure CSS keyframes — no animation library needed
- Do not add a backend or server — Firebase handles all sync
- `_redirects` file in `/public` must contain `/* /index.html 200` for Netlify SPA routing
- Use `import.meta.env.VITE_*` to access env vars in Vite
