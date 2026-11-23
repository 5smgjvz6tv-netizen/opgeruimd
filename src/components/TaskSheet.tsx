import { useEffect, useState } from 'react'
import { CATALOG, DEFAULT_ROOMS, catTitle, type CatalogTask } from '../lib/catalog'
import { useApp, type Task, type TaskInput } from '../lib/data'
import { xpOf } from '../lib/game'
import { roomGroups } from '../lib/homeLayout'
import { list, plural, t } from '../lib/i18n'
import { guess, room, ROOMS } from '../lib/rooms'
import { Chips, Segmented } from './Bits'
import { CatalogPicker } from './CatalogPicker'
import { Icon } from './Icon'
import { Sheet } from './Sheet'

const VAGUE_NL = /^(?:(?:de|het|hele)\s+)?(woonkamer|keuken|badkamer|slaapkamer|wc|toilet|hal|gang|zolder|werkkamer|kinderkamer|tuin|balkon|washok|huis|kamer|alles)\s+(opruimen|schoonmaken|doen|poetsen|bijhouden)$|^(opruimen|schoonmaken|poetsen|huishouden)$/i
const VAGUE_EN = /^(clean|tidy|tidy up|do|organize|organise)\s+(?:the\s+|whole\s+)?(living room|kitchen|bathroom|bedroom|toilet|hall|hallway|attic|office|study|kids'? room|garden|balcony|house|home|room|everything)$|^(clean|tidy|tidy up|chores|housework)$/i
const ROOM_HINTS: [RegExp, string][] = [
  [/woonkamer|living room/i, 'woonkamer'], [/keuken|kitchen/i, 'keuken'], [/badkamer|bathroom/i, 'badkamer'],
  [/slaapkamer|bedroom/i, 'slaapkamer'], [/wc|toilet/i, 'toilet'], [/hal|gang|hall/i, 'hal'],
  [/werkkamer|office|study/i, 'werkkamer'], [/kinderkamer|kids/i, 'kinderen'], [/tuin|garden/i, 'tuin'], [/balkon|balcony/i, 'balkon'],
]
function vagueSuggestions(title: string): CatalogTask[] | null {
  const s = title.trim()
  if (!s || (!VAGUE_NL.test(s) && !VAGUE_EN.test(s))) return null
  const groupId = ROOM_HINTS.find(([re]) => re.test(s))?.[1] ?? 'hele-huis'
  const group = CATALOG.find((g) => g.id === groupId) ?? CATALOG[0]
  return group.tasks.slice(0, 3)
}

const blank = (): TaskInput => ({ title: '', room: null, minutes: 10, recurrence: 'once', weekdays: [], interval_days: 7, assignee: null, due_date: null, effort: 2 })

export function TaskSheet({ open, onClose, task, onLogDone }: { open: boolean; onClose: () => void; task?: Task | null; onLogDone?: (t: Task) => void }) {
  const { d, act } = useApp()
  const [f, setF] = useState<TaskInput>(blank)
  const [touched, setTouched] = useState({ room: false, minutes: false })
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState<'lib' | 'own'>('lib')
  const [sel, setSel] = useState<Set<string>>(new Set())
  const existing = new Set(d.tasks.filter((x) => !x.archived && x.catalog_id).map((x) => x.catalog_id!))
  const existingTitles = new Set(d.tasks.filter((x) => !x.archived).map((x) => x.title.trim().toLowerCase()))
  const activeRooms = d.household.home_layout
    ? roomGroups(d.household.home_layout)
    : d.household.rooms?.length ? d.household.rooms : DEFAULT_ROOMS
  const roomChoices = ROOMS.filter((r) => r.id !== 'buiten')

  useEffect(() => {
    if (!open) return
    setF(task ? { ...task, interval_days: task.interval_days ?? 7 } : blank())
    setTouched({ room: !!task, minutes: !!task })
    setMode(task ? 'own' : 'lib'); setSel(new Set())
  }, [open, task])

  const set = (p: Partial<TaskInput>) => setF((x) => ({ ...x, ...p }))
  const onTitle = (title: string) => {
    const g = guess(title)
    set({ title, ...(!touched.room && { room: g.room }), ...(!touched.minutes && g.minutes && { minutes: g.minutes }) })
  }
  const valid = f.title.trim() && (f.recurrence !== 'weekly' || f.weekdays.length)
  const toggle = (c: CatalogTask) => setSel((s) => { const n = new Set(s); n.has(c.id) ? n.delete(c.id) : n.add(c.id); return n })

  async function save() {
    if (!valid) return
    setBusy(true)
    await act.saveTask({
      ...f, title: f.title.trim(),
      weekdays: f.recurrence === 'weekly' ? [...f.weekdays].sort() : [],
      interval_days: f.recurrence === 'interval' ? f.interval_days : null,
      due_date: f.recurrence === 'once' ? f.due_date : null,
    }, task?.id)
    setBusy(false); onClose()
  }
  async function addSelected() {
    setBusy(true)
    await act.addCatalog(CATALOG.flatMap((r) => r.tasks).filter((x) => sel.has(x.id) && !existing.has(x.id)))
    setBusy(false); onClose()
  }
  const days = list('days.short')

  return (
    <Sheet open={open} onClose={onClose} title={task ? t('task.edit') : t('task.new')}>
      {!task && <Segmented value={mode} onChange={setMode} options={[{ v: 'lib', label: t('task.fromLib') }, { v: 'own', label: t('task.own') }]} />}

      {mode === 'lib' && !task ? (
        <>
          <CatalogPicker rooms={activeRooms} selected={sel} onToggle={toggle} existing={existing} existingTitles={existingTitles} />
          <button className="btn primary block sticky-cta" onClick={addSelected} disabled={!sel.size || busy}>
            {busy ? <span className="spinner" /> : sel.size ? t('task.addN', { n: sel.size, tasks: plural(sel.size) }) : t('task.pickSome')}
          </button>
        </>
      ) : (
        <form style={{ display: 'flex', flexDirection: 'column', gap: 20 }} onSubmit={(e) => { e.preventDefault(); save() }}>
          <div>
            <input className="field big" autoFocus={!task} placeholder={t('task.placeholder')} value={f.title} onChange={(e) => onTitle(e.target.value)} enterKeyHint="done" aria-label={t('task.placeholder')} />
            {(() => {
              const tips = vagueSuggestions(f.title)
              if (!tips) return null
              return (
                <div className="vague-tip">
                  <div className="vague-tip-head"><Icon name="sparkle" size={16} /><span>{t('task.vagueTip')}</span></div>
                  <div className="vague-chips">
                    {tips.map((c) => (
                      <button key={c.id} type="button" className="vague-chip"
                        onClick={() => { setTouched({ room: true, minutes: true }); set({ title: catTitle(c), room: c.room, minutes: c.minutes, effort: c.effort }) }}>
                        {catTitle(c)}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>

          <div><span className="label">{t('task.room')}</span>
            <Chips value={f.room ?? ''} onChange={(v) => { setTouched((x) => ({ ...x, room: true })); set({ room: v || null }) }}
              options={roomChoices.map((r) => ({ v: r.id as string, label: room(r.id).label, icon: r.icon }))} /></div>

          <div><span className="label">{t('task.duration')}</span>
            <Chips value={f.minutes} onChange={(v) => { setTouched((x) => ({ ...x, minutes: true })); set({ minutes: v }) }}
              options={[5, 10, 15, 20, 30].map((v) => ({ v, label: `${v} ${t('common.min')}` }))} /></div>

          <div><span className="label">{t('task.effort')}</span>
            <Chips value={f.effort} onChange={(v) => set({ effort: v })}
              options={[{ v: 1, label: t('effort.1'), icon: 'feather' }, { v: 2, label: t('effort.2') }, { v: 3, label: t('effort.3'), icon: 'muscle' }]} />
            <p className="group-f" style={{ marginTop: 8 }}>{t('task.effortNote')} <b>+{xpOf(f.minutes, f.effort)} XP</b></p></div>

          <div><span className="label">{t('task.when')}</span>
            <Segmented value={f.recurrence} onChange={(v) => set({ recurrence: v })}
              options={[{ v: 'once', label: t('task.whenOnce') }, { v: 'weekly', label: t('task.whenWeekly') }, { v: 'interval', label: t('task.whenInterval') }]} />
            <div style={{ marginTop: 10 }}>
              {f.recurrence === 'weekly' && <Chips multi value={f.weekdays} options={days.map((l, v) => ({ v, label: l }))}
                onChange={(v) => set({ weekdays: f.weekdays.includes(v) ? f.weekdays.filter((x) => x !== v) : [...f.weekdays, v] })} />}
              {f.recurrence === 'interval' && <Chips value={f.interval_days ?? 7} onChange={(v) => set({ interval_days: v })}
                options={[2, 3, 7, 14, 30].map((v) => ({ v, label: v === 7 ? t('freq.weekly') : v === 14 ? t('freq.biweekly') : v === 30 ? t('freq.monthly') : t('freq.n', { n: v }) }))} />}
              {f.recurrence === 'once' && (
                <div className="list"><label className="row"><span className="row-main"><span className="row-title">{t('task.from')}</span>
                  {!f.due_date && <span className="row-sub">{t('task.asap')}</span>}</span>
                  <input type="date" className="field" style={{ width: 'auto' }} value={f.due_date ?? ''} onChange={(e) => set({ due_date: e.target.value || null })} /></label></div>
              )}
            </div></div>

          {d.members.length > 1 && <div><span className="label">{t('task.who')}</span>
            <Chips value={f.assignee ?? ''} onChange={(v) => set({ assignee: v || null })}
              options={[{ v: '', label: t('task.whoAuto') }, ...d.members.map((m) => ({ v: m.user_id, label: m.user_id === d.me.user_id ? t('common.you') : m.name }))]} /></div>}

          <button className="btn primary block" disabled={!valid || busy}>{busy ? <span className="spinner" /> : task ? t('common.save') : t('task.add')}</button>
          {task && onLogDone && <button type="button" className="btn tinted block" onClick={() => onLogDone(task)}>{t('task.logDone')}</button>}
          {task && <button type="button" className="btn ghost danger block" onClick={async () => { await act.archiveTask(task.id); onClose() }}>{t('task.delete')}</button>}
        </form>
      )}
    </Sheet>
  )
}
