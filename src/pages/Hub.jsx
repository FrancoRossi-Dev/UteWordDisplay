import { useNavigate } from 'react-router-dom'
import './Hub.css'

const ROOMS = [
  {
    path: '/emocion',
    emoji: '😊',
    title: '¿Cómo me siento hoy?',
    desc: 'Los participantes comparten su emoción escaneando el QR.',
  },
  {
    path: '/feedback',
    emoji: '📊',
    title: 'Retroalimentación del curso',
    desc: 'Los participantes califican y dejan comentarios al final.',
  },
]

export default function Hub() {
  const navigate = useNavigate()

  return (
    <div className="hub-page">
      <div className="hub-inner">
        <h1 className="hub-title">Seleccioná una pantalla</h1>
        <p className="hub-subtitle">Hacé clic para abrir la pantalla de presentación.</p>

        <div className="hub-cards">
          {ROOMS.map(({ path, emoji, title, desc }) => (
            <button
              key={path}
              className="hub-card"
              onClick={() => navigate(path)}
            >
              <span className="hub-card-emoji">{emoji}</span>
              <span className="hub-card-title">{title}</span>
              <span className="hub-card-desc">{desc}</span>
              <span className="hub-card-arrow">→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
