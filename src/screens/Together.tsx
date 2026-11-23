import { addDays, localDate } from '../../supabase/functions/_shared/planner'
import { Avatar, DAYS } from '../components/Bits'
import { Icon } from '../components/Icon'
import { useApp } from '../lib/data'
import { dayState, roomScores, streak, weekMinutes, weekStart } from '../lib/stats'

export function Together() {
  const { d } = useApp()
  const s = streak(d)
  const week = weekMinutes(d)
  const total = d.members.reduce((a, m) => a + (week[m.user_id] ?? 0), 0)
  const { rooms, total: house } = roomScores(d)
  const ws = weekStart()
  const carried = d.items.filter((i) => i.date >= ws && i.date < addDays(ws, 7) && i.status === 'todo' && i.date < localDate()).length

  return (
    <div className="screen">
      <header className="large-title"><h1>Samen</h1></header>

      {d.members.length < 2 && <Invite />}

      <section className="card">
        <div className="stat-head">
          <span className="big-emoji">🔥</span>
          <div><h2>{s} {s === 1 ? 'dag' : 'dagen'} op rij</h2><p className="muted small">dat jullie je blokje afmaakten</p></div>
        </div>
        <div className="week">
          {DAYS.map((l, i) => {
            const st = dayState(d, addDays(ws, i))
            return <div key={l} className={'wd ' + st}><span>{l}</span><i>{st === 'done' ? '✓' : st === 'rest' ? '🌿' : st === 'missed' ? '·' : ''}</i></div>
          })}
        </div>
      </section>

      <section className="card">
        <h2>Deze week</h2>
        <p className="muted small">Minuten huishouden sinds maandag{carried ? ` · ${carried} doorgeschoven` : ''}</p>
        {total ? (
          <>
            <div className="fair-bar">
              {d.members.map((m) => <i key={m.user_id} style={{ flex: week[m.user_id] ?? 0, background: m.color }} />)}
            </div>
            <div className="fair-legend">
              {d.members.map((m) => (
                <span key={m.user_id}><Avatar m={m} size={20} /> {m.user_id === d.me.user_id ? 'Jij' : m.name} <b>{week[m.user_id] ?? 0} min</b></span>
              ))}
            </div>
          </>
        ) : <p className="muted">Nog niks afgevinkt deze week. Het eerste blokje telt!</p>}
      </section>

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

export function Invite({ compact }: { compact?: boolean }) {
  const { d } = useApp()
  const code = d.household.invite_code
  const url = location.origin + location.pathname
  const share = () => navigator.share
    ? navigator.share({ title: 'Opgeruimd', text: `Doe je mee met ons huishouden in Opgeruimd? Code: ${code}`, url })
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

