import { useEffect, useMemo, useRef, useState } from 'react'
import { listenForEmotion, clearEmotionHistory } from '../firebase'
import QrPanel from '../components/QrPanel'
import './Display.css'

const ORBIT_PERIOD = 60         // seconds per full revolution
const GAP          = 16         // min px between neighbouring cards
const PAD          = 12         // min px between cards and the panel edge
const SAMPLES      = 360        // points used to measure the ellipse by arc length
const CARD_ASPECT  = 358 / 405  // image height / width
const COUNT_RATIO  = 0.16       // count font size / card width (matches Display.css)
const COUNT_GAP    = 6.4        // 0.4rem gap between image and count

function scaleForCount(count) {
  return Math.min(1 + Math.log(count) * 0.45, 3)
}

function cardHeight(w) {
  return w * (CARD_ASPECT + COUNT_RATIO) + COUNT_GAP
}

// Space a card takes along the orbit: its diagonal, so neighbours clear at any angle
function cardExtent(w) {
  return Math.hypot(w, cardHeight(w))
}

// Sampled ellipse with cumulative arc length, so cards can be spaced in pixels
function buildOrbit(cx, cy, rx, ry) {
  const pts = []
  const cum = [0]
  for (let i = 0; i <= SAMPLES; i++) {
    const t = (i / SAMPLES) * 2 * Math.PI
    pts.push([cx + rx * Math.cos(t), cy + ry * Math.sin(t)])
    if (i > 0) {
      const [ax, ay] = pts[i - 1]
      cum.push(cum[i - 1] + Math.hypot(pts[i][0] - ax, pts[i][1] - ay))
    }
  }
  return { pts, cum, length: cum[SAMPLES] }
}

// u is a fraction of the perimeter (wraps around)
function pointOnOrbit({ pts, cum, length }, u) {
  const s = (((u % 1) + 1) % 1) * length
  let lo = 0
  let hi = cum.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (cum[mid] <= s) lo = mid
    else hi = mid
  }
  const k = (s - cum[lo]) / (cum[hi] - cum[lo] || 1)
  return [
    pts[lo][0] + (pts[hi][0] - pts[lo][0]) * k,
    pts[lo][1] + (pts[hi][1] - pts[lo][1]) * k,
  ]
}

// Spaces cards along one shared orbit by arc length, sharing leftover room evenly
function placeCards(emotions, w, h, iconBase, fit) {
  const widths  = emotions.map(e => iconBase * scaleForCount(e.count) * fit)
  const maxW    = Math.max(0, ...widths)
  const extents = widths.map(cardExtent)
  const needed  = extents.reduce((sum, e) => sum + e + GAP, 0)
  // Shrink the ellipse so the biggest card stays inside the panel
  const orbit = buildOrbit(
    w / 2, h / 2,
    Math.max(w / 2 - maxW / 2 - PAD, 1),
    Math.max(h / 2 - cardHeight(maxW) / 2 - PAD, 1),
  )

  const slack   = emotions.length ? Math.max(orbit.length - needed, 0) / emotions.length : 0
  const offsets = []
  let s = 0
  extents.forEach((e, i) => {
    if (i > 0) s += (extents[i - 1] + e) / 2 + GAP + slack
    offsets.push(s / orbit.length)
  })

  return { orbit, widths, offsets, fits: needed <= orbit.length }
}

// Arc spacing can still let cards touch where the ellipse curves tightly,
// so check real boxes over a full revolution
function anyOverlap({ orbit, widths, offsets }) {
  for (let p = 0; p < 1; p += 1 / 90) {
    const boxes = widths.map((cw, i) => {
      const [x, y] = pointOnOrbit(orbit, p + offsets[i])
      return [x, y, cw / 2, cardHeight(cw) / 2]
    })
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const [ax, ay, aw, ah] = boxes[i]
        const [bx, by, bw, bh] = boxes[j]
        if (Math.abs(ax - bx) < aw + bw && Math.abs(ay - by) < ah + bh) return true
      }
    }
  }
  return false
}

// Places every card on the orbit with no overlaps; shrinks all cards evenly until they fit
function computeLayout(emotions, w, h, iconBase) {
  let fit = 1
  let placed = placeCards(emotions, w, h, iconBase, fit)
  for (let i = 0; i < 40 && (!placed.fits || anyOverlap(placed)); i++) {
    fit *= 0.95
    placed = placeCards(emotions, w, h, iconBase, fit)
  }

  const offsets = new Map(emotions.map(({ id }, i) => [id, placed.offsets[i]]))
  return { orbit: placed.orbit, fit, offsets }
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
        const id = `${ts}-${Math.random()}`
        return [...prev, { id, emotionId, count: 1 }]
      })
    })
    return () => unsubscribe()
  }, [])

  const total    = orbitEmotions.reduce((sum, e) => sum + e.count, 0)
  const iconBase = Math.min(panelSize.w, panelSize.h) * 0.165

  const layout = useMemo(
    () => computeLayout(orbitEmotions, panelSize.w, panelSize.h, iconBase),
    [orbitEmotions, panelSize.w, panelSize.h, iconBase],
  )
  const layoutRef = useRef(layout)
  layoutRef.current = layout
  const cardRefs = useRef(new Map())

  // Moves cards every frame by writing transforms directly, without re-rendering
  useEffect(() => {
    const drawn = new Map()   // id -> offset currently on screen, eased toward the target
    let phase = 0
    let last  = performance.now()
    let raf

    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.1)
      last   = now
      phase += dt / ORBIT_PERIOD
      const { orbit, offsets } = layoutRef.current
      const ease = 1 - Math.exp(-dt * 3)

      for (const [id, el] of cardRefs.current) {
        const target = offsets.get(id)
        if (target === undefined) continue
        let u = drawn.get(id) ?? target
        u += ((((target - u) % 1) + 1.5) % 1 - 0.5) * ease   // shortest way around
        drawn.set(id, u)
        const [x, y] = pointOnOrbit(orbit, phase + u)
        el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`
      }
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

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

        {orbitEmotions.map(({ id, emotionId, count }) => {
          return (
            <div
              key={id}
              ref={(el) => el ? cardRefs.current.set(id, el) : cardRefs.current.delete(id)}
              className="orbit-emotion"
              style={{
                '--orb-base':  `${iconBase}px`,
                '--orb-scale': scaleForCount(count) * layout.fit,
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
