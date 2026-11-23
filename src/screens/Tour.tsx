import { useEffect, useState } from 'react'
import { fillPlan, localDate, suggestExtras } from '../../supabase/functions/_shared/planner'
import { Ic } from '../components/Bits'
import { Icon } from '../components/Icon'
import { sb, useApp } from '../lib/data'
import { xpOf } from '../lib/game'
import { plural, t } from '../lib/i18n'
import { enablePush, isIOS, isStandalone, pushState } from '../lib/push'
import { room } from '../lib/rooms'

/** Na het inloggen: iPhone klaarmaken en meteen de eerste opruimronde. */
export function Tour({ onDone }: { onDone: (start: boolean) => void }) {
  const [step, setStep] = useState<'phone' | 'first'>('phone')
  return (
    <div className="ob">
      <header className="ob-top"><span style={{ width: 36 }} />
        <div className="ob-dots"><i className={step === 'phone' ? 'on' : 'done'} /><i className={step === 'first' ? 'on' : ''} /></div>
        <button className="link" onClick={() => onDone(false)}>{t('common.skip')}</button></header>
      <div className="ob-body" key={step}>{step === 'phone' ? <Phone onNext={() => setStep('first')} /> : <First onDone={onDone} />}</div>
    </div>
  )
}

function Phone({ onNext }: { onNext: () => void }) {
  const { d } = useApp()
  const [push, setPush] = useState('…')
  const [err, setErr] = useState('')
  useEffect(() => { pushState().then(setPush) }, [])
  return (
    <>
      <div><h1 className="ob-title">{t('tour.phoneTitle')}</h1><p className="ob-sub">{t('tour.phoneSub')}</p></div>
      <div className="list">
        <div className="row"><Ic name={isStandalone ? 'check' : 'download'} tone={isStandalone ? undefined : 'coral'} />
          <span className="row-main"><span className="row-title">{t('tour.install')}</span><span className="row-sub">{isStandalone ? t('tour.installDone') : t('tour.installHow')}</span></span></div>
        <div className="row"><Ic name={push === 'on' ? 'check' : 'bell'} tone={push === 'on' ? undefined : 'coral'} />
          <span className="row-main"><span className="row-title">{t('tour.push')}</span>
            <span className="row-sub">{push === 'on' ? t('tour.pushDone') : push === 'denied' ? t('set.notifDenied') : !isStandalone && isIOS ? t('set.notifInstall') : t('tour.pushHow')}</span></span>
          {push === 'off' && (isStandalone || !isIOS) && <button className="btn primary sm" onClick={async () => { setErr(''); try { await enablePush(d.me.user_id); setPush('on') } catch (e) { setErr((e as Error).message) } }}>{t('set.notifTurnOn')}</button>}
        </div>
        <div className="row"><Ic name="pin" tone="gray" /><span className="row-main"><span className="row-title">{t('tour.arrive')}</span><span className="row-sub">{t('tour.arriveHow')}</span></span></div>
      </div>
      {err && <p className="error">{err}</p>}
      <div className="ob-foot"><button className="btn primary block" onClick={onNext}>{t('common.next')}</button></div>
    </>
  )
}

function First({ onDone }: { onDone: (start: boolean) => void }) {
  const { d, act } = useApp()
  const today = localDate()
  const mine = d.items.filter((i) => i.date === today && i.user_id === d.me.user_id)
  const [ready, setReady] = useState(mine.length > 0)
  useEffect(() => {
    if (mine.length) return
    ;(async () => {
      await fillPlan(sb, d.household.id, today)
      const { data } = await sb.from('plan_items').select('id').eq('date', today).eq('user_id', d.me.user_id)
      if (!data?.length) {
        const planned = new Set(d.items.filter((i) => i.date === today).map((i) => i.task_id))
        let left = d.household.block_minutes
        const pick = suggestExtras(d.tasks, today, planned, left).filter((x) => (left -= x.minutes) >= 0)
        const list = pick.length ? pick : d.tasks.filter((x) => !x.archived && !planned.has(x.id)).slice(0, 2)
        if (list.length) await sb.from('plan_items').insert(list.map((x) => ({ household_id: d.household.id, date: today, task_id: x.id, user_id: d.me.user_id, minutes: x.minutes })))
      }
      act.reload(); setReady(true)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const total = mine.reduce((s, i) => s + i.minutes, 0)
  const xp = mine.reduce((s, i) => s + xpOf(i.minutes, d.tasks.find((x) => x.id === i.task_id)?.effort), 0)
  return (
    <>
      <div><h1 className="ob-title">{t('tour.firstTitle')}</h1>
        <p className="ob-sub">{mine.length ? t('tour.firstSub', { n: mine.length, tasks: plural(mine.length), min: total, xp }) : t('tour.preparing')}</p></div>
      <div className="list">
        {!ready && !mine.length && <div className="row"><div className="skeleton grow" /></div>}
        {mine.map((i) => {
          const task = d.tasks.find((x) => x.id === i.task_id)
          const r = room(task?.room ?? null)
          return <div key={i.id} className="row"><Ic name={r.icon} /><span className="row-main"><span className="row-title">{task?.title}</span>
            <span className="row-sub">{r.label}<span className="sep" />{i.minutes} {t('common.min')}</span></span><span className="xp-chip">+{xpOf(i.minutes, task?.effort)}</span></div>
        })}
      </div>
      <div className="ob-foot">
        <button className="btn primary block" disabled={!mine.length} onClick={() => onDone(true)}><Icon name="play" size={16} />{t('tour.firstStart')}</button>
        <button className="btn ghost block" onClick={() => onDone(false)}>{t('tour.firstLater')}</button>
      </div>
    </>
  )
}
