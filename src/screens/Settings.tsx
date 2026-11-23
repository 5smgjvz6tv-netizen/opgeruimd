import { useEffect, useRef, useState } from 'react'
import { SUPABASE_URL } from '../config'
import { Avatar, DAYS } from '../components/Bits'
import { Icon } from '../components/Icon'
import { sb, useApp } from '../lib/data'
import { enablePush, isIOS, isStandalone, pushState } from '../lib/push'
import { haptic, setSound, sound, soundOn } from '../lib/feel'

// Instellingen met beeld in plaats van uitleg: draai, schuif en tik. Elke keuze zegt live wat hij doet.
const NOTIFY: [string, string, string][] = [
  ['reminder', '🏡', 'Herinnering'],
  ['timer', '⏰', 'Timer klaar'],
  ['swap', '🔄', 'Ruilverzoek'],
  ['done', '✅', 'Ander is klaar'],
  ['task', '➕', 'Nieuwe taak'],
  ['kudos', '👏', 'High fives'],
]
const COLORS = ['#0FA37F', '#FF8A5B', '#4F7CFF', '#B45CF0', '#F2B705', '#E5487A', '#14B8C4', '#6B7A74']
const DAY_LONG = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag']

/** Bewaar pas als je even stilstaat met schuiven (niet bij elke pixel). */
function useDebounced<T>(value: T, save: (v: T) => void, ms = 450) {
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    const t = setTimeout(() => save(value), ms)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
}

export function Settings() {
  const { d, act } = useApp()
  const { me, household: hh } = d
  const [push, setPush] = useState<string>('…')
  const [err, setErr] = useState('')
  const [tested, setTested] = useState(false)
  useEffect(() => { pushState().then(setPush) }, [])

  const [block, setBlock] = useState(hh.block_minutes)
  useDebounced(block, (v) => act.patchHousehold({ block_minutes: v }))
  const toMin = (t: string | null) => (t ? Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5)) : 18 * 60 + 30)
  const [time, setTime] = useState(toMin(me.fallback_time))
  const [onlyArrive, setOnlyArrive] = useState(!me.fallback_time)
  useDebounced(time, (v) => !onlyArrive && act.patchMe({ fallback_time: fmt(v) }))

  async function turnOn() {
    setErr('')
    try { await enablePush(me.user_id); setPush('on') } catch (e) { setErr((e as Error).message) }
  }
  const pushOn = push === 'on'

  return (
    <div className="screen settings">
      <header className="large-title"><h1>Instellingen</h1></header>

      {/* ——— Opruimronde ——— */}
      <Head icon="⏱️" title="Je opruimronde" sub="Hoe lang en wanneer jullie opruimen" />
      <section className="card center-card">
        <Dial value={block} min={5} max={30} step={5} onChange={setBlock} />
        <p className="live">≈ {Math.max(1, Math.round(block / 6))} {Math.round(block / 6) === 1 ? 'taakje' : 'taakjes'} per ronde{block >= 25 ? ' · lekker doorwerken 💪' : block <= 10 ? ' · kort en krachtig ⚡' : ''}</p>
      </section>

      <section className="card">
        <h4 className="card-q">🌿 Rustdagen</h4>
        <p className="muted small">Tik op dagen waarop jullie vrij zijn. Dan plan ik niks in.</p>
        <div className="days">
          {DAYS.map((l, i) => {
            const rest = hh.rest_days.includes(i)
            return (
              <button key={l} className={'day' + (rest ? ' rest' : '')} aria-pressed={rest} aria-label={`${DAY_LONG[i]}${rest ? ', rustdag' : ''}`}
                onClick={() => act.patchHousehold({ rest_days: rest ? hh.rest_days.filter((x) => x !== i) : [...hh.rest_days, i] })}>
                <span className="day-l">{l}</span>
                <span className="day-dot">{rest ? <span className="leaf">🌿</span> : <span className="broom">🧹</span>}</span>
              </button>
            )
          })}
        </div>
        <p className="live">{hh.rest_days.length ? `Vrij op ${hh.rest_days.slice().sort().map((i) => DAY_LONG[i]).join(' en ')}` : 'Geen rustdagen: elke dag een kwartiertje'}</p>
      </section>

      {/* ——— Seintje ——— */}
      <Head icon="🔔" title="Wanneer krijg je een seintje?" sub="Als je thuiskomt, of op een vaste tijd" />
      <section className="card">
        <TimeSlider value={time} disabled={onlyArrive} onChange={setTime} />
        <p className="live">{onlyArrive ? 'Alleen als je thuiskomt 📍' : `Elke dag om ${fmt(time)}, tenzij je eerder thuiskomt`}</p>
        <div className="tiles two">
          <Tile on={!onlyArrive} icon="⏰" label="Vaste tijd" onClick={() => { setOnlyArrive(false); act.patchMe({ fallback_time: fmt(time) }) }} />
          <Tile on={onlyArrive} icon="📍" label="Alleen thuiskomen" onClick={() => { setOnlyArrive(true); act.patchMe({ fallback_time: null }) }} />
        </div>
        <Arrive url={`${SUPABASE_URL}/functions/v1/arrive?t=${me.arrive_token}`} />
      </section>

      {/* ——— Meldingen ——— */}
      <Head icon="📣" title="Meldingen" sub="Tik aan waar je een melding van wilt" />
      <section className={'card push-card' + (pushOn ? ' on' : '')}>
        <span className="push-bell">{pushOn ? '🔔' : '🔕'}</span>
        <span className="grow">
          <b>{pushOn ? 'Meldingen staan aan' : 'Meldingen staan uit'}</b><br />
          <span className="muted small">
            {!isStandalone && isIOS ? 'Zet de app eerst op je beginscherm (Safari → Deel → Zet op beginscherm)'
              : push === 'denied' ? 'Geblokkeerd: iPhone-instellingen → Meldingen → Opgeruimd'
              : push === 'unsupported' ? 'Deze browser kan geen meldingen tonen'
              : pushOn ? 'Je krijgt seintjes op je iPhone' : 'Zet ze aan voor herinneringen en de timer'}
          </span>
        </span>
        {pushOn
          ? <button className="btn soft small" onClick={async () => { await act.testPush(); setTested(true) }}>{tested ? 'Verstuurd ✓' : 'Test'}</button>
          : push === 'off' && <button className="btn primary small" onClick={turnOn}>Zet aan</button>}
      </section>
      {err && <p className="error shake">{err}</p>}
      <section className={'card' + (pushOn ? '' : ' dimmed')}>
        <div className="tiles">
          {NOTIFY.map(([key, icon, label]) => (
            <Tile key={key} on={me.notify?.[key] !== false} icon={icon} label={label}
              onClick={() => { haptic(4); act.patchMe({ notify: { ...me.notify, [key]: me.notify?.[key] === false } }) }} />
          ))}
        </div>
      </section>

      <Head icon="✨" title="Gevoel" sub="Kleine beloningen als je iets afvinkt" />
      <FeelTiles />

      {/* ——— Jij ——— */}
      <Head icon="🎨" title="Jij" sub="Zo zie je je huisgenoot jou in de app" />
      <Me />

      {/* ——— Huishouden ——— */}
      <Head icon="🏠" title="Jullie huishouden" />
      <section className="card">
        <div className="code-row">
          <span className="code">{hh.invite_code}</span>
          <button className="btn soft" onClick={() => navigator.share
            ? navigator.share({ title: 'Opgeruimd', text: `Doe je mee met ons huishouden in Opgeruimd? Code: ${hh.invite_code}`, url: location.origin + location.pathname }).catch(() => {})
            : navigator.clipboard.writeText(hh.invite_code)}><Icon name="share" size={18} /> Delen</button>
        </div>
        <p className="muted small">Met deze code doet je huisgenoot mee</p>
      </section>

      <section className="card list-card">
        <button className="nav-row" onClick={() => act.patchMe({ onboarded_at: null })}>
          <span className="nav-ic">✨</span><span className="grow"><b>Rondleiding opnieuw</b><br /><span className="muted small">Alle uitleg en de takenbibliotheek nog eens</span></span><Icon name="chevron" size={16} />
        </button>
        <button className="nav-row danger" onClick={() => sb.auth.signOut()}>
          <span className="nav-ic">👋</span><span className="grow"><b>Uitloggen</b></span><Icon name="chevron" size={16} />
        </button>
      </section>
      <p className="muted small center">Opgeruimd · samen een kwartiertje per dag</p>
    </div>
  )
}

const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

function Head({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return <header className="set-head"><h3><span>{icon}</span>{title}</h3>{sub && <p>{sub}</p>}</header>
}

function Tile({ on, icon, label, onClick }: { on: boolean; icon: string; label: string; onClick: () => void }) {
  return (
    <button className={'tile' + (on ? ' on' : '')} aria-pressed={on} onClick={onClick}>
      <span className="tile-ic">{icon}</span><span>{label}</span>
      <span className="tile-check"><Icon name="check" size={12} /></span>
    </button>
  )
}

/** Draaiknop: sleep rond de ring om de lengte van je opruimronde te kiezen. */
function Dial({ value, min, max, step, onChange }: { value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  const ref = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)
  const R = 78, C = 2 * Math.PI * R, SPAN = 0.78 // 280° boog
  const frac = (value - min) / (max - min)
  const ang = -220 + frac * 280 // graden, 0 = rechts
  const knob = { x: 100 + R * Math.cos((ang * Math.PI) / 180), y: 100 + R * Math.sin((ang * Math.PI) / 180) }

  const fromPoint = (cx: number, cy: number) => {
    const r = ref.current!.getBoundingClientRect()
    let a = (Math.atan2(cy - (r.top + r.height / 2), cx - (r.left + r.width / 2)) * 180) / Math.PI
    a = ((a + 220 + 360) % 360)
    if (a > 280) a = a > 320 ? 0 : 280
    const v = Math.round((min + (a / 280) * (max - min)) / step) * step
    if (v !== value) { haptic(4); sound('tick'); onChange(Math.min(max, Math.max(min, v))) }
  }
  return (
    <div className="dial">
      <svg ref={ref} viewBox="0 0 200 200" role="slider" tabIndex={0} aria-label="Lengte van je opruimronde"
        aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} aria-valuetext={`${value} minuten`}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onChange(Math.min(max, value + step))
          if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onChange(Math.max(min, value - step))
        }}
        onPointerDown={(e) => { dragging.current = true; (e.target as Element).setPointerCapture?.(e.pointerId); fromPoint(e.clientX, e.clientY) }}
        onPointerMove={(e) => dragging.current && fromPoint(e.clientX, e.clientY)}
        onPointerUp={() => { dragging.current = false }} onPointerCancel={() => { dragging.current = false }}>
        <circle cx="100" cy="100" r={R} className="dial-track" strokeDasharray={`${C * SPAN} ${C}`} transform="rotate(140 100 100)" />
        <circle cx="100" cy="100" r={R} className="dial-fill" strokeDasharray={`${C * SPAN * frac} ${C}`} transform="rotate(140 100 100)" />
        {Array.from({ length: (max - min) / step + 1 }, (_, i) => {
          const a = ((-220 + (i / ((max - min) / step)) * 280) * Math.PI) / 180
          return <circle key={i} cx={100 + (R - 18) * Math.cos(a)} cy={100 + (R - 18) * Math.sin(a)} r="2" className={'dial-tick' + (min + i * step <= value ? ' on' : '')} />
        })}
        <circle cx={knob.x} cy={knob.y} r="14" className="dial-knob" />
      </svg>
      <div className="dial-label"><b key={value} className="count">{value}</b><span>minuten</span></div>
    </div>
  )
}

/** Tijdslider van de middag tot de avond, met een wolkje dat meeschuift. */
function TimeSlider({ value, disabled, onChange }: { value: number; disabled: boolean; onChange: (v: number) => void }) {
  const MIN = 15 * 60, MAX = 22 * 60
  const pct = ((value - MIN) / (MAX - MIN)) * 100
  return (
    <div className={'tslider' + (disabled ? ' off' : '')}>
      <div className="ts-bubble" style={{ left: `${pct}%` }}>{fmt(value)}</div>
      <input type="range" min={MIN} max={MAX} step={15} value={value} disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))} style={{ ['--p' as string]: `${pct}%` }} aria-label="Herinneringstijd" aria-valuetext={fmt(value)} />
      <div className="ts-ends"><span>☀️ 15:00</span><span>🌙 22:00</span></div>
    </div>
  )
}

function Arrive({ url }: { url: string }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  return (
    <div className={'arrive' + (open ? ' open' : '')}>
      <button className="nav-row" onClick={() => setOpen((x) => !x)} aria-expanded={open}>
        <span className="nav-ic">📍</span>
        <span className="grow"><b>Seintje als je thuiskomt</b><br /><span className="muted small">Eenmalig instellen in Opdrachten, ongeveer 1 minuut</span></span>
        <span className="chev"><Icon name="chevron" size={16} /></span>
      </button>
      <div className="cat-body"><div>
        <button className="btn primary block" onClick={async () => { await navigator.clipboard.writeText(url).catch(() => {}); setCopied(true); location.href = 'shortcuts://' }}>
          <Icon name="copy" size={18} /> {copied ? 'Link gekopieerd, open Opdrachten' : 'Kopieer link en open Opdrachten'}
        </button>
        <ol className="mini-steps">
          <li><b>Automatisering</b> (onderin) → <b>+</b></li>
          <li><b>Kom aan</b> → kies je <b>huisadres</b> → <b>Voer direct uit</b> aan → <b>Volgende</b></li>
          <li><b>Nieuwe lege automatisering</b> → zoek <b>URL</b> → <b>Haal inhoud van URL op</b></li>
          <li>Tik op <b>URL</b>, <b>plak</b> de link en tik op <b>Gereed</b> ✅</li>
        </ol>
        <p className="muted small">Apple laat apps dit niet zelf instellen, daarom deze paar tikjes.</p>
      </div></div>
    </div>
  )
}

function FeelTiles() {
  const [on, setOn] = useState(soundOn())
  return (
    <section className="card">
      <div className="tiles two">
        <Tile on={on} icon={on ? '🔊' : '🔇'} label="Geluidjes" onClick={() => { setSound(!on); setOn(!on); if (!on) setTimeout(() => sound('pop'), 50) }} />
        <Tile on icon="📳" label="Trillen" onClick={() => haptic([10, 60, 10])} />
      </div>
      <p className="live">{on ? 'Plopje bij afvinken, deuntje als je klaar bent 🎵' : 'Stil: alleen een tikje in je hand'}</p>
    </section>
  )
}

function Me() {
  const { d, act } = useApp()
  const { me } = d
  const [name, setName] = useState(me.name)
  const [color, setColor] = useState(me.color)
  return (
    <section className="card me-card">
      <div className="me-preview" style={{ ['--c' as string]: color }}>
        <Avatar m={{ name: name || '?', color }} size={84} />
      </div>
      <input className="field center-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Je naam"
        onBlur={() => name.trim() && name.trim() !== me.name && act.patchMe({ name: name.trim() })} aria-label="Naam" />
      <div className="colors center">
        {COLORS.map((c) => (
          <button key={c} className={'swatch' + (color === c ? ' on' : '')} style={{ background: c }} aria-label={`Kleur ${c}`} aria-pressed={color === c}
            onClick={() => { setColor(c); act.patchMe({ color: c }) }} />
        ))}
      </div>
    </section>
  )
}

