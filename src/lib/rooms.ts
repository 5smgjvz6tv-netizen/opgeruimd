export const ROOMS = [
  { id: 'keuken', label: 'Keuken', icon: '🍳' },
  { id: 'woonkamer', label: 'Woonkamer', icon: '🛋️' },
  { id: 'badkamer', label: 'Badkamer', icon: '🛁' },
  { id: 'slaapkamer', label: 'Slaapkamer', icon: '🛏️' },
  { id: 'was', label: 'Was', icon: '🧺' },
  { id: 'boven', label: 'Boven', icon: '⬆️' },
  { id: 'beneden', label: 'Beneden', icon: '⬇️' },
  { id: 'overig', label: 'Overig', icon: '✨' },
] as const

export const room = (id: string | null) => ROOMS.find((r) => r.id === id) ?? ROOMS[ROOMS.length - 1]

// Slimme regels: raad ruimte en duur uit wat je typt.
const RULES: [RegExp, string | null, number | null][] = [
  [/was(sen|je)?\b|wasmachine|droger|strijk|vouw/, 'was', 10],
  [/keuken|aanrecht|vaatwas|afwas|oven|koelkast|magnetron|fornuis|kookplaat|afzuig/, 'keuken', 10],
  [/bad(kamer)?|douche|wc|toilet|wastafel|spiegel/, 'badkamer', 15],
  [/\bbed\b|beddengoed|verschon|slaapkamer|kast opruim/, 'slaapkamer', 10],
  [/tv|bank|woonkamer|salontafel|kussens/, 'woonkamer', null],
  [/boven|trap/, 'boven', null],
  [/beneden|hal\b|gang/, 'beneden', null],
  [/stofzuig|dweil|vloer/, null, 15],
  [/afstof|stof\b|planten|water geven|vuilnis|prullenbak|afval/, null, 5],
  [/ramen|grote schoonmaak|ontvet/, null, 30],
]
export function guess(title: string) {
  const t = title.toLowerCase()
  let r: string | null = null
  let m: number | null = null
  for (const [re, rr, mm] of RULES) if (re.test(t)) { r ??= rr; m ??= mm }
  return { room: r, minutes: m }
}

export const STARTERS = [
  { title: 'Bed verschonen', room: 'slaapkamer', minutes: 15, recurrence: 'weekly', weekdays: [5] },
  { title: 'Zwarte was draaien', room: 'was', minutes: 10, recurrence: 'weekly', weekdays: [0] },
  { title: 'Stofzuigen beneden', room: 'beneden', minutes: 15, recurrence: 'weekly', weekdays: [0, 3] },
  { title: 'Stofzuigen boven', room: 'boven', minutes: 15, recurrence: 'weekly', weekdays: [2] },
  { title: 'Badkamer schoonmaken', room: 'badkamer', minutes: 15, recurrence: 'weekly', weekdays: [5] },
  { title: 'Aanrecht en kookplaat afnemen', room: 'keuken', minutes: 5, recurrence: 'interval', interval_days: 2 },
  { title: 'Vuilnis buiten zetten', room: 'keuken', minutes: 5, recurrence: 'weekly', weekdays: [1] },
  { title: 'Planten water geven', room: 'woonkamer', minutes: 5, recurrence: 'interval', interval_days: 7 },
] as const
