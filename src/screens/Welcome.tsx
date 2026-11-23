import { useState } from 'react'
import { fillPlan, localDate } from '../../supabase/functions/_shared/planner'
import { sb } from '../lib/data'
import { STARTERS } from '../lib/rooms'

export function Login() {
  const [mode, setMode] = useState<'in' | 'up'>('up')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setBusy(true)
    const { error } = mode === 'up'
      ? await sb.auth.signUp({ email, password: pw })
      : await sb.auth.signInWithPassword({ email, password: pw })
    setBusy(false)
    if (error) setErr(error.message.includes('Invalid login') ? 'E-mail of wachtwoord klopt niet' : error.message.includes('already') ? 'Dit e-mailadres heeft al een account. Log in.' : error.message)
  }

  return (
    <div className="welcome">
      <div className="welcome-hero">
        <img src={import.meta.env.BASE_URL + 'icon.svg'} alt="" className="app-icon" />
        <h1>Opgeruimd</h1>
        <p className="muted">15 minuten per dag, samen.<br />En het huis blijft gewoon op orde.</p>
      </div>
      <form className="card" onSubmit={submit}>
        <div className="segmented">
          <button type="button" className={mode === 'up' ? 'on' : ''} onClick={() => setMode('up')}>Nieuw account</button>
          <button type="button" className={mode === 'in' ? 'on' : ''} onClick={() => setMode('in')}>Inloggen</button>
        </div>
        <input className="field" type="email" autoComplete="email" placeholder="E-mailadres" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="field" type="password" autoComplete={mode === 'up' ? 'new-password' : 'current-password'} placeholder="Wachtwoord (min. 6 tekens)" minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} required />
        {err && <p className="error">{err}</p>}
        <button className="btn primary block" disabled={busy}>{busy ? 'Even geduld…' : mode === 'up' ? 'Account maken' : 'Inloggen'}</button>
      </form>
    </div>
  )
}

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [join, setJoin] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function go(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setBusy(true)
    if (join) {
      const { data: hid, error } = await sb.rpc('join_household', { code, my_name: name })
      if (error) { setBusy(false); return setErr(error.message) }
      await fillPlan(sb, hid, localDate()) // meteen meedoen met wat vandaag nog openstaat
    } else {
      const { data: hid, error } = await sb.rpc('create_household', { my_name: name })
      if (error) { setBusy(false); return setErr(error.message) }
      await sb.from('tasks').insert(STARTERS.map((t) => ({ ...t, weekdays: 'weekdays' in t ? [...t.weekdays] : [], household_id: hid })))
    }
    onDone()
  }

  return (
    <div className="welcome">
      <div className="welcome-hero">
        <span className="big-emoji">👋</span>
        <h1>Welkom!</h1>
        <p className="muted">Nog twee dingetjes en je bent klaar.</p>
      </div>
      <form className="card" onSubmit={go}>
        <label className="label">Hoe heet je?</label>
        <input className="field" placeholder="Je voornaam" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        <label className="label">Jullie huishouden</label>
        <div className="segmented">
          <button type="button" className={!join ? 'on' : ''} onClick={() => setJoin(false)}>Nieuw beginnen</button>
          <button type="button" className={join ? 'on' : ''} onClick={() => setJoin(true)}>Ik heb een code</button>
        </div>
        {join
          ? <input className="field mono" placeholder="Code, bijv. 3F9A2C" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={6} required />
          : <p className="muted small">Ik zet alvast een paar veelvoorkomende taken klaar. Die kun je daarna aanpassen of weghalen.</p>}
        {err && <p className="error">{err}</p>}
        <button className="btn primary block" disabled={busy || !name.trim()}>{busy ? 'Even geduld…' : 'Aan de slag'}</button>
      </form>
    </div>
  )
}
