import { useState } from 'react'
import { Icon } from './Icon'
import { Stepper } from './Controls'
import { t } from '../lib/i18n'
import { floorName, type HomeLayout } from '../lib/homeLayout'
import { room } from '../lib/rooms'

const choices = ['keuken','woonkamer','slaapkamer','badkamer','toilet','hal','werkkamer','kinderkamer','was']
export function HomeLayoutPicker({ home, onChange }: { home: HomeLayout; onChange: (h: HomeLayout) => void }) {
  const [selected, select] = useState(0)
  const active = Math.min(selected, home.floors.length - 1)
  const changeCount = (count: number) => {
    const floors = home.floors.slice(0, count).map(rooms => [...rooms])
    while (floors.length < count) floors.push([])
    for (const id of home.floors.slice(count).flat()) if (!floors.flat().includes(id)) floors[count - 1].push(id)
    select(Math.min(count - 1, count > home.floors.length ? count - 1 : active)); onChange({ ...home, floors })
  }
  return <div className="layout-picker">
    <div className="row"><strong className="grow">{t('layout.floors')}</strong><Stepper value={home.floors.length} min={1} max={4} onChange={changeCount} label={t('layout.floors')} /></div>
    <div className="house-section"><svg viewBox="0 0 300 42" aria-hidden="true" preserveAspectRatio="none"><path d="M3 39 150 4l147 35Z" /></svg>
      {home.floors.map((rooms, index) => <button type="button" key={index} aria-pressed={active === index} onClick={() => select(index)}>
        <b>{floorName(index)}</b><span>{rooms.map(id => <Icon key={id} name={room(id).icon} size={18} />)}</span>
      </button>).reverse()}
    </div>
    <fieldset><legend>{t('layout.rooms', { floor: floorName(active) })}</legend><div className="chips">
      {choices.map(id => <button key={id} type="button" className="layout-choice" aria-pressed={home.floors[active].includes(id)} onClick={() => onChange({ ...home, floors: home.floors.map((rooms, i) => i !== active ? rooms : rooms.includes(id) ? rooms.filter(r => r !== id) : [...rooms, id]) })}>{room(id).label}</button>)}
    </div></fieldset>
    <fieldset><legend>{t('layout.extra')}</legend><div className="chips">
      {(['dishwasher','garden','balcony'] as const).map(key => <button type="button" className="layout-choice" key={key} aria-pressed={home[key]} onClick={() => onChange({ ...home, [key]: !home[key] })}>{t(key === 'dishwasher' ? 'layout.dishwasher' : key === 'garden' ? 'room.tuin' : 'room.balkon')}</button>)}
    </div></fieldset>
  </div>
}
