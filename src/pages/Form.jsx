import { useState, useEffect } from 'react'
import { submitWord } from '../firebase'
import './Form.css'

const PRESET_WORDS = [
  '🤝 Confianza',    '💬 Escucha',
  '❤️ Empatía',      '🌱 Crecimiento',
  '🛡️ Seguridad',    '✨ Respeto',
  '💡 Colaboración', '🌟 Pertenencia',
  '🕊️ Calma',        '💪 Fortaleza',
]

const BLOCK_MS = 5 * 60 * 1000
const LS_KEY = 'qrapp_last_submit'

function getSecondsLeft() {
  const saved = localStorage.getItem(LS_KEY)
  if (!saved) return 0
  const remaining = BLOCK_MS - (Date.now() - Number(saved))
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0
}

export default function Form() {
  const [custom, setCustom] = useState('')
  const [sent, setSent] = useState(null)
  const [secondsLeft, setSecondsLeft] = useState(getSecondsLeft)

  useEffect(() => {
    if (secondsLeft <= 0) return
    const interval = setInterval(() => {
      const s = getSecondsLeft()
      setSecondsLeft(s)
      if (s <= 0) clearInterval(interval)
    }, 1000)
    return () => clearInterval(interval)
  }, [secondsLeft > 0])

  const send = async (word) => {
    if (!word.trim() || secondsLeft > 0) return
    await submitWord(word.trim())
    localStorage.setItem(LS_KEY, String(Date.now()))
    setSecondsLeft(getSecondsLeft())
    setSent(word.trim())
    setCustom('')
    setTimeout(() => setSent(null), 2500)
  }

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const secs = String(secondsLeft % 60).padStart(2, '0')

  if (secondsLeft > 0) {
    return (
      <div className="form-page">
        <div className="blocked-card">
          <p className="blocked-title">¡Gracias por participar!</p>
          <p className="blocked-subtitle">Podrás enviar otra palabra en</p>
          <p className="blocked-timer">{mins}:{secs}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="form-page">
      <h1 className="form-title">¿Qué palabra querés aportar hoy?</h1>
      <p className="form-subtitle">
        Elegí una de las opciones o escribí la tuya. Tu voz importa.
      </p>

      {sent && (
        <div className="sent-badge">
          Gracias por compartir <strong>"{sent}"</strong> 🌿
        </div>
      )}

      <div className="preset-grid">
        {PRESET_WORDS.map((w) => (
          <button key={w} className="preset-btn" onClick={() => send(w)}>
            {w}
          </button>
        ))}
      </div>

      <p className="custom-label">O escribí tu propia palabra:</p>

      <div className="custom-row">
        <input
          className="custom-input"
          type="text"
          placeholder="Tu palabra…"
          value={custom}
          maxLength={24}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(custom)}
        />
        <button className="send-btn" onClick={() => send(custom)}>
          Compartir
        </button>
      </div>
    </div>
  )
}
