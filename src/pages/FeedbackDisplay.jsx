import { useEffect, useRef, useState } from 'react'
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
    <svg viewBox="0 0 300 165" width="100%" height="100%" aria-hidden="true">
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
const BUBBLE_DURATION = 8000
const BUBBLE_INTERVAL_MIN = 3000
const BUBBLE_INTERVAL_RANGE = 3500

export default function FeedbackDisplay() {
  const [responses, setResponses]               = useState([])
  const [floatingComments, setFloatingComments] = useState([])
  const responsesRef = useRef([])

  const submitUrl = `${window.location.origin}/feedback/submit`

  const average = responses.length > 0
    ? responses.reduce((sum, r) => sum + r.score, 0) / responses.length
    : 1

  // Keep ref in sync so the cycling timer can read latest responses without a stale closure
  useEffect(() => { responsesRef.current = responses }, [responses])

  // Load responses from Firebase (last hour only)
  useEffect(() => {
    const unsub = listenForFeedbackAdded((entry) => {
      setResponses(prev => {
        if (prev.some(r => r.id === entry.id)) return prev
        return [...prev, entry]
      })
    })
    return () => unsub()
  }, [])

  // Continuously cycle random comments as floating bubbles
  useEffect(() => {
    let timer

    const spawnBubble = () => {
      const withComments = responsesRef.current.filter(r => r.comment)
      if (withComments.length > 0) {
        const entry = withComments[Math.floor(Math.random() * withComments.length)]
        const fid = `${entry.id}-${Date.now()}-${Math.random()}`
        const x = 4 + Math.random() * 66
        setFloatingComments(prev => [...prev, { fid, text: entry.comment, score: entry.score, x }])
        setTimeout(() => {
          setFloatingComments(prev => prev.filter(c => c.fid !== fid))
        }, BUBBLE_DURATION)
      }
      timer = setTimeout(spawnBubble, BUBBLE_INTERVAL_MIN + Math.random() * BUBBLE_INTERVAL_RANGE)
    }

    timer = setTimeout(spawnBubble, 1200)
    return () => clearTimeout(timer)
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

      {/* Floating comments */}
      {floatingComments.map(({ fid, text, score, x }) => (
        <div
          key={fid}
          className="fb-float"
          style={{ left: `${x}%` }}
        >
          <span className="fb-float-stars" style={{ color: SCORE_COLORS[score] }}>
            {'★'.repeat(score)}{'☆'.repeat(5 - score)}
          </span>
          <span className="fb-float-text">{text}</span>
        </div>
      ))}
    </div>
  )
}
