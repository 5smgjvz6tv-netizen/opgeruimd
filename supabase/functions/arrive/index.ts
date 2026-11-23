// Aangeroepen door de iOS Opdrachten-automatisering "Als ik thuiskom".
import { db, json, push, reminder } from '../_shared/push.ts'
import { ensurePlan, localDate } from '../_shared/planner.ts'

Deno.serve(async (req) => {
  const token = new URL(req.url).searchParams.get('t')
  if (!token || !/^[0-9a-f-]{36}$/i.test(token)) return json({ error: 'missing token' }, 400)
  const { data: m } = await db.from('members').select('*').eq('arrive_token', token).maybeSingle()
  if (!m) return json({ error: 'unknown token' }, 404)

  const today = localDate()
  const snoozedForTime = m.snooze_until && new Date(m.snooze_until) > new Date() && !m.snooze_on_arrive
  if (snoozedForTime) return json({ ok: true, sent: false, reason: 'snoozed' })
  if (m.reminded_on === today && !m.snooze_on_arrive) return json({ ok: true, sent: false, reason: 'already reminded' })

  await ensurePlan(db, m.household_id, today)
  const msg = await reminder(m, today, m.snooze_on_arrive ? 'back' : 'arrive')
  await db.from('members').update({
    reminded_on: today, snooze_on_arrive: false, snooze_until: null, snooze_reason: null,
  }).eq('user_id', m.user_id)
  await db.from('outbox').delete().eq('user_id', m.user_id).eq('tag', 'snooze').is('sent_at', null)
  if (msg) await push(m.user_id, msg)
  return json({ ok: true, sent: !!msg })
})
