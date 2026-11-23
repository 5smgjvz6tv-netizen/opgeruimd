import { CATALOG } from './catalog'
import { t } from './i18n'

export type HomeLayout = { floors: string[][]; dishwasher: boolean; garden: boolean; balcony: boolean }
export const initialLayout = (): HomeLayout => ({
  floors: [['keuken', 'woonkamer', 'slaapkamer', 'badkamer']], dishwasher: false, garden: false, balcony: false,
})
export const floorName = (index: number) => index === 0 ? t('layout.ground') : t('layout.floor', { n: index })
export function roomGroups(home: HomeLayout) {
  return [...new Set([...home.floors.flat(), 'vloeren', 'hele-huis', ...(home.garden ? ['tuin'] : []), ...(home.balcony ? ['balkon'] : [])])]
}
export function starterTasks(home: HomeLayout) {
  const rooms = home.floors.flat()
  const ids = ['k-vuilnis', ...(home.dishwasher ? ['k-vaatwasser-uit'] : []),
    ...(rooms.includes('slaapkamer') ? ['s-bed-opmaken'] : []), ...(rooms.includes('woonkamer') ? ['w-opruimen'] : []),
    ...(home.floors.length === 1 ? ['v-zuig'] : ['v-zuig-beneden', 'v-zuig-boven', ...['v-zuig-2','v-zuig-3'].slice(0, home.floors.length - 2)]),
    ...(rooms.includes('was') ? ['l-vouwen'] : []), ...(home.garden ? ['g-vegen'] : []), ...(home.balcony ? ['b-vegen'] : [])]
  const catalog = CATALOG.flatMap(group => group.tasks)
  return ids.map(id => catalog.find(task => task.id === id)!)
}
