import { createClient } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { SUPABASE_KEY, SUPABASE_URL } from '../config'
import { addDays, ensurePlan, fillPlan, localDate, type PlanItem, type Task } from '../../supabase/functions/_shared/planner'
import { flush } from './push'

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
}
export type Household = { id: string; name: string; invite_code: string; block_minutes: number; rest_days: number[] }
export type Data = { me: Member; partner: Member | null; members: Member[]; household: Household; tasks: Task[]; items: PlanItem[] }
export type TaskInput = Pick<Task, 'title' | 'room' | 'minutes' | 'recurrence' | 'weekdays' | 'interval_days' | 'assignee' | 'due_date'>

/** Laadt alles van het huishouden en blijft live in sync met de andere telefoon. */
export function useHousehold(userId: string) {
  const [data, setData] = useState<Data | null | undefined>(undefined)
  const hid = useRef<string | null>(null)

  const load = useCallback(async () => {
    const { data: me } = await sb.from('members').select('*').eq('user_id', userId).maybeSingle()
    if (!me) return setData(null)
    if (hid.current !== me.household_id) {
      hid.current = me.household_id
      await ensurePlan(sb, me.household_id, localDate())
    }
    const h = me.household_id
    const [hh, members, tasks, items] = await Promise.all([
      sb.from('households').select('*').eq('id', h).single(),
      sb.from('members').select('*').eq('household_id', h).order('created_at'),
      sb.from('tasks').select('*').eq('household_id', h).order('created_at'),
      sb.from('plan_items').select('*').eq('household_id', h).gte('date', addDays(localDate(), -60)),
    ])
    const all = (members.data ?? []) as Member[]
    setData({
      me: all.find((m) => m.user_id === userId) ?? me,
      partner: all.find((m) => m.user_id !== userId) ?? null,
      members: all,
      household: hh.data,
      tasks: tasks.data ?? [],
      items: items.data ?? [],
    })
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
    document.addEventListener('visibilitychange', wake)
    const iv = setInterval(wake, 60_000)
    return () => { sb.removeChannel(ch); document.removeEventListener('visibilitychange', wake); clearInterval(iv); clearTimeout(t) }
  }, [load])

  return { data, setData, load }
}

// ——— Acties ———
export function actions(d: Data, setData: (fn: (d: Data) => Data) => void, reload: () => void) {
  const { me, partner, household: hh } = d
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
      setData((x) => ({ ...x, items: x.items.map((i) => i.id === item.id
        ? { ...i, status: done ? 'done' : 'todo', done_by: done ? me.user_id : null, done_at: done ? new Date().toISOString() : null }
        : i) }))
      await sb.rpc('toggle_item', { item: item.id, done })
      const rest = mine().filter((i) => i.id !== item.id && i.status !== 'done')
      if (done && item.user_id === me.user_id && !rest.length && partner) {
        notify(partner.user_id, `${me.name} is klaar voor vandaag 💪`, 'Alle taakjes zijn afgevinkt.', 'done')
      }
      reload()
    },
    async saveTask(input: TaskInput, id?: string) {
      if (id) {
        await sb.from('tasks').update(input).eq('id', id)
      } else {
        const { data: t } = await sb.from('tasks').insert({ ...input, household_id: hh.id }).select().single()
        if (t) await fillPlan(sb, hh.id, today, [t.id])
        if (t && partner && input.assignee !== me.user_id) {
          notify(partner.user_id, `${me.name} heeft een taak toegevoegd`, `${t.title} (±${t.minutes} min). Ik plan hem slim in.`, 'task')
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
    async startTimer(minutes: number) {
      const end = new Date(Date.now() + minutes * 60_000)
      await patchMe({ timer_ends_at: end.toISOString() })
      await clearOutbox('timer')
      await notify(me.user_id, 'Tijd is om! ⏰', 'Je blokje zit erop. Goed bezig! Vink af wat je gedaan hebt.', 'timer', end)
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
      await notify(me.user_id, 'Heb je nu even 15 minuten? 🙂', '', 'snooze', at)
    },
    async unsnooze() {
      await clearOutbox('snooze')
      await patchMe({ snooze_reason: null, snooze_on_arrive: false, snooze_until: null })
    },
    async askSwap(item: PlanItem, title: string) {
      if (!partner) return
      await sb.from('plan_items').update({ swap_to: partner.user_id }).eq('id', item.id)
      notify(partner.user_id, `${me.name} vraagt of jij iets kunt overnemen`, `${title} (±${item.minutes} min). Open de app om ja of nee te zeggen.`, 'swap')
      reload()
    },
    async answerSwap(item: PlanItem, title: string, yes: boolean) {
      await sb.from('plan_items').update(yes ? { swap_to: null, user_id: me.user_id } : { swap_to: null }).eq('id', item.id)
      notify(item.user_id, yes ? `${me.name} neemt het over 👍` : `${me.name} kan het nu niet`, yes ? `${title} staat nu bij ${me.name}.` : `${title} blijft bij jou.`, 'swap')
      reload()
    },
    patchMe,
    async patchHousehold(fields: Partial<Household>) {
      setData((x) => ({ ...x, household: { ...x.household, ...fields } }))
      await sb.from('households').update(fields).eq('id', hh.id)
    },
    testPush: () => notify(me.user_id, 'Het werkt! 🎉', 'Zo zien je herinneringen eruit.', 'test'),
  }
}
export type Actions = ReturnType<typeof actions>

export const Ctx = createContext<{ d: Data; act: Actions }>(null!)
export const useApp = () => useContext(Ctx)
