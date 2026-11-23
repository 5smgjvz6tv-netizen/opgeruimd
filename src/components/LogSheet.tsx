import { useEffect, useMemo, useState } from 'react'
import { addDays, dueSince, localDate, nextDue } from '../../supabase/functions/_shared/planner'
import { useApp, type Task } from '../lib/data'
import { haptic, sound } from '../lib/feel'
import { xpOf } from '../lib/game'
import { list, locale, t } from '../lib/i18n'
import { guess, room } from '../lib/rooms'
import { Chips, Confetti, Ic, Switch } from './Bits'
import { Icon } from './Icon'
import { Sheet } from './Sheet'

export const niceDate = (date: string) => {
  const diff = Math.round((Date.parse(date) - Date.parse(localDate())) / 864e5)
  if (diff === 0) return t('common.today').toLowerCase()
  if (diff === 1) return t('common.tomorrow').toLowerCase()
  if (diff > 1 && diff < 7) return list('days.long')[(new Date(date + 'T12:00:00Z').getUTCDay() + 6) % 7]
  return new Date(date + 'T12:00:00').toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short' })
}

/** "Al gedaan": iets loggen wat je buiten de app om hebt opgeruimd. */
export function LogSheet({ open, onClose, preset }: { open: boolean; onClose: () => void; preset?: Task | null }) {
  const { d, act } = useApp()
  const today = localDate()
  const [q, setQ] = useState('')
  const [pick, setPick] = useState<Task | null>(null)
  const [when, setWhen] = useState(0)
  const [withId, setWithId] = useState<string | null>(null)
  const [repeat, setRepeat] = useState(false)
  const [mins, setMins] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<{ title: string; next: string | null; xp: number } | null>(null)

  useEffect(() => {
    if (!open) return
    setQ(''); setPick(preset ?? null); setWhen(0); setWithId(null); setRepeat(false); setMins(null); setDone(null)
  }, [open, preset])

  const tasks = useMemo(() => {
    const f = q.trim().toLowerCase()
    return d.tasks.filter((x) => !x.archived)
      .filter((x) => !f || x.title.toLowerCase().includes(f) || room(x.room).label.toLowerCase().includes(f))
      .map((x) => ({ x, due: !!dueSince(x, addDays(today, 2)) }))
      .sort((a, b) => Number(b.due) - Number(a.due) || a.x.title.localeCompare(b.x.title)).map((y) => y.x)
  }, [d.tasks, q, today])

  const newTitle = q.trim()
  const canNew = !pick && newTitle.length > 1 && !tasks.some((x) => x.title.toLowerCase() === newTitle.toLowerCase())
  const minutes = mins ?? pick?.minutes ?? guess(newTitle).minutes ?? 10
  const xp = xpOf(minutes, pick?.effort ?? 2)
  const dayLabels = list('days.long')

  async function save() {
    setBusy(true)
    const date = addDays(today, -when)
    const at = when === 0 ? new Date() : new Date(date + 'T12:00:00')
    const task = pick ?? await act.createForLog(newTitle, repeat)
    if (!task) { setBusy(false); return }
    await act.logDone(task, at, withId, minutes)
    sound('done'); haptic([10, 60, 20])
    setDone({ title: task.title, next: nextDue({ ...task, last_done_at: at.toISOString(), archived: task.recurrence === 'once' }, addDays(today, 1)), xp })
    setBusy(false)
    setTimeout(onClose, 1800)
  }

  return (
    <Sheet open={open} onClose={onClose} title={t('log.title')}>
      {done ? (
        <div className="levelup">
          <Confetti />
          <span className="big" style={{ fontSize: 22 }}>+{done.xp}</span>
          <h2>{t('log.saved')}</h2>
          <p className="muted">{done.title}{done.next ? ` · ${t('log.next', { when: niceDate(done.next) })}` : ''}</p>
        </div>
      ) : (
        <>
          <p className="group-f">{t('log.intro')}</p>
          {pick ? (
            <div className="list"><button className="row" onClick={() => setPick(null)}>
              <Ic name={room(pick.room).icon} /><span className="row-main"><span className="row-title">{pick.title}</span><span className="row-sub">{t('log.change')}</span></span>
              <Icon name="x" size={16} /></button></div>
          ) : (
            <div className="group">
              <div className="search"><Icon name="search" size={18} />
                <input className="field" placeholder={t('log.what')} value={q} onChange={(e) => setQ(e.target.value)} autoFocus={!preset} /></div>
              <div className="list" style={{ maxHeight: '34dvh', overflowY: 'auto' }}>
                {canNew && <div className="row"><Ic name="plus" /><span className="row-main"><span className="row-title">{newTitle}</span><span className="row-sub">{t('log.new')}</span></span></div>}
                {tasks.slice(0, 30).map((x) => (
                  <button key={x.id} className="row" onClick={() => setPick(x)}>
                    <Ic name={room(x.room).icon} /><span className="row-main"><span className="row-title">{x.title}</span><span className="row-sub">{room(x.room).label}<span className="sep" />{x.minutes} {t('common.min')}</span></span>
                    <span className="chev"><Icon name="chevron" size={16} /></span>
                  </button>
                ))}
              </div>
              {canNew && <div className="list"><label className="row"><span className="row-main"><span className="row-title">{t('log.repeat')}</span></span><Switch on={repeat} onChange={setRepeat} label={t('log.repeat')} /></label></div>}
            </div>
          )}

          <div><span className="label">{t('log.duration')}</span>
            <Chips value={minutes} onChange={setMins} options={[5, 10, 15, 20, 30, 45, 60].map((v) => ({ v, label: `${v} ${t('common.min')}` }))} /></div>
          <div><span className="label">{t('log.when')}</span>
            <Chips value={when} onChange={setWhen} options={[0, 1, 2, 3, 4, 5, 6].map((n) => {
              const raw = dayLabels[(new Date(addDays(today, -n) + 'T12:00:00Z').getUTCDay() + 6) % 7]
              return { v: n, label: n === 0 ? t('common.today') : n === 1 ? t('common.yesterday') : raw[0].toUpperCase() + raw.slice(1) }
            })} /></div>
          {d.others.length > 0 && <div className="list">{d.others.map((o) => (
            <label key={o.user_id} className="row"><span className="row-main"><span className="row-title">{t('log.with', { name: o.name })}</span></span>
              <Switch on={withId === o.user_id} onChange={(v) => setWithId(v ? o.user_id : null)} label={t('log.with', { name: o.name })} /></label>
          ))}</div>}
          <button className="btn primary block" onClick={save} disabled={busy || (!pick && !canNew)}>
            {busy ? <span className="spinner" /> : <>{t('common.save')} <span className="xp-chip">+{xp} XP</span></>}
          </button>
        </>
      )}
    </Sheet>
  )
}
