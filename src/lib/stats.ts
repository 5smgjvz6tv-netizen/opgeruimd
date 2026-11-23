import { addDays, daysBetween, dueSince, localDate, weekday } from '../../supabase/functions/_shared/planner'
import type { Data } from './data'
import { ROOMS } from './rooms'

export type DayState = 'done' | 'partial' | 'missed' | 'rest' | 'empty' | 'future'

export function dayState(d: Data, date: string): DayState {
  const today = localDate()
  if (date > today) return d.household.rest_days.includes(weekday(date)) ? 'rest' : 'future'
  if (d.household.rest_days.includes(weekday(date))) return 'rest'
  const items = d.items.filter((i) => i.date === date)
  if (!items.length) return 'empty'
  const done = items.filter((i) => i.status === 'done').length
  if (done === items.length) return 'done'
  if (date === today) return done ? 'partial' : 'future'
  return done ? 'partial' : 'missed'
}

/** Dagen op rij dat jullie je blokje hebben afgemaakt. Rustdagen en lege dagen tellen niet mee en breken niks. */
export function streak(d: Data) {
  const today = localDate()
  let n = dayState(d, today) === 'done' ? 1 : 0
  for (let i = 1; i <= 60; i++) {
    const s = dayState(d, addDays(today, -i))
    if (s === 'done') n++
    else if (s === 'partial' || s === 'missed') break
  }
  return n
}

export const weekStart = (date = localDate()) => addDays(date, -weekday(date))

export function weekMinutes(d: Data) {
  const from = weekStart()
  const out: Record<string, number> = {}
  for (const i of d.items) {
    if (i.status === 'done' && i.done_by && i.done_at && localDate(i.done_at) >= from) {
      out[i.done_by] = (out[i.done_by] ?? 0) + i.minutes
    }
  }
  return out
}

/** Hoe staat het huis ervoor? 100% = alles bij. Per taak zakt het per dag dat hij te laat is. */
export function roomScores(d: Data) {
  const today = localDate()
  const taskScore = (t: Data['tasks'][number]) => {
    const since = dueSince(t, today)
    return since ? Math.max(0, 0.75 - daysBetween(since, today) * 0.25) : 1
  }
  const active = d.tasks.filter((t) => !t.archived)
  const rooms = ROOMS.map((r) => {
    const ts = active.filter((t) => (t.room ?? 'overig') === r.id)
    return { ...r, count: ts.length, score: ts.length ? ts.reduce((s, t) => s + taskScore(t), 0) / ts.length : 1 }
  }).filter((r) => r.count)
  const total = active.length ? active.reduce((s, t) => s + taskScore(t), 0) / active.length : 1
  return { rooms, total }
}
