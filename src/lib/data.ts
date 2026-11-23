import { createClient } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { SUPABASE_KEY, SUPABASE_URL } from '../config'
import { addDays, ensurePlan, fillPlan, localDate, type PlanItem, type Task } from '../../supabase/functions/_shared/planner'
import { flush } from './push'
import { lang, langChoice, setLang, t as tr } from './i18n'
import { hasChecks, recordCheck, saveRound, syncChecks } from './offlineRound'
import type { HomeLayout } from './homeLayout'
import { guess } from './rooms'
import { catalogRow, type CatalogTask } from './catalog'

export type { PlanItem, Task }
export const sb = createClient(SUPABASE_URL, SUPABASE_KEY)

export type Member = {
  user_id: string
  household_id: string
  name: string
  color: string
  arrive_token: string
  fallback_time: string | null
  snooze_until: string | null
  snooze_reason: string | null
  snooze_on_arrive: boolean
  timer_ends_at: string | null
  notify: Record<string, boolean>
  onboarded_at: string | null
}
export type Household = { home_layout?: HomeLayout | null; id: string; name: string; invite_code: string; block_minutes: number; rest_days: number[]; rooms: string[] | null; size: number }
export type Data = { me: Member; partner: Member | null; others: Member[]; solo: boolean; members: Member[]; household: Household; tasks: Task[]; items: PlanItem[]; xp: Record<string, number> }
export type TaskInput = Pick<Task, 'title' | 'room' | 'minutes' | 'recurrence' | 'weekdays' | 'interval_days' | 'assignee' | 'due_date' | 'effort'>

/** Laadt alles van het huishouden en blijft live in sync met de andere telefoon. */
export function useHousehold(userId: string) {
  const [data, setData] = useState<Data | null | undefined>(undefined)
  const [unavailable, setUnavailable] = useState(!navigator.onLine)
  const [syncError, setSyncError] = useState('')
  const revision = useRef(0)
  const hid = useRef<string | null>(null)

  const load = useCallback(async () => {
    const rev = ++revision.current
    if (!navigator.onLine) { setUnavailable(true); return }
    const { data: me, error } = await sb.from('members').select('*').eq('user_id', userId).maybeSingle()
    if (rev !== revision.current) return
    if (error) { setUnavailable(true); return }
    if (!me) { setUnavailable(false); return setData(null) }
    if (hasChecks(userId)) {
      try { await syncChecks(userId, me.household_id); setSyncError('') }
      catch { setSyncError(tr('offline.failed')); setUnavailable(true); return }
    }
    if (hid.current !== me.household_id) {
      hid.current = me.household_id
      await ensurePlan(sb, me.household_id, localDate())
    }
    const h = me.household_id
    const [hh, members, tasks, items, xpRows] = await Promise.all([
      sb.from('households').select('*').eq('id', h).single(),
      sb.from('members').select('*').eq('household_id', h).order('created_at'),
      sb.from('tasks').select('*').eq('household_id', h).order('created_at'),
      sb.from('plan_items').select('*').eq('household_id', h).gte('date', addDays(localDate(), -60)),
      sb.rpc('household_xp'),
    ])
    if (rev !== revision.current) return
    if (!hh.data || [hh, members, tasks, items, xpRows].some(result => result.error)) { setUnavailable(true); return }
    const xp: Record<string, number> = {}
    for (const r of (xpRows.data ?? []) as { user_id: string; xp: number }[]) xp[r.user_id] = Number(r.xp)
    const all = (members.data ?? []) as Member[]
    const snapshot: Data = {
      me: all.find((m) => m.user_id === userId) ?? me,
      partner: all.find((m) => m.user_id !== userId) ?? null,
      others: all.filter((m) => m.user_id !== userId),
      // Alleen wonen: geen huisgenoten-functies (tenzij er toch iemand is meegedaan).
      solo: (hh.data?.size ?? 2) === 1 && all.length <= 1,
      members: all,
      household: hh.data,
      tasks: tasks.data ?? [],
      items: items.data ?? [],
      xp,
    }
    saveRound(snapshot)
    setData(snapshot); setUnavailable(false); setSyncError('')
    // Taal synchroniseren: als dit apparaat op 'auto' staat (bijv. net op beginscherm gezet), neem de gekozen accounttaal over.
    const savedLang = (me as { lang?: string }).lang
    if (langChoice() === 'auto' && (savedLang === 'nl' || savedLang === 'en') && savedLang !== lang) setLang(savedLang)
    else if (savedLang !== lang) sb.from('members').update({ lang }).eq('user_id', userId).then(() => {})
  }, [userId])

  useEffect(() => {
    load()
    let t: ReturnType<typeof setTimeout>
    const soon = () => { clearTimeout(t); t = setTimeout(load, 150) }
    const ch = sb.channel('household')
    for (const table of ['households', 'members', 'tasks', 'plan_items']) {
      ch.on('postgres_changes', { event: '*', schema: 'public', table }, soon)
    }
    ch.subscribe()
    // Terug in de app (of nieuwe dag): plan van vandaag zeker maken en verversen.
    let day = localDate()
    const wake = async () => {
      if (document.visibilityState !== 'visible') return
      if (hid.current && day !== localDate()) { day = localDate(); await ensurePlan(sb, hid.current, day) }
      load()
    }
    const disconnect = () => { revision.current++; setUnavailable(true) }
    window.addEventListener('offline', disconnect)
    window.addEventListener('online', load)
    document.addEventListener('visibilitychange', wake)
    const iv = setInterval(wake, 60_000)
    return () => { revision.current++; window.removeEventListener('offline', disconnect); window.removeEventListener('online', load); sb.removeChannel(ch); document.removeEventListener('visibilitychange', wake); clearInterval(iv); clearTimeout(t) }
  }, [load])

  return { data, setData, load, unavailable, syncError }
}

// ——— Acties ———
export function actions(d: Data, setData: (fn: (d: Data) => Data) => void, reload: () => void) {
  const { me, others, household: hh } = d
  const notifyOthers = (title: string, body: string, tag: string) => others.forEach((o) => notify(o.user_id, title, body, tag))
  const today = localDate()
  const notify = async (userId: string, title: string, body: string, tag: string, sendAt?: Date) => {
    await sb.from('outbox').insert({ household_id: hh.id, user_id: userId, title, body, tag, send_at: (sendAt ?? new Date()).toISOString() })
    if (!sendAt) flush()
  }
  const clearOutbox = (tag: string) => sb.from('outbox').delete().eq('user_id', me.user_id).eq('tag', tag).is('sent_at', null)
  const patchMe = async (fields: Partial<Member>) => {
    setData((x) => ({ ...x, me: { ...x.me, ...fields } }))
    await sb.from('members').update(fields).eq('user_id', me.user_id)
  }
  const mine = () => d.items.filter((i) => i.date === today && i.user_id === me.user_id)

  return {
    async toggle(item: PlanItem) {
      const done = item.status !== 'done'
      const at = new Date().toISOString()
      setData((x) => ({ ...x, items: x.items.map((i) => i.id === item.id
        ? { ...i, status: done ? 'done' : 'todo', done_by: done ? me.user_id : null, done_at: done ? at : null }
        : i) }))
      if (item.user_id === me.user_id) {
        recordCheck(me.user_id, hh.id, item.id, item.done_at, done, at)
        if (!navigator.onLine) { reload(); return }
        try { await syncChecks(me.user_id, hh.id) } catch { reload(); return }
      } else {
        await sb.rpc('toggle_item', { item: item.id, done })
      }
      const rest = mine().filter((i) => i.id !== item.id && i.status !== 'done')
      if (done && item.user_id === me.user_id && !rest.length && others.length) {
        notifyOthers(tr('push.doneT', { name: me.name }), tr('push.doneB'), 'done')
      }
      reload()
    },
    async saveTask(input: TaskInput, id?: string) {
      if (id) {
        await sb.from('tasks').update(input).eq('id', id)
      } else {
        const { data: t } = await sb.from('tasks').insert({ ...input, household_id: hh.id }).select().single()
        if (t) await fillPlan(sb, hh.id, today, [t.id])
        if (t && others.length && input.assignee !== me.user_id) {
          notifyOthers(tr('push.taskT', { name: me.name }), tr('push.taskB', { title: t.title, min: t.minutes }), 'task')
        }
      }
      reload()
    },
    async archiveTask(id: string) {
      await sb.from('tasks').update({ archived: true }).eq('id', id)
      await sb.from('plan_items').delete().eq('task_id', id).eq('status', 'todo')
      reload()
    },
    async doNow(task: Task) {
      // Extraatje: zet hem op jouw lijst van vandaag.
      const existing = d.items.find((i) => i.date === today && i.task_id === task.id)
      if (existing) await sb.from('plan_items').update({ user_id: me.user_id }).eq('id', existing.id)
      else await sb.from('plan_items').insert({ household_id: hh.id, date: today, task_id: task.id, user_id: me.user_id, minutes: task.minutes, extra: true })
      reload()
    },
    /** Morgen / andere dag: taak van vandaag halen en pas vanaf die dag weer inplannen. */
    async postpone(item: PlanItem, days: number) {
      const to = addDays(today, days)
      setData((x) => ({ ...x, items: x.items.filter((i) => i.id !== item.id) }))
      await sb.from('tasks').update({ postponed_to: to }).eq('id', item.task_id)
      await sb.from('plan_items').delete().eq('id', item.id)
      reload()
    },
    /** Samen gedaan: telt voor allebei in de eerlijke verdeling. helperId = met wie (null = toch niet samen). */
    async together(item: PlanItem, helperId: string | null) {
      const helper = helperId && helperId === item.done_by ? me.user_id : helperId
      setData((x) => ({ ...x, items: x.items.map((i) => (i.id === item.id ? { ...i, helper } : i)) }))
      await sb.from('plan_items').update({ helper }).eq('id', item.id)
    },
    /** Taken uit de bibliotheek toevoegen en (waar er ruimte is) meteen inplannen. */
    async addCatalog(list: CatalogTask[]) {
      if (!list.length) return
      const { data } = await sb.from('tasks').insert(list.map((t) => catalogRow(t, hh.id))).select('id')
      if (data?.length) await fillPlan(sb, hh.id, today, data.map((r: { id: string }) => r.id))
      reload()
    },
    /** Nieuwe taak die je al gedaan hebt (uit "Al gedaan"). */
    async createForLog(title: string, repeat: boolean): Promise<Task | null> {
      const g = guess(title)
      const { data } = await sb.from('tasks').insert({
        household_id: hh.id, title, room: g.room ?? 'overig', minutes: g.minutes ?? 10,
        recurrence: repeat ? 'interval' : 'once', interval_days: repeat ? 7 : null,
      }).select().single()
      return data
    },
    /** "Al gedaan": telt mee, vinkt af als hij die dag gepland stond, en schuift de volgende keer op. */
    async logDone(task: Task, at: Date, withUser: string | null, minutes?: number) {
      await sb.rpc('log_done', { task: task.id, at: at.toISOString(), with_user: withUser, minutes: minutes ?? null })
      reload()
    },
    /** High five voor een klus van je huisgenoot. */
    async kudos(item: PlanItem, title: string) {
      if (item.kudos_at || !item.done_by || item.done_by === me.user_id) return
      setData((x) => ({ ...x, items: x.items.map((i) => (i.id === item.id ? { ...i, kudos_at: new Date().toISOString() } : i)) }))
      await sb.from('plan_items').update({ kudos_at: new Date().toISOString() }).eq('id', item.id)
      notify(item.done_by, tr('push.kudosT', { name: me.name }), tr('push.kudosB', { title }), 'kudos')
    },
    async startTimer(minutes: number) {
      const end = new Date(Date.now() + Math.round(minutes * 60_000))
      await patchMe({ timer_ends_at: end.toISOString() })
      await clearOutbox('timer')
      await notify(me.user_id, tr('push.timerT'), tr('push.timerB'), 'timer', end)
    },
    async stopTimer() {
      await patchMe({ timer_ends_at: null })
      await clearOutbox('timer')
    },
    async snooze(reason: string, when: 'arrive' | number | 'tomorrow') {
      await clearOutbox('snooze')
      if (when === 'tomorrow') {
        const t = new Date(addDays(today, 1) + 'T07:00:00')
        return patchMe({ snooze_reason: reason, snooze_on_arrive: false, snooze_until: t.toISOString() })
      }
      const at = new Date(Date.now() + (when === 'arrive' ? 3 : when) * 3600_000)
      await patchMe({ snooze_reason: reason, snooze_on_arrive: when === 'arrive', snooze_until: when === 'arrive' ? null : at.toISOString() })
      // Ook bij "als ik thuiskom" na 3 uur een reserve-herinnering, voor als het thuiskom-signaal niet komt.
      await notify(me.user_id, tr('push.snoozeT'), '', 'snooze', at)
    },
    async unsnooze() {
      await clearOutbox('snooze')
      await patchMe({ snooze_reason: null, snooze_on_arrive: false, snooze_until: null })
    },
    async askSwap(item: PlanItem, title: string, toId: string) {
      await sb.from('plan_items').update({ swap_to: toId }).eq('id', item.id)
      notify(toId, tr('push.swapT', { name: me.name }), tr('push.swapB', { title, min: item.minutes }), 'swap')
      reload()
    },
    async answerSwap(item: PlanItem, title: string, yes: boolean) {
      await sb.from('plan_items').update(yes ? { swap_to: null, user_id: me.user_id } : { swap_to: null }).eq('id', item.id)
      notify(item.user_id, tr(yes ? 'push.yesT' : 'push.noT', { name: me.name }), tr(yes ? 'push.yesB' : 'push.noB', { title, name: me.name }), 'swap')
      reload()
    },
    patchMe,
    reload,
    async patchHousehold(fields: Partial<Household>) {
      setData((x) => ({ ...x, household: { ...x.household, ...fields } }))
      await sb.from('households').update(fields).eq('id', hh.id)
    },
    testPush: () => notify(me.user_id, tr('push.testT'), tr('push.testB'), 'test'),
  }
}
export type Actions = ReturnType<typeof actions>

export const Ctx = createContext<{ d: Data; act: Actions }>(null!)
export const useApp = () => useContext(Ctx)
