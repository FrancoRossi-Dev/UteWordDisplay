import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import './QrPanel.css'

export default function QrPanel({ url, label }) {
  const [hidden, setHidden] = useState(false)

  return (
    <>
      <aside className={`qr-panel${hidden ? ' hidden' : ''}`} aria-hidden={hidden}>
        <div className="qr-card">
          <QRCodeSVG value={url} size={512} bgColor="#ffffff" fgColor="#111111" className="qr-card-code" />
          <p className="qr-card-label">{label}</p>
          <p className="qr-card-url">{url.replace(/^https?:\/\//, '')}</p>
        </div>
      </aside>

      <button className="qr-toggle" onClick={() => setHidden(h => !h)}>
        {hidden ? 'Mostrar QR' : 'Ocultar QR'}
      </button>
    </>
  )
}
