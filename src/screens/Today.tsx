import { useEffect, useMemo, useRef, useState } from 'react'
import { localDate, suggestExtras, weekday } from '../../supabase/functions/_shared/planner'
import { Avatar, Check, Confetti, Ring } from '../components/Bits'
import { Icon } from '../components/Icon'
import { Sheet } from '../components/Sheet'
import { SnoozeSheet } from '../components/SnoozeSheet'
import { useApp, type Member, type PlanItem } from '../lib/data'
import { isStandalone, pushState } from '../lib/push'
import { room } from '../lib/rooms'
import { streak } from '../lib/stats'

const greet = () => { const h = new Date().getHours(); return h < 6 ? 'Goedenacht' : h < 12 ? 'Goedemorgen' : h < 18 ? 'Goedemiddag' : 'Goedenavond' }
const dateLabel = () => new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

function useNow(active: boolean) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => { if (!active) return; const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i) }, [active])
  return now
}

function beep() {
  try {
    const ctx = new AudioContext()
    ;[0, 0.25, 0.5].forEach((t) => {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.frequency.value = 880; o.connect(g); g.connect(ctx.destination)
      g.gain.setValueAtTime(0.25, ctx.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2)
      o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.2)
    })
  } catch { /* geen geluid mogelijk */ }
}

export function Today({ goSettings, onLog }: { goSettings: () => void; onLog: () => void }) {
  const { d, act } = useApp()
  const { me, partner, household: hh } = d
  const today = localDate()
  const title = (id: string) => d.tasks.find((t) => t.id === id)?.title ?? 'Taak'
  const todays = d.items.filter((i) => i.date === today)
  const mine = todays.filter((i) => i.user_id === me.user_id)
  const theirs = partner ? todays.filter((i) => i.user_id === partner.user_id) : []
  const requests = todays.filter((i) => i.swap_to === me.user_id && i.status === 'todo')
  const doneMin = mine.filter((i) => i.status === 'done').reduce((s, i) => s + i.minutes, 0)
  const totalMin = mine.reduce((s, i) => s + i.minutes, 0)
  const allDone = mine.length > 0 && mine.every((i) => i.status === 'done')
  // Feestje zodra je de laatste taak afvinkt (niet bij het openen van de app).
  const [party, setParty] = useState(0)
  const wasDone = useRef(allDone)
  useEffect(() => {
    if (allDone && !wasDone.current) setParty(Date.now())
    wasDone.current = allDone
  }, [allDone])
  const rest = hh.rest_days.includes(weekday(today))

  const endsAt = me.timer_ends_at ? Date.parse(me.timer_ends_at) : 0
  const now = useNow(!!endsAt)
  const left = Math.max(0, Math.round((endsAt - now) / 1000))
  const running = endsAt > 0 && left > 0
  const [timeUp, setTimeUp] = useState(false)
  const wasRunning = useRef(running)
  useEffect(() => {
    if (wasRunning.current && !running && endsAt) { beep(); setTimeUp(true); act.stopTimer() }
    wasRunning.current = running
  }, [running, endsAt, act])

  const [snoozeOpen, setSnoozeOpen] = useState(false)
  const [menu, setMenu] = useState<PlanItem | null>(null)
  const [showExtras, setShowExtras] = useState(false)
  const snoozed = !!me.snooze_reason && (me.snooze_on_arrive || (!!me.snooze_until && Date.parse(me.snooze_until) > Date.now()))
  const minutesLeft = running ? Math.floor(left / 60) : Math.max(0, hh.block_minutes - doneMin)
  const planned = useMemo(() => new Set(todays.map((i) => i.task_id)), [todays])
  const extras = (allDone || showExtras) ? suggestExtras(d.tasks, today, planned, minutesLeft) : []

  const [push, setPush] = useState<string>('on')
  useEffect(() => { pushState().then(setPush) }, [])
  const s = streak(d)

  return (
    <div className="screen">
      <header className="large-title">
        <div>
          <p className="eyebrow">{dateLabel()}</p>
          <h1>{greet()}, {me.name}</h1>
        </div>
        {s > 0 && <span className="pill flame" title="Dagen op rij">🔥 {s}</span>}
      </header>

      {push !== 'on' && (
        <button className="banner" onClick={goSettings}>
          <Icon name="bell" />
          <span><b>{isStandalone ? 'Zet meldingen aan' : 'Zet de app op je beginscherm'}</b><br />
            <span className="muted small">{isStandalone ? 'Dan krijg je een seintje als je thuiskomt.' : 'Pas dan werken meldingen op je iPhone.'}</span></span>
          <Icon name="chevron" size={18} />
        </button>
      )}

      {requests.map((i) => (
        <div className="card swap-card" key={i.id}>
          <p><b>{partner?.name}</b> vraagt of jij <b>{title(i.task_id)}</b> kunt doen <span className="muted">(±{i.minutes} min)</span></p>
          <div className="btn-row">
            <button className="btn primary" onClick={() => act.answerSwap(i, title(i.task_id), true)}>Ja, doe ik</button>
            <button className="btn soft" onClick={() => act.answerSwap(i, title(i.task_id), false)}>Nu niet</button>
          </div>
        </div>
      ))}

      <section className={'card hero' + (allDone ? ' all-done' : '') + (snoozed && !running ? ' is-snoozed' : '') + (timeUp ? ' timer-up' : '')}>
        {party > 0 && <Confetti key={party} />}
        {rest && !mine.length ? (
          <Empty icon="🌿" title="Rustdag" text="Vandaag geen taken. Lekker niks doen." />
        ) : !mine.length ? (
          <Empty icon="✨" title="Niks op je lijstje" text="Het huis staat er goed voor." />
        ) : (
          <>
            <div className="hero-head">
              <Ring value={totalMin ? doneMin / totalMin : 0}>
                {running ? <Icon name="clock" size={20} /> : `${mine.filter((i) => i.status === 'done').length}/${mine.length}`}
              </Ring>
              <div>
                <h2>{allDone ? 'Klaar voor vandaag! 🎉' : running ? 'Bezig…' : 'Jouw opruimronde'}</h2>
                <p className="muted">{allDone ? `${doneMin} min gedaan. Morgen weer.` : `${mine.length} ${mine.length === 1 ? 'taakje' : 'taakjes'} · ±${totalMin} min`}</p>
              </div>
            </div>

            {running && (
              <div className={'timer' + (left <= 10 ? ' ending' : '')} role="timer" aria-live="off" aria-label={`Nog ${mmss(left)}`}>
                <span className="timer-num">{mmss(left).split(':')[0]}<span className="colon">:</span>{mmss(left).split(':')[1]}</span>
                <div className="timer-bar"><i style={{ width: `${(left / (hh.block_minutes * 60)) * 100}%` }} /></div>
              </div>
            )}
            {timeUp && !running && (
              <div className="notice">⏰ Tijd is om, goed bezig! <button className="link" onClick={() => setTimeUp(false)}>Oké</button></div>
            )}

            {snoozed && !running && (
              <div className="snoozed">
                <Icon name="moon" size={18} />
                <span>Later · {me.snooze_reason}<br />
                  <span className="muted small">{me.snooze_on_arrive ? 'Ik herinner je als je thuiskomt' : `Herinnering om ${new Date(me.snooze_until!).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}`}</span></span>
                <button className="link" onClick={act.unsnooze}>Toch nu</button>
              </div>
            )}

            <ul className="tasks">
              {mine.map((i) => (
                <TaskRow key={i.id} item={i} title={title(i.task_id)} onToggle={() => act.toggle(i)} onMore={() => setMenu(i)} />
              ))}
            </ul>

            {(!allDone || running) && (
              <div className="btn-row">
                {running ? (
                  <>
                    <button className="btn primary grow" onClick={() => { act.stopTimer(); setShowExtras(true) }}><Icon name="check" size={18} /> Ik ben klaar</button>
                    <button className="btn soft" onClick={act.stopTimer} aria-label="Timer stoppen"><Icon name="stop" size={16} fill /></button>
                  </>
                ) : (
                  <>
                    <button className="btn primary grow" onClick={() => { act.startTimer(hh.block_minutes); act.unsnooze(); setTimeUp(false) }}>
                      <Icon name="play" size={16} fill /> Start {hh.block_minutes} min
                    </button>
                    {!snoozed && <button className="btn soft" onClick={() => setSnoozeOpen(true)}><Icon name="moon" size={18} /> Later</button>}
                  </>
                )}
              </div>
            )}
          </>
        )}

        {(allDone || !mine.length || showExtras) && (
          extras.length ? (
            <div className="extras">
              <p className="label">{minutesLeft > 0 ? `Nog ${minutesLeft} min over? Zin in een extraatje:` : 'Zin in een extraatje?'}</p>
              {extras.map((t) => (
                <button key={t.id} className="extra" onClick={() => act.doNow(t)}>
                  <span>{room(t.room).icon}</span><span className="grow">{t.title}</span>
                  <span className="muted small">{t.minutes} min</span><Icon name="plus" size={18} />
                </button>
              ))}
            </div>
          ) : (allDone || showExtras) && <p className="muted small center">Er is verder niks dat nu nodig is. Geniet ervan!</p>
        )}
      </section>

      <button className="log-cta" onClick={onLog}>
        <span className="log-cta-ic">🙌</span>
        <span className="grow"><b>Zelf al iets opgeruimd?</b><br /><span className="muted small">Log het. Het telt mee en de planning schuift mee.</span></span>
        <Icon name="plus" size={20} />
      </button>

      {partner && (
        <section className="card partner">
          <div className="partner-head">
            <Avatar m={partner} />
            <div className="grow">
              <b>{partner.name}</b>
              <p className="muted small"><PartnerStatus m={partner} items={theirs} /></p>
            </div>
          </div>
          {theirs.length > 0 && (
            <ul className="mini">
              {theirs.map((i) => (
                <li key={i.id} className={i.status === 'done' ? 'done' : ''}>
                  <span className="dot">{i.status === 'done' ? '✓' : ''}</span>{title(i.task_id)}
                  {i.helper && <span className="tag">👫 samen</span>}
                  {i.swap_to === me.user_id && <span className="tag">vraagt jou</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <SnoozeSheet open={snoozeOpen} onClose={() => setSnoozeOpen(false)} />
      <ItemMenu item={menu} title={menu ? title(menu.task_id) : ''} onClose={() => setMenu(null)} />
    </div>
  )
}

function TaskRow({ item, title, onToggle, onMore }: { item: PlanItem; title: string; onToggle: () => void; onMore: () => void }) {
  const { d } = useApp()
  const t = d.tasks.find((x) => x.id === item.task_id)
  const done = item.status === 'done'
  return (
    <li className={'task' + (done ? ' done' : '')}>
      <Check done={done} onClick={onToggle} label={title} />
      <button className="task-main" onClick={onToggle}>
        <span className="task-title"><span className="strike">{title}</span></span>
        <span className="muted small">{room(t?.room ?? null).icon} {room(t?.room ?? null).label} · {item.minutes} min{item.extra ? ' · extraatje' : ''}</span>
      </button>
      {item.swap_to && <span className="tag">gevraagd</span>}
      {item.helper && <span className="tag">👫 samen</span>}
      <button className="icon-btn" onClick={onMore} aria-label={`Meer opties voor ${title}`}><Icon name="more" size={20} /></button>
    </li>
  )
}

/** Opties per taak: verzetten, aan de ander vragen, samen gedaan. */
function ItemMenu({ item, title, onClose }: { item: PlanItem | null; title: string; onClose: () => void }) {
  const { d, act } = useApp()
  const p = d.partner
  const live = item && d.items.find((i) => i.id === item.id)
  const run = (fn: () => unknown) => async () => { onClose(); await fn() }
  const nextSat = ((5 - weekday(localDate()) + 7) % 7) || 7
  return (
    <Sheet open={!!item} onClose={onClose} title={title}>
      {live && (live.status === 'done' ? (
        p ? (
          <div className="menu">
            <button className="menu-item" onClick={run(() => act.together(live, !live.helper))}>
              <span>👫</span><span className="grow">{live.helper ? 'Toch niet samen gedaan' : `Samen gedaan met ${p.name}`}<br />
                <span className="muted small">Telt dan voor jullie allebei in het weekoverzicht</span></span>
            </button>
          </div>
        ) : <p className="muted">Deze taak is al afgevinkt.</p>
      ) : (
        <div className="menu">
          <p className="label">Verzetten naar</p>
          <button className="menu-item" onClick={run(() => act.postpone(live, 1))}><Icon name="calendar" size={20} /><span className="grow">Morgen</span></button>
          <button className="menu-item" onClick={run(() => act.postpone(live, 2))}><Icon name="calendar" size={20} /><span className="grow">Overmorgen</span></button>
          <button className="menu-item" onClick={run(() => act.postpone(live, nextSat))}><Icon name="calendar" size={20} /><span className="grow">Het weekend</span></button>
          <button className="menu-item" onClick={run(() => act.postpone(live, 7))}><Icon name="calendar" size={20} /><span className="grow">Volgende week</span></button>
          {p && !live.swap_to && <>
            <p className="label">Samen</p>
            <button className="menu-item" onClick={run(() => act.askSwap(live, title))}>
              <Icon name="swap" size={20} /><span className="grow">Vraag {p.name} om het over te nemen</span>
            </button>
          </>}
        </div>
      ))}
    </Sheet>
  )
}

function PartnerStatus({ m, items }: { m: Member; items: PlanItem[] }) {
  if (m.timer_ends_at && Date.parse(m.timer_ends_at) > Date.now()) return <>⏱️ Is nu bezig</>
  if (m.snooze_reason) return <>😴 Later: {m.snooze_reason}</>
  if (!items.length) return <>Niks op de planning vandaag</>
  const done = items.filter((i) => i.status === 'done').length
  return <>{done === items.length ? '✅ Klaar voor vandaag' : `${done} van ${items.length} gedaan`}</>
}

const Empty = ({ icon, title, text }: { icon: string; title: string; text: string }) => (
  <div className="empty"><span className="empty-icon">{icon}</span><h2>{title}</h2><p className="muted">{text}</p></div>
)
