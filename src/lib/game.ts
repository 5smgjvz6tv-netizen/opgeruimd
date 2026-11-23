// Spelregels: XP, niveaus en de weekuitdaging.
import { addDays, localDate, points } from '../../supabase/functions/_shared/planner'
import type { Data } from './data'
import { list, t, type TKey } from './i18n'
import { dayState, weekStart } from './stats'

/** Niveau n begint bij 50·n·(n−1)/2 XP: 0, 50, 150, 300, 500, 750 … (elk niveau 50 XP meer). */
export function levelOf(xp: number) {
  let n = 1
  while (50 * n * (n + 1) / 2 <= xp) n++
  const start = 50 * n * (n - 1) / 2, next = 50 * n * (n + 1) / 2
  const titles = list('level.titles')
  return { n, title: titles[Math.min(n, titles.length) - 1], start, next, into: xp - start, need: next - start, frac: (xp - start) / (next - start) }
}

type Ch = { id: string; title: TKey; sub: TKey; icon: string; goal: number; count: (d: Data, uid: string, from: string) => number }
const doneThisWeek = (d: Data, uid: string, from: string) =>
  d.items.filter((i) => i.status === 'done' && i.done_at && localDate(i.done_at) >= from && (i.done_by === uid || i.helper === uid))
const roomOf = (d: Data, taskId: string) => d.tasks.find((x) => x.id === taskId)?.room
const CHALLENGES: Ch[] = [
  { id: 'ring', title: 'ch.ring', sub: 'ch.ringSub', icon: 'check-circle', goal: 5,
    count: (d, _u, from) => Array.from({ length: 7 }, (_, i) => addDays(from, i)).filter((day) => dayState(d, day) === 'done').length },
  { id: 'bath', title: 'ch.bath', sub: 'ch.bathSub', icon: 'badkamer', goal: 3,
    count: (d, u, from) => doneThisWeek(d, u, from).filter((i) => ['badkamer', 'toilet'].includes(roomOf(d, i.task_id) ?? '')).length },
  { id: 'heavy', title: 'ch.heavy', sub: 'ch.heavySub', icon: 'muscle', goal: 3,
    count: (d, u, from) => doneThisWeek(d, u, from).filter((i) => d.tasks.find((x) => x.id === i.task_id)?.effort === 3).length },
  { id: 'kitchen', title: 'ch.kitchen', sub: 'ch.kitchenSub', icon: 'keuken', goal: 5,
    count: (d, u, from) => doneThisWeek(d, u, from).filter((i) => roomOf(d, i.task_id) === 'keuken').length },
  { id: 'bonus', title: 'ch.bonus', sub: 'ch.bonusSub', icon: 'star', goal: 3,
    count: (d, u, from) => doneThisWeek(d, u, from).filter((i) => i.extra && i.done_by === u).length },
  { id: 'hour', title: 'ch.hour', sub: 'ch.hourSub', icon: 'hourglass', goal: 60,
    count: (d, u, from) => doneThisWeek(d, u, from).reduce((s, i) => s + i.minutes, 0) },
]

/** Elke week een andere uitdaging (vast per week, voor iedereen in huis dezelfde). */
export function weeklyChallenge(d: Data) {
  const from = weekStart()
  const week = Math.floor(Date.parse(from + 'T12:00:00Z') / (7 * 864e5))
  const c = CHALLENGES[week % CHALLENGES.length]
  const have = Math.min(c.goal, c.count(d, d.me.user_id, from))
  return { ...c, have, done: have >= c.goal, frac: have / c.goal }
}

/** XP van een taak (zelfde formule als de server). */
export const xpOf = (minutes: number, effort?: number) => points(minutes, effort)
export const tt = t
