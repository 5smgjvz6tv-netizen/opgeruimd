import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2'

export const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT')!,
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
)

export type Payload = { title: string; body: string; tag?: string | null }

/** Stuur een melding naar alle apparaten van één persoon. */
export async function push(userId: string, payload: Payload) {
  // Meldingen per soort: respecteer wat iemand in Instellingen heeft uitgezet.
  const { data: m } = await db.from('members').select('notify').eq('user_id', userId).maybeSingle()
  if (payload.tag && m?.notify?.[payload.tag] === false) return
  const { data } = await db.from('push_subscriptions').select('*').eq('user_id', userId)
  await Promise.all((data ?? []).map(async (s) => {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
        { TTL: 3600, urgency: 'high' },
      )
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode
      if (code === 404 || code === 410) await db.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
      else console.error('push failed', code, e)
    }
  }))
}

export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

/** Herinnering met je takenlijstje van vandaag, of null als er niks openstaat. */
export async function reminder(m: { user_id: string; name: string; lang?: string }, date: string, kind: 'arrive' | 'back' | 'time' | 'snooze') {
  const { data } = await db.from('plan_items').select('minutes, tasks(title)')
    .eq('user_id', m.user_id).eq('date', date).eq('status', 'todo')
  if (!data?.length) return null
  const en = m.lang === 'en'
  const min = data.reduce((s, r) => s + r.minutes, 0)
  // deno-lint-ignore no-explicit-any
  const names = data.map((r: any) => r.tasks?.title).filter(Boolean)
  const list = names.slice(0, 3).join(', ') + (names.length > 3 ? ` +${names.length - 3}` : '')
  const title = {
    arrive: en ? `Welcome home, ${m.name}` : `Welkom thuis, ${m.name}`,
    back: en ? `Back home, ${m.name}` : `Weer thuis, ${m.name}`,
    time: en ? `Time for your tidy-up round, ${m.name}` : `Tijd voor je opruimronde, ${m.name}`,
    snooze: en ? 'Time for your tidy-up round?' : 'Tijd voor je opruimronde?',
  }[kind]
  const n = data.length
  const body = en ? `${n} ${n === 1 ? 'task' : 'tasks'} · ±${min} min: ${list}.` : `${n} ${n === 1 ? 'taak' : 'taken'} · ±${min} min: ${list}.`
  return { title, body, tag: 'reminder' }
}
