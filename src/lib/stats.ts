import { addDays, daysBetween, dueSince, localDate, points, weekday } from '../../supabase/functions/_shared/planner'
import type { Data } from './data'
import { ROOMS } from './rooms'
import type { TKey } from './i18n'

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

/** Dagen op rij dat jullie je opruimronde hebben afgemaakt. Rustdagen en lege dagen tellen niet mee en breken niks. */
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

/** Inzet deze week per persoon: minuten en punten (minuten × zwaarte). Samen gedaan telt voor allebei. */
export function weekEffort(d: Data) {
  const from = weekStart()
  const out: Record<string, { min: number; pts: number }> = {}
  for (const i of d.items) {
    if (i.status !== 'done' || !i.done_at || localDate(i.done_at) < from) continue
    const effort = d.tasks.find((t) => t.id === i.task_id)?.effort
    for (const id of [i.done_by, i.helper]) {
      if (!id) continue
      const o = (out[id] ??= { min: 0, pts: 0 })
      o.min += i.minutes
      o.pts += points(i.minutes, effort)
    }
  }
  return out
}

/** Taken die al minstens een dag liggen te wachten. */
export function overdue(d: Data) {
  const today = localDate()
  return d.tasks
    .map((t) => ({ t, since: dueSince(t, today) }))
    .filter((x): x is { t: Data['tasks'][number]; since: string } => !!x.since && x.since < today)
    .map((x) => ({ ...x, days: daysBetween(x.since, today) }))
    .sort((a, b) => b.days - a.days)
}

/** Hoe staat het huis ervoor? 100% = alles bij. Per taak zakt het per dag dat hij te laat is. */
export function roomScores(d: Data) {
  const today = localDate()
  const taskScore = (t: Data['tasks'][number]) => {
    const since = dueSince(t, today)
    return since && since < today ? Math.max(0, 1 - daysBetween(since, today) * 0.25) : 1
  }
  const active = d.tasks.filter((t) => !t.archived)
  const rooms = ROOMS.map((r) => {
    const ts = active.filter((t) => (t.room ?? 'overig') === r.id)
    return { ...r, count: ts.length, score: ts.length ? ts.reduce((s, t) => s + taskScore(t), 0) / ts.length : 1 }
  }).filter((r) => r.count)
  const total = active.length ? active.reduce((s, t) => s + taskScore(t), 0) / active.length : 1
  return { rooms, total }
}

export type Score = { pts: number; min: number; count: number }
/** Scorebord tussen twee datums (incl. from, excl. to). Samen gedaan telt voor allebei. */
export function scores(d: Data, from: string, to: string) {
  const out: Record<string, Score> = {}
  for (const m of d.members) out[m.user_id] = { pts: 0, min: 0, count: 0 }
  for (const i of d.items) {
    if (i.status !== 'done' || !i.done_at) continue
    const day = localDate(i.done_at)
    if (day < from || day >= to) continue
    const effort = d.tasks.find((t) => t.id === i.task_id)?.effort
    for (const id of [i.done_by, i.helper]) {
      if (!id || !out[id]) continue
      out[id].pts += points(i.minutes, effort)
      out[id].min += i.minutes
      out[id].count++
    }
  }
  return out
}

/** Alles wat deze week gedaan is, nieuwste eerst. */
export function feed(d: Data, from = weekStart()) {
  return d.items
    .filter((i) => i.status === 'done' && i.done_at && localDate(i.done_at) >= from)
    .sort((a, b) => b.done_at!.localeCompare(a.done_at!))
}

export type Badge = { icon: string; title: TKey; text: TKey; have: number; need: number }
/** Persoonlijke badges (laatste 60 dagen + niveau). */
export function badges(d: Data, userId: string, level = 1): Badge[] {
  const mine = d.items.filter((i) => i.status === 'done' && (i.done_by === userId || i.helper === userId))
  const task = (id: string) => d.tasks.find((t) => t.id === id)
  const weekAgo = addDays(localDate(), -6)
  const daysThisWeek = new Set(mine.filter((i) => localDate(i.done_at!) >= weekAgo).map((i) => localDate(i.done_at!))).size
  const weekMin = mine.filter((i) => localDate(i.done_at!) >= weekStart()).reduce((s, i) => s + i.minutes, 0)
  const list: Badge[] = [
    { icon: 'check-circle', title: 'b.first', text: 'b.firstSub', have: Math.min(mine.length, 1), need: 1 },
    { icon: 'flame', title: 'b.week', text: 'b.weekSub', have: daysThisWeek, need: 7 },
    { icon: 'muscle', title: 'b.heavy', text: 'b.heavySub', have: mine.filter((i) => task(i.task_id)?.effort === 3).length, need: 5 },
    { icon: 'was', title: 'b.laundry', text: 'b.laundrySub', have: mine.filter((i) => task(i.task_id)?.room === 'was').length, need: 10 },
    { icon: 'star', title: 'b.self', text: 'b.selfSub', have: mine.filter((i) => i.extra && i.done_by === userId).length, need: 5 },
    { icon: 'hourglass', title: 'b.hour', text: 'b.hourSub', have: weekMin, need: 60 },
    { icon: 'crown', title: 'b.level5', text: 'b.level5Sub', have: level, need: 5 },
  ]
  if (d.others.length) list.splice(5, 0,
    { icon: 'duo', title: 'b.team', text: 'b.teamSub', have: mine.filter((i) => i.helper).length, need: 5 },
    { icon: 'clap', title: 'b.kudos', text: 'b.kudosSub', have: mine.filter((i) => i.kudos_at && i.done_by === userId).length, need: 5 })
  return list.map((b) => ({ ...b, have: Math.min(b.have, b.need) }))
}

/** Adaptief voorstel van Bas na minstens 5 actieve dagen in de app. */
export function adaptiveRoundTip(d: Data): { kind: 'up' | 'down'; suggested: number; current: number } | null {
  const days = new Set(d.items.map((i) => i.date))
  if (days.size < 5) return null
  const current = d.household.block_minutes
  const late = overdue(d).length
  if (late >= 3 && current < 30) return { kind: 'up', suggested: Math.min(30, current + 5), current }
  const today = localDate()
  let cleanStreak = 0
  for (let i = 1; i <= 7; i++) {
    const st = dayState(d, addDays(today, -i))
    if (st === 'done') cleanStreak++
    else if (st === 'partial' || st === 'missed') break
  }
  if (cleanStreak >= 5 && late === 0 && current > 10) return { kind: 'down', suggested: Math.max(10, current - 5), current }
  return null
}
