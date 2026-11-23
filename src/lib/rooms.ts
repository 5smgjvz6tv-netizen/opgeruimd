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

const DAY = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']
/** "ma & do" / "elke 2 dagen" / "eenmalig" */
export function scheduleLabel(t: { recurrence: string; weekdays?: number[] | null; interval_days?: number | null }) {
  if (t.recurrence === 'weekly') return (t.weekdays ?? []).map((d) => DAY[d]).join(' & ')
  if (t.recurrence === 'interval') {
    const n = t.interval_days ?? 7
    const named: Record<number, string> = { 1: 'elke dag', 2: 'om de dag', 7: 'elke week', 14: 'om de week', 30: 'elke maand', 60: 'om de 2 maanden', 90: 'elk kwartaal', 120: 'om de 4 maanden' }
    return named[n] ?? `elke ${n} dagen`
  }
  return 'eenmalig'
}
