import { useEffect, useMemo, useRef, useState } from 'react'
import { addDays, localDate, suggestExtras, weekday } from '../../supabase/functions/_shared/planner'
import { Avatar, Check, Confetti, Ic, Ring, XpBar } from '../components/Bits'
import { Icon } from '../components/Icon'
import { Sheet } from '../components/Sheet'
import { SnoozeSheet } from '../components/SnoozeSheet'
import { useApp, type Member, type PlanItem } from '../lib/data'
import { floatText, haptic, sound } from '../lib/feel'
import { levelOf, weeklyChallenge, xpOf } from '../lib/game'
import { list, locale, plural, t } from '../lib/i18n'
import { isStandalone, pushState } from '../lib/push'
import { room } from '../lib/rooms'
import { streak } from '../lib/stats'

const greet = () => { const h = new Date().getHours(); return t(h < 6 ? 'today.night' : h < 12 ? 'today.morning' : h < 18 ? 'today.afternoon' : 'today.evening') }
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

function useNow(active: boolean) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => { if (!active) return; const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i) }, [active])
  return now
}

export function Today({ goSettings, goProgress, onLog }: { goSettings: () => void; goProgress: () => void; onLog: () => void }) {
  const { d, act } = useApp()
  const { me, household: hh } = d
  const today = localDate()
  const taskOf = (id: string) => d.tasks.find((x) => x.id === id)
  const title = (id: string) => taskOf(id)?.title ?? '—'
  const xpItem = (i: PlanItem) => xpOf(i.minutes, taskOf(i.task_id)?.effort)
  const todays = d.items.filter((i) => i.date === today)
  const mine = todays.filter((i) => i.user_id === me.user_id)
  const requests = todays.filter((i) => i.swap_to === me.user_id && i.status === 'todo')
  const doneItems = mine.filter((i) => i.status === 'done')
  const doneMin = doneItems.reduce((s, i) => s + i.minutes, 0)
  const totalMin = mine.reduce((s, i) => s + i.minutes, 0)
  const totalXp = mine.reduce((s, i) => s + xpItem(i), 0)
  const earnedXp = doneItems.reduce((s, i) => s + xpItem(i), 0)
  const allDone = mine.length > 0 && doneItems.length === mine.length
  const rest = hh.rest_days.includes(weekday(today))

  // Niveau + level-up-moment
  const myXp = d.xp[me.user_id] ?? 0
  const lv = levelOf(myXp)
  const prevLv = useRef(lv.n)
  const [levelUp, setLevelUp] = useState<number | null>(null)
  useEffect(() => { if (lv.n > prevLv.current) { setLevelUp(lv.n); sound('done'); haptic([10, 60, 10, 60, 30]) } prevLv.current = lv.n }, [lv.n])

  // Ring dicht: klein feestje
  const [party, setParty] = useState(0)
  const wasDone = useRef(allDone)
  useEffect(() => { if (allDone && !wasDone.current) { setParty(Date.now()); sound('done'); haptic([10, 60, 10]) } wasDone.current = allDone }, [allDone])

  // Timer
  const endsAt = me.timer_ends_at ? Date.parse(me.timer_ends_at) : 0
  const now = useNow(!!endsAt)
  const left = Math.max(0, Math.round((endsAt - now) / 1000))
  const running = endsAt > 0 && left > 0
  const [timeUp, setTimeUp] = useState(false)
  const wasRunning = useRef(running)
  useEffect(() => { if (wasRunning.current && !running && endsAt) { sound('done'); haptic([20, 80, 20]); setTimeUp(true); act.stopTimer() } wasRunning.current = running }, [running, endsAt, act])

  const [snoozeOpen, setSnoozeOpen] = useState(false)
  const [menu, setMenu] = useState<PlanItem | null>(null)
  const [showExtras, setShowExtras] = useState(false)
  const snoozed = !!me.snooze_reason && (me.snooze_on_arrive || (!!me.snooze_until && Date.parse(me.snooze_until) > Date.now()))
  const minutesLeft = running ? Math.floor(left / 60) : Math.max(0, hh.block_minutes - doneMin)
  const planned = useMemo(() => new Set(todays.map((i) => i.task_id)), [todays])
  const extras = (allDone || showExtras || !mine.length) && !rest ? suggestExtras(d.tasks, today, planned, minutesLeft) : []
  const [push, setPush] = useState('on')
  useEffect(() => { pushState().then(setPush) }, [])
  const s = streak(d)
  const ch = weeklyChallenge(d)
  const missing = hh.size - d.members.length

  const toggle = (i: PlanItem, el?: Element | null) => {
    if (i.status !== 'done') { haptic(); sound('pop'); floatText(el ?? null, `+${xpItem(i)} XP`) } else haptic(4)
    act.toggle(i)
  }
  const time = me.fallback_time?.slice(0, 5)
  const reminderNote = time ? t('today.reminderBoth', { time }) : t('today.reminderArrive')

  return (
    <div className="page">
      <header className="hdr">
        <div>
          <p className="eyebrow" style={{ textTransform: 'capitalize' }}>{new Date().toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1>{greet()}, {me.name}</h1>
        </div>
      </header>

      <section className={'card round' + (allDone ? ' all-done' : '')}>
        {party > 0 && <Confetti key={party} />}
        {rest && !mine.length ? (
          <div className="round-head"><Ic name="leaf" tone="gold" lg /><div><h2>{t('today.rest')}</h2><p className="row-sub">{t('today.restSub')}</p></div></div>
        ) : !mine.length ? (
          <div className="round-head"><Ic name="sparkle" lg /><div><h2>{t('today.empty')}</h2><p className="row-sub">{t('today.emptySub')}</p></div></div>
        ) : (
          <>
            <div className="round-head">
              <Ring size={68} stroke={7} value={doneItems.length / mine.length}>{allDone ? <Icon name="check" size={20} /> : `${doneItems.length}/${mine.length}`}</Ring>
              <div className="grow">
                <h2>{allDone ? t('today.done') : running ? t('today.running') : t('today.round')}</h2>
                <p className="row-sub">{allDone ? t('today.doneSub', { xp: earnedXp, min: doneMin })
                  : t('today.roundSub', { n: mine.length, tasks: plural(mine.length), min: totalMin, xp: totalXp })}</p>
              </div>
            </div>

            {running && (
              <div className={'timer' + (left <= 10 ? ' ending' : '')} role="timer">
                <span className="timer-num">{mmss(left)}</span>
                <XpBar frac={left / (hh.block_minutes * 60)} />
              </div>
            )}
            {timeUp && !running && <div className="notice"><Icon name="alarm" size={18} />{t('today.timeUp')}<button onClick={() => setTimeUp(false)}><Icon name="x" size={16} /></button></div>}
            {snoozed && !running && (
              <div className="snoozed">
                <Ic name="moon" tone="gray" />
                <span className="row-main"><span className="row-title">{t('today.snoozed', { reason: me.snooze_reason ?? '' })}</span>
                  <span className="row-sub">{me.snooze_on_arrive ? t('today.snoozeArrive') : t('today.snoozeAt', { time: new Date(me.snooze_until!).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' }) })}</span></span>
                <button className="btn tinted sm" onClick={act.unsnooze}>{t('today.resume')}</button>
              </div>
            )}

            {(!allDone || running) && (
              <div className="btn-row">
                {running ? (
                  <>
                    <button className="btn primary grow" onClick={() => { act.stopTimer(); setShowExtras(true) }}><Icon name="check" size={18} />{t('today.finish')}</button>
                    <button className="btn soft" onClick={act.stopTimer} aria-label={t('today.stop')}><Icon name="stop" size={16} /></button>
                  </>
                ) : (
                  <>
                    <button className="btn primary grow" onClick={() => { act.startTimer(hh.block_minutes); if (snoozed) act.unsnooze(); setTimeUp(false); haptic() }}>
                      <Icon name="play" size={16} />{t('today.start', { min: hh.block_minutes })}</button>
                    {!snoozed && <button className="btn soft" onClick={() => setSnoozeOpen(true)}><Icon name="moon" size={18} />{t('today.later')}</button>}
                  </>
                )}
              </div>
            )}
            <ul className="tasks">
              {mine.map((i) => <TaskRow key={i.id} item={i} onToggle={(el) => toggle(i, el)} onMore={() => setMenu(i)} />)}
            </ul>

          </>
        )}

        {extras.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <span className="label" style={{ marginLeft: 0 }}>{minutesLeft > 0 && (allDone || running) ? t('today.extrasTitle', { min: minutesLeft }) : t('today.extrasTitleNoTime')}</span>
            <div className="list" style={{ boxShadow: 'none', background: 'var(--fill)' }}>
              {extras.map((x) => (
                <button key={x.id} className="row" onClick={() => { haptic(); act.doNow(x) }}>
                  <Ic name={room(x.room).icon} /><span className="row-main"><span className="row-title">{x.title}</span>
                    <span className="row-sub">{room(x.room).label}<span className="sep" />{x.minutes} {t('common.min')}</span></span>
                  <span className="xp-chip">+{xpOf(x.minutes, x.effort)}</span><Icon name="plus" size={18} />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="round-foot"><img className="ref-avatar" src={import.meta.env.BASE_URL + 'bas-mark.svg'} alt="" /><span>{reminderNote}</span><button onClick={goSettings}>{t('common.edit')}</button></div>
      </section>

      <button className="card me-strip" onClick={goProgress} aria-label={t('level', { n: lv.n })}>
        <span className="lv-badge">{lv.n}</span>
        <span className="row-main">
          <span className="row-title">{t('level', { n: lv.n })} · {lv.title}</span>
          <XpBar frac={lv.frac} />
          <span className="row-sub">{t('level.toNext', { xp: lv.next - myXp, n: lv.n + 1 })}</span>
        </span>
        {s > 0 && <span className="streak"><Icon name="flame" size={18} />{s}</span>}
      </button>

      {(!isStandalone || push === 'off') && (
        <div className="list"><button className="row" onClick={goSettings}>
          <Ic name={isStandalone ? 'bell' : 'download'} tone="coral" />
          <span className="row-main"><span className="row-title">{t(isStandalone ? 'today.push' : 'today.install')}</span>
            <span className="row-sub">{t(isStandalone ? 'today.pushSub' : 'today.installSub')}</span></span>
          <span className="chev"><Icon name="chevron" size={16} /></span>
        </button></div>
      )}

      {requests.map((i) => {
        const from = d.members.find((m) => m.user_id === i.user_id)
        return (
          <div key={i.id} className="card pad">
            <div className="row" style={{ padding: 0, minHeight: 0 }}>
              <Ic name="swap" tone="coral" />
              <span className="row-main"><span className="row-title">{title(i.task_id)}</span>
                <span className="row-sub">{t('today.asksYou', { name: from?.name ?? '' })}</span></span>
              <span className="xp-chip">+{xpItem(i)}</span>
            </div>
            <div className="btn-row" style={{ marginTop: 12 }}>
              <button className="btn primary grow" onClick={() => act.answerSwap(i, title(i.task_id), true)}>{t('today.swapYes')}</button>
              <button className="btn soft grow" onClick={() => act.answerSwap(i, title(i.task_id), false)}>{t('today.swapNo')}</button>
            </div>
          </div>
        )
      })}

      <button className="card challenge" onClick={goProgress}>
        <Ic name={ch.icon} tone={ch.done ? 'gold' : undefined} lg />
        <span className="row-main">
          <span className="row-sub" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.03em', fontSize: 11 }}>{t('prog.challenge')}</span>
          <span className="row-title">{t(ch.title)}</span>
          <span className="row-sub">{t(ch.sub)}</span>
          <XpBar frac={ch.frac} />
        </span>
        <span className="row-main" style={{ flex: 'none', alignItems: 'flex-end', gap: 4 }}>
          <span className="tnum" style={{ fontWeight: 700 }}>{ch.have}/{ch.goal}</span>
          {ch.done && <span className="xp-chip">{t('prog.challengeDone')}</span>}
        </span>
      </button>

      <div className="list"><button className="row" onClick={onLog}>
        <Ic name="check-circle" tone="gold" />
        <span className="row-main"><span className="row-title">{t('today.log')}</span><span className="row-sub">{t('today.logSub')}</span></span>
        <Icon name="plus" size={20} />
      </button></div>

      {d.others.length > 0 && (
        <div className="group">
          <h3 className="group-h">{t('today.housemates')}</h3>
          <div className="list">{d.others.map((o) => <Mate key={o.user_id} m={o} items={todays.filter((i) => i.user_id === o.user_id)} />)}</div>
        </div>
      )}
      {!d.solo && missing > 0 && (
        <div className="list"><button className="row" onClick={goProgress}>
          <Ic name="duo" tone="coral" />
          <span className="row-main"><span className="row-title">{t('today.invite')}</span><span className="row-sub">{t('today.inviteSub', { n: d.members.length, size: hh.size })}</span></span>
          <span className="chev"><Icon name="chevron" size={16} /></span>
        </button></div>
      )}

      <SnoozeSheet open={snoozeOpen} onClose={() => setSnoozeOpen(false)} />
      <ItemMenu item={menu} onClose={() => setMenu(null)} />
      <Sheet open={levelUp !== null} onClose={() => setLevelUp(null)} title="">
        <div className="levelup">
          <Confetti />
          <span className="big">{levelUp}</span>
          <h2 style={{ fontSize: 22 }}>{t('level.up.title', { n: levelUp ?? 0 })}</h2>
          <p className="muted">{t('level.up.body', { title: lv.title })}</p>
        </div>
        <button className="btn primary block" onClick={() => setLevelUp(null)}>{t('common.done')}</button>
      </Sheet>
    </div>
  )
}

function TaskRow({ item, onToggle, onMore }: { item: PlanItem; onToggle: (el?: Element | null) => void; onMore: () => void }) {
  const { d } = useApp()
  const task = d.tasks.find((x) => x.id === item.task_id)
  const r = room(task?.room ?? null)
  const done = item.status === 'done'
  const name = task?.title ?? '—'
  return (
    <li className={'task' + (done ? ' done' : '')}>
      <Check done={done} onClick={(e) => onToggle(e?.currentTarget)} label={name} />
      <button className="task-main" onClick={(e) => onToggle(e.currentTarget.parentElement?.querySelector('.check'))}>
        <span className="task-title"><span className="strike">{name}</span></span>
        <span className="row-sub"><Icon name={r.icon} size={13} />{r.label}<span className="sep" />{item.minutes} {t('common.min')}
          {task?.effort === 3 && <><span className="sep" /><Icon name="muscle" size={13} /></>}
          {item.extra && <><span className="sep" />{t('today.extra')}</>}</span>
      </button>
      {item.swap_to && <span className="tag gray">{t('today.asked')}</span>}
      {item.helper && <span className="tag">{t('today.together')}</span>}
      {!done && <span className="xp-chip">+{xpOf(item.minutes, task?.effort)}</span>}
      <button className="icon-btn" onClick={onMore} aria-label={name}><Icon name="more" size={20} /></button>
    </li>
  )
}

function Mate({ m, items }: { m: Member; items: PlanItem[] }) {
  const done = items.filter((i) => i.status === 'done').length
  const status = m.timer_ends_at && Date.parse(m.timer_ends_at) > Date.now() ? t('today.mateBusy')
    : m.snooze_reason ? t('today.mateSnoozed', { reason: m.snooze_reason })
    : !items.length ? t('today.mateNone') : done === items.length ? t('today.mateDone') : t('today.mateProgress', { done, n: items.length })
  return (
    <div className="row">
      <Avatar m={m} size={30} />
      <span className="row-main"><span className="row-title">{m.name}</span><span className="row-sub">{status}</span></span>
      {items.length > 0 && <Ring value={done / items.length} size={30} stroke={4} />}
    </div>
  )
}

/** Opties per taak: verplaatsen, laten overnemen, samen gedaan, ongedaan maken. */
function ItemMenu({ item, onClose }: { item: PlanItem | null; onClose: () => void }) {
  const { d, act } = useApp()
  const live = item && d.items.find((i) => i.id === item.id)
  const name = live ? d.tasks.find((x) => x.id === live.task_id)?.title ?? '' : ''
  const run = (fn: () => unknown) => async () => { onClose(); await fn() }
  const nextSat = ((5 - weekday(localDate()) + 7) % 7) || 7
  const days = list('days.long')
  const at = (n: number) => days[weekday(addDays(localDate(), n))]
  return (
    <Sheet open={!!item} onClose={onClose} title={name}>
      {live && live.status === 'done' && (
        <>
          <div className="list"><button className="row" onClick={run(() => act.toggle(live))}>
            <Ic name="back" tone="gray" /><span className="row-main"><span className="row-title">{t('menu.undo')}</span><span className="row-sub">{t('menu.undoSub')}</span></span>
          </button></div>
          {d.others.length > 0 && (
            <div className="group"><span className="label">{t('menu.together')}</span>
              <div className="list">{d.others.map((o) => (
                <button key={o.user_id} className="row" onClick={run(() => act.together(live, live.helper === o.user_id ? null : o.user_id))}>
                  <Avatar m={o} size={30} /><span className="row-main"><span className="row-title">{o.name}</span><span className="row-sub">{t('menu.togetherSub')}</span></span>
                  {live.helper === o.user_id && <Icon name="check" size={18} />}
                </button>
              ))}</div></div>
          )}
        </>
      )}
      {live && live.status !== 'done' && (
        <>
          <div className="group"><span className="label">{t('menu.moveTo')}</span>
            <div className="list">
              {([[1, 'menu.tomorrow'], [2, 'menu.dayAfter'], [nextSat, 'menu.weekend'], [7, 'menu.nextWeek']] as const).map(([n, k]) => (
                <button key={k} className="row" onClick={run(() => act.postpone(live, n))}>
                  <Ic name="calendar" /><span className="row-main"><span className="row-title">{t(k)}</span></span><span className="row-val" style={{ textTransform: 'capitalize' }}>{at(n)}</span>
                </button>
              ))}
            </div></div>
          {d.others.length > 0 && !live.swap_to && (
            <div className="group"><span className="label">{t('menu.ask')}</span>
              <div className="list">{d.others.map((o) => (
                <button key={o.user_id} className="row" onClick={run(() => act.askSwap(live, name, o.user_id))}>
                  <Avatar m={o} size={30} /><span className="row-main"><span className="row-title">{o.name}</span><span className="row-sub">{t('menu.askSub')}</span></span>
                  <Icon name="swap" size={18} />
                </button>
              ))}</div></div>
          )}
        </>
      )}
    </Sheet>
  )
}
