import { CATALOG, type CatalogTask } from './catalog'
import { t } from './i18n'

export type CleanDepth = 'basic' | 'normal' | 'thorough'
export type HomeType = 'house' | 'apartment'

export type HomeLayout = {
  homeType?: HomeType
  floors: string[][]
  placements?: Record<string, number[]>
  dishwasher: boolean
  garden: boolean
  balcony: boolean
  cat?: boolean
  dog?: boolean
  plants?: boolean
  workFromHome?: boolean
  youngKids?: boolean
  hasCleaner?: boolean
  cooksOften?: boolean
  depth?: CleanDepth
  // Legacy optional fields kept for backwards compatibility with saved layouts
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
  homeType: 'apartment',
  floors: suggestedFloors(1), placements: {}, dishwasher: false, garden: false, balcony: false,
  cat: false, dog: false, plants: false, workFromHome: false, youngKids: false, hasCleaner: false, cooksOften: false, depth: 'normal',
})

export function switchHomeType(home: HomeLayout, homeType: HomeType): HomeLayout {
  const next = resizeLayout(home, homeType === 'apartment' ? 1 : Math.max(2, home.floors.length))
  return {
    ...next,
    homeType,
    garden: homeType === 'house' ? true : false,
    balcony: homeType === 'apartment' ? true : home.balcony,
  }
}

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
    ...(rooms.includes('kinderkamer') || home.youngKids ? ['kinderen'] : []),
    ...(home.workFromHome ? ['werkkamer'] : []),
    'vloeren', 'hele-huis',
    ...(home.cat || home.dog || home.pets ? ['huisdier'] : []),
    ...(home.garden ? ['tuin'] : []),
    ...(home.balcony ? ['balkon'] : []),
  ])]
}
export function starterTasks(home: HomeLayout): CatalogTask[] {
  const rooms = home.floors.flat()
  const depth: CleanDepth = home.depth ?? 'normal'
  const floorTasks = home.hasCleaner
    ? []
    : home.floors.length === 1
      ? ['v-zuig']
      : ['v-zuig-beneden', 'v-zuig-boven', ...['v-zuig-2', 'v-zuig-3'].slice(0, home.floors.length - 2)]
  const isHouse = home.homeType === 'house' || (home.homeType === undefined && (home.floors.length > 1 || home.garden))
  const weekly = depth === 'basic' ? [] : [
    ...(rooms.includes('badkamer') && !home.hasCleaner ? ['b-schoonmaken'] : []),
    ...(rooms.includes('toilet') && !home.hasCleaner ? ['t-wc'] : []),
    ...(rooms.includes('slaapkamer') ? ['s-bed'] : []),
    ...(rooms.includes('was') ? ['l-donker'] : []),
    ...(isHouse ? ['g-container'] : []),
  ]
  const monthly = depth !== 'thorough' ? [] : [
    ...(rooms.includes('keuken') ? ['k-koelkast'] : []),
    ...(rooms.includes('woonkamer') && !home.hasCleaner ? ['w-ramen'] : []),
    ...(rooms.includes('was') ? ['l-wasmachine'] : []),
  ]
  const ids = [
    ...(rooms.includes('slaapkamer') ? ['s-bed-opmaken'] : []),
    ...(rooms.includes('keuken') ? ['k-vuilnis', home.dishwasher ? 'k-vaatwasser-uit' : 'k-afwas'] : []),
    ...(rooms.includes('woonkamer') ? ['w-opruimen'] : []),
    ...floorTasks,
    ...(rooms.includes('keuken') && home.cooksOften ? ['k-koelkast-check', 'k-theedoeken'] : []),
    ...(rooms.includes('was') ? ['l-vouwen'] : []),
    ...(rooms.includes('werkkamer') || home.workFromHome ? ['o-bureau'] : []),
    ...(rooms.includes('kinderkamer') || home.youngKids ? ['c-speelgoed'] : []),
    ...(home.cat ? ['p-bak'] : []),
    ...(home.dog ? ['p-bakjes', ...(home.hasCleaner ? [] : ['p-haren'])] : []),
    ...(!home.cat && !home.dog && home.pets ? ['p-bakjes'] : []),
    ...(home.plants ? ['w-planten'] : []),
    ...(home.garden ? ['g-vegen'] : []),
    ...(home.balcony ? ['b-vegen'] : []),
    ...weekly,
    ...monthly,
  ]
  const catalog = CATALOG.flatMap(group => group.tasks)
  return [...new Set(ids)].map(id => catalog.find(task => task.id === id)).filter((task): task is CatalogTask => !!task)
}

export type RoundAdvice = {
  recommended: number
  houseMinutes: number
  perPerson: number
  activeDays: number
  profile: 'cleaner' | 'family' | 'wfh' | 'pet' | 'compact' | 'standard'
  focus: 'cleaner' | 'pets' | 'kids' | 'cooking' | 'floors' | 'basics'
}

const MINUTE_STEPS = [5, 10, 15, 20, 30] as const

/** Persoonlijk minuut-advies incl. het dagdeel van wekelijkse en maandelijkse klussen. */
export function recommendRound(home: HomeLayout, size: number, restDays: number[]): RoundAdvice {
  const floors = Math.max(1, home.floors.length)
  const roomCount = home.floors.flat().length
  const hasPets = !!(home.cat || home.dog || home.pets)
  // Realistische dagbelasting voor het hele huis: dagelijkse basis + wekelijkse (badkamer, vloeren, was, bed) + maandelijkse klussen omgerekend per dag.
  let raw = 17 + (floors - 1) * 7.5 + Math.max(0, roomCount - 4) * 2
  if (home.dishwasher) raw -= 3
  if (home.cooksOften) raw += 4
  if (home.cat) raw += 4
  if (home.dog) raw += 6
  else if (!home.cat && home.pets) raw += 4
  if (home.youngKids) raw += 7
  if (home.workFromHome) raw += 3
  if (home.plants) raw += 1.5
  if (home.garden) raw += 3
  if (home.balcony) raw += 1.5
  if (home.homeType === 'apartment') raw -= 3
  if (home.hasCleaner) raw *= 0.6
  const depth = home.depth ?? 'normal'
  if (depth === 'basic') raw *= 0.72
  else if (depth === 'thorough') raw *= 1.22

  const activeDays = Math.max(1, 7 - restDays.length)
  const houseMinutes = Math.max(10, Math.round((raw * 7) / activeDays / 5) * 5)
  const perPerson = (raw / Math.max(1, size)) * (7 / activeDays)
  const recommended = MINUTE_STEPS.reduce((best, m) => (Math.abs(m - perPerson) < Math.abs(best - perPerson) ? m : best), 15)

  const profile: RoundAdvice['profile'] = home.hasCleaner ? 'cleaner'
    : home.youngKids ? 'family'
    : home.workFromHome ? 'wfh'
    : hasPets ? 'pet'
    : floors === 1 && roomCount <= 6 ? 'compact'
    : 'standard'

  const focus: RoundAdvice['focus'] = home.hasCleaner ? 'cleaner'
    : hasPets ? 'pets'
    : home.youngKids ? 'kids'
    : home.cooksOften ? 'cooking'
    : floors >= 2 ? 'floors'
    : 'basics'

  return { recommended, houseMinutes, perPerson: Math.round(perPerson), activeDays, profile, focus }
}
