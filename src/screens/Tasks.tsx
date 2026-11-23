import { useState } from 'react'
import { daysBetween, dueSince, localDate, nextDue, weekday } from '../../supabase/functions/_shared/planner'
import { Avatar, Ic } from '../components/Bits'
import { Icon } from '../components/Icon'
import { niceDate } from '../components/LogSheet'
import { useApp, type Task } from '../lib/data'
import { taskTitle } from '../lib/catalog'
import { xpOf } from '../lib/game'
import { list, t } from '../lib/i18n'
import { room, ROOMS, scheduleLabel } from '../lib/rooms'
import { overdue } from '../lib/stats'

export function Tasks({ onEdit, onAdd }: { onEdit: (t: Task) => void; onAdd: () => void }) {
  const { d, act } = useApp()
  const [only, setOnly] = useState<string | null>(null)
  const all = d.tasks.filter((x) => !x.archived)
  const active = all.filter((x) => !only || (x.room ?? 'overig') === only)
  const roomsUsed = ROOMS.filter((r) => all.some((x) => (x.room ?? 'overig') === r.id))
  const late = overdue(d).filter(({ t: x }) => !only || (x.room ?? 'overig') === only)
  const planned = new Set(d.items.filter((i) => i.date === localDate()).map((i) => i.task_id))
  const todayWd = weekday(localDate())
  const days = list('days.long')
  const groups = [
    ...days.map((name, i) => ({ key: 'd' + i, title: name, today: i === todayWd, rest: d.household.rest_days.includes(i), tasks: active.filter((x) => x.recurrence === 'weekly' && x.weekdays.includes(i)) })),
    { key: 'int', title: t('tasks.recurring'), today: false, rest: false, tasks: active.filter((x) => x.recurrence === 'interval') },
    { key: 'once', title: t('tasks.once'), today: false, rest: false, tasks: active.filter((x) => x.recurrence === 'once') },
  ].filter((g) => g.tasks.length || g.today)

  return (
    <div className="page">
      <header className="hdr">
        <h1>{t('tasks.title')}</h1>
        <button className="icon-btn filled" onClick={onAdd} aria-label={t('task.new')}><Icon name="plus" size={20} /></button>
      </header>

      {roomsUsed.length > 1 && (
        <div className="room-filter">
          <button className={'chip' + (!only ? ' on' : '')} onClick={() => setOnly(null)}>{t('tasks.all')} <small>{all.length}</small></button>
          {roomsUsed.map((r) => (
            <button key={r.id} className={'chip' + (only === r.id ? ' on' : '')} onClick={() => setOnly(only === r.id ? null : r.id)}>
              <Icon name={r.icon} size={16} />{room(r.id).label} <small>{all.filter((x) => (x.room ?? 'overig') === r.id).length}</small>
            </button>
          ))}
        </div>
      )}

      {late.length > 0 && (
        <div className="group">
          <h3 className="group-h">{t('tasks.overdue')}<span className="tag gold">{late.length}</span></h3>
          <div className="list">
            {late.map(({ t: x, days: n }) => (
              <div key={x.id} className="row">
                <Ic name={room(x.room).icon} tone="gold" />
                <button className="row-main" onClick={() => onEdit(x)}>
                  <span className="row-title">{taskTitle(x)}</span>
                  <span className="row-sub">{n === 1 ? t('tasks.lateYesterday') : t('tasks.lateDays', { n })}<span className="sep" />{x.minutes} {t('common.min')}</span>
                </button>
                {!planned.has(x.id) && <button className="btn tinted sm" onClick={() => act.doNow(x)}>{t('tasks.doToday')}</button>}
              </div>
            ))}
          </div>
        </div>
      )}

      {!all.length && <p className="group-f center">{t('tasks.empty')}</p>}
      {groups.map((g) => (
        <div key={g.key + (only ?? '')} className="group">
          <h3 className="group-h"><span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>{g.title}{g.today && <span className="tag">{t('common.today')}</span>}{g.rest && <span className="tag gold">{t('set.rest')}</span>}</span></h3>
          {g.tasks.length ? <div className="list">{g.tasks.map((x) => <TaskLine key={x.id} task={x} onClick={() => onEdit(x)} />)}</div>
            : <p className="group-f">{t('tasks.nothingFixed')}</p>}
        </div>
      ))}
    </div>
  )
}

function TaskLine({ task, onClick }: { task: Task; onClick: () => void }) {
  const { d } = useApp()
  const who = d.members.find((m) => m.user_id === task.assignee)
  const today = localDate()
  const due = dueSince(task, today)
  const r = room(task.room)
  const moved = task.postponed_to && task.postponed_to > today ? t('tasks.moved', { when: niceDate(task.postponed_to) }) : null
  const nd = !moved && !due ? nextDue(task) : null
  const ago = task.last_done_at ? daysBetween(localDate(task.last_done_at), today) : null
  return (
    <button className="row" onClick={onClick}>
      <Ic name={r.icon} />
      <span className="row-main">
        <span className="row-title">{taskTitle(task)}</span>
        <span className="row-sub">
          {task.recurrence !== 'weekly' && <>{scheduleLabel(task)}<span className="sep" /></>}
          {task.minutes} {t('common.min')}
          {task.effort !== 2 && <><span className="sep" /><Icon name={task.effort === 3 ? 'muscle' : 'feather'} size={13} /></>}
          {moved ? <><span className="sep" />{moved}</> : nd ? <><span className="sep" />{t('tasks.next', { when: niceDate(nd) })}</> : null}
          {ago === 0 && <><span className="sep" /><Icon name="check" size={13} />{t('tasks.doneToday')}</>}
        </span>
      </span>
      {who && <Avatar m={who} size={22} />}
      <span className="xp-chip">+{xpOf(task.minutes, task.effort)}</span>
      <span className="chev"><Icon name="chevron" size={16} /></span>
    </button>
  )
}
