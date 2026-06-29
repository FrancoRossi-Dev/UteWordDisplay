import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { listenForEmotion } from '../firebase'
import './Display.css'

const KAPPA = 4 * (Math.sqrt(2) - 1) / 3
const TARGET_PIXEL_RATIO = 2.26

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

export default function Display() {
  const [orbitEmotions, setOrbitEmotions] = useState([])
  const submitUrl = `${window.location.origin}/submit`

  useEffect(() => {
    const unsubscribe = listenForEmotion(({ emotionId, ts }) => {
      setOrbitEmotions((prev) => {
        const existing = prev.find(e => e.emotionId === emotionId)
        if (existing) {
          return prev.map(e =>
            e.id === existing.id ? { ...e, count: e.count + 1 } : e
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
        const duration  = 15 + Math.random() * 21
        return [...prev, { id, emotionId, count: 1, frac, path, duration }]
      })
    })
    return () => unsubscribe()
  }, [])

  return (
    <div className="display">
      <div className="qr-container">
        <QRCodeSVG value={submitUrl} size={200} bgColor="#ffffff" fgColor="#111111" />
        <p className="qr-label">Escaneá para compartir cómo te sentís</p>
      </div>

      {orbitEmotions.length > 0 && (
        <button className="clear-btn" onClick={() => setOrbitEmotions([])}>
          Limpiar
        </button>
      )}

      {orbitEmotions.map(({ id, emotionId, count, frac, path, duration }) => (
        <div
          key={id}
          className="orbit-emotion"
          style={{
            offsetPath:    `path("${path}")`,
            '--orb-frac':  frac,
            '--orb-dur':   `${duration}s`,
            '--orb-scale': scaleForCount(count),
          }}
        >
          <img
            src={`/emotionsGabi/${emotionId}.webp`}
            alt={emotionId}
            className="orbit-emotion-img"
          />
          <span className="orbit-emotion-count">{count}</span>
        </div>
      ))}
    </div>
  )
}
