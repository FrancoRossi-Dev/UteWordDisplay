import { useState } from 'react'
import { submitFeedback } from '../firebase'
import './FeedbackForm.css'

const SCORE_META = [
  { n: 1, label: 'Muy malo',  emoji: '😞', color: '#ef4444' },
  { n: 2, label: 'Malo',      emoji: '😕', color: '#f97316' },
  { n: 3, label: 'Regular',   emoji: '😐', color: '#eab308' },
  { n: 4, label: 'Bueno',     emoji: '🙂', color: '#84cc16' },
  { n: 5, label: 'Excelente', emoji: '😄', color: '#22c55e' },
]

export default function FeedbackForm() {
  const [score,   setScore]   = useState(null)
  const [comment, setComment] = useState('')
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)

  const send = async () => {
    if (!score || loading) return
    setLoading(true)
    await submitFeedback(score, comment)
    setLoading(false)
    setSent(true)
  }

  if (sent) {
    return (
      <div className="fbf-page">
        <div className="fbf-thanks">
          <span className="fbf-thanks-icon">🙏</span>
          <h2 className="fbf-thanks-title">¡Gracias por tu feedback!</h2>
          <p className="fbf-thanks-sub">Tu opinión nos ayuda a mejorar.</p>
        </div>
      </div>
    )
  }

  const selected = SCORE_META.find(s => s.n === score)

  return (
    <div className="fbf-page">
      <h1 className="fbf-title">¿Cómo estuvo el curso?</h1>
      <p className="fbf-subtitle">Calificá tu experiencia del 1 al 5</p>

      {/* Score buttons */}
      <div className="fbf-score-row">
        {SCORE_META.map(({ n, label, emoji, color }) => (
          <button
            key={n}
            className={`fbf-score-btn${score === n ? ' selected' : ''}`}
            style={score === n ? { '--btn-color': color } : {}}
            onClick={() => setScore(n)}
            aria-label={`${n} — ${label}`}
          >
            <span className="fbf-score-emoji">{emoji}</span>
            <span className="fbf-score-num">{n}</span>
          </button>
        ))}
      </div>

      {selected && (
        <p className="fbf-score-label" style={{ color: selected.color }}>
          {selected.label}
        </p>
      )}

      {/* Comment */}
      <textarea
        className="fbf-comment"
        placeholder="Dejá un comentario (opcional)"
        value={comment}
        onChange={e => setComment(e.target.value)}
        rows={4}
        maxLength={280}
      />
      <span className="fbf-char-count">{comment.length}/280</span>

      <button
        className="fbf-submit"
        onClick={send}
        disabled={!score || loading}
      >
        {loading ? 'Enviando…' : 'Enviar feedback'}
      </button>
    </div>
  )
}
