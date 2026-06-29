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
  const [sent, setSent] = useState(null)

  const send = async (emotionId) => {
    await submitEmotion(emotionId)
    setSent(emotionId)
    setTimeout(() => setSent(null), 2500)
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

      <div className="emotion-grid">
        {EMOTIONS.map(({ id }) => (
          <button
            key={id}
            className="emotion-btn"
            onClick={() => send(id)}
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
