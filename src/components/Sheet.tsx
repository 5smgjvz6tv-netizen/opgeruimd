import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/** iOS-achtige bottom sheet: veert open, en je kunt hem naar beneden vegen om te sluiten. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const [shown, setShown] = useState(open)
  const [visible, setVisible] = useState(false)
  const sheet = useRef<HTMLDivElement>(null)
  const drag = useRef<{ y: number; dy: number; t: number } | null>(null)

  useEffect(() => {
    if (open) {
      setShown(true)
      const r = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
      return () => cancelAnimationFrame(r)
    }
    setVisible(false)
    const t = setTimeout(() => setShown(false), 420)
    return () => clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    addEventListener('keydown', k)
    document.body.style.overflow = 'hidden'
    return () => { removeEventListener('keydown', k); document.body.style.overflow = '' }
  }, [open, onClose])

  const down = (e: React.PointerEvent) => {
    drag.current = { y: e.clientY, dy: 0, t: performance.now() }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    sheet.current?.classList.add('dragging')
  }
  const move = (e: React.PointerEvent) => {
    if (!drag.current || !sheet.current) return
    const dy = e.clientY - drag.current.y
    drag.current.dy = dy
    // Omhoog trekken voelt als elastiek, omlaag volgt je vinger.
    sheet.current.style.transform = `translateY(${dy > 0 ? dy : dy / 6}px)`
  }
  const up = () => {
    const d = drag.current
    drag.current = null
    if (!sheet.current || !d) return
    sheet.current.classList.remove('dragging')
    sheet.current.style.transform = ''
    const velocity = d.dy / (performance.now() - d.t)
    if (d.dy > 110 || velocity > 0.5) onClose()
  }

  if (!shown) return null
  // Altijd los op de pagina (portal): animaties van het scherm mogen de sheet niet "vangen".
  return createPortal(
    <div className={'sheet-wrap' + (visible ? ' open' : '')} onClick={onClose}>
      <div ref={sheet} className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-drag" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
          <div className="grabber" />
          <div className="sheet-head">
            <h2>{title}</h2>
            <button className="icon-btn" onPointerDown={(e) => e.stopPropagation()} onClick={onClose} aria-label="Sluiten">✕</button>
          </div>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
