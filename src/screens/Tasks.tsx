import { dueSince, localDate, weekday } from '../../supabase/functions/_shared/planner'
import { Avatar, DAYS_LONG } from '../components/Bits'
import { Icon } from '../components/Icon'
import { useApp, type Task } from '../lib/data'
import { room } from '../lib/rooms'
import { overdue } from '../lib/stats'

export function Tasks({ onEdit, onAdd }: { onEdit: (t: Task) => void; onAdd: () => void }) {
  const { d, act } = useApp()
  const late = overdue(d)
  const planned = new Set(d.items.filter((i) => i.date === localDate()).map((i) => i.task_id))
  const active = d.tasks.filter((t) => !t.archived)
  const todayWd = weekday(localDate())
  const groups: { key: string; title: string; tasks: Task[]; today?: boolean }[] = [
    ...DAYS_LONG.map((name, i) => ({ key: 'd' + i, title: name, today: i === todayWd, tasks: active.filter((t) => t.recurrence === 'weekly' && t.weekdays.includes(i)) })),
    { key: 'int', title: 'Om de paar dagen', tasks: active.filter((t) => t.recurrence === 'interval') },
    { key: 'once', title: 'Eenmalig', tasks: active.filter((t) => t.recurrence === 'once') },
  ]
  const rest = d.household.rest_days

  return (
    <div className="screen">
      <header className="large-title">
        <h1>Taken</h1>
        <button className="icon-btn filled" onClick={onAdd} aria-label="Nieuwe taak"><Icon name="plus" /></button>
      </header>
      {late.length > 0 && (
        <section className="group">
          <h3 className="group-title">Achterstallig<span className="tag soft">{late.length}</span></h3>
          <ul className="card list overdue">
            {late.map(({ t, days }) => (
              <li key={t.id} className="line-wrap">
                <button className="line" onClick={() => onEdit(t)}>
                  <span className="line-icon">{room(t.room).icon}</span>
                  <span className="grow">
                    <span className="task-title">{t.title}</span>
                    <span className="small late">{days === 1 ? 'Sinds gisteren' : `${days} dagen te laat`} · {t.minutes} min</span>
                  </span>
                </button>
                {!planned.has(t.id) && (
                  <button className="btn soft small do-now" onClick={() => act.doNow(t)}>Vandaag</button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
      {!active.length && <p className="muted center">Nog geen taken. Tik op + om er een toe te voegen.</p>}
      {groups.map((g) => (
        <section key={g.key} className="group">
          <h3 className={'group-title' + (g.today ? ' today' : '')}>
            {g.title}{g.today && <span className="tag">vandaag</span>}
            {g.key.startsWith('d') && rest.includes(+g.key.slice(1)) && <span className="tag soft">rustdag</span>}
          </h3>
          {g.tasks.length ? (
            <ul className="card list">
              {g.tasks.map((t) => <TaskLine key={t.id} t={t} onClick={() => onEdit(t)} />)}
            </ul>
          ) : g.key.startsWith('d') ? <p className="muted small empty-day">Niks vast</p> : null}
        </section>
      ))}
    </div>
  )
}

function TaskLine({ t, onClick }: { t: Task; onClick: () => void }) {
  const { d } = useApp()
  const who = d.members.find((m) => m.user_id === t.assignee)
  const due = dueSince(t, localDate())
  const r = room(t.room)
  const moved = t.postponed_to && t.postponed_to > localDate()
    ? `verzet naar ${new Date(t.postponed_to).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}` : null
  const meta = moved ?? (t.recurrence === 'interval' ? `elke ${t.interval_days} dagen` : t.recurrence === 'once' && t.due_date ? `vanaf ${new Date(t.due_date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}` : null)
  return (
    <li>
      <button className="line" onClick={onClick}>
        <span className="line-icon">{r.icon}</span>
        <span className="grow">
          <span className="task-title">{t.title}</span>
          <span className="muted small">{r.label} · {t.minutes} min{t.effort === 3 ? ' · 💪' : t.effort === 1 ? ' · 🪶' : ''}{meta ? ` · ${meta}` : ''}{due && due < localDate() ? ' · ⚠︎ ligt achter' : ''}</span>
        </span>
        {who && <Avatar m={who} size={22} />}
        <Icon name="chevron" size={16} />
      </button>
    </li>
  )
}
