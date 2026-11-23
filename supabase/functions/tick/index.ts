// Draait elke minuut (pg_cron) en direct na acties in de app.
// Verstuurt geplande meldingen (timer, snooze, ruilverzoeken) en de reserve-herinnering op tijd.
import { db, json, push, reminder } from '../_shared/push.ts'
import { ensurePlan, localDate, TZ } from '../_shared/planner.ts'

const clock = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return json({})
  const { data: due, error } = await db.rpc('claim_outbox')
  if (error) console.error(error)
  for (const o of due ?? []) {
    if (o.tag === 'snooze') {
      // Snooze voorbij: stuur de herinnering mét het lijstje.
      const { data: m } = await db.from('members').select('*').eq('user_id', o.user_id).single()
      if (!m || (!m.snooze_until && !m.snooze_on_arrive)) continue // al afgehandeld (bijv. thuisgekomen)
      const msg = await reminder(m, localDate(), o.title)
      await db.from('members').update({ snooze_until: null, snooze_reason: null, snooze_on_arrive: false }).eq('user_id', o.user_id)
      if (msg) await push(o.user_id, msg)
    } else {
      await push(o.user_id, { title: o.title, body: o.body, tag: o.tag })
    }
  }

  // Reserve: niet thuisgekomen-signaal gehad? Dan op de ingestelde tijd.
  const today = localDate()
  const now = clock.format(new Date())
  const { data: members } = await db.from('members').select('*').not('fallback_time', 'is', null)
  let fallbacks = 0
  for (const m of members ?? []) {
    if (m.reminded_on === today || m.fallback_time.slice(0, 5) > now) continue
    if (m.snooze_until && new Date(m.snooze_until) > new Date()) continue
    if (m.snooze_on_arrive) continue
    await db.from('members').update({ reminded_on: today }).eq('user_id', m.user_id)
    await ensurePlan(db, m.household_id, today)
    const msg = await reminder(m, today, `Tijd voor je opruimronde, ${m.name} ✨`)
    if (msg) { await push(m.user_id, msg); fallbacks++ }
  }
  return json({ ok: true, sent: (due ?? []).length, fallbacks })
})
