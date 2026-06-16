# Netlify Deployment

## 1. Prepare the Repo

Make sure the following exist before deploying:

- `public/_redirects` with content: `/* /index.html 200`
- `.env.local` is in `.gitignore` (never commit secrets)
- `.env.example` is committed (with empty values as a template)

## 2. Push to GitHub

```bash
git init
git add .
git commit -m "initial commit"
gh repo create qr-word-app --public --push
# or push to an existing repo
```

## 3. Connect to Netlify

1. Go to https://app.netlify.com
2. Click **Add new site → Import an existing project**
3. Connect your GitHub account and select the repo
4. Build settings (Netlify auto-detects Vite, but confirm):
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Click **Deploy site**

## 4. Add Environment Variables on Netlify

1. Go to **Site Settings → Environment Variables**
2. Add each variable from your `.env.local`:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_DATABASE_URL`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_APP_ID`
3. **Trigger a redeploy** after adding variables: **Deploys → Trigger deploy → Deploy site**

## 5. Set a Custom Domain (optional)

1. **Site Settings → Domain management → Add custom domain**
2. Follow DNS instructions for your registrar

## 6. The QR Code URL

Once deployed, your Display page at `/` will generate a QR code pointing to:

```
https://your-site-name.netlify.app/submit
```

The app reads the current hostname at runtime via `window.location.origin`, so no hardcoded URL is needed.

## Local Preview (before deploying)

```bash
npm run build
npm run preview   # serves dist/ locally at localhost:4173
```

## Continuous Deployment

After the initial setup, every `git push` to `main` triggers an automatic Netlify rebuild. No manual steps needed.
