import { useEffect, useRef, useState } from 'react'
import { SUPABASE_URL } from '../config'
import { Avatar, Ic, Segmented, Switch } from '../components/Bits'
import { DayPicker, Dial, Stepper, TimeSlider, fmtTime, toMin } from '../components/Controls'
import { Icon } from '../components/Icon'
import { sb, useApp } from '../lib/data'
import { haptic, setSound, sound, soundOn } from '../lib/feel'
import { langChoice, setLang, t, type TKey } from '../lib/i18n'
import { enablePush, isIOS, isStandalone, pushState } from '../lib/push'

const NOTIFY: [string, string, TKey, boolean][] = [
  ['reminder', 'bell', 'set.n.reminder', false], ['timer', 'timer', 'set.n.timer', false], ['swap', 'swap', 'set.n.swap', true],
  ['done', 'check-circle', 'set.n.done', true], ['task', 'plus', 'set.n.task', true], ['kudos', 'clap', 'set.n.kudos', true],
]
export const COLORS = ['#12A27E', '#FF7A59', '#4F7CFF', '#B45CF0', '#E09A2C', '#E5487A', '#14B8C4', '#6B7671']

/** Bewaar pas als je even stilstaat met schuiven. */
function useDebounced<T>(value: T, save: (v: T) => void, ms = 450) {
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    const id = setTimeout(() => save(value), ms)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
}

export function Settings() {
  const { d, act } = useApp()
  const { me, household: hh } = d
  const [block, setBlock] = useState(hh.block_minutes)
  useDebounced(block, (v) => act.patchHousehold({ block_minutes: v }))
  const [time, setTime] = useState(toMin(me.fallback_time))
  const [mode, setMode] = useState<'time' | 'arrive'>(me.fallback_time ? 'time' : 'arrive')
  useDebounced(time, (v) => mode === 'time' && act.patchMe({ fallback_time: fmtTime(v) }))
  const [size, setSize] = useState(hh.size)
  useDebounced(size, (v) => act.patchHousehold({ size: v }))

  return (
    <div className="page">
      <header className="hdr"><h1>{t('set.title')}</h1></header>

      <div className="group">
        <h3 className="group-h">{t('set.round')}</h3>
        <div className="list">
          <div className="dial-wrap">
            <Dial value={block} min={5} max={30} step={5} onChange={setBlock} label={t('set.roundLength')} />
            <div className="dial-side"><b>{t('set.roundLength')}</b>{t('set.roundFoot', { n: Math.max(1, Math.round(block / 6)) })}</div>
          </div>
        </div>
      </div>

      <div className="group">
        <h3 className="group-h">{t('set.rest')}</h3>
        <div className="list"><DayPicker rest={hh.rest_days} onToggle={(i) => act.patchHousehold({ rest_days: hh.rest_days.includes(i) ? hh.rest_days.filter((x) => x !== i) : [...hh.rest_days, i] })} /></div>
        <p className="group-f">{t('set.restFoot')}</p>
      </div>

      <div className="group">
        <h3 className="group-h">{t('set.reminder')}</h3>
        <div className="list">
          <div className="row"><Segmented value={mode} onChange={(v) => { setMode(v); act.patchMe({ fallback_time: v === 'time' ? fmtTime(time) : null }) }}
            options={[{ v: 'time', label: t('set.modeTime') }, { v: 'arrive', label: t('set.modeArrive') }]} /></div>
          {mode === 'time' && <TimeSlider value={time} onChange={setTime} />}
          <Arrive url={`${SUPABASE_URL}/functions/v1/arrive?t=${me.arrive_token}`} />
        </div>
        <p className="group-f">{t(mode === 'time' ? 'set.reminderFoot' : 'set.reminderFootArrive')}</p>
      </div>

      <Notifications />

      <div className="group">
        <h3 className="group-h">{t('set.house')}</h3>
        <div className="list">
          <div className="row"><Ic name={size === 1 ? 'solo' : size === 2 ? 'duo' : 'group'} />
            <span className="row-main"><span className="row-title">{t('set.size')}</span><span className="row-sub">{size === 1 ? t('set.sizeSolo') : t('set.sizeN', { n: size })}</span></span>
            <Stepper value={size} min={Math.max(1, d.members.length)} max={8} onChange={setSize} label={t('set.size')} /></div>
          {d.members.length > 1 && <div className="row"><Ic name="people" /><span className="row-main"><span className="row-title">{t('set.members')}</span></span>
            <span style={{ display: 'flex', gap: 4 }}>{d.members.map((m) => <Avatar key={m.user_id} m={m} size={26} />)}</span></div>}
          {size > 1 && <div className="row"><Ic name="key" /><span className="row-main"><span className="row-title">{t('set.code')}</span></span>
            <span className="mono" style={{ fontWeight: 700 }}>{hh.invite_code}</span>
            <button className="icon-btn" aria-label={t('common.share')} onClick={() => navigator.share ? navigator.share({ title: 'Opgeruimd', text: hh.invite_code }).catch(() => {}) : navigator.clipboard.writeText(hh.invite_code)}><Icon name="share" size={18} /></button></div>}
        </div>
        <p className="group-f">{size > 1 ? t('set.houseFoot') : t('set.houseFootSolo')}</p>
      </div>

      <Profile />

      <div className="group">
        <h3 className="group-h">{t('set.feel')}</h3>
        <Feel />
        <p className="group-f">{t('set.feelFoot')}</p>
      </div>

      <div className="group">
        <h3 className="group-h">{t('set.lang')}</h3>
        <div className="list"><div className="row"><Segmented value={langChoice()} onChange={(v) => setLang(v as 'nl' | 'en' | 'auto')}
          options={[{ v: 'nl', label: 'Nederlands' }, { v: 'en', label: 'English' }, { v: 'auto', label: t('set.langAuto') }]} /></div></div>
      </div>

      <div className="group">
        <h3 className="group-h">{t('set.more')}</h3>
        <div className="list">
          <button className="row" onClick={() => act.patchMe({ onboarded_at: null })}><Ic name="info" /><span className="row-main"><span className="row-title">{t('set.tour')}</span></span><span className="chev"><Icon name="chevron" size={16} /></span></button>
          <button className="row" onClick={() => sb.auth.signOut()}><Ic name="back" tone="red" /><span className="row-main"><span className="row-title" style={{ color: 'var(--bad)' }}>{t('set.logout')}</span></span></button>
        </div>
        <p className="group-f center">{t('set.version')}</p>
      </div>
    </div>
  )
}

function Notifications() {
  const { d, act } = useApp()
  const { me } = d
  const [push, setPush] = useState('…')
  const [err, setErr] = useState('')
  const [tested, setTested] = useState(false)
  useEffect(() => { pushState().then(setPush) }, [])
  const on = push === 'on'
  const status = !isStandalone && isIOS ? t('set.notifInstall') : push === 'denied' ? t('set.notifDenied') : push === 'unsupported' ? t('set.notifUnsupported') : on ? t('set.notifStatusOn') : t('set.notifStatusOff')
  return (
    <div className="group">
      <h3 className="group-h">{t('set.notif')}</h3>
      <div className="list">
        <div className="row">
          <Ic name={on ? 'bell' : 'bell-off'} tone={on ? undefined : 'coral'} />
          <span className="row-main"><span className="row-title">{t('set.notif')}</span><span className="row-sub">{status}</span></span>
          {on ? <button className="btn tinted sm" onClick={async () => { await act.testPush(); setTested(true) }}>{tested ? t('set.notifSent') : t('set.notifTest')}</button>
            : push === 'off' && (isStandalone || !isIOS) && <button className="btn primary sm" onClick={async () => { setErr(''); try { await enablePush(me.user_id); setPush('on') } catch (e) { setErr((e as Error).message) } }}>{t('set.notifTurnOn')}</button>}
        </div>
        {NOTIFY.filter(([, , , social]) => !social || !d.solo).map(([key, icon, label]) => (
          <label key={key} className="row"><Ic name={icon} tone="gray" /><span className="row-main"><span className="row-title">{t(label)}</span></span>
            <Switch on={me.notify?.[key] !== false} label={t(label)} onChange={(v) => { haptic(4); act.patchMe({ notify: { ...me.notify, [key]: v } }) }} /></label>
        ))}
      </div>
      {err && <p className="error">{err}</p>}
      <p className="group-f">{t('set.notifFoot')}</p>
    </div>
  )
}

function Arrive({ url }: { url: string }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  return (
    <>
      <button className="row" onClick={() => setOpen((x) => !x)} aria-expanded={open}>
        <Ic name="pin" /><span className="row-main"><span className="row-title">{t('set.arriveSetup')}</span><span className="row-sub">{t('set.arriveSetupSub')}</span></span>
        <span className="chev" style={{ transform: open ? 'rotate(90deg)' : '', transition: 'transform 260ms' }}><Icon name="chevron" size={16} /></span>
      </button>
      <div className={'collapse' + (open ? ' open' : '')}><div>
        <ol className="steps-list">
          <li>{t('set.arriveS1')}</li><li>{t('set.arriveS2')}</li><li>{t('set.arriveS3')}</li><li>{t('set.arriveS4')}</li>
        </ol>
        <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button className="btn primary block" onClick={async () => { await navigator.clipboard.writeText(url).catch(() => {}); setCopied(true); location.href = 'shortcuts://' }}>
            <Icon name="shortcut" size={18} />{copied ? t('set.arriveCopied') : t('set.arriveCopy')}</button>
          <p className="group-f" style={{ padding: 0 }}>{t('set.arriveWhy')}</p>
        </div>
      </div></div>
    </>
  )
}

function Profile() {
  const { d, act } = useApp()
  const { me } = d
  const [name, setName] = useState(me.name)
  return (
    <div className="group">
      <h3 className="group-h">{t('set.you')}</h3>
      <div className="list">
        <label className="row"><Avatar m={{ name, color: me.color }} size={30} />
          <input className="field" style={{ border: 0, padding: '6px 0', background: 'transparent' }} value={name} aria-label={t('set.name')}
            onChange={(e) => setName(e.target.value)} onBlur={() => name.trim() && name.trim() !== me.name && act.patchMe({ name: name.trim() })} /></label>
        <div className="row"><Ic name="palette" /><span className="row-main"><span className="row-title">{t('set.color')}</span></span></div>
        <div style={{ padding: '0 14px 14px 56px' }}><div className="colors">
          {COLORS.map((c) => <button key={c} className={'swatch' + (me.color === c ? ' on' : '')} style={{ background: c }} aria-label={c} aria-pressed={me.color === c} onClick={() => { haptic(4); act.patchMe({ color: c }) }} />)}
        </div></div>
      </div>
      <p className="group-f">{t('set.youFoot')}</p>
    </div>
  )
}

function Feel() {
  const [on, setOn] = useState(soundOn())
  return (
    <div className="list">
      <label className="row"><Ic name={on ? 'sound' : 'sound-off'} tone="gray" /><span className="row-main"><span className="row-title">{t('set.sound')}</span></span>
        <Switch on={on} label={t('set.sound')} onChange={(v) => { setSound(v); setOn(v); if (v) setTimeout(() => sound('pop'), 50) }} /></label>
      <button className="row" onClick={() => haptic([10, 60, 10])}><Ic name="vibrate" tone="gray" /><span className="row-main"><span className="row-title">{t('set.haptics')}</span></span>
        <span className="row-val">{t('common.on')}</span></button>
    </div>
  )
}
