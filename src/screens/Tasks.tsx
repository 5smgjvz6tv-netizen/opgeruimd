import { dueSince, localDate, weekday } from '../../supabase/functions/_shared/planner'
import { Avatar, DAYS_LONG } from '../components/Bits'
import { Icon } from '../components/Icon'
import { useApp, type Task } from '../lib/data'
import { room } from '../lib/rooms'

export function Tasks({ onEdit, onAdd }: { onEdit: (t: Task) => void; onAdd: () => void }) {
  const { d } = useApp()
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
  const meta = t.recurrence === 'interval' ? `elke ${t.interval_days} dagen` : t.recurrence === 'once' && t.due_date ? `vanaf ${new Date(t.due_date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}` : null
  return (
    <li>
      <button className="line" onClick={onClick}>
        <span className="line-icon">{r.icon}</span>
        <span className="grow">
          <span className="task-title">{t.title}</span>
          <span className="muted small">{r.label} · {t.minutes} min{meta ? ` · ${meta}` : ''}{due && due < localDate() ? ' · ⚠︎ ligt achter' : ''}</span>
        </span>
        {who && <Avatar m={who} size={22} />}
        <Icon name="chevron" size={16} />
      </button>
    </li>
  )
}
