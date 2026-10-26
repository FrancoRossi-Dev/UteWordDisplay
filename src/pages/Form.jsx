import { useEffect, useState } from 'react'
import { submitEmotion } from '../firebase'
import './Form.css'

const COOLDOWN_MS  = 10 * 60 * 1000
const COOLDOWN_KEY = 'emotion:lastSentAt'

// Stored so the cooldown survives a page reload; storage may be unavailable (private mode)
function readLastSent() {
  try {
    return Number(localStorage.getItem(COOLDOWN_KEY)) || 0
  } catch {
    return 0
  }
}

function writeLastSent(ts) {
  try {
    localStorage.setItem(COOLDOWN_KEY, String(ts))
  } catch {
    // Cooldown still applies for this session through state
  }
}

const EMOTIONS = [
  { id: 'emotion_1' },
  { id: 'emotion_2' },
  { id: 'emotion_3' },
  { id: 'emotion_4' },
  { id: 'emotion_5' },
  { id: 'emotion_6' },
  { id: 'emotion_7' },
  { id: 'emotion_8' },
  { id: 'emotion_9' },
]

export default function Form() {
  const [sent,    setSent]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [lastSentAt, setLastSentAt] = useState(readLastSent)
  const [now, setNow] = useState(Date.now)

  const coolingDown = now - lastSentAt < COOLDOWN_MS
  const disabled    = loading || coolingDown

  // Re-enable the buttons once the cooldown expires
  useEffect(() => {
    if (!coolingDown) return
    const id = setTimeout(() => setNow(Date.now()), lastSentAt + COOLDOWN_MS - now)
    return () => clearTimeout(id)
  }, [coolingDown, lastSentAt, now])

  const send = async (emotionId) => {
    if (disabled) return
    setLoading(true)
    setError(null)
    try {
      await submitEmotion(emotionId)
      const ts = Date.now()
      writeLastSent(ts)
      setLastSentAt(ts)
      setNow(ts)
      setSent(emotionId)
      setTimeout(() => setSent(null), 2500)
    } catch (err) {
      console.error('Error al enviar emoción:', err)
      setError('No se pudo enviar. Intentá de nuevo.')
      setTimeout(() => setError(null), 3000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-page">
      <h1 className="form-title">¿Cómo te sentís hoy?</h1>
      <p className="form-subtitle">Elegí la cara que mejor te representa.</p>

      {sent && (
        <div className="sent-badge">
          ¡Gracias por compartir cómo te sentís! 🌿
        </div>
      )}

      {error && (
        <div className="error-badge">
          {error}
        </div>
      )}

      <div className="emotion-grid">
        {EMOTIONS.map(({ id }) => (
          <button
            key={id}
            className="emotion-btn"
            onClick={() => send(id)}
            disabled={disabled}
            aria-label={`Emoción ${id.split('_')[1]}`}
          >
            <img
              src={`/emotionsGabi/${id}.webp`}
              alt=""
              className="emotion-img"
            />
          </button>
        ))}
      </div>
    </div>
  )
}
