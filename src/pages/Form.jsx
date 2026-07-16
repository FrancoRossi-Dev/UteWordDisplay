import { useState } from 'react'
import { submitEmotion } from '../firebase'
import './Form.css'

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

  const send = async (emotionId) => {
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      await submitEmotion(emotionId)
      setSent(emotionId)
      setTimeout(() => setSent(null), 2500)
    } catch (err) {
      console.error('Error al enviar emoción:', err)
      setError(`Error: ${err?.code || err?.message || String(err)}`)
      setTimeout(() => setError(null), 10000)
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
            className={`emotion-btn${loading ? ' loading' : ''}`}
            onClick={() => send(id)}
            disabled={loading}
            aria-label={id}
          >
            <img
              src={`/emotionsGabi/${id}.webp`}
              alt={id}
              className="emotion-img"
            />
          </button>
        ))}
      </div>
    </div>
  )
}
