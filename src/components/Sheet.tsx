import { useEffect, useState, type ReactNode } from 'react'

/** iOS-achtige bottom sheet. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const [shown, setShown] = useState(open)
  useEffect(() => {
    if (open) setShown(true)
    else { const t = setTimeout(() => setShown(false), 260); return () => clearTimeout(t) }
  }, [open])
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    addEventListener('keydown', k)
    return () => removeEventListener('keydown', k)
  }, [open, onClose])
  if (!shown) return null
  return (
    <div className={'sheet-wrap' + (open ? ' open' : '')} onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="grabber" />
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Sluiten">✕</button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  )
}
