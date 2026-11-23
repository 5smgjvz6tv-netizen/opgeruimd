import { useEffect, useState, type ReactNode } from 'react'
import { fillPlan, localDate, suggestExtras } from '../../supabase/functions/_shared/planner'
import { Check } from '../components/Bits'
import { Icon } from '../components/Icon'
import { sb, useApp } from '../lib/data'
import { enablePush, isIOS, isStandalone, pushState } from '../lib/push'
import { room } from '../lib/rooms'
import { CATALOG, DEFAULT_ROOMS, type CatalogTask } from '../lib/catalog'
import { CatalogPicker } from '../components/CatalogPicker'
import { SUPABASE_URL } from '../config'

const BASE = import.meta.env.BASE_URL
type Step = 'intro' | 'tasks' | 'how' | 'together' | 'phone' | 'first'

/** Rondleiding na het aanmaken van je account: van taken kiezen tot je eerste opruimronde. */
export function Tour({ onDone }: { onDone: () => void }) {
  const { d } = useApp()
  const [steps] = useState<Step[]>(() => [
    'intro', ...(d.tasks.some((t) => !t.archived) ? [] : ['tasks' as const]), 'how', 'together', 'phone', 'first',
  ])
  const [i, setI] = useState(0)
  const [dir, setDir] = useState(1)
  const step = steps[i]
  const go = (n: number) => { setDir(n > i ? 1 : -1); setI(n); scrollTo({ top: 0 }) }
  const next = () => go(Math.min(i + 1, steps.length - 1))

  return (
    <div className="tour">
      <header className="tour-top">
        <button className="icon-btn" onClick={() => go(i - 1)} disabled={i === 0} aria-label="Terug" style={{ visibility: i ? 'visible' : 'hidden' }}>
          <Icon name="back" />
        </button>
        <div className="dots" aria-label={`Stap ${i + 1} van ${steps.length}`}>
          {steps.map((s, n) => <i key={s} className={n === i ? 'on' : n < i ? 'done' : ''} />)}
        </div>
        <button className="link small" onClick={onDone} style={{ visibility: step === 'first' ? 'hidden' : 'visible' }}>Overslaan</button>
      </header>
      <div className="tour-step" key={step} data-dir={dir}>
        {step === 'intro' && <Intro onNext={next} />}
        {step === 'tasks' && <PickTasks onNext={next} />}
        {step === 'how' && <How onNext={next} />}
        {step === 'together' && <Together onNext={next} />}
        {step === 'phone' && <Phone onNext={next} />}
        {step === 'first' && <First onDone={onDone} />}
      </div>
    </div>
  )
}

function Art({ name }: { name: string }) {
  const [ok, setOk] = useState(true)
  return ok ? <img className="tour-art" src={`${BASE}onboarding/${name}.webp`} alt="" onError={() => setOk(false)} /> : <div className="tour-art-fallback" />
}

/** Rij met een (herkenbaar) icoon en uitleg. */
function Row({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <li className="tour-row">
      <span className="tour-ic">{icon}</span>
      <span><b>{title}</b><br /><span className="muted">{children}</span></span>
    </li>
  )
}

function Intro({ onNext }: { onNext: () => void }) {
  return (
    <>
      <Art name="welcome" />
      <h1 className="tour-title">Zo werkt Opgeruimd</h1>
      <ul className="tour-list stagger">
        <Row icon={<Icon name="calendar" />} title="Elke dag een opruimronde">Een kwartiertje met een paar kleine taakjes. Zo stapelt er niks op.</Row>
        <Row icon={<Icon name="people" />} title="Eerlijk verdeeld">De app verdeelt de taken slim tussen jou en je huisgenoot.</Row>
        <Row icon={<Icon name="bell" />} title="Een seintje op het goede moment">Als je thuiskomt, of op een tijd die jij kiest.</Row>
      </ul>
      <button className="btn primary block" onClick={onNext}>Laten we beginnen</button>
    </>
  )
}

function PickTasks({ onNext }: { onNext: () => void }) {
  const { d, act } = useApp()
  const [phase, setPhase] = useState<'rooms' | 'tasks'>('rooms')
  const [rooms, setRooms] = useState<string[]>(d.household.rooms ?? DEFAULT_ROOMS)
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const existing = new Set(d.tasks.filter((t) => !t.archived && t.catalog_id).map((t) => t.catalog_id!))

  const toRooms = (id: string) => setRooms((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id]))
  const goTasks = () => {
    // Populaire taken uit je ruimtes staan alvast aan.
    setSel(new Set(CATALOG.filter((r) => rooms.includes(r.id)).flatMap((r) => r.tasks.filter((t) => t.popular).map((t) => t.id))))
    setPhase('tasks'); scrollTo({ top: 0 })
  }
  const toggle = (t: CatalogTask) => setSel((s) => { const n = new Set(s); n.has(t.id) ? n.delete(t.id) : n.add(t.id); return n })

  async function save() {
    setBusy(true)
    await act.patchHousehold({ rooms })
    await act.addCatalog(CATALOG.flatMap((r) => r.tasks).filter((t) => sel.has(t.id) && !existing.has(t.id)))
    setBusy(false)
    onNext()
  }

  if (phase === 'rooms') return (
    <>
      <Art name="tasks" />
      <h1 className="tour-title">Welke ruimtes hebben jullie?</h1>
      <p className="muted center">Dan laat ik alleen taken zien die bij jullie huis passen.</p>
      <div className="room-grid stagger">
        {CATALOG.map((r) => (
          <button key={r.id} className={'room-tile' + (rooms.includes(r.id) ? ' on' : '')} onClick={() => toRooms(r.id)} aria-pressed={rooms.includes(r.id)}>
            <span className="room-emoji">{r.icon}</span><span>{r.label}</span>
            <span className="pick-check"><Icon name="check" size={13} /></span>
          </button>
        ))}
      </div>
      <button className="btn primary block sticky-cta" onClick={goTasks} disabled={!rooms.length}>Volgende</button>
    </>
  )

  return (
    <>
      <h1 className="tour-title">Wat moet er bij jullie gebeuren?</h1>
      <p className="muted center">De meest gekozen taken staan al aan. Tik weg wat niet past, of zoek iets op. Hoe vaak en hoe lang heb ik al voor je ingevuld.</p>
      <div className="legend"><span><Icon name="repeat" size={15} /> hoe vaak</span><span><Icon name="clock" size={15} /> minuten</span><span>💪 zwaar · 🪶 licht</span></div>
      <CatalogPicker rooms={rooms} selected={sel} onToggle={toggle} existing={existing} />
      <button className="btn primary block sticky-cta" onClick={save} disabled={!sel.size || busy}>
        {busy ? <span className="spinner" /> : `${sel.size} ${sel.size === 1 ? 'taak' : 'taken'} toevoegen`}
      </button>
    </>
  )
}

function How({ onNext }: { onNext: () => void }) {
  return (
    <>
      <Art name="timer" />
      <h1 className="tour-title">Zo doe je een opruimronde</h1>
      <ul className="tour-list stagger">
        <Row icon={<span className="mini-check"><Icon name="check" size={14} /></span>} title="Vink af wat je gedaan hebt">Tik op het rondje voor een taak.</Row>
        <Row icon={<span className="mini-btn primary"><Icon name="play" size={12} fill /> Start</span>} title="Start de timer">Je krijgt een melding als de tijd om is, ook als je telefoon in je zak zit.</Row>
        <Row icon={<span className="mini-btn"><Icon name="moon" size={13} /> Later</span>} title="Even geen tijd?">Kies waarom (bijv. sportschool). Je krijgt later opnieuw een seintje.</Row>
        <Row icon={<span className="mini-dots"><Icon name="more" size={18} /></span>} title="Opties per taak">Verzet een taak naar morgen, of vraag je huisgenoot hem over te nemen.</Row>
        <Row icon={<Icon name="sparkle" />} title="Eerder klaar?">Dan stelt de app kleine extraatjes voor die nog in je tijd passen.</Row>
      </ul>
      <button className="btn primary block" onClick={onNext}>Duidelijk</button>
    </>
  )
}

function Together({ onNext }: { onNext: () => void }) {
  const { d } = useApp()
  const code = d.household.invite_code
  const [copied, setCopied] = useState(false)
  const share = async () => {
    const text = `Doe je mee met ons huishouden in Opgeruimd? Code: ${code}`
    if (navigator.share) await navigator.share({ title: 'Opgeruimd', text, url: location.origin + location.pathname }).catch(() => {})
    else { await navigator.clipboard.writeText(code); setCopied(true) }
  }
  return (
    <>
      <Art name="together" />
      <h1 className="tour-title">Samen, en eerlijk</h1>
      <ul className="tour-list stagger">
        <Row icon={<span className="emoji-ic">💪</span>} title="Zware taken tellen zwaarder">Wc schoonmaken telt meer dan planten water geven.</Row>
        <Row icon={<span className="emoji-ic">👫</span>} title="Samen gedaan? Telt voor allebei">Kies het na het afvinken via <Icon name="more" size={14} />.</Row>
        <Row icon={<span className="emoji-ic">🔥</span>} title="Houd jullie reeks vast">Rustdagen kies je zelf en breken je reeks niet.</Row>
        <Row icon={<span className="emoji-ic">🏡</span>} title="Huis-meter">Zie per ruimte hoe het huis ervoor staat.</Row>
      </ul>
      {d.members.length < 2 && (
        <div className="card invite-mini pop-in">
          <span className="muted small">Code voor je huisgenoot</span>
          <div className="code-row"><span className="code">{code}</span>
            <button className="btn soft" onClick={share}><Icon name="share" size={18} /> {copied ? 'Gekopieerd' : 'Delen'}</button></div>
        </div>
      )}
      <button className="btn primary block" onClick={onNext}>Volgende</button>
    </>
  )
}

function Phone({ onNext }: { onNext: () => void }) {
  const { d, act } = useApp()
  const { me } = d
  const [push, setPush] = useState('…')
  const [err, setErr] = useState('')
  const [mode, setMode] = useState<'time' | 'arrive'>('time')
  const [copied, setCopied] = useState(false)
  useEffect(() => { pushState().then(setPush) }, [])
  const arriveUrl = `${SUPABASE_URL}/functions/v1/arrive?t=${me.arrive_token}`

  const turnOn = async () => {
    setErr('')
    try { await enablePush(me.user_id); setPush('on') } catch (e) { setErr((e as Error).message) }
  }
  const openShortcuts = async () => {
    await navigator.clipboard.writeText(arriveUrl).catch(() => {})
    setCopied(true)
    location.href = 'shortcuts://'
  }

  return (
    <>
      <Art name="phone" />
      <h1 className="tour-title">Maak je iPhone klaar</h1>
      <ol className="setup stagger">
        <li className={isStandalone ? 'done' : ''}>
          <span className="setup-ic"><Icon name="plusSquare" /></span>
          <span className="grow"><b>Op je beginscherm</b><br />
            <span className="muted small">{isStandalone ? 'Staat erop.' : isIOS ? 'Safari → Deel → Zet op beginscherm' : 'Op je iPhone: Safari → Deel → Zet op beginscherm'}</span></span>
          {isStandalone && <span className="ok pop-in"><Icon name="check" size={16} /></span>}
        </li>
        <li className={push === 'on' ? 'done' : ''}>
          <span className="setup-ic"><Icon name="bell" /></span>
          <span className="grow"><b>Meldingen</b><br />
            <span className="muted small">{push === 'on' ? 'Staan aan.' : push === 'denied' ? 'Geblokkeerd: zet ze aan in je iPhone-instellingen → Meldingen → Opgeruimd' : 'Voor herinneringen, de timer en je huisgenoot.'}</span></span>
          {push === 'on'
            ? <span className="ok pop-in"><Icon name="check" size={16} /></span>
            : push === 'off' && <button className="btn primary small" onClick={turnOn}>Zet aan</button>}
        </li>
        {err && <p className="error shake">{err}</p>}
        <li className="col">
          <div className="setup-head">
            <span className="setup-ic"><Icon name="clock" /></span>
            <span className="grow"><b>Wanneer wil je een seintje?</b></span>
          </div>
          <div className="segmented" data-active={mode === 'time' ? 0 : 1}>
            <span className="seg-pill" />
            <button className={mode === 'time' ? 'on' : ''} onClick={() => setMode('time')}>⏰ Vaste tijd</button>
            <button className={mode === 'arrive' ? 'on' : ''} onClick={() => setMode('arrive')}>📍 Als ik thuiskom</button>
          </div>
          {mode === 'time' ? (
            <div className="setting-row fade-in">
              <span className="grow">Elke dag om</span>
              <input type="time" className="field time" value={me.fallback_time?.slice(0, 5) ?? '18:30'}
                onChange={(e) => act.patchMe({ fallback_time: e.target.value || null })} aria-label="Herinneringstijd" />
            </div>
          ) : (
            <div className="fade-in">
              <p className="muted small apple-note">Apple laat apps dit niet zelf instellen. Het kost je eenmalig ongeveer een minuut, daarna gaat het vanzelf.</p>
              <button className="btn primary block" onClick={openShortcuts}><Icon name="copy" size={18} /> {copied ? 'Link gekopieerd, open Opdrachten' : 'Kopieer link en open Opdrachten'}</button>
              <ol className="mini-steps">
                <li><b>Automatisering</b> (onderin) → <b>+</b></li>
                <li>Kies <b>Kom aan</b> → kies je <b>huisadres</b> → zet <b>Voer direct uit</b> aan → <b>Volgende</b></li>
                <li><b>Nieuwe lege automatisering</b> → zoek <b>URL</b> → kies <b>Haal inhoud van URL op</b></li>
                <li>Tik op <b>URL</b>, <b>plak</b> de link en tik op <b>Gereed</b> ✅</li>
              </ol>
              <p className="muted small">Je vaste tijd ({me.fallback_time?.slice(0, 5) ?? '18:30'}) blijft als reserve, voor als het thuiskom-seintje niet komt.</p>
            </div>
          )}
        </li>
      </ol>
      <button className="btn primary block" onClick={onNext}>{push === 'on' ? 'Klaar!' : 'Volgende'}</button>
      {push !== 'on' && <p className="muted small center">Je kunt dit altijd later doen bij Instellingen.</p>}
    </>
  )
}

function First({ onDone }: { onDone: () => void }) {
  const { d, act } = useApp()
  const today = localDate()
  const mine = d.items.filter((i) => i.date === today && i.user_id === d.me.user_id)
  const [ready, setReady] = useState(mine.length > 0)
  const title = (id: string) => d.tasks.find((t) => t.id === id)?.title ?? 'Taak'

  // Zorg dat de eerste opruimronde altijd iets bevat, ook als vandaag niks "aan de beurt" is.
  useEffect(() => {
    if (mine.length) return
    ;(async () => {
      await fillPlan(sb, d.household.id, today)
      const { data } = await sb.from('plan_items').select('id').eq('date', today).eq('user_id', d.me.user_id)
      if (!data?.length) {
        const planned = new Set(d.items.filter((i) => i.date === today).map((i) => i.task_id))
        let left = d.household.block_minutes
        const pick = suggestExtras(d.tasks, today, planned, left).filter((t) => (left -= t.minutes) >= 0)
        const fallback = pick.length ? pick : d.tasks.filter((t) => !t.archived && !planned.has(t.id)).slice(0, 2)
        if (fallback.length) await sb.from('plan_items').insert(fallback.map((t) => ({ household_id: d.household.id, date: today, task_id: t.id, user_id: d.me.user_id, minutes: t.minutes })))
      }
      act.reload()
      setReady(true)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const total = mine.reduce((s, i) => s + i.minutes, 0)
  const start = async () => { onDone(); await act.startTimer(d.household.block_minutes) }

  return (
    <>
      <Art name="together" />
      <h1 className="tour-title">Je eerste opruimronde</h1>
      <p className="muted center">{mine.length ? `${mine.length} ${mine.length === 1 ? 'taakje' : 'taakjes'} · ±${total} minuten. Zin om meteen te beginnen?` : 'Even je taakjes klaarzetten…'}</p>
      <ul className="card first-list stagger">
        {!ready && !mine.length && <li className="skeleton" />}
        {mine.map((i) => {
          const t = d.tasks.find((x) => x.id === i.task_id)
          return (
            <li key={i.id} className="task">
              <Check done={false} onClick={() => {}} label={title(i.task_id)} />
              <span className="task-main"><span className="task-title">{title(i.task_id)}</span>
                <span className="muted small">{room(t?.room ?? null).icon} {room(t?.room ?? null).label} · {i.minutes} min</span></span>
            </li>
          )
        })}
      </ul>
      <button className="btn primary block big-cta" onClick={start} disabled={!mine.length}>
        <Icon name="play" size={18} fill /> Start mijn opruimronde
      </button>
      <button className="btn ghost block" onClick={onDone}>Later vandaag</button>
    </>
  )
}
