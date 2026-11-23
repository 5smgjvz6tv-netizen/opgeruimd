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

const lowerFirst = (s: string) => (s.length > 1 && s[1] === s[1].toLowerCase() ? s[0].toLowerCase() + s.slice(1) : s)
const pick = <T,>(arr: T[], seed: number) => arr[Math.abs(seed) % arr.length]

/** Herinnering met je takenlijstje van vandaag, of null als er niks openstaat. */
export async function reminder(m: { user_id: string; name: string; lang?: string }, date: string, kind: 'arrive' | 'back' | 'time' | 'snooze') {
  const { data } = await db.from('plan_items').select('minutes, tasks(title)')
    .eq('user_id', m.user_id).eq('date', date).eq('status', 'todo')
  if (!data?.length) return null
  const en = m.lang === 'en'
  const min = data.reduce((s, r) => s + r.minutes, 0)
  // deno-lint-ignore no-explicit-any
  const names = data.map((r: any) => r.tasks?.title).filter(Boolean) as string[]
  const first = names[0] ? lowerFirst(names[0]) : (en ? 'your first chore' : 'je eerste klusje')
  const list = names.slice(0, 3).map(lowerFirst).join(', ') + (names.length > 3 ? ` +${names.length - 3}` : '')
  const seed = Number(date.replaceAll('-', '')) + m.name.length
  const n = data.length
  const rest = n - 1

  const title = en
    ? pick({
        arrive: [`Welcome home, ${m.name}!`, `Before you hit the sofa, ${m.name}`, `Hey ${m.name}, just got in?`],
        back: [`Ready now, ${m.name}?`, `Round two, ${m.name}!`],
        time: [`Quick ${min}-min reset, ${m.name}?`, `Let’s knock this out, ${m.name}`, `Time for your round, ${m.name}!`],
        snooze: [`Got ${min} min now, ${m.name}?`, `Ready to knock it out, ${m.name}?`],
      }[kind], seed)
    : pick({
        arrive: [`Voordat je op de bank ploft, ${m.name}`, `Hé ${m.name}, net binnen?`, `Welkom thuis, ${m.name}!`],
        back: [`Nu wel een gaatje, ${m.name}?`, `Klaar voor je ronde, ${m.name}?`],
        time: [`Zullen we ff snel, ${m.name}?`, `Even ${min} min knallen, ${m.name}?`, `Tijd voor je ronde, ${m.name}!`],
        snooze: [`Nu even ${min} min tijd, ${m.name}?`, `Klaar voor poging twee, ${m.name}?`],
      }[kind], seed)

  const body = en
    ? pick([
        `Start with ${first}${rest ? ` (+${rest} more)` : ''} — ±${min} min and you’re done for the day. Let’s go!`,
        `Just ${list} (±${min} min). Smash it out now, relax guilt-free after.`,
        `±${min} min for ${list}. Start the timer and keep your streak alive!`,
      ], seed + 1)
    : pick([
        `Beginnen met ${first}${rest ? ` (+${rest} ${rest === 1 ? 'andere' : 'andere'})` : ''} — ±${min} min en je bent klaar voor vandaag. Let’s go!`,
        `Alleen even ${list} (±${min} min). Zo gepiept, daarna lekker niksen.`,
        `±${min} min voor ${list}. Timer aan, afvinken en je streak loopt lekker door!`,
      ], seed + 1)

  return { title, body, tag: 'reminder' }
}
