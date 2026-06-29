# Firebase Setup

## 1. Create a Firebase Project

1. Go to https://console.firebase.google.com
2. Click **Add project** → name it `qr-word-app`
3. Disable Google Analytics (not needed)
4. Click **Create project**

## 2. Enable Realtime Database

1. In the left sidebar → **Build → Realtime Database**
2. Click **Create Database**
3. Choose a region (pick closest to your users)
4. Start in **test mode** (you can lock it down later)

## 3. Get Config Keys

1. Go to **Project Settings** (gear icon) → **General**
2. Scroll to **Your apps** → click the web icon `</>`
3. Register the app with any nickname
4. Copy the `firebaseConfig` object — you need these values:
   - `apiKey`
   - `authDomain`
   - `databaseURL`
   - `projectId`
   - `appId`

## 4. Set Local Environment Variables

Create `.env.local` in the project root (this file is gitignored):

```
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 5. Firebase Database Rules

For a closed event/demo, test mode rules are fine:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

For production, lock down to write-only from clients:

```json
{
  "rules": {
    "words": {
      ".read": true,
      ".write": true
    }
  }
}
```

## 6. Enable Firebase Storage (for orbiting images)

Storage is used by the `/admin` page to upload images that orbit on the Form page.

1. In the Firebase console → **Build → Storage** → **Get started**
2. Choose **Start in test mode** → pick any region → **Done**
3. Once enabled, go to the **Rules** tab and replace the default with:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /images/{imageId} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

4. Add `VITE_FIREBASE_STORAGE_BUCKET` to `.env.local` (and Netlify env vars):

```
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
```

The storage bucket name is visible in the Firebase Storage console URL or in the Firebase project settings.

Also add the admin PIN:

```
VITE_ADMIN_PIN=your_pin_here
```

The admin page is at `/admin`. Without `VITE_ADMIN_PIN` set, it defaults to `1234`.

## 7. Firebase SDK Usage in Code

```js
// src/firebase.js
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, set, onValue } from 'firebase/database'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)

// Write a word
export const submitWord = (word) => set(ref(db, 'words/latest'), { word, ts: Date.now() })

// Listen for new words
export const listenForWord = (callback) => onValue(ref(db, 'words/latest'), (snap) => {
  if (snap.exists()) callback(snap.val())
})
```
