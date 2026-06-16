import { useState } from 'react'
import { submitWord } from '../firebase'
import './Form.css'

const PRESET_WORDS = [
  '🤝 Confianza',    '💬 Escucha',
  '❤️ Empatía',      '🌱 Crecimiento',
  '🛡️ Seguridad',    '✨ Respeto',
  '💡 Colaboración', '🌟 Pertenencia',
  '🕊️ Calma',        '💪 Fortaleza',
]

export default function Form() {
  const [custom, setCustom] = useState('')
  const [sent, setSent] = useState(null)

  const send = async (word) => {
    if (!word.trim()) return
    await submitWord(word.trim())
    setSent(word.trim())
    setCustom('')
    setTimeout(() => setSent(null), 2500)
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
