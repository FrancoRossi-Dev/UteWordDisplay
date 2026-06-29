import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { listenForFeedbackAdded } from '../firebase'
import './FeedbackDisplay.css'

const CX = 150, CY = 155, R = 120, NEEDLE_LEN = 105

function toRad(deg) { return deg * Math.PI / 180 }

function scoreToAngleDeg(score) {
  return 180 - (score - 1) / 4 * 180
}

function pointOnArc(angleDeg, radius) {
  const rad = toRad(angleDeg)
  return {
    x: CX + radius * Math.cos(rad),
    y: CY - radius * Math.sin(rad),
  }
}

const TICK_SCORES = [1, 2, 3, 4, 5]

function Speedometer({ average, total }) {
  const rotDeg = (average - 1) / 4 * 180 - 90
  const arcPath = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`

  return (
    <svg viewBox="0 0 300 174" width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id="gaugeGrad" x1={CX - R} y1="0" x2={CX + R} y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#ef4444" />
          <stop offset="45%"  stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>

      {/* Track */}
      <path d={arcPath} fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth="22" strokeLinecap="round" />
      {/* Colored gradient */}
      <path d={arcPath} fill="none" stroke="url(#gaugeGrad)" strokeWidth="15" strokeLinecap="round" opacity="0.85" />

      {/* Ticks + labels */}
      {TICK_SCORES.map(score => {
        const ang = scoreToAngleDeg(score)
        const outer = pointOnArc(ang, R)
        const inner = pointOnArc(ang, R - 14)
        const label = pointOnArc(ang, R + 19)
        return (
          <g key={score}>
            <line x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y}
              stroke="rgba(255,255,255,0.85)" strokeWidth="2.5" />
            <text x={label.x} y={label.y}
              textAnchor="middle" dominantBaseline="middle"
              fill="rgba(255,255,255,0.75)" fontSize="13" fontWeight="700" fontFamily="sans-serif">
              {score}
            </text>
          </g>
        )
      })}

      {/* Needle */}
      <g style={{
        transform: `rotate(${rotDeg}deg)`,
        transformOrigin: `${CX}px ${CY}px`,
        transition: total === 0
          ? 'none'
          : 'transform 1.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        <line x1={CX} y1={CY + 13} x2={CX} y2={CY - NEEDLE_LEN}
          stroke="white" strokeWidth="4" strokeLinecap="round" />
        <line x1={CX} y1={CY} x2={CX} y2={CY + 13}
          stroke="rgba(255,255,255,0.25)" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* Pivot cap */}
      <circle cx={CX} cy={CY} r="12" fill="rgba(10,20,40,0.95)" />
      <circle cx={CX} cy={CY} r="6"  fill="white" opacity="0.92" />
    </svg>
  )
}

const SCORE_COLORS = ['', '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e']

function makeBubblePos() {
  const angle = Math.random() * Math.PI * 2
  const rx = 11 + Math.random() * 20   // horizontal spread %
  const ry = 8  + Math.random() * 14   // vertical spread %
  return {
    x:     50 + Math.cos(angle) * rx,
    y:     50 + Math.sin(angle) * ry,
    dur:   3.2 + Math.random() * 2.2,  // bob cycle duration (s)
    phase: Math.random(),               // 0-1, starting phase of bob
  }
}

export default function FeedbackDisplay() {
  const [responses, setResponses] = useState([])
  const [bubbles,   setBubbles]   = useState([])  // one per comment, permanent

  const submitUrl = `${window.location.origin}/feedback/submit`

  const average = responses.length > 0
    ? responses.reduce((sum, r) => sum + r.score, 0) / responses.length
    : 1

  useEffect(() => {
    const unsub = listenForFeedbackAdded((entry) => {
      setResponses(prev => {
        if (prev.some(r => r.id === entry.id)) return prev
        return [...prev, entry]
      })

      if (entry.comment) {
        setBubbles(prev => {
          if (prev.some(b => b.id === entry.id)) return prev
          return [...prev, { id: entry.id, text: entry.comment, score: entry.score, ...makeBubblePos() }]
        })
      }
    })
    return () => unsub()
  }, [])

  return (
    <div className="fb-display">
      {/* Center panel */}
      <div className="fb-center">
        <h1 className="fb-heading">¿Cómo estuvo el curso?</h1>

        <div className="fb-gauge-wrap">
          <Speedometer average={average} total={responses.length} />
        </div>

        <div className="fb-stats">
          {responses.length > 0 ? (
            <>
              <span className="fb-avg-num">{average.toFixed(1)}</span>
              <span className="fb-avg-denom"> / 5</span>
              <span className="fb-count">
                · {responses.length} {responses.length === 1 ? 'respuesta' : 'respuestas'}
              </span>
            </>
          ) : (
            <span className="fb-waiting">Esperando respuestas…</span>
          )}
        </div>
      </div>

      {/* QR code */}
      <div className="fb-qr-corner">
        <QRCodeSVG value={submitUrl} size={150} bgColor="#ffffff" fgColor="#111111" />
        <p className="fb-qr-label">Escaneá para dar tu opinión</p>
      </div>

      {/* Permanent comment bubbles — one per participant, bobbing near the gauge */}
      {bubbles.map(({ id, text, score, x, y, dur, phase }) => (
        <div
          key={id}
          className="fb-bubble-pos"
          style={{ left: `${x}%`, top: `${y}%` }}
        >
          <div
            className="fb-bubble-bob"
            style={{
              '--bob-dur': `${dur}s`,
              '--bob-del': `${-(phase * dur).toFixed(2)}s`,
            }}
          >
            <div className="fb-bubble-card">
              <span className="fb-bubble-stars" style={{ color: SCORE_COLORS[score] }}>
                {'★'.repeat(score)}{'☆'.repeat(5 - score)}
              </span>
              <span className="fb-bubble-text">{text}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
