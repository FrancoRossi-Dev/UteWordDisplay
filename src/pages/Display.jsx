import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { listenForWord } from '../firebase'
import './Display.css'

const COLORS = ['#c8c8ff', '#ff9de2', '#9de2ff', '#ffd89d', '#a0f0b0']
// 4 cubic Bézier curves approximate an ellipse with < 0.03% error
const KAPPA = 4 * (Math.sqrt(2) - 1) / 3

function ellipsePath(cx, cy, rx, ry) {
  const k = KAPPA
  return (
    `M ${cx + rx} ${cy} ` +
    `C ${cx + rx} ${cy - k*ry}, ${cx + k*rx} ${cy - ry}, ${cx} ${cy - ry} ` +
    `C ${cx - k*rx} ${cy - ry}, ${cx - rx} ${cy - k*ry}, ${cx - rx} ${cy} ` +
    `C ${cx - rx} ${cy + k*ry}, ${cx - k*rx} ${cy + ry}, ${cx} ${cy + ry} ` +
    `C ${cx + k*rx} ${cy + ry}, ${cx + rx} ${cy + k*ry}, ${cx + rx} ${cy} Z`
  )
}

function scaleForCount(count) {
  return Math.min(1 + Math.log(count) * 0.45, 3)
}

const TARGET_PIXEL_RATIO = 2.26

export default function Display() {
  const [orbitWords, setOrbitWords] = useState([])
  const submitUrl = `${window.location.origin}/submit`

  useEffect(() => {
    const unsubscribe = listenForWord(({ word, ts }) => {
      const key = word.trim().toLowerCase()
      setOrbitWords((prev) => {
        const existing = prev.find(w => w.word.trim().toLowerCase() === key)
        if (existing) {
          return prev.map(w =>
            w.id === existing.id ? { ...w, count: w.count + 1 } : w
          )
        }
        const id        = `${ts}-${Math.random()}`
        const frac      = Math.random()
        const rx_vw     = 20 + Math.random() * 16
        const pixAspect = window.innerWidth / window.innerHeight
        const ry_vh     = Math.min(rx_vw * pixAspect / TARGET_PIXEL_RATIO, 38)
        const rxPx      = rx_vw / 100 * window.innerWidth
        const ryPx      = ry_vh / 100 * window.innerHeight
        const path      = ellipsePath(window.innerWidth / 2, window.innerHeight / 2, rxPx, ryPx)
        const duration  = 15 + Math.random() * 21  // slowed by 1/3 vs previous range
        const color     = COLORS[Math.floor(Math.random() * COLORS.length)]
        return [...prev, { id, word, count: 1, frac, path, duration, color }]
      })
    })
    return () => unsubscribe()
  }, [])

  return (
    <div className="display">
      <div className="qr-container">
        <QRCodeSVG value={submitUrl} size={200} bgColor="#ffffff" fgColor="#111111" />
        <p className="qr-label">Escaneá para compartir una palabra</p>
      </div>

      {orbitWords.length > 0 && (
        <button className="clear-btn" onClick={() => setOrbitWords([])}>
          Limpiar
        </button>
      )}

      {orbitWords.map(({ id, word, count, frac, path, duration, color }) => (
        <span
          key={id}
          className="orbit-word"
          style={{
            offsetPath:      `path("${path}")`,
            '--orb-frac':    frac,
            '--orb-dur':     `${duration}s`,
            '--orb-scale':   scaleForCount(count),
            color,
          }}
        >
          {word}
          {count >= 2 && <span className="orbit-count"> ×{count}</span>}
        </span>
      ))}
    </div>
  )
}
