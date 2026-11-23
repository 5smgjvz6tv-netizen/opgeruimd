// Onboarding-keuzes (vóór het inloggen) bewaren en na het inloggen in één keer toepassen.
import { fillPlan, localDate } from '../../supabase/functions/_shared/planner'
import { lang } from './i18n'
import { initialLayout, roomGroups, starterTasks, type HomeLayout } from './homeLayout'
import { catalogRow } from './catalog'
import { sb } from './data'

export type Draft = {
  path: 'new' | 'join'
  name: string
  color: string
  size: number
  layout?: HomeLayout
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
  const layout = d.layout ?? initialLayout()
  const starter = d.path === 'new' ? starterTasks(layout).map(task => catalogRow(task, '')) : []
  const profile = { ...d, layout, rooms: roomGroups(layout), lang, reminder: d.time === null ? null : hhmm(d.time) }
  const { data: hid, error } = await sb.rpc('finish_home_setup', { profile, starter })
  if (error) throw error
  await fillPlan(sb, hid, localDate())
  clearDraft()
  sessionStorage.removeItem('opgeruimd.signup-email')
}
