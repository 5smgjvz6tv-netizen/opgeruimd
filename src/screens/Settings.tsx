import { useEffect, useState } from 'react'
import { SUPABASE_URL } from '../config'
import { Chips, DAYS } from '../components/Bits'
import { Icon } from '../components/Icon'
import { sb, useApp } from '../lib/data'
import { enablePush, isIOS, isStandalone, pushState } from '../lib/push'

const NOTIFY: [string, string, string][] = [
  ['reminder', 'Herinnering voor je opruimronde', 'Als je thuiskomt, op je reservetijd of na een snooze'],
  ['timer', 'Timer is klaar', 'Als de tijd van je opruimronde om is'],
  ['swap', 'Ruilverzoeken', 'Als iemand vraagt of je iets overneemt'],
  ['done', 'Huisgenoot is klaar', 'Als de ander de opruimronde heeft afgerond'],
  ['task', 'Nieuwe taak toegevoegd', 'Als de ander een taak toevoegt'],
  ['kudos', 'High fives', 'Als je huisgenoot je een 👏 geeft voor een klus'],
]
const COLORS = ['#0FA37F', '#FF8A5B', '#4F7CFF', '#B45CF0', '#F2B705', '#E5487A']

export function Settings() {
  const { d, act } = useApp()
  const { me, household: hh } = d
  const [name, setName] = useState(me.name)
  const [push, setPush] = useState<string>('…')
  const [err, setErr] = useState('')
  const [copied, setCopied] = useState(false)
  const [tested, setTested] = useState(false)
  useEffect(() => { pushState().then(setPush) }, [])
  const arriveUrl = `${SUPABASE_URL}/functions/v1/arrive?t=${me.arrive_token}`

  async function turnOn() {
    setErr('')
    try { await enablePush(me.user_id); setPush('on') } catch (e) { setErr((e as Error).message) }
  }

  return (
    <div className="screen">
      <header className="large-title"><h1>Instellingen</h1></header>

      <h3 className="group-title">Meldingen</h3>
      <section className="card">
        {!isStandalone && isIOS ? (
          <ol className="steps">
            <li>Tik onderin Safari op <b>Deel</b> <Icon name="share" size={16} /></li>
            <li>Kies <b>Zet op beginscherm</b></li>
            <li>Open Opgeruimd vanaf je beginscherm en zet hier de meldingen aan</li>
          </ol>
        ) : push === 'on' ? (
          <div className="setting-row">
            <span className="ok-dot" /> <span className="grow">Meldingen staan aan</span>
            <button className="btn soft small" onClick={async () => { await act.testPush(); setTested(true) }}>{tested ? 'Verstuurd ✓' : 'Test'}</button>
          </div>
        ) : push === 'denied' ? (
          <p>Meldingen zijn geblokkeerd. Zet ze aan via <b>Instellingen → Meldingen → Opgeruimd</b> op je iPhone.</p>
        ) : push === 'unsupported' ? (
          <p className="muted">Deze browser ondersteunt geen pushmeldingen.</p>
        ) : (
          <button className="btn primary block" onClick={turnOn}><Icon name="bell" size={18} /> Meldingen aanzetten</button>
        )}
        {err && <p className="error">{err}</p>}
      </section>
      <section className="card">
        {NOTIFY.map(([key, label, hint]) => {
          const on = me.notify?.[key] !== false
          return (
            <div className="switch-row" key={key}>
              <span className="grow">{label}<br /><span className="muted small">{hint}</span></span>
              <button className="switch" role="switch" aria-checked={on} aria-label={label}
                onClick={() => act.patchMe({ notify: { ...me.notify, [key]: !on } })} />
            </div>
          )
        })}
      </section>

      <h3 className="group-title">Thuiskomen</h3>
      <section className="card">
        <p>Laat je iPhone een seintje geven als je thuiskomt. Dan stuur ik meteen je lijstje.</p>
        <ol className="steps">
          <li>Open de app <b>Opdrachten</b> → <b>Automatisering</b> → <b>+</b></li>
          <li>Kies <b>Kom aan</b>, selecteer je huis, en zet <b>Voer direct uit</b> aan</li>
          <li>Voeg de actie <b>Haal inhoud van URL op</b> toe en plak deze link:</li>
        </ol>
        <div className="code-row">
          <code className="url">{arriveUrl.replace('https://', '')}</code>
          <button className="btn soft small" onClick={() => { navigator.clipboard.writeText(arriveUrl); setCopied(true) }}>
            <Icon name="copy" size={16} /> {copied ? 'Gekopieerd' : 'Kopieer'}
          </button>
        </div>
        <div className="setting-row">
          <span className="grow">Geen signaal gehad? Herinner me om</span>
          <input type="time" className="field time" value={me.fallback_time?.slice(0, 5) ?? ''}
            onChange={(e) => act.patchMe({ fallback_time: e.target.value || null })} aria-label="Reservetijd" />
        </div>
        <p className="muted small">Laat leeg als je alleen het thuiskom-signaal wilt gebruiken.</p>
      </section>

      <h3 className="group-title">Huishouden</h3>
      <section className="card">
        <label className="label">Lengte van een opruimronde</label>
        <Chips value={hh.block_minutes} onChange={(v) => act.patchHousehold({ block_minutes: v })}
          options={[10, 15, 20, 30].map((v) => ({ v, label: `${v} min` }))} />
        <label className="label">Rustdagen (dan plan ik niks in)</label>
        <Chips multi value={hh.rest_days} options={DAYS.map((l, v) => ({ v, label: l }))}
          onChange={(v) => act.patchHousehold({ rest_days: hh.rest_days.includes(v) ? hh.rest_days.filter((x) => x !== v) : [...hh.rest_days, v] })} />
        <p className="muted small">Uitnodigingscode: <b className="mono">{hh.invite_code}</b></p>
      </section>

      <h3 className="group-title">Jij</h3>
      <section className="card">
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => name.trim() && act.patchMe({ name: name.trim() })} aria-label="Naam" />
        <label className="label">Jouw kleur</label>
        <div className="colors">
          {COLORS.map((c) => (
            <button key={c} className={'swatch' + (me.color === c ? ' on' : '')} style={{ background: c }} onClick={() => act.patchMe({ color: c })} aria-label={`Kleur ${c}`} />
          ))}
        </div>
      </section>

      <button className="btn soft block" onClick={() => act.patchMe({ onboarded_at: null })}><Icon name="sparkle" size={18} /> Rondleiding opnieuw bekijken</button>
      <button className="btn ghost danger block" onClick={() => sb.auth.signOut()}>Uitloggen</button>
      <p className="muted small center">Opgeruimd · samen een kwartiertje per dag.</p>
    </div>
  )
}
