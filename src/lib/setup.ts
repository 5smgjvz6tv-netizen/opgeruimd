// Onboarding-keuzes (vóór het inloggen) bewaren en na het inloggen in één keer toepassen.
import { fillPlan, localDate } from '../../supabase/functions/_shared/planner'
import { CATALOG, catalogRow } from './catalog'
import { sb } from './data'

export type Draft = {
  path: 'new' | 'join'
  name: string
  color: string
  size: number
  rooms: string[]
  sel: string[]
  block: number
  rest: number[]
  time: number | null // minuten na middernacht; null = alleen bij thuiskomst
  code: string
}
const KEY = 'opgeruimd.draft'
export const loadDraft = (): Draft | null => { try { return JSON.parse(localStorage.getItem(KEY) ?? 'null') } catch { return null } }
export const saveDraft = (d: Draft) => { try { localStorage.setItem(KEY, JSON.stringify(d)) } catch { /* */ } }
export const clearDraft = () => { try { localStorage.removeItem(KEY) } catch { /* */ } }

const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

/** Maak het huishouden (of doe mee) met alles wat in de onboarding is gekozen. */
export async function applyDraft(d: Draft, userId: string) {
  let hid: string
  if (d.path === 'join') {
    const { data, error } = await sb.rpc('join_household', { code: d.code, my_name: d.name })
    if (error) throw error
    hid = data
  } else {
    const { data, error } = await sb.rpc('create_household', { my_name: d.name })
    if (error) throw error
    hid = data
    await sb.from('households').update({ size: d.size, rooms: d.rooms, block_minutes: d.block, rest_days: d.rest }).eq('id', hid)
    const chosen = CATALOG.flatMap((r) => r.tasks).filter((x) => d.sel.includes(x.id))
    if (chosen.length) await sb.from('tasks').insert(chosen.map((x) => catalogRow(x, hid)))
  }
  await sb.from('members').update({ color: d.color, fallback_time: d.time === null ? null : hhmm(d.time) }).eq('user_id', userId)
  await fillPlan(sb, hid, localDate())
  clearDraft()
}
