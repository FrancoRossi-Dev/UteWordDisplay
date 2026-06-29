import { initializeApp } from 'firebase/app'
import { getDatabase, ref, set, push, update, query, orderByChild, startAt, onValue, onChildAdded } from 'firebase/database'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)

export const submitEmotion = (emotionId) =>
  set(ref(db, 'words/latest'), { emotionId, ts: Date.now() })

export const listenForEmotion = (callback) =>
  onValue(ref(db, 'words/latest'), (snap) => {
    if (snap.exists()) callback(snap.val())
  })

export const submitFeedback = (score, comment) => {
  const id   = push(ref(db, 'feedback/responses')).key
  const data = { score, comment: comment.trim(), ts: Date.now() }
  return update(ref(db), {
    [`feedback/responses/${id}`]: data,  // shown on display, 1-hour window
    [`feedback/archive/${id}`]:   data,  // permanent record, never queried by the app
  })
}

export const listenForFeedbackAdded = (callback) => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000
  const q = query(ref(db, 'feedback/responses'), orderByChild('ts'), startAt(oneHourAgo))
  return onChildAdded(q, (snap) => {
    callback({ id: snap.key, ...snap.val() })
  })
}
