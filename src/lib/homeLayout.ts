import { CATALOG } from './catalog'
import { t } from './i18n'

export type HomeLayout = { floors: string[][]; placements?: Record<string, number[]>; dishwasher: boolean; garden: boolean; balcony: boolean }
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
})

function roomFloors(floors: string[][], id: string) {
  return floors.flatMap((rooms, i) => rooms.includes(id) ? [i] : [])
}

function placementsOf(home: HomeLayout) {
  if (home.placements) return home.placements
  // Older saved layouts only stored their final room lists. Preserve custom placements.
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
