import { initializeApp } from 'firebase/app'
import { getDatabase, ref, set, push, query, orderByChild, startAt, onValue, onChildAdded } from 'firebase/database'

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

export const submitFeedback = (score, comment) =>
  push(ref(db, 'feedback/responses'), { score, comment: comment.trim(), ts: Date.now() })

export const listenForFeedbackAdded = (callback) => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000
  const q = query(ref(db, 'feedback/responses'), orderByChild('ts'), startAt(oneHourAgo))
  return onChildAdded(q, (snap) => {
    callback({ id: snap.key, ...snap.val() })
  })
}
