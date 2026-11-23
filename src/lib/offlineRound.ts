import { localDate } from '../../supabase/functions/_shared/planner'
import type { Data } from './data'
import { sb } from './data'

type SavedItem = { id: string; title: string; minutes: number; done_at: string | null }
export type SavedRound = { household: string; date: string; minutes: number; items: SavedItem[] }
type Change = { item: string; original: string | null; desired: boolean; at: string; household: string }
const roundKey = (uid: string) => 'opgeruimd.round.' + uid
const prefix = (uid: string) => 'opgeruimd.check.' + uid + '.'
export function saveRound(d: Data) {
  const date = localDate()
  const round: SavedRound = { household: d.household.id, date, minutes: d.household.block_minutes,
    items: d.items.filter(i => i.user_id === d.me.user_id && i.date === date).map(i => ({
      id: i.id, title: d.tasks.find(task => task.id === i.task_id)?.title ?? '', minutes: i.minutes, done_at: i.done_at,
    })) }
  try { localStorage.setItem(roundKey(d.me.user_id), JSON.stringify(round)) } catch { /* Browsing can continue when storage is full. */ }
}
function pending(uid: string) {
  return Object.keys(localStorage).filter(k => k.startsWith(prefix(uid))).sort().map(key => ({
    key, change: JSON.parse(localStorage.getItem(key)!) as Change,
  }))
}
export function savedRound(uid: string): SavedRound | null {
  const round = JSON.parse(localStorage.getItem(roundKey(uid)) ?? 'null') as SavedRound | null
  if (!round) return null
  for (const { change } of pending(uid)) {
    const item = round.items.find(i => i.id === change.item)
    if (item) item.done_at = change.desired ? change.at : null
  }
  return round
}
export function recordCheck(uid: string, household: string, item: string, original: string | null, desired: boolean, at = new Date().toISOString()) {
  localStorage.setItem(prefix(uid) + at + '.' + crypto.randomUUID(), JSON.stringify({ item, household, original, desired, at }))
}
export const hasChecks = (uid: string) => Object.keys(localStorage).some(k => k.startsWith(prefix(uid)))
export async function syncChecks(uid: string, household: string) {
  const work = async () => {
    for (const { key, change } of pending(uid)) {
      if (change.household === household) {
        const { error } = await sb.rpc('sync_round_check', { target: change.item, desired: change.desired, original_time: change.original, event_time: change.at })
        if (error) throw error
      }
      localStorage.removeItem(key)
    }
  }
  if (navigator.locks) await navigator.locks.request(prefix(uid), work)
  else await work()
}
