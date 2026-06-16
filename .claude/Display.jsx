import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { listenForWord } from '../firebase'
import './Display.css'

export default function Display() {
  const [floatingWords, setFloatingWords] = useState([])
  const submitUrl = `${window.location.origin}/submit`

  useEffect(() => {
    const unsubscribe = listenForWord(({ word, ts }) => {
      const id = `${ts}-${Math.random()}`
      const x = 10 + Math.random() * 70 // % from left, keep away from QR area
      setFloatingWords((prev) => [...prev, { id, word, x }])
      // Remove word after animation completes
      setTimeout(() => {
        setFloatingWords((prev) => prev.filter((w) => w.id !== id))
      }, 4500)
    })
    return () => unsubscribe()
  }, [])

  return (
    <div className="display">
      <div className="qr-container">
        <QRCodeSVG value={submitUrl} size={200} bgColor="#ffffff" fgColor="#111111" />
        <p className="qr-label">Escaneá para compartir una palabra</p>
      </div>

      {floatingWords.map(({ id, word, x }) => (
        <span
          key={id}
          className="floating-word"
          style={{ left: `${x}%` }}
        >
          {word}
        </span>
      ))}
    </div>
  )
}
