import { useState } from 'react'
import { addDays, localDate } from '../../supabase/functions/_shared/planner'
import { Avatar, DAYS } from '../components/Bits'
import { Icon } from '../components/Icon'
import { useApp, type Member } from '../lib/data'
import { room } from '../lib/rooms'
import { badges, dayState, feed, roomScores, scores, streak, weekStart, type Score } from '../lib/stats'

export function Together({ onLog }: { onLog: () => void }) {
  const { d } = useApp()
  const s = streak(d)
  const ws = weekStart()
  const now = scores(d, ws, addDays(ws, 7))
  const last = scores(d, addDays(ws, -7), ws)
  const { rooms, total: house } = roomScores(d)

  return (
    <div className="screen">
      <header className="large-title"><h1>Samen</h1></header>
      {d.members.length < 2 && <Invite />}
      <Scoreboard now={now} last={last} />
      <Feed onLog={onLog} />

      <section className="card">
        <div className="stat-head">
          <span className="big-emoji">🔥</span>
          <div><h2>{s} {s === 1 ? 'dag' : 'dagen'} op rij</h2><p className="muted small">dat jullie je opruimronde afmaakten</p></div>
        </div>
        <div className="week">
          {DAYS.map((l, i) => {
            const st = dayState(d, addDays(ws, i))
            return <div key={l} className={'wd ' + st}><span>{l}</span><i>{st === 'done' ? '✓' : st === 'rest' ? '🌿' : st === 'missed' ? '·' : ''}</i></div>
          })}
        </div>
      </section>

      <Badges />

      <section className="card">
        <div className="stat-head between">
          <h2>Huis-meter</h2>
          <span className={'pill ' + (house > 0.8 ? 'good' : house > 0.5 ? 'ok' : 'bad')}>{Math.round(house * 100)}%</span>
        </div>
        <p className="muted small">Hoe goed alles bijgehouden is, per ruimte</p>
        <ul className="meters">
          {rooms.map((r) => (
            <li key={r.id}>
              <span className="meter-label">{r.icon} {r.label}</span>
              <div className="meter"><i className={r.score > 0.8 ? 'good' : r.score > 0.5 ? 'ok' : 'bad'} style={{ width: `${Math.max(4, r.score * 100)}%` }} /></div>
            </li>
          ))}
        </ul>
      </section>

      {d.members.length >= 2 && <Invite compact />}
    </div>
  )
}

/** 🏆 Wie doet deze week het meest? Punten = minuten × zwaarte. */
function Scoreboard({ now, last }: { now: Record<string, Score>; last: Record<string, Score> }) {
  const { d } = useApp()
  const [info, setInfo] = useState(false)
  const ms = d.members
  const lead = leader(ms, now)
  const lastLead = leader(ms, last)
  const total = ms.reduce((a, m) => a + now[m.user_id].pts, 0)
  const name = (m: Member) => (m.user_id === d.me.user_id ? 'Jij' : m.name)

  return (
    <section className="card score">
      <div className="stat-head between">
        <h2>🏆 Deze week</h2>
        <button className="icon-btn" onClick={() => setInfo((x) => !x)} aria-label="Hoe werken punten?" aria-expanded={info}><Icon name="info" size={20} /></button>
      </div>
      {info && <p className="muted small fade-in points-info">Punten = minuten × zwaarte. 🪶 Licht telt ×0,75, normaal ×1 en 💪 zwaar ×1,5. Samen gedaan telt voor allebei.</p>}
      <div className={'players n' + ms.length}>
        {ms.map((m) => (
          <div key={m.user_id} className={'player' + (lead?.user_id === m.user_id ? ' lead' : '')}>
            <div className="player-av">
              {lead?.user_id === m.user_id && <span className="crown">👑</span>}
              <Avatar m={m} size={52} />
            </div>
            <b className="player-name">{name(m)}</b>
            <span className="player-pts"><CountUp value={now[m.user_id].pts} /><small> pt</small></span>
            <span className="muted small">{fmtMin(now[m.user_id].min)} · {now[m.user_id].count} {now[m.user_id].count === 1 ? 'klus' : 'klussen'}</span>
          </div>
        ))}
      </div>
      {total > 0 && ms.length > 1 && (
        <div className="fair-bar">{ms.map((m) => <i key={m.user_id} style={{ flex: now[m.user_id].pts, background: m.color }} />)}</div>
      )}
      <p className="score-line">
        {!total ? 'Nog niks gedaan deze week. Wie zet de eerste punten neer?'
          : ms.length < 2 ? 'Nodig je huisgenoot uit om het samen te doen.'
          : lead ? <>{lead.user_id === d.me.user_id ? 'Jij staat' : `${lead.name} staat`} <b>{gap(ms, now)} punten</b> voor 💪</>
          : 'Gelijkspel! 🤝'}
      </p>
      {lastLead && ms.length > 1 && <p className="muted small center">Vorige week won <b>{lastLead.user_id === d.me.user_id ? 'jij' : lastLead.name}</b> 🏆 ({ms.map((m) => last[m.user_id].pts).join(' – ')})</p>}
    </section>
  )
}

const leader = (ms: Member[], sc: Record<string, Score>) => {
  if (ms.length < 1) return null
  const sorted = [...ms].sort((a, b) => sc[b.user_id].pts - sc[a.user_id].pts)
  if (!sc[sorted[0].user_id].pts || (sorted[1] && sc[sorted[0].user_id].pts === sc[sorted[1].user_id].pts)) return null
  return sorted[0]
}
const gap = (ms: Member[], sc: Record<string, Score>) => {
  const p = ms.map((m) => sc[m.user_id].pts).sort((a, b) => b - a)
  return p[0] - (p[1] ?? 0)
}
const fmtMin = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}u ${m % 60 ? `${m % 60}m` : ''}`.trim() : `${m} min`)

function CountUp({ value }: { value: number }) {
  return <span className="count" key={value}>{value}</span>
}

/** 📋 Wie deed wat: tijdlijn van deze week, met 👏 high fives. */
function Feed({ onLog }: { onLog: () => void }) {
  const { d, act } = useApp()
  const [all, setAll] = useState(false)
  const items = feed(d)
  const shown = all ? items : items.slice(0, 8)
  const member = (id: string | null) => d.members.find((m) => m.user_id === id)
  const groups: { day: string; list: typeof items }[] = []
  for (const i of shown) {
    const day = localDate(i.done_at!)
    const g = groups.find((x) => x.day === day)
    g ? g.list.push(i) : groups.push({ day, list: [i] })
  }

  return (
    <section className="card">
      <div className="stat-head between">
        <h2>📋 Wie deed wat</h2>
        <button className="btn soft small" onClick={onLog}><Icon name="check" size={16} /> Al gedaan</button>
      </div>
      {!items.length && <p className="muted">Hier zie je alles wat jullie deze week doen, ook wat je zelf logt.</p>}
      {groups.map((g) => (
        <div key={g.day} className="feed-day">
          <p className="label">{g.day === localDate() ? 'Vandaag' : g.day === addDays(localDate(), -1) ? 'Gisteren' : new Date(g.day + 'T12:00').toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
          <ul className="feed">
            {g.list.map((i) => {
              const t = d.tasks.find((x) => x.id === i.task_id)
              const who = member(i.done_by)
              const mine = i.done_by === d.me.user_id
              const title = t?.title ?? 'Taak'
              return (
                <li key={i.id} className="feed-item">
                  {who && <Avatar m={who} size={34} />}
                  <span className="grow">
                    <b>{title}</b>
                    <span className="muted small feed-meta">
                      {mine ? 'Jij' : who?.name} · {room(t?.room ?? null).icon} {i.minutes} min
                      {t?.effort === 3 && ' · 💪'}{i.helper && ` · 👫 met ${i.helper === d.me.user_id ? 'jou' : member(i.helper)?.name}`}
                      {i.extra && ' · 🙌 extra'} · {new Date(i.done_at!).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </span>
                  {!mine ? (
                    <button className={'kudos' + (i.kudos_at ? ' given' : '')} onClick={() => act.kudos(i, title)} disabled={!!i.kudos_at}
                      aria-label={i.kudos_at ? 'High five gegeven' : `Geef ${who?.name} een high five`}>
                      👏{i.kudos_at && <span className="kudos-burst" />}
                    </button>
                  ) : i.kudos_at ? <span className="kudos-got" title="High five gekregen">👏</span> : null}
                </li>
              )
            })}
          </ul>
        </div>
      ))}
      {items.length > 8 && <button className="link" onClick={() => setAll((x) => !x)}>{all ? 'Minder tonen' : `Alles tonen (${items.length})`}</button>}
    </section>
  )
}

function Badges() {
  const { d } = useApp()
  const list = badges(d, d.me.user_id)
  const got = list.filter((b) => b.have >= b.need).length
  return (
    <section className="card">
      <div className="stat-head between"><h2>🏅 Jouw badges</h2><span className="pill good">{got}/{list.length}</span></div>
      <ul className="badges">
        {list.map((b) => {
          const earned = b.have >= b.need
          return (
            <li key={b.title} className={'badge' + (earned ? ' earned' : '')} title={b.text}>
              <span className="badge-ic">{b.icon}</span>
              <b>{b.title}</b>
              <span className="muted small">{b.text}</span>
              {!earned && <span className="badge-bar"><i style={{ width: `${(b.have / b.need) * 100}%` }} /></span>}
              {!earned && <span className="muted small">{b.have}/{b.need}</span>}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export function Invite({ compact }: { compact?: boolean }) {
  const { d } = useApp()
  const code = d.household.invite_code
  const url = location.origin + location.pathname
  const share = () => navigator.share
    ? navigator.share({ title: 'Opgeruimd', text: `Doe je mee met ons huishouden in Opgeruimd? Code: ${code}`, url }).catch(() => {})
    : navigator.clipboard.writeText(code)
  return (
    <section className={'card invite' + (compact ? ' compact' : '')}>
      {!compact && <><h2>Nodig je huisgenoot uit</h2><p className="muted">Laat hem of haar de app openen, een account maken en deze code invullen:</p></>}
      <div className="code-row">
        <span className="code">{code}</span>
        <button className="btn soft" onClick={share}><Icon name="share" size={18} /> Delen</button>
      </div>
      {compact && <p className="muted small">Uitnodigingscode van jullie huishouden</p>}
    </section>
  )
}
