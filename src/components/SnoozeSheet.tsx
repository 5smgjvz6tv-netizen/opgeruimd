import { useState } from 'react'
import { useApp } from '../lib/data'
import { t, type TKey } from '../lib/i18n'
import { Chips } from './Bits'
import { Sheet } from './Sheet'

const REASONS: [TKey, string][] = [['snooze.r.gym', 'dumbbell'], ['snooze.r.shop', 'cart'], ['snooze.r.cook', 'pot'], ['snooze.r.guests', 'guests'], ['snooze.r.work', 'briefcase'], ['snooze.r.tired', 'sleepy']]

export function SnoozeSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { d, act } = useApp()
  const [reason, setReason] = useState<TKey>(REASONS[0][0])
  const [custom, setCustom] = useState('')
  const [when, setWhen] = useState<'arrive' | 1 | 2 | 'tomorrow'>('arrive')
  const text = custom.trim() || t(reason)

  return (
    <Sheet open={open} onClose={onClose} title={t('snooze.title')}>
      <div><span className="label">{t('snooze.why')}</span>
        <Chips value={custom ? '' : reason} onChange={(v) => { setReason(v as TKey); setCustom('') }} options={REASONS.map(([k, icon]) => ({ v: k, label: t(k), icon }))} />
        <input className="field" style={{ marginTop: 10 }} placeholder={t('snooze.custom')} value={custom} onChange={(e) => setCustom(e.target.value)} /></div>
      <div><span className="label">{t('snooze.when')}</span>
        <Chips value={when} onChange={setWhen} options={[
          { v: 'arrive', label: t('snooze.w.arrive'), icon: 'pin' }, { v: 1, label: t('snooze.w.1h'), icon: 'clock' },
          { v: 2, label: t('snooze.w.2h'), icon: 'clock' }, { v: 'tomorrow', label: t('snooze.w.tomorrow'), icon: 'calendar' },
        ]} />
        <p className="group-f" style={{ marginTop: 8 }}>
          {when === 'arrive' ? t('snooze.noteArrive') : when === 'tomorrow' ? t('snooze.noteTomorrow') : ''} {d.others.length ? t('snooze.noteShare') : ''}
        </p></div>
      <button className="btn primary block" onClick={async () => { await act.snooze(text, when); onClose() }}>{t('snooze.save')}</button>
    </Sheet>
  )
}
