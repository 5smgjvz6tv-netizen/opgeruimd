import { useEffect, useMemo, useState } from 'react'
import { Check, Confetti, Ic, Ring, Segmented, XpBar } from '../components/Bits'
import { HomeLayoutPicker, HousePortrait } from '../components/HomeLayoutPicker'
import { LegalSheet, type LegalDoc } from '../components/LegalSheet'
import { initialLayout, recommendRound, starterTasks, roomGroups } from '../lib/homeLayout'
import { DayPicker, TimeSlider, Stepper } from '../components/Controls'
import { Bas } from '../components/Bas'
import { Icon } from '../components/Icon'
import { CATALOG, DEFAULT_ROOMS, catTitle } from '../lib/catalog'
import { sb } from '../lib/data'
import { floatText, haptic, sound } from '../lib/feel'
import { xpOf } from '../lib/game'
import { langChoice, lang, setLang, t } from '../lib/i18n'
import { applyDraft, loadDraft, saveDraft, type Draft } from '../lib/setup'
import { COLORS } from './Settings'

const BASE = import.meta.env.BASE_URL
type Step = 'welcome' | 'code' | 'you' | 'house' | 'rooms' | 'rhythm' | 'demo' | 'account' | 'login'

const fresh = (): Draft => ({ path: 'new', name: '', color: COLORS[Math.floor(Math.random() * COLORS.length)], size: 2, rooms: DEFAULT_ROOMS, sel: [], block: 15, rest: [], time: 18 * 60 + 30, code: '' })
/** Onboarding vóór het inloggen: kies, probeer en personaliseer. Pas aan het eind maak je een account. */
export function Onboard({ authed, userId, onDone }: { authed?: boolean; userId?: string; onDone: () => void }) {
  const [dr, setDr] = useState<Draft>(() => loadDraft() ?? fresh())
  useEffect(() => saveDraft(dr), [dr])
  const set = (p: Partial<Draft>) => setDr((x) => ({ ...x, ...p }))
  const steps: Step[] = dr.path === 'join'
    ? ['welcome', 'code', 'you', 'rhythm', 'account']
    : ['welcome', 'you', 'house', 'rooms', 'rhythm', 'account']
  const [step, setStep] = useState<Step>('welcome')
  const [dir, setDir] = useState(1)
  const i = steps.indexOf(step)
  const go = (s: Step) => { setDir(steps.indexOf(s) >= i ? 1 : -1); setStep(s); scrollTo({ top: 0 }) }
  const next = () => go(steps[Math.min(i + 1, steps.length - 1)])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function finish() {
    if (!userId) return
    setBusy(true); setErr('')
    try { await applyDraft(dr, userId); onDone() } catch (e) { setErr((e as Error).message); setBusy(false) }
  }

  const foot = (label: string, ok = true, onClick: () => void = next) => (
    <div className="ob-foot"><button className="btn primary block" disabled={!ok || busy} onClick={onClick}>{busy ? <span className="spinner" /> : label}</button>{err && <p className="error center">{err}</p>}</div>
  )
  const layout = dr.layout ?? initialLayout()
  const starter = starterTasks(layout)
  const advice = useMemo(() => recommendRound(layout, dr.size, dr.rest), [layout, dr.size, dr.rest])
  const [pickedBlock, setPickedBlock] = useState(false)
  useEffect(() => {
    if (!pickedBlock && dr.path === 'new' && dr.block !== advice.recommended) set({ block: advice.recommended })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advice.recommended, pickedBlock, dr.path])
  const [accountEmail, setAccountEmail] = useState('')
  const [returnStep, setReturnStep] = useState<Step>('welcome')
  const login = () => { setReturnStep(step); go('login') }

  return (
    <div className="ob">
      <header className="ob-top">
        {step !== 'welcome' && step !== 'login'
          ? <button className="icon-btn" onClick={() => go(step === 'demo' ? 'rhythm' : steps[Math.max(0, i - 1)])} aria-label={t('common.back')}><Icon name="back" size={20} /></button>
          : step === 'login' ? <button className="icon-btn" onClick={() => go(returnStep)} aria-label={t('common.back')}><Icon name="back" size={20} /></button> : <span style={{ width: 36 }} />}
        {step !== 'welcome' && step !== 'login' && <div className="ob-dots">{steps.slice(1).map((s, n) => <i key={s} className={n + 1 === i ? 'on' : n + 1 < i ? 'done' : ''} />)}</div>}
        <div style={{ width: 140 }}><Segmented value={langChoice() === 'auto' ? lang : langChoice()} onChange={(v) => setLang(v as 'nl' | 'en')} options={[{ v: 'nl', label: 'NL' }, { v: 'en', label: 'EN' }]} /></div>
      </header>

      <div className="ob-body" key={step} data-dir={dir}>
        {step === 'welcome' && (
          <>
            <div className="welcome-intro">
              <Bas className="welcome-mark" />
              <h1>Opgeruimd</h1>
              <p className="bas-intro">{t('ob.basIntro')}</p>
              <p className="ob-sub" style={{ marginTop: 0 }}>{t('app.tagline')}</p>
            </div>
            <div className="list welcome-features">
              <div className="row"><Ic name="timer" /><span className="row-main"><span className="row-title">{t('ob.w1')}</span><span className="row-sub">{t('ob.w1s')}</span></span></div>
              <div className="row"><Ic name="trophy"  /><span className="row-main"><span className="row-title">{t('ob.w2')}</span><span className="row-sub">{t('ob.w2s')}</span></span></div>
              <div className="row"><Ic name="duo"  /><span className="row-main"><span className="row-title">{t('ob.w3')}</span><span className="row-sub">{t('ob.w3s')}</span></span></div>
            </div>
            <div className="ob-foot welcome-actions">
              <button className="btn primary block" onClick={() => { set({ path: 'new' }); setDir(1); setStep('you') }}>{t('ob.start')}</button>
              <button className="btn soft block" onClick={() => { set({ path: 'join', size: 2 }); setDir(1); setStep('code') }}>{t('ob.haveCode')}</button>
              {!authed && <button className="btn ghost block" onClick={login}>{t('ob.haveAccount')}</button>}
            </div>
          </>
        )}

        {step === 'code' && <CodeStep code={dr.code} onCode={(code) => set({ code })} onNext={next} />}

        {step === 'you' && (
          <>
            <div className="name-entry">
              <h1 className="ob-title"><label htmlFor="first-name">{t('ob.youTitle')}</label></h1>
              <input id="first-name" className="field big" placeholder={t('ob.namePh')} value={dr.name}
                autoComplete="given-name" enterKeyHint="next" autoFocus onChange={e => set({ name: e.target.value })}
                onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing && dr.name.trim()) next() }} />
            </div>
            {foot(t('common.next'), !!dr.name.trim())}
          </>
        )}

        {step === 'house' && (
          <>
            <div><h1 className="ob-title">{t('ob.houseTitle')}</h1><p className="ob-sub">{t('ob.houseSub')}</p></div>
            <div className="choices">
              {([[1, 'solo', 'ob.solo', 'ob.soloSub'], [2, 'duo', 'ob.duo', 'ob.duoSub'], [3, 'group', 'ob.group', 'ob.groupSub']] as const).map(([n, icon, title, sub]) => {
                const on = n === 3 ? dr.size >= 3 : dr.size === n
                return (
                  <button key={n} className={'choice' + (on ? ' on' : '')} onClick={() => { haptic(4); set({ size: n === 3 ? Math.max(3, dr.size) : n }) }}>
                    <Ic name={icon} lg /><span className="row-main"><span className="row-title">{t(title)}</span><span className="row-sub">{t(sub)}</span>
                    </span><span className="radio" />
                  </button>
                )
              })}
              {dr.size >= 3 && <div className="row"><span className="grow">{t('ob.groupCount', { n: dr.size })}</span><Stepper value={dr.size} min={3} max={8} onChange={size => set({ size })} label={t('set.size')} /></div>}
            </div>
            {foot(t('common.next'))}
          </>
        )}

        {step === 'rooms' && (
          <>
            <div><h1 className="ob-title">{t('layout.title')}</h1><p className="ob-sub">{t('layout.intro')}</p></div>
            <HomeLayoutPicker home={layout} onChange={home => set({ layout: home, rooms: roomGroups(home), sel: starterTasks(home).map(task => task.id) })} />
            <div className="starter-preview"><Icon name="list-check" /><div><b>{t('layout.starter')}</b><p>{starter.map(catTitle).join(' · ')}</p>{layout.hasCleaner && <p className="cleaner-note">{t('layout.cleanerNote')}</p>}</div></div>
            {foot(t('common.next'), true, () => { set({ layout, rooms: roomGroups(layout), sel: starter.map(task => task.id) }); next() })}
          </>
        )}

        {step === 'rhythm' && (
          <div className="rhythm-step">
            <div><h1 className="ob-title">{t('ob.rhythmTitle')}</h1></div>
            {dr.path === 'new' && (
              <>
                <div className="advice-banner">
                  <img className="ref-avatar" src={BASE + 'bas-rubber.webp'} alt="" />
                  <div>
                    <strong>{t(`ob.profile.${advice.profile}` as const)}</strong>
                    <p>{dr.size > 1
                      ? t('ob.adviceTeam', { total: advice.houseMinutes, size: dr.size, min: advice.recommended, focus: t(`ob.focus.${advice.focus}` as const) })
                      : t('ob.adviceSolo', { min: advice.recommended, profile: t(`ob.profile.${advice.profile}` as const).toLowerCase(), focus: t(`ob.focus.${advice.focus}` as const) })}
                    </p>
                  </div>
                </div>
                <div className="card rhythm-card">
                  <div className="rhythm-sec">
                    <div className="rhythm-head">
                      <span className="label">{t('set.round')}</span>
                      <span className="rhythm-meta">{t('ob.roundApprox', { n: Math.max(1, Math.round(dr.block / 6)) })}</span>
                    </div>
                    <div className="round-pills" role="radiogroup" aria-label={t('set.roundLength')}>
                      {[5, 10, 15, 20, 30].map((m) => (
                        <button key={m} type="button" className={'round-pill' + (dr.block === m ? ' on' : '') + (advice.recommended === m ? ' rec' : '')} aria-pressed={dr.block === m}
                          onClick={() => { haptic(4); setPickedBlock(true); set({ block: m }) }}>
                          {advice.recommended === m && <em className="rec-tag">{t('ob.adviceTag')}</em>}
                          <b>{m}</b><span>{t('common.min')}</span>
                        </button>
                      ))}
                    </div>
                    <p className="tempo-note">{t(dr.block === advice.recommended ? 'ob.tempo.exact' : dr.block < advice.recommended ? 'ob.tempo.light' : 'ob.tempo.extra')}</p>
                  </div>
                  <div className="rhythm-sec">
                    <div className="rhythm-head">
                      <span className="label">{t('set.rest')}</span>
                      {dr.rest.length > 0 && <span className="rhythm-meta">{t('ob.restRecalc', { rest: dr.rest.length })}</span>}
                    </div>
                    <DayPicker rest={dr.rest} onToggle={(d) => set({ rest: dr.rest.includes(d) ? dr.rest.filter((x) => x !== d) : [...dr.rest, d] })} />
                  </div>
                </div>
              </>
            )}
            <div className="card rhythm-card">
              <div className="rhythm-sec">
                <span className="label">{t('set.reminder')}</span>
                <TimeSlider value={dr.time ?? 1110} onChange={(time) => set({ time })} />
                <p className="group-f">{t('ob.timeHint')}</p>
              </div>
            </div>
            <div className="ob-foot"><button className="btn primary block" onClick={() => { set({ time: dr.time ?? 1110 }); next() }}>{t('common.next')}</button>
              <button className="btn ghost block" onClick={() => go('demo')}>{t('ob.demoTitle')}</button></div>
          </div>
        )}
        {step === 'demo' && <Demo dr={dr} onDone={() => go('rhythm')} />}
        {step === 'account' && (authed ? <><h1>{t('ob.accountTitle')}</h1>{foot(t('common.done'), true, finish)}</> : <Account dr={dr} email={accountEmail} setEmail={setAccountEmail} onLogin={login} />)}
        {step === 'login' && <Login email={accountEmail} setEmail={setAccountEmail} />}
      </div>
      {!authed && !['welcome','login','account'].includes(step) && <button className="link ob-login" onClick={login}>{t('ob.haveAccount')}</button>}
    </div>
  )
}

function CodeStep({ code, onCode, onNext }: { code: string; onCode: (c: string) => void; onNext: () => void }) {
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  async function check() {
    setBusy(true); setErr('')
    const { data } = await sb.rpc('code_exists', { code })
    setBusy(false)
    data ? onNext() : setErr(t('ob.badCode'))
  }
  return (
    <>
      <div><h1 className="ob-title">{t('ob.codeTitle')}</h1><p className="ob-sub">{t('ob.codeSub')}</p></div>
      <input className="field big mono center" placeholder={t('ob.codePh')} value={code} maxLength={6} autoFocus onChange={(e) => onCode(e.target.value.toUpperCase())} />
      {err && <p className="error center">{err}</p>}
      <div className="ob-foot"><button className="btn primary block" disabled={code.length < 6 || busy} onClick={check}>{busy ? <span className="spinner" /> : t('common.next')}</button></div>
    </>
  )
}

/** Mini-opruimronde om te spelen: afvinken (XP), timer starten, opties openen, ring sluiten. */
function Demo({ dr, onDone }: { dr: Draft; onDone: () => void }) {
  const picks = useMemo(() => {
    const starter = starterTasks(dr.layout ?? initialLayout()).filter((x) => x.minutes <= 10)
    const all = CATALOG.flatMap((r) => r.tasks)
    const chosen = starter.length >= 3 ? starter.slice(0, 3) : all.filter((x) => dr.sel.includes(x.id) && x.minutes <= 10).slice(0, 3)
    return chosen.length === 3 ? chosen.map((x) => ({ title: catTitle(x), minutes: x.minutes, effort: x.effort }))
      : [{ title: t('ob.demoTask1'), minutes: 5, effort: 1 }, { title: t('ob.demoTask2'), minutes: 5, effort: 1 }, { title: t('ob.demoTask3'), minutes: 10, effort: 1 }]
  }, [dr.layout, dr.sel, lang])
  const [done, setDone] = useState<boolean[]>([false, false, false])
  const [timer, setTimer] = useState<number | null>(null)
  const [menu, setMenu] = useState(false)
  const all = done.every(Boolean)
  const n = done.filter(Boolean).length
  useEffect(() => {
    if (timer === null || timer <= 0 || all) return
    const id = setInterval(() => setTimer((s) => Math.max(0, (s ?? 0) - 7)), 100)
    return () => clearInterval(id)
  }, [timer, all])
  useEffect(() => { if (all) { sound('done'); haptic([10, 60, 10]) } }, [all])
  const xp = picks.reduce((s, p, k) => s + (done[k] ? xpOf(p.minutes, p.effort) : 0), 0)
  const stage = all ? 4 : menu ? 3 : timer !== null ? 2 : n > 0 ? 1 : 0
  const coach = [t('ob.demo1'), t('ob.demo2', { xp }), t('ob.demo3'), t('ob.demo4'), t('ob.demoDone')][stage]
  const total = picks.reduce((s, p) => s + p.minutes, 0)

  return (
    <>
      <div><h1 className="ob-title">{t('ob.demoTitle')}</h1><p className="ob-sub">{t('ob.demoSub')}</p></div>
      <div className="coach" key={stage}><Bas className="ref-avatar" cheer={all || stage === 1} /><span><strong>Bas</strong>{coach}</span></div>
      <section className={'card round' + (all ? ' all-done' : '')}>
        {all && <Confetti />}
        <div className="round-head">
          <Ring value={n / 3}>{all ? <Icon name="check" size={20} /> : `${n}/3`}</Ring>
          <div className="grow"><h2>{all ? t('today.done') : timer !== null ? t('today.running') : t('today.round')}</h2>
            <p className="row-sub">{t('today.roundSub', { n: 3, tasks: t('common.tasks'), min: total, xp: picks.reduce((s, p) => s + xpOf(p.minutes, p.effort), 0) })}</p></div>
          {xp > 0 && <span className="xp-chip xp-gain" key={xp}>+{xp} XP</span>}
        </div>
        {timer !== null && !all && <div className="timer"><span className="timer-num">{Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}</span><XpBar frac={timer / (dr.block * 60)} /></div>}
        <ul className="tasks">
          {picks.map((p, k) => (
            <li key={k} className={'task' + (done[k] ? ' done' : '')}>
              <Check done={done[k]} label={p.title} onClick={(e) => {
                if (!done[k]) { haptic(); sound('pop'); floatText(e?.currentTarget ?? null, `+${xpOf(p.minutes, p.effort)} XP`) }
                setDone((x) => x.map((v, j) => (j === k ? !v : v)))
              }} />
              <span className="task-main"><span className="task-title"><span className="strike">{p.title}</span></span><span className="row-sub">{p.minutes} {t('common.min')}</span></span>
              {!done[k] && <span className="xp-chip">+{xpOf(p.minutes, p.effort)}</span>}
              <button className="icon-btn" aria-label={p.title} onClick={() => setMenu((x) => !x)} style={stage === 2 ? { background: 'var(--gold-soft)', color: 'var(--gold)' } : undefined}><Icon name="more" size={20} /></button>
            </li>
          ))}
        </ul>
        {menu && !all && (
          <div className="demo-menu fade-in">
            <div><Icon name="calendar" size={16} />{t('menu.moveTo')}: {t('menu.tomorrow').toLowerCase()}, {t('menu.weekend').toLowerCase()}…</div>
            {dr.size > 1 && <div><Icon name="swap" size={16} />{t('menu.ask')}</div>}
            <div><Icon name="moon" size={16} />{t('today.later')}: {t('snooze.w.arrive').toLowerCase()}</div>
          </div>
        )}
        {timer === null && !all && (
          <div className="btn-row"><button className="btn primary grow" disabled={n === 0} onClick={() => { haptic(); setTimer(dr.block * 60) }} style={n > 0 ? { boxShadow: '0 0 0 4px var(--gold-soft)' } : undefined}>
            <Icon name="play" size={16} />{t('today.start', { min: dr.block })}</button></div>
        )}
      </section>
      <div className="ob-foot"><button className="btn primary block" disabled={!all} onClick={onDone}>{t('common.next')}</button>
        <button className="btn ghost block" onClick={onDone}>{t('common.skip')}</button></div>
    </>
  )
}

type EmailField = { email: string; setEmail: (value: string) => void }
function Account({ dr, email, setEmail, onLogin }: EmailField & { dr: Draft; onLogin: () => void }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [legal, setLegal] = useState<LegalDoc | null>(null)
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setBusy(true)
    sessionStorage.setItem('opgeruimd.signup-email', email.trim().toLowerCase())
    const { data, error } = await sb.auth.signUp({ email, password: pw })
    if (error || !data.user) { sessionStorage.removeItem('opgeruimd.signup-email'); setBusy(false); return setErr(error?.message.includes('already') ? t('ob.exists') : error?.message ?? '') }
    if (!data.session) { setErr(t('ob.confirmEmail')); setBusy(false) }
  }
  const home = dr.layout ?? initialLayout()
  const floorCount = home.floors.length === 1 ? t('layout.floorCount1') : t('layout.floorCountN', { n: home.floors.length })
  return (
    <>
      <form className="save-form" onSubmit={submit}>
        <div className="save-heading">
          {dr.path === 'new' ? <HousePortrait floors={home.floors.length} /> : <img width="86" src={BASE + 'bas-rubber.webp'} alt="" />}
          <h1 className="ob-title">{t('ob.accountTitle')}</h1>
          <p className="ob-sub">{t('ob.accountSub')}</p>
          {dr.path === 'new' && dr.name.trim() && (
            <p className="save-summary">{t('ob.accountSummary', { name: dr.name.trim(), floors: floorCount, tasks: starterTasks(home).length, min: dr.block })}</p>
          )}
        </div>
        <div className="group">
          <input className="field" aria-label={t('ob.email')} type="email" autoComplete="email" placeholder={t('ob.email')} value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="field" aria-label={t('ob.password')} type="password" autoComplete="new-password" placeholder={t('ob.password')} minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} required />
          <p className="save-note"><Icon name="lock" size={15} /><span>{t('ob.noSpam')}</span></p>
          <p className="legal-inline">
            {t('legal.agreeBefore')}
            <button type="button" className="link" onClick={() => setLegal('terms')}>{t('legal.terms').toLowerCase()}</button>
            {t('legal.and')}
            <button type="button" className="link" onClick={() => setLegal('privacy')}>{t('legal.privacy').toLowerCase()}</button>
            {t('legal.agreeAfter')}
          </p>
          {err && <p className="error">{err}</p>}
        </div>
        <div className="ob-foot"><button className="btn primary block" disabled={busy}>{busy ? <><span className="spinner" />{t('ob.creating')}</> : t('ob.create')}</button><button type="button" className="btn soft block" onClick={onLogin}>{t('ob.haveAccount')}</button></div>
      </form>
      <LegalSheet doc={legal} onClose={() => setLegal(null)} />
    </>
  )
}

function Login({ email, setEmail }: EmailField) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setBusy(true)
    const { error } = await sb.auth.signInWithPassword({ email, password: pw })
    setBusy(false)
    if (error) setErr(error.message.includes('Invalid') ? t('ob.wrongLogin') : error.message)
  }
  return (
    <form style={{ display: 'contents' }} onSubmit={submit}>
      <div className="ob-hero"><img src={BASE + 'bas-rubber.webp'} alt="" className="app-icon" /><h1 className="ob-title">{t('ob.loginTitle')}</h1></div>
      <div className="group">
        <input className="field" aria-label={t('ob.email')} type="email" autoComplete="email" placeholder={t('ob.email')} value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="field" aria-label={t('ob.password')} type="password" autoComplete="current-password" placeholder={t('ob.password')} value={pw} onChange={(e) => setPw(e.target.value)} required />
        {err && <p className="error">{err}</p>}
      </div>
      <div className="ob-foot"><button className="btn primary block" disabled={busy}>{busy ? <span className="spinner" /> : t('ob.login')}</button></div>
    </form>
  )
}
