import { useState } from 'react'
import { addDays, localDate } from '../../supabase/functions/_shared/planner'
import { Avatar, Ic, Ring, XpBar } from '../components/Bits'
import { Icon } from '../components/Icon'
import { useApp, type Member } from '../lib/data'
import { taskTitle } from '../lib/catalog'
import { haptic, sound } from '../lib/feel'
import { levelOf, weeklyChallenge, xpOf } from '../lib/game'
import { list, locale, t } from '../lib/i18n'
import { room } from '../lib/rooms'
import { badges, dayState, feed, roomScores, scores, streak, weekStart } from '../lib/stats'

export function Together() {
  const { d } = useApp()
  const ws = weekStart()
  const myXp = d.xp[d.me.user_id] ?? 0
  const lv = levelOf(myXp)
  const s = streak(d)
  const ch = weeklyChallenge(d)
  const { rooms, total: house } = roomScores(d)
  const myBadges = badges(d, d.me.user_id, lv.n)
  const short = list('days.short')

  return (
    <div className="page">
      <header className="hdr"><h1>{d.solo ? t('tab.progress') : t('tab.together')}</h1></header>

      <div className="card level-card">
        <span className="lv-badge" style={{ width: 52, height: 52, fontSize: 20 }}>{lv.n}</span>
        <div className="grow">
          <h2>{lv.title}</h2>
          <p className="row-sub">{t('level', { n: lv.n })} · {myXp} XP</p>
          <XpBar frac={lv.frac} />
          <p className="row-sub" style={{ marginTop: 6 }}>{t('level.toNext', { xp: lv.next - myXp, n: lv.n + 1 })}</p>
        </div>
      </div>

      {d.solo ? <SoloWeek /> : <Scoreboard />}

      <div className="group">
        <h3 className="group-h">{t('prog.challenge')}</h3>
        <div className="card challenge">
          <Ic name={ch.icon} tone={ch.done ? 'gold' : undefined} lg />
          <span className="row-main"><span className="row-title">{t(ch.title)}</span><span className="row-sub">{t(ch.sub)}</span><XpBar frac={ch.frac} /></span>
          <span className="row-main" style={{ flex: 'none', alignItems: 'flex-end', gap: 4 }}>
            <span className="tnum" style={{ fontWeight: 700 }}>{ch.have}/{ch.goal}</span>
            {ch.done && <span className="xp-chip">{t('prog.challengeDone')}</span>}
          </span>
        </div>
      </div>

      <div className="group">
        <h3 className="group-h">{t('prog.streak')}<span className="streak" style={{ textTransform: 'none' }}><Icon name="flame" size={16} />{s}</span></h3>
        <div className="card week-dots">
          {short.map((l, i) => {
            const day = addDays(ws, i)
            const st = dayState(d, day)
            const items = d.items.filter((item) => item.date === day)
            const done = items.filter((item) => item.status === 'done').length
            const label = st === 'rest' ? t('today.rest') : `${done}/${items.length}`
            return <div key={day} className={'wd ' + st + (day === localDate() ? ' today' : '')}
              role="img" aria-label={`${list('days.long')[i]} · ${label}`}>
              <span>{l}</span>
              <Ring size={30} stroke={4} value={items.length && st !== 'rest' ? done / items.length : 0}>
                {st === 'done' && <Icon name="check" size={15} />}
                {st === 'rest' && <Icon name="leaf" size={14} />}
              </Ring>
            </div>
          })}
        </div>
        <p className="group-f">{t('prog.streakSub')}</p>
      </div>

      <div className="group">
        <h3 className="group-h">{t('prog.badges')}<span>{myBadges.filter((b) => b.have >= b.need).length}/{myBadges.length}</span></h3>
        <div className="list badges">
          {myBadges.map((b) => {
            const earned = b.have >= b.need
            return (
              <div key={b.title} className={'badge' + (earned ? ' earned' : '')}>
                <span className="ic"><Icon name={b.icon} size={22} /></span>
                <b>{t(b.title)}</b>
                {earned ? <small>{t(b.text)}</small> : <><XpBar frac={b.have / b.need} /><small className="tnum">{b.have}/{b.need}</small></>}
              </div>
            )
          })}
        </div>
      </div>

      <div className="group">
        <h3 className="group-h">{t('prog.house')}<span>{Math.round(house * 100)}%</span></h3>
        <div className="list">
          {rooms.map((r) => (
            <div key={r.id} className="row">
              <Ic name={r.icon} tone={r.score > 0.8 ? undefined : r.score > 0.5 ? 'gold' : 'red'} />
              <span className="row-main"><span className="row-title">{room(r.id).label}</span></span>
              <span className="row-val">{Math.round(r.score * 100)}%</span>
              <div className="meter"><i className={r.score > 0.8 ? 'good' : r.score > 0.5 ? 'ok' : 'bad'} style={{ width: `${Math.max(4, r.score * 100)}%` }} /></div>
            </div>
          ))}
        </div>
        <p className="group-f">{t('prog.houseSub')}</p>
      </div>

      <Activity />
      {!d.solo && <Invite />}
    </div>
  )
}

function Scoreboard() {
  const { d } = useApp()
  const ws = weekStart()
  const now = scores(d, ws, addDays(ws, 7))
  const last = scores(d, addDays(ws, -7), ws)
  const ranked = [...d.members].sort((a, b) => now[b.user_id].pts - now[a.user_id].pts)
  const max = Math.max(1, ...ranked.map((m) => now[m.user_id].pts))
  const lead = ranked.length > 1 && now[ranked[0].user_id].pts > now[ranked[1].user_id].pts ? ranked[0] : null
  const gap = lead ? now[ranked[0].user_id].pts - now[ranked[1].user_id].pts : 0
  const lastRank = [...d.members].sort((a, b) => last[b.user_id].pts - last[a.user_id].pts)
  const lastWin = lastRank.length > 1 && last[lastRank[0].user_id].pts > last[lastRank[1].user_id].pts ? lastRank[0] : null
  const name = (m: Member) => (m.user_id === d.me.user_id ? t('common.you') : m.name)
  return (
    <div className="group">
      <h3 className="group-h">{t('prog.week')}</h3>
      <div className="list">
        {ranked.map((m) => (
          <div key={m.user_id} className="player" style={{ '--c': m.color } as React.CSSProperties}>
            <Avatar m={m} size={34} />
            <span className="row-main">
              <span className="row-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{name(m)}{lead?.user_id === m.user_id && <span className="crown"><Icon name="crown" size={16} /></span>}
                <span className="tag gray">{t('level.short', { n: levelOf(d.xp[m.user_id] ?? 0).n })}</span></span>
              <XpBar frac={now[m.user_id].pts / max} color={m.color} />
              <span className="row-sub">{now[m.user_id].min} {t('common.min')}<span className="sep" />{now[m.user_id].count === 1 ? t('prog.tasks1') : t('prog.tasksN', { n: now[m.user_id].count })}</span>
            </span>
            <span className="player-score">{now[m.user_id].pts} <small className="muted">XP</small></span>
          </div>
        ))}
      </div>
      <p className="group-f">
        {ranked.length < 2 ? t('prog.waitingMate') : !ranked.some((m) => now[m.user_id].pts) ? t('prog.noneYet') : lead ? (lead.user_id === d.me.user_id ? t('prog.leadYou', { n: gap }) : t('prog.lead', { name: lead.name, n: gap })) : t('prog.tie')}
        {lastWin && <> · {lastWin.user_id === d.me.user_id ? t('prog.lastWeekYou') : t('prog.lastWeek', { name: lastWin.name })}</>}
        <br />{t('prog.pointsInfo')}
      </p>
    </div>
  )
}

function SoloWeek() {
  const { d } = useApp()
  const ws = weekStart()
  const id = d.me.user_id
  const now = scores(d, ws, addDays(ws, 7))[id]
  const last = scores(d, addDays(ws, -7), ws)[id]
  const best = Math.max(now.pts, ...Array.from({ length: 8 }, (_, i) => scores(d, addDays(ws, -7 * (i + 1)), addDays(ws, -7 * i))[id].pts))
  const diff = now.pts - last.pts
  return (
    <div className="group">
      <h3 className="group-h">{t('prog.weekSolo')}</h3>
      <div className="list">
        <div className="row"><Ic name="star" tone="gold" /><span className="row-main"><span className="row-title">{now.pts} XP</span>
          <span className="row-sub">{t('prog.vsLast', { diff: (diff >= 0 ? '+' : '') + diff })}</span></span></div>
        <div className="row"><Ic name="clock" /><span className="row-main"><span className="row-title">{now.min} {t('common.min')}</span>
          <span className="row-sub">{now.count === 1 ? t('prog.tasks1') : t('prog.tasksN', { n: now.count })}</span></span></div>
        <div className="row"><Ic name="trophy" tone="gold" /><span className="row-main"><span className="row-title">{t('prog.best', { xp: best })}</span></span></div>
      </div>
      <p className="group-f">{t('prog.pointsInfo')}</p>
    </div>
  )
}

function Activity() {
  const { d, act } = useApp()
  const [all, setAll] = useState(false)
  const items = feed(d)
  const shown = all ? items : items.slice(0, 8)
  const member = (id: string | null) => d.members.find((m) => m.user_id === id)
  return (
    <div className="group">
      <h3 className="group-h">{t('prog.log')}</h3>
      {!items.length ? <p className="group-f">{t('prog.logEmpty')}</p> : (
        <div className="list">
          {shown.map((i) => {
            const task = d.tasks.find((x) => x.id === i.task_id)
            const who = member(i.done_by)
            const mine = i.done_by === d.me.user_id
            const when = new Date(i.done_at!)
            const day = localDate(when) === localDate() ? t('common.today') : when.toLocaleDateString(locale(), { weekday: 'short' })
            return (
              <div key={i.id} className="row">
                {who ? <Avatar m={who} size={30} /> : <Ic name="check" />}
                <span className="row-main">
                  <span className="row-title">{taskTitle(task)}</span>
                  <span className="row-sub">{!d.solo && <>{mine ? t('common.you') : who?.name}<span className="sep" /></>}
                    {day} {when.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' })}<span className="sep" />{i.minutes} {t('common.min')}
                    {i.helper && <><span className="sep" />{t('prog.with', { name: i.helper === d.me.user_id ? t('common.you').toLowerCase() : member(i.helper)?.name ?? '' })}</>}
                    {i.extra && <><span className="sep" />{t('prog.extra')}</>}</span>
                </span>
                <span className="xp-chip">+{xpOf(i.minutes, task?.effort)}</span>
                {!mine && !d.solo && (
                  <button className={'kudos' + (i.kudos_at ? ' given' : '')} disabled={!!i.kudos_at} aria-label={t(i.kudos_at ? 'prog.kudosGiven' : 'prog.kudos')}
                    onClick={() => { haptic([8, 40, 8]); sound('kudos'); act.kudos(i, task?.title ?? '') }}><Icon name="clap" size={18} /></button>
                )}
                {mine && i.kudos_at && <span className="kudos given" aria-label={t('prog.kudosGiven')}><Icon name="clap" size={18} /></span>}
              </div>
            )
          })}
        </div>
      )}
      {items.length > 8 && <button className="btn ghost sm" onClick={() => setAll((x) => !x)}>{all ? t('prog.showLess') : t('prog.showAll', { n: items.length })}</button>}
    </div>
  )
}

export function Invite() {
  const { d } = useApp()
  const code = d.household.invite_code
  const share = () => navigator.share
    ? navigator.share({ title: 'Opgeruimd', text: `${t('prog.inviteSub')} ${code}`, url: location.origin + location.pathname }).catch(() => {})
    : navigator.clipboard.writeText(code)
  return (
    <div className="group">
      <h3 className="group-h">{t('prog.invite')}</h3>
      <div className="list"><div className="code-row"><span className="code">{code}</span>
        <button className="btn tinted sm" onClick={share}><Icon name="share" size={16} />{t('common.share')}</button></div></div>
      <p className="group-f">{t('prog.inviteSub')}</p>
    </div>
  )
}
