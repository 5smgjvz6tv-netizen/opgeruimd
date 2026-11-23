import { CATALOG, type CatalogTask } from './catalog'
import { t } from './i18n'

export type HomeLayout = {
  floors: string[][]
  placements?: Record<string, number[]>
  dishwasher: boolean
  garden: boolean
  balcony: boolean
  robotVacuum?: boolean
  airfryer?: boolean
  coffeeMachine?: boolean
  dryer?: boolean
  bidet?: boolean
  plants?: boolean
  pets?: boolean
}
function suggestedFloors(count: number): string[][] {
  const floors: string[][] = Array.from({ length: count }, () => [])
  floors[0].push('woonkamer', 'keuken', 'toilet', 'hal')
  floors[Math.min(1, count - 1)].push('slaapkamer', 'badkamer')
  if (count > 1) floors[count - 1].push('was')
  if (count === 4) floors[2].push('werkkamer')
  if (count >= 3) floors[count - 1].push('zolder')
  return floors
}
export const initialLayout = (): HomeLayout => ({
  floors: suggestedFloors(1), placements: {}, dishwasher: false, garden: false, balcony: false,
  robotVacuum: false, airfryer: false, coffeeMachine: false, dryer: false, bidet: false, plants: false, pets: false,
})

function roomFloors(floors: string[][], id: string) {
  return floors.flatMap((rooms, i) => rooms.includes(id) ? [i] : [])
}

function placementsOf(home: HomeLayout) {
  if (home.placements) return home.placements
  // Older saved layouts only stored their final room lists. If upper floors were empty, start fresh from defaults.
  if (home.floors.length > 1 && home.floors.slice(1).some(rooms => !rooms.length)) return {}
  const previous = suggestedFloors(home.floors.length)
  const overrides: Record<string, number[]> = {}
  for (const id of new Set([...home.floors.flat(), ...previous.flat()])) {
    const actual = roomFloors(home.floors, id)
    if (actual.join() !== roomFloors(previous, id).join()) overrides[id] = actual
  }
  return overrides
}

export function resizeLayout(home: HomeLayout, count: number): HomeLayout {
  const placements = placementsOf(home)
  const floors = suggestedFloors(count).map(rooms => rooms.filter(id => !(id in placements)))
  for (const [id, levels] of Object.entries(placements)) {
    for (const level of new Set(levels.map(i => Math.min(i, count - 1)))) floors[level].push(id)
  }
  return { ...home, floors, placements }
}

export function toggleRoom(home: HomeLayout, floor: number, id: string): HomeLayout {
  const floors = home.floors.map((rooms, i) => i !== floor ? rooms :
    rooms.includes(id) ? rooms.filter(room => room !== id) : [...rooms, id])
  return { ...home, floors, placements: { ...placementsOf(home), [id]: roomFloors(floors, id) } }
}

export const floorName = (index: number) => index === 0 ? t('layout.ground') : t('layout.floor', { n: index })
export function roomGroups(home: HomeLayout) {
  const rooms = home.floors.flat()
  return [...new Set([
    ...rooms,
    ...(rooms.includes('kinderkamer') ? ['kinderen'] : []),
    'vloeren', 'hele-huis',
    ...(home.pets ? ['huisdier'] : []),
    ...(home.garden ? ['tuin'] : []),
    ...(home.balcony ? ['balkon'] : []),
  ])]
}
export function starterTasks(home: HomeLayout): CatalogTask[] {
  const rooms = home.floors.flat()
  const floorTasks = home.floors.length === 1
    ? [home.robotVacuum ? 'v-robot' : 'v-zuig']
    : [home.robotVacuum ? 'v-robot' : 'v-zuig-beneden', 'v-zuig-boven', ...['v-zuig-2', 'v-zuig-3'].slice(0, home.floors.length - 2)]
  const ids = [
    ...(rooms.includes('slaapkamer') ? ['s-bed-opmaken'] : []),
    ...(rooms.includes('keuken') ? ['k-vuilnis', home.dishwasher ? 'k-vaatwasser-uit' : 'k-afwas'] : []),
    ...(rooms.includes('woonkamer') ? ['w-opruimen'] : []),
    ...floorTasks,
    ...(rooms.includes('keuken') && home.airfryer ? ['k-airfryer'] : []),
    ...(rooms.includes('keuken') && home.coffeeMachine ? ['k-koffie'] : []),
    ...(rooms.includes('toilet') && home.bidet ? ['t-bidet'] : []),
    ...(rooms.includes('was') ? ['l-vouwen', ...(home.dryer ? ['l-droger'] : [])] : home.dryer ? ['l-droger'] : []),
    ...(rooms.includes('werkkamer') ? ['o-bureau'] : []),
    ...(rooms.includes('kinderkamer') ? ['c-speelgoed'] : []),
    ...(home.plants ? ['w-planten'] : []),
    ...(home.pets ? ['p-bakjes'] : []),
    ...(home.garden ? ['g-vegen'] : []),
    ...(home.balcony ? ['b-vegen'] : []),
  ]
  const catalog = CATALOG.flatMap(group => group.tasks)
  return [...new Set(ids)].map(id => catalog.find(task => task.id === id)).filter((task): task is CatalogTask => !!task)
}
