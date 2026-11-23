import { useEffect, useState } from 'react'
import { useApp, type Task, type TaskInput } from '../lib/data'
import { guess, ROOMS } from '../lib/rooms'
import { Chips, DAYS } from './Bits'
import { Sheet } from './Sheet'

const blank = (): TaskInput => ({ title: '', room: null, minutes: 10, recurrence: 'once', weekdays: [], interval_days: 7, assignee: null, due_date: null, effort: 2 })

export function TaskSheet({ open, onClose, task }: { open: boolean; onClose: () => void; task?: Task | null }) {
  const { d, act } = useApp()
  const [f, setF] = useState<TaskInput>(blank)
  const [touched, setTouched] = useState({ room: false, minutes: false })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setF(task ? { ...task, interval_days: task.interval_days ?? 7 } : blank())
    setTouched({ room: !!task, minutes: !!task })
  }, [open, task])

  const set = (p: Partial<TaskInput>) => setF((x) => ({ ...x, ...p }))
  const onTitle = (title: string) => {
    const g = guess(title)
    set({ title, ...(!touched.room && { room: g.room }), ...(!touched.minutes && g.minutes && { minutes: g.minutes }) })
  }
  const valid = f.title.trim() && (f.recurrence !== 'weekly' || f.weekdays.length)

  async function save() {
    if (!valid) return
    setBusy(true)
    await act.saveTask({
      ...f,
      title: f.title.trim(),
      weekdays: f.recurrence === 'weekly' ? [...f.weekdays].sort() : [],
      interval_days: f.recurrence === 'interval' ? f.interval_days : null,
      due_date: f.recurrence === 'once' ? f.due_date : null,
    }, task?.id)
    setBusy(false)
    onClose()
  }

  const who = [{ v: '', label: '✨ Slim verdelen' }, ...d.members.map((m) => ({ v: m.user_id, label: m.user_id === d.me.user_id ? 'Ik' : m.name }))]

  return (
    <Sheet open={open} onClose={onClose} title={task ? 'Taak aanpassen' : 'Nieuwe taak'}>
      <form onSubmit={(e) => { e.preventDefault(); save() }}>
        <input className="field big" autoFocus={!task} placeholder="Wat moet er gebeuren?" value={f.title}
          onChange={(e) => onTitle(e.target.value)} enterKeyHint="done" aria-label="Taak" />

        <label className="label">Ruimte</label>
        <Chips value={f.room ?? ''} onChange={(v) => { setTouched((t) => ({ ...t, room: true })); set({ room: v || null }) }}
          options={ROOMS.map((r) => ({ v: r.id, label: <>{r.icon} {r.label}</> }))} />

        <label className="label">Hoe lang ongeveer?</label>
        <Chips value={f.minutes} onChange={(v) => { setTouched((t) => ({ ...t, minutes: true })); set({ minutes: v }) }}
          options={[5, 10, 15, 20, 30].map((v) => ({ v, label: `${v} min` }))} />

        <label className="label">Hoe zwaar?</label>
        <Chips value={f.effort} onChange={(v) => set({ effort: v })}
          options={[{ v: 1, label: '🪶 Licht' }, { v: 2, label: 'Normaal' }, { v: 3, label: '💪 Zwaar' }]} />

        <label className="label">Wanneer?</label>
        <div className="segmented">
          {([['once', 'Eén keer'], ['weekly', 'Vaste dagen'], ['interval', 'Elke x dagen']] as const).map(([v, l]) => (
            <button type="button" key={v} className={f.recurrence === v ? 'on' : ''} onClick={() => set({ recurrence: v })}>{l}</button>
          ))}
        </div>
        {f.recurrence === 'weekly' && (
          <Chips multi value={f.weekdays} onChange={(v) => set({ weekdays: f.weekdays.includes(v) ? f.weekdays.filter((x) => x !== v) : [...f.weekdays, v] })}
            options={DAYS.map((l, v) => ({ v, label: l }))} />
        )}
        {f.recurrence === 'interval' && (
          <Chips value={f.interval_days ?? 7} onChange={(v) => set({ interval_days: v })}
            options={[2, 3, 7, 14, 30].map((v) => ({ v, label: v === 7 ? 'elke week' : v === 14 ? '2 weken' : v === 30 ? 'maand' : `${v} dagen` }))} />
        )}
        {f.recurrence === 'once' && (
          <div className="row-field">
            <span>Vanaf</span>
            <input type="date" className="field" value={f.due_date ?? ''} onChange={(e) => set({ due_date: e.target.value || null })} />
            {!f.due_date && <span className="muted small">zo snel mogelijk</span>}
          </div>
        )}

        {d.members.length > 1 && <>
          <label className="label">Voor wie?</label>
          <Chips value={f.assignee ?? ''} onChange={(v) => set({ assignee: v || null })} options={who} />
        </>}

        <button className="btn primary block" disabled={!valid || busy}>{busy ? 'Opslaan…' : task ? 'Opslaan' : 'Toevoegen'}</button>
        {task && (
          <button type="button" className="btn ghost danger block" onClick={async () => { await act.archiveTask(task.id); onClose() }}>
            Taak verwijderen
          </button>
        )}
      </form>
    </Sheet>
  )
}
