import { useState } from 'react'
import { Icon } from './Icon'
import { Stepper } from './Controls'
import { t } from '../lib/i18n'
import { floorName, resizeLayout, toggleRoom, type HomeLayout } from '../lib/homeLayout'
import { room } from '../lib/rooms'

const choices = ['keuken','woonkamer','slaapkamer','badkamer','toilet','hal','werkkamer','kinderkamer','was','zolder']
export function HomeLayoutPicker({ home, onChange }: { home: HomeLayout; onChange: (h: HomeLayout) => void }) {
  const [selected, select] = useState(0)
  const active = Math.min(selected, home.floors.length - 1)
  const changeCount = (count: number) => {
    select(count > home.floors.length ? count - 1 : Math.min(active, count - 1))
    onChange(resizeLayout(home, count))
  }
  const [landing, setLanding] = useState<number | null>(null)
  function option(label: string, icon: string, checked: boolean, toggle: () => void) {
    return <button key={label} type="button" className="room-option" aria-pressed={checked} onClick={toggle}>
      <Icon name={icon} /><span>{label}</span><i aria-hidden="true">{checked && <Icon name="check" size={13} />}</i>
    </button>
  }
  return <div className="layout-picker">
    <div className="floor-builder">
      <div className="row"><strong className="grow">{t('layout.floors')}</strong><Stepper value={home.floors.length} min={1} max={4} onChange={count => {
        setLanding(count > home.floors.length ? count - 1 : null)
        changeCount(count)
      }} label={t('layout.floors')} /></div>
      <div className="house-model">
        <img className="toy-roof" src={art('roof')} alt="" />
        {home.floors.map((_, index) => <button type="button" key={index} aria-pressed={active === index}
          className={landing === index ? 'landing' : ''} onClick={() => select(index)}>
          <img src={art(index ? 'storey' : 'ground')} alt="" /><span>{floorName(index)}</span>
        </button>).reverse()}
      </div>
    </div>
    <fieldset><legend>{t('layout.rooms', { floor: floorName(active) })}</legend><div className="room-options">
      {choices.map(id => option(room(id).label, room(id).icon, home.floors[active].includes(id), () => onChange(toggleRoom(home, active, id))))}
    </div></fieldset>
    <fieldset><legend>{t('layout.extra')}</legend><div className="room-options">
      {(['dishwasher','garden','balcony'] as const).map(key => option(
        t(key === 'dishwasher' ? 'layout.dishwasher' : key === 'garden' ? 'room.tuin' : 'room.balkon'),
        { dishwasher: 'keuken', garden: 'buiten', balcony: 'huis' }[key], home[key], () => onChange({ ...home, [key]: !home[key] })
      ))}
    </div></fieldset>
  </div>
}

const art = (piece: string) => import.meta.env.BASE_URL + 'onboarding/' + piece + '.webp'

export function HousePortrait({ floors }: { floors: number }) {
  return <div className="house-portrait" aria-hidden="true">
    <img className="toy-roof" src={art('roof')} alt="" />
    {Array.from({ length: floors - 1 }, (_, i) => <img key={i} src={art('storey')} alt="" />)}
    <img src={art('ground')} alt="" />
  </div>
}
