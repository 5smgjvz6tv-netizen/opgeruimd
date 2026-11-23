import { useState } from 'react'
import { CATALOG, catTitle, groupLabel, searchCatalog, type CatalogTask } from '../lib/catalog'
import { xpOf } from '../lib/game'
import { t } from '../lib/i18n'
import { scheduleLabel } from '../lib/rooms'
import { Ic } from './Bits'
import { Icon } from './Icon'

/** Taken kiezen uit de bibliotheek: zoeken of per ruimte openklappen, meerdere tegelijk. */
export function CatalogPicker({ rooms, selected, onToggle, existing, existingTitles }: {
  rooms: string[] | null; selected: Set<string>; onToggle: (t: CatalogTask) => void; existing: Set<string>; existingTitles?: Set<string>
}) {
  const [q, setQ] = useState('')
  const [allRooms, setAllRooms] = useState(false)
  const groups = CATALOG.filter((r) => allRooms || !rooms || rooms.includes(r.id))
  const [open, setOpen] = useState<string | null>(groups[0]?.id ?? null)
  const results = q.trim() ? searchCatalog(q, allRooms ? undefined : rooms ?? undefined) : null

  const row = (task: CatalogTask) => {
    const have = existing.has(task.id) || !!existingTitles?.has(catTitle(task).trim().toLowerCase()) || !!existingTitles?.has(task.title.trim().toLowerCase())
    const on = selected.has(task.id) || have
    return (
      <button key={task.id} className={'row pick-row' + (have ? ' have' : '')} onClick={() => !have && onToggle(task)} disabled={have} aria-pressed={on}>
        <span className={'check' + (on ? ' on' : '')}><Icon name="check" size={14} /></span>
        <span className="row-main">
          <span className="row-title">{catTitle(task)}</span>
          <span className="row-sub">
            <span>{scheduleLabel(task)}</span><span className="sep" /><span>{task.minutes} {t('common.min')}</span>
            {task.effort !== 2 && <><span className="sep" /><Icon name={task.effort === 3 ? 'muscle' : 'feather'} size={13} /><span>{t(task.effort === 3 ? 'effort.3' : 'effort.1')}</span></>}
          </span>
        </span>
        {have ? <span className="tag gray">{t('lib.have')}</span> : <span className="xp-chip">+{xpOf(task.minutes, task.effort)}</span>}
      </button>
    )
  }

  return (
    <div className="group">
      <div className="search">
        <Icon name="search" size={18} />
        <input className="field" placeholder={t('lib.search')} value={q} onChange={(e) => setQ(e.target.value)} />
        {q && <button className="icon-btn clear" onClick={() => setQ('')} aria-label={t('common.close')}><Icon name="x" size={16} /></button>}
      </div>
      {results ? (
        results.length ? <div className="list">{results.map(row)}</div>
          : <p className="group-f center">{t('lib.noResults', { q })}</p>
      ) : groups.map((g) => {
        const n = g.tasks.filter((x) => selected.has(x.id)).length
        const isOpen = open === g.id
        return (
          <div key={g.id} className={'list cat-group' + (isOpen ? ' open' : '')}>
            <button className="row" onClick={() => setOpen(isOpen ? null : g.id)} aria-expanded={isOpen}>
              <Ic name={g.icon} />
              <span className="row-main"><span className="row-title">{groupLabel(g)}</span>
                <span className="row-sub">{t('lib.count', { n: g.tasks.length })}{n > 0 && <><span className="sep" />{t('lib.chosen', { n })}</>}</span></span>
              {n > 0 && <span className="count-badge">{n}</span>}
              <span className="chev"><Icon name="chevron" size={16} /></span>
            </button>
            <div className={'collapse' + (isOpen ? ' open' : '')}><div>{isOpen && g.tasks.map(row)}</div></div>
          </div>
        )
      })}
      {rooms && !allRooms && !results && <button className="btn ghost sm" onClick={() => setAllRooms(true)}>{t('lib.otherRooms')}</button>}
    </div>
  )
}
