import { useState } from 'react'
import { useApp } from '../lib/data'
import { Chips } from './Bits'
import { Sheet } from './Sheet'

const REASONS = ['🏋️ Sportschool', '🛒 Boodschappen', '🍝 Koken', '👥 Bezoek', '💼 Nog werk', '😴 Even moe']

export function SnoozeSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { d, act } = useApp()
  const [reason, setReason] = useState(REASONS[0])
  const [custom, setCustom] = useState('')
  const [when, setWhen] = useState<'arrive' | 1 | 2 | 'tomorrow'>('arrive')
  const text = custom.trim() || reason

  return (
    <Sheet open={open} onClose={onClose} title="Nu even niet">
      <p className="muted">Geen probleem. {d.partner ? `${d.partner.name} ziet waarom, ` : ''}en ik herinner je later opnieuw.</p>
      <label className="label">Waarom niet?</label>
      <Chips value={custom ? '' : reason} onChange={(v) => { setReason(v); setCustom('') }} options={REASONS.map((v) => ({ v, label: v }))} />
      <input className="field" placeholder="Of typ zelf iets…" value={custom} onChange={(e) => setCustom(e.target.value)} />
      <label className="label">Herinner me</label>
      <Chips value={when} onChange={setWhen} options={[
        { v: 'arrive', label: '🏡 Als ik thuiskom' }, { v: 1, label: 'Over 1 uur' }, { v: 2, label: 'Over 2 uur' }, { v: 'tomorrow', label: 'Morgen' },
      ]} />
      {when === 'arrive' && <p className="muted small">Lukt het thuiskom-signaal niet? Dan krijg je na 3 uur toch een herinnering.</p>}
      {when === 'tomorrow' && <p className="muted small">Wat vandaag blijft liggen, plan ik morgen slim opnieuw in.</p>}
      <button className="btn primary block" onClick={async () => { await act.snooze(text, when); onClose() }}>Snooze</button>
    </Sheet>
  )
}
