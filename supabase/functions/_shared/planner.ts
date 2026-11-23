// Slimme dagplanner — gedeeld door de app (browser) en de server (Deno edge functions).
// Geen imports, zodat het in beide omgevingen werkt.

export type Recurrence = 'once' | 'weekly' | 'interval'
export type Task = {
  id: string
  household_id: string
  title: string
  room: string | null
  minutes: number
  recurrence: Recurrence
  weekdays: number[] // 0 = maandag … 6 = zondag
  interval_days: number | null
  assignee: string | null
  due_date: string | null
  last_done_at: string | null
  archived: boolean
  effort: number // 1 = licht, 2 = normaal, 3 = zwaar
  postponed_to: string | null
  created_at: string
}
export type PlanItem = {
  id: string
  household_id: string
  date: string
  task_id: string
  user_id: string
  minutes: number
  status: 'todo' | 'done'
  done_at: string | null
  done_by: string | null
  extra: boolean
  swap_to: string | null
  helper: string | null
}

export const TZ = 'Europe/Amsterdam'
export const MAX_ITEMS = 6
/** Zwaarte telt mee in de eerlijke verdeling: punten = minuten × factor. */
export const EFFORT = { 1: 0.75, 2: 1, 3: 1.5 } as Record<number, number>
export const points = (minutes: number, effort = 2) => Math.round(minutes * (EFFORT[effort] ?? 1))

const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' })
export const localDate = (d: Date | string = new Date()) => fmt.format(typeof d === 'string' ? new Date(d) : d)
export const addDays = (date: string, n: number) => {
  const d = new Date(date + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
export const weekday = (date: string) => (new Date(date + 'T12:00:00Z').getUTCDay() + 6) % 7
export const daysBetween = (a: string, b: string) =>
  Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 864e5)

/** Sinds welke datum is deze taak "aan de beurt" (op of vóór `date`)? null = niet nodig. */
export function dueSince(t: Task, date: string): string | null {
  if (t.archived) return null
  if (t.postponed_to && t.postponed_to > date) return null // verzet naar later
  const last = t.last_done_at ? localDate(t.last_done_at) : null
  const created = localDate(t.created_at)
  if (t.recurrence === 'once') {
    if (last) return null
    const from = t.due_date ?? created
    return from <= date ? from : null
  }
  if (t.recurrence === 'interval') {
    const from = last ? addDays(last, t.interval_days ?? 7) : created
    return from <= date ? from : null
  }
  for (let i = 0; i < 7; i++) {
    const d = addDays(date, -i)
    if (!t.weekdays.includes(weekday(d))) continue
    if (d < created) return null
    // 1 dag speling: gisteren al vooruit gedaan telt ook.
    return last && last >= addDays(d, -1) ? null : d
  }
  return null
}

function score(t: Task, since: string, date: string) {
  const late = Math.min(daysBetween(since, date), 7) // achterstand telt mee, maar overheerst niet
  return late + (t.recurrence === 'weekly' && late === 0 ? 10 : 0) + (t.recurrence === 'once' ? 1 : 0)
}

/**
 * Verdeel wat vandaag aan de beurt is over de huisgenoten, in blokjes van ±block minuten.
 * Wat niet past, schuift vanzelf door naar een volgende dag (het blijft "aan de beurt").
 */
export function planDay(opts: {
  date: string
  tasks: Task[]
  members: { user_id: string }[]
  blockMinutes: number
  restDays: number[]
  weekLoad: Record<string, number>
  existing: Pick<PlanItem, 'task_id' | 'user_id' | 'minutes'>[]
}): { task_id: string; user_id: string; minutes: number }[] {
  const { date, tasks, members, blockMinutes, restDays, weekLoad, existing } = opts
  if (!members.length || restDays.includes(weekday(date))) return []
  const taken = new Set(existing.map((e) => e.task_id))
  const effortOf = new Map(tasks.map((t) => [t.id, t.effort]))
  const load: Record<string, { min: number; pts: number; n: number }> = {}
  for (const m of members) load[m.user_id] = { min: 0, pts: 0, n: 0 }
  for (const e of existing) {
    const l = load[e.user_id]
    if (l) { l.min += e.minutes; l.pts += points(e.minutes, effortOf.get(e.task_id)); l.n++ }
  }

  const fits = (id: string, minutes: number) => {
    const l = load[id]
    return !!l && l.n < MAX_ITEMS && (l.n === 0 || l.min + minutes <= blockMinutes + 2)
  }
  // Wie (deze week en vandaag) minder zware punten heeft, krijgt de volgende taak.
  const weight = (id: string) => load[id].pts + (weekLoad[id] ?? 0) / 4

  const due = tasks
    .map((t) => ({ t, since: dueSince(t, date) }))
    .filter((x): x is { t: Task; since: string } => !!x.since && !taken.has(x.t.id))
    .sort((a, b) => score(b.t, b.since, date) - score(a.t, a.since, date) || a.t.created_at.localeCompare(b.t.created_at))

  // Grote klussen (langer dan een blokje) pas als ze al een paar dagen wachten, en alleen als iemand nog niks heeft.
  const big = (t: Task, since: string) => t.minutes > blockMinutes && daysBetween(since, date) < 3
  const ordered = [...due.filter((x) => !big(x.t, x.since)), ...due.filter((x) => big(x.t, x.since))]
  const out: { task_id: string; user_id: string; minutes: number }[] = []
  for (const { t } of ordered) {
    const who = t.assignee && load[t.assignee]
      ? (fits(t.assignee, t.minutes) ? t.assignee : null)
      : members.map((m) => m.user_id).filter((id) => fits(id, t.minutes)).sort((a, b) => weight(a) - weight(b))[0] ?? null
    if (!who) continue
    load[who].min += t.minutes
    load[who].pts += points(t.minutes, t.effort)
    load[who].n++
    out.push({ task_id: t.id, user_id: who, minutes: t.minutes })
  }
  return out
}

/** Kleine extraatjes die in de resterende tijd passen: wat nu of morgen aan de beurt is. */
export function suggestExtras(tasks: Task[], date: string, planned: Set<string>, minutesLeft: number) {
  const tomorrow = addDays(date, 1)
  return tasks
    .map((t) => ({ t, since: dueSince(t, tomorrow) }))
    .filter((x) => x.since && !planned.has(x.t.id) && x.t.minutes <= Math.max(minutesLeft, 5))
    .sort((a, b) => score(b.t, b.since!, tomorrow) - score(a.t, a.since!, tomorrow))
    .slice(0, 3)
    .map((x) => x.t)
}

// ——— Database-helpers (werken met elke supabase-js client) ———
// deno-lint-ignore no-explicit-any
type Db = any

/** Vul de planning van `date` aan. Met `only` alleen die taken (bijv. een net toegevoegde). */
export async function fillPlan(db: Db, householdId: string, date: string, only?: string[]) {
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString()
  const [hh, members, tasks, existing, done] = await Promise.all([
    db.from('households').select('block_minutes, rest_days').eq('id', householdId).single(),
    db.from('members').select('user_id').eq('household_id', householdId),
    db.from('tasks').select('*').eq('household_id', householdId).eq('archived', false),
    db.from('plan_items').select('task_id, user_id, minutes').eq('household_id', householdId).eq('date', date),
    db.from('plan_items').select('done_by, helper, minutes, tasks(effort)').eq('household_id', householdId).eq('status', 'done').gte('done_at', weekAgo),
  ])
  if (hh.error || !hh.data) return
  const weekLoad: Record<string, number> = {}
  for (const r of done.data ?? []) {
    const p = points(r.minutes, r.tasks?.effort)
    for (const id of [r.done_by, r.helper]) if (id) weekLoad[id] = (weekLoad[id] ?? 0) + p
  }
  const pool = (tasks.data ?? []) as Task[]
  const rows = planDay({
    date,
    tasks: only ? pool.filter((t) => only.includes(t.id)) : pool,
    members: members.data ?? [],
    blockMinutes: hh.data.block_minutes,
    restDays: hh.data.rest_days ?? [],
    weekLoad,
    existing: existing.data ?? [],
  }).map((r) => ({ ...r, household_id: householdId, date }))
  if (rows.length) await db.from('plan_items').upsert(rows, { onConflict: 'date,task_id', ignoreDuplicates: true })
}

/** Maak de dagplanning één keer per dag (wie het eerst komt, maalt het eerst). */
export async function ensurePlan(db: Db, householdId: string, date: string) {
  const { data } = await db
    .from('plan_days')
    .upsert({ household_id: householdId, date }, { onConflict: 'household_id,date', ignoreDuplicates: true })
    .select()
  if (data?.length) await fillPlan(db, householdId, date)
  return !!data?.length
}
