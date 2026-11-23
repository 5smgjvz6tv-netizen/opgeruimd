import { useState } from 'react'
import { fillPlan, localDate } from '../../supabase/functions/_shared/planner'
import { Icon } from '../components/Icon'
import { sb } from '../lib/data'
import { isIOS, isStandalone } from '../lib/push'

const BASE = import.meta.env.BASE_URL

export function Login() {
  const [mode, setMode] = useState<'in' | 'up'>('up')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  // Op iPhone eerst op het beginscherm zetten: die app heeft een eigen login, los van Safari.
  const [browserAnyway, setBrowserAnyway] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setBusy(true)
    const { error } = mode === 'up'
      ? await sb.auth.signUp({ email, password: pw })
      : await sb.auth.signInWithPassword({ email, password: pw })
    setBusy(false)
    if (error) setErr(error.message.includes('Invalid login') ? 'E-mail of wachtwoord klopt niet' : error.message.includes('already') ? 'Dit e-mailadres heeft al een account. Log in.' : error.message)
  }

  if (isIOS && !isStandalone && !browserAnyway) return <InstallFirst onSkip={() => setBrowserAnyway(true)} />

  return (
    <div className="welcome">
      <div className="welcome-hero rise">
        <img src={BASE + 'icon.svg'} alt="" className="app-icon" />
        <h1>Opgeruimd</h1>
        <p className="muted">Samen een kwartiertje per dag.<br />En het huis blijft gewoon op orde.</p>
      </div>
      <form className="card rise" style={{ animationDelay: '80ms' }} onSubmit={submit}>
        <div className="segmented" data-active={mode === 'up' ? 0 : 1}>
          <span className="seg-pill" />
          <button type="button" className={mode === 'up' ? 'on' : ''} onClick={() => setMode('up')}>Nieuw account</button>
          <button type="button" className={mode === 'in' ? 'on' : ''} onClick={() => setMode('in')}>Inloggen</button>
        </div>
        <input className="field" type="email" autoComplete="email" placeholder="E-mailadres" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="field" type="password" autoComplete={mode === 'up' ? 'new-password' : 'current-password'} placeholder="Wachtwoord (min. 6 tekens)" minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} required />
        {err && <p className="error shake">{err}</p>}
        <button className="btn primary block" disabled={busy}>{busy ? <span className="spinner" /> : mode === 'up' ? 'Account maken' : 'Inloggen'}</button>
      </form>
    </div>
  )
}

/** iPhone in Safari: eerst de app op het beginscherm zetten. */
function InstallFirst({ onSkip }: { onSkip: () => void }) {
  return (
    <div className="welcome">
      <div className="welcome-hero rise">
        <img src={BASE + 'icon.svg'} alt="" className="app-icon" />
        <h1>Zet Opgeruimd op je beginscherm</h1>
        <p className="muted">Dan werkt hij als een echte app, mét meldingen.</p>
      </div>
      <ol className="card big-steps rise" style={{ animationDelay: '80ms' }}>
        <li>
          <span className="step-icon"><Icon name="share" size={22} /></span>
          <span>Tik onderin Safari op <b>Deel</b><br /><span className="muted small">Het vierkantje met het pijltje omhoog</span></span>
        </li>
        <li>
          <span className="step-icon"><Icon name="plusSquare" size={22} /></span>
          <span>Scroll en kies <b>Zet op beginscherm</b><br /><span className="muted small">Tik daarna rechtsboven op <b>Voeg toe</b></span></span>
        </li>
        <li>
          <span className="step-icon"><img src={BASE + 'icon.svg'} alt="" width={26} height={26} style={{ borderRadius: 7 }} /></span>
          <span>Open <b>Opgeruimd</b> vanaf je beginscherm<br /><span className="muted small">Daar maak je je account aan</span></span>
        </li>
      </ol>
      <div className="safari-hint rise" style={{ animationDelay: '160ms' }} aria-hidden="true"><Icon name="share" size={20} /><span className="bob">↓</span></div>
      <button className="btn ghost block" onClick={onSkip}>Toch verder in de browser</button>
    </div>
  )
}

/** Naam + nieuw huishouden of meedoen met een code. */
export function Setup({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [join, setJoin] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function go(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setBusy(true)
    const { data: hid, error } = join
      ? await sb.rpc('join_household', { code, my_name: name })
      : await sb.rpc('create_household', { my_name: name })
    if (error) { setBusy(false); return setErr(error.message) }
    if (join) await fillPlan(sb, hid, localDate()) // meteen meedoen met wat vandaag nog openstaat
    onDone()
  }

  return (
    <div className="welcome">
      <div className="welcome-hero rise">
        <span className="big-emoji wave">👋</span>
        <h1>Welkom!</h1>
        <p className="muted">Eerst even kennismaken.</p>
      </div>
      <form className="card rise" style={{ animationDelay: '80ms' }} onSubmit={go}>
        <label className="label">Hoe heet je?</label>
        <input className="field" placeholder="Je voornaam" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        <label className="label">Jullie huishouden</label>
        <div className="segmented" data-active={join ? 1 : 0}>
          <span className="seg-pill" />
          <button type="button" className={!join ? 'on' : ''} onClick={() => setJoin(false)}>🏡 Nieuw beginnen</button>
          <button type="button" className={join ? 'on' : ''} onClick={() => setJoin(true)}>🔑 Ik heb een code</button>
        </div>
        {join
          ? <input className="field mono" placeholder="Code, bijv. 3F9A2C" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={6} required />
          : <p className="muted small hint">Je huisgenoot kan later meedoen met een code die je in de app vindt.</p>}
        {err && <p className="error shake">{err}</p>}
        <button className="btn primary block" disabled={busy || !name.trim()}>{busy ? <span className="spinner" /> : 'Volgende'}</button>
      </form>
    </div>
  )
}
