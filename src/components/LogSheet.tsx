import { useEffect, useMemo, useState } from 'react'
import { addDays, dueSince, localDate, nextDue } from '../../supabase/functions/_shared/planner'
import { useApp, type Task } from '../lib/data'
import { guess, room } from '../lib/rooms'
import { Chips, Confetti } from './Bits'
import { Icon } from './Icon'
import { Sheet } from './Sheet'

const dayName = (date: string) => new Date(date + 'T12:00:00').toLocaleDateString('nl-NL', { weekday: 'long' })
export const niceDate = (date: string) => {
  const diff = Math.round((Date.parse(date) - Date.parse(localDate())) / 864e5)
  if (diff === 0) return 'vandaag'
  if (diff === 1) return 'morgen'
  if (diff > 1 && diff < 7) return dayName(date)
  return new Date(date + 'T12:00:00').toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })
}

/** "Al gedaan": iets loggen wat je zelf al hebt opgeruimd, buiten de app om. */
export function LogSheet({ open, onClose, preset }: { open: boolean; onClose: () => void; preset?: Task | null }) {
  const { d, act } = useApp()
  const today = localDate()
  const [q, setQ] = useState('')
  const [pick, setPick] = useState<Task | null>(null)
  const [when, setWhen] = useState(0)
  const [together, setTogether] = useState(false)
  const [repeat, setRepeat] = useState(false)
  const [mins, setMins] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<{ title: string; next: string | null } | null>(null)

  useEffect(() => {
    if (!open) return
    setQ(''); setPick(preset ?? null); setWhen(0); setTogether(false); setRepeat(false); setMins(null); setDone(null)
  }, [open, preset])

  // Wat nu (bijna) aan de beurt is eerst: dat heb je waarschijnlijk net gedaan.
  const list = useMemo(() => {
    const active = d.tasks.filter((t) => !t.archived)
    const f = q.trim().toLowerCase()
    return active
      .filter((t) => !f || t.title.toLowerCase().includes(f) || room(t.room).label.toLowerCase().includes(f))
      .map((t) => ({ t, due: !!dueSince(t, addDays(today, 2)) }))
      .sort((a, b) => Number(b.due) - Number(a.due) || a.t.title.localeCompare(b.t.title))
      .map((x) => x.t)
  }, [d.tasks, q, today])

  const newTitle = q.trim()
  const canNew = newTitle.length > 1 && !list.some((t) => t.title.toLowerCase() === newTitle.toLowerCase())

  async function save() {
    setBusy(true)
    const date = addDays(today, -when)
    const at = when === 0 ? new Date() : new Date(date + 'T12:00:00')
    const task = pick ?? await act.createForLog(newTitle, repeat)
    if (!task) { setBusy(false); return }
    await act.logDone(task, at, together, mins ?? task.minutes)
    const after = { ...task, last_done_at: at.toISOString(), archived: task.recurrence === 'once' }
    setDone({ title: task.title, next: nextDue(after, addDays(today, 1)) })
    setBusy(false)
    setTimeout(onClose, 1900)
  }

  return (
    <Sheet open={open} onClose={onClose} title="Al gedaan 🙌">
      {done ? (
        <div className="log-done">
          <Confetti />
          <span className="log-badge pop-in"><Icon name="check" size={34} /></span>
          <h2>Genoteerd!</h2>
          <p className="muted">{done.title}{done.next ? <> · volgende keer <b>{niceDate(done.next)}</b></> : ' · klaar'}</p>
        </div>
      ) : (
        <>
          <p className="muted">Zelf iets opgeruimd? Log het hier. Het telt mee en schuift de volgende keer op.</p>
          {!pick ? (
            <>
              <div className="search">
                <Icon name="search" size={18} />
                <input className="field" placeholder="Wat heb je gedaan?" value={q} onChange={(e) => setQ(e.target.value)} autoFocus={!preset} />
              </div>
              <ul className="log-list">
                {canNew && (
                  <li><div className="log-item new">
                    <span className="pick-icon">{room(guess(newTitle).room).icon}</span>
                    <span className="grow"><b>“{newTitle}”</b><br /><span className="muted small">Nieuw, nog niet in je takenlijst</span></span>
                    <Icon name="plus" size={18} />
                  </div></li>
                )}
                {list.slice(0, 30).map((t) => (
                  <li key={t.id}><button className="log-item" onClick={() => setPick(t)}>
                    <span className="pick-icon">{room(t.room).icon}</span>
                    <span className="grow"><b>{t.title}</b><br /><span className="muted small">{room(t.room).label} · {t.minutes} min</span></span>
                    <Icon name="chevron" size={16} />
                  </button></li>
                ))}
              </ul>
              {canNew && (
                <label className="check-row"><input type="checkbox" checked={repeat} onChange={(e) => setRepeat(e.target.checked)} /> “{newTitle}” komt vaker terug (elke week)</label>
              )}
            </>
          ) : (
            <div className="fade-in">
              <button className="log-item selected" onClick={() => setPick(null)}>
                <span className="pick-icon">{room(pick.room).icon}</span>
                <span className="grow"><b>{pick.title}</b><br /><span className="muted small">Tik om iets anders te kiezen</span></span>
                <Icon name="x" size={16} />
              </button>
            </div>
          )}

          <label className="label">Hoe lang duurde het?</label>
          <Chips value={mins ?? pick?.minutes ?? guess(newTitle).minutes ?? 10} onChange={setMins}
            options={[5, 10, 15, 20, 30, 45, 60].map((v) => ({ v, label: v === 60 ? '1 uur' : `${v} min` }))} />

          <label className="label">Wanneer?</label>
          <Chips value={when} onChange={setWhen}
            options={[0, 1, 2, 3, 4, 5, 6].map((n) => ({ v: n, label: n === 0 ? 'Vandaag' : n === 1 ? 'Gisteren' : dayName(addDays(today, -n)) }))} />

          {d.partner && (
            <label className="check-row"><input type="checkbox" checked={together} onChange={(e) => setTogether(e.target.checked)} /> 👫 Samen met {d.partner.name} gedaan</label>
          )}

          <button className="btn primary block" onClick={save} disabled={busy || (!pick && !canNew)}>
            {busy ? <span className="spinner" /> : <><Icon name="check" size={18} /> Opslaan</>}
          </button>
        </>
      )}
    </Sheet>
  )
}
