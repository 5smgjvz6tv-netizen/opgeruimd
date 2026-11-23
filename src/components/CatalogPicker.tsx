import { useState } from 'react'
import { CATALOG, searchCatalog, type CatalogTask } from '../lib/catalog'
import { scheduleLabel } from '../lib/rooms'
import { Icon } from './Icon'

/** Kies taken uit de bibliotheek: zoeken ("dekbed") of per ruimte bladeren, meerdere tegelijk. */
export function CatalogPicker({ rooms, selected, onToggle, existing }: {
  rooms: string[] | null
  selected: Set<string>
  onToggle: (t: CatalogTask) => void
  existing: Set<string>
}) {
  const [q, setQ] = useState('')
  const [allRooms, setAllRooms] = useState(false)
  const groups = CATALOG.filter((r) => allRooms || !rooms || rooms.includes(r.id))
  const [open, setOpen] = useState<string | null>(groups[0]?.id ?? null)
  const results = q.trim() ? searchCatalog(q, allRooms ? undefined : rooms ?? undefined) : null

  const item = (t: CatalogTask) => {
    const have = existing.has(t.id)
    const on = selected.has(t.id)
    return (
      <li key={t.id}>
        <button className={'pick-item compact' + (on ? ' on' : '') + (have ? ' have' : '')} onClick={() => !have && onToggle(t)} disabled={have} aria-pressed={on}>
          <span className="grow"><b>{t.title}</b><br />
            <span className="muted small"><Icon name="repeat" size={13} /> {scheduleLabel(t)} · <Icon name="clock" size={13} /> {t.minutes} min{t.effort === 3 ? ' · 💪' : t.effort === 1 ? ' · 🪶' : ''}</span>
          </span>
          {have ? <span className="tag soft">✓ al toegevoegd</span> : <span className="pick-check"><Icon name="check" size={15} /></span>}
        </button>
      </li>
    )
  }

  return (
    <div className="catalog">
      <div className="search">
        <Icon name="search" size={18} />
        <input className="field" placeholder="Zoek, bijv. dekbed, kalk of kat" value={q} onChange={(e) => setQ(e.target.value)} />
        {q && <button className="icon-btn clear" onClick={() => setQ('')} aria-label="Zoekveld leegmaken"><Icon name="x" size={16} /></button>}
      </div>
      {results ? (
        results.length ? <ul className="pick stagger">{results.map(item)}</ul>
          : <p className="muted center small">Niks gevonden voor “{q}”. Maak hem zelf aan via <b>Zelf maken</b>.</p>
      ) : (
        <div className="cat-groups">
          {groups.map((r) => {
            const n = r.tasks.filter((t) => selected.has(t.id)).length
            const isOpen = open === r.id
            return (
              <section key={r.id} className={'cat-group' + (isOpen ? ' open' : '')}>
                <button className="cat-head" onClick={() => setOpen(isOpen ? null : r.id)} aria-expanded={isOpen}>
                  <span className="cat-icon">{r.icon}</span>
                  <span className="grow"><b>{r.label}</b><br /><span className="muted small">{r.tasks.length} taken{n ? ` · ${n} gekozen` : ''}</span></span>
                  {n > 0 && <span className="count-badge pop-in" key={n}>{n}</span>}
                  <span className="chev"><Icon name="chevron" size={16} /></span>
                </button>
                <div className="cat-body"><div>
                  <ul className="pick">{r.tasks.map(item)}</ul>
                </div></div>
              </section>
            )
          })}
        </div>
      )}
      {rooms && !allRooms && <button className="link small" onClick={() => setAllRooms(true)}>Ook andere ruimtes laten zien</button>}
    </div>
  )
}
