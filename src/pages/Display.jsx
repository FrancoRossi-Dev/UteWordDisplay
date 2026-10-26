import { useEffect, useRef, useState } from 'react'
import { listenForEmotion, clearEmotionHistory } from '../firebase'
import QrPanel from '../components/QrPanel'
import './Display.css'

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

export default function Display() {
  const [orbitEmotions, setOrbitEmotions] = useState([])
  const [panelSize, setPanelSize] = useState({ w: 0, h: 0 })
  const panelRef = useRef(null)
  const submitUrl = `${window.location.origin}/emocion/enviar`

  // Orbits are laid out inside the results panel, which resizes when the QR is hidden
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setPanelSize({ w: width, h: height })
    })
    observer.observe(panelRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const unsubscribe = listenForEmotion(({ emotionId, ts }) => {
      setOrbitEmotions((prev) => {
        const existing = prev.find(e => e.emotionId === emotionId)
        if (existing) {
          return prev.map(e =>
            e.id === existing.id ? { ...e, count: e.count + 1 } : e
          )
        }
        const id       = `${ts}-${Math.random()}`
        const frac     = Math.random()
        const ring     = Math.random()   // 0 = inner orbit, 1 = outer orbit
        const duration = 15 + Math.random() * 21
        return [...prev, { id, emotionId, count: 1, frac, ring, duration }]
      })
    })
    return () => unsubscribe()
  }, [])

  const total    = orbitEmotions.reduce((sum, e) => sum + e.count, 0)
  const iconBase = Math.min(panelSize.w, panelSize.h) * 0.11

  return (
    <div className="display split-screen">
      <QrPanel url={submitUrl} label="Escaneá para compartir cómo te sentís" />

      <main className="results-panel" ref={panelRef}>
        <div className="orbit-center">
          <h1 className="orbit-title">¿Cómo nos sentimos hoy?</h1>
          <p className="orbit-total">
            {total > 0
              ? `${total} ${total === 1 ? 'respuesta' : 'respuestas'}`
              : 'Esperando respuestas…'}
          </p>
        </div>

        {orbitEmotions.map(({ id, emotionId, count, frac, ring, duration }) => {
          // Inner orbit leaves room for the title in the center
          const rx   = (0.28 + ring * 0.16) * panelSize.w
          const ry   = (0.26 + ring * 0.16) * panelSize.h
          const path = ellipsePath(panelSize.w / 2, panelSize.h / 2, rx, ry)

          return (
            <div
              key={id}
              className="orbit-emotion"
              style={{
                offsetPath:    `path("${path}")`,
                '--orb-frac':  frac,
                '--orb-dur':   `${duration}s`,
                '--orb-base':  `${iconBase}px`,
                '--orb-scale': scaleForCount(count),
              }}
            >
              <img
                src={`/emotionsGabi/${emotionId}.webp`}
                alt={`Emoción ${emotionId.split('_')[1]}`}
                className="orbit-emotion-img"
              />
              <span className="orbit-emotion-count">{count}</span>
            </div>
          )
        })}
      </main>

      {orbitEmotions.length > 0 && (
        <button className="clear-btn" onClick={() => { setOrbitEmotions([]); clearEmotionHistory() }}>
          Limpiar
        </button>
      )}
    </div>
  )
}
