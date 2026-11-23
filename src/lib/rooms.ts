import { t, type TKey } from './i18n'

export const ROOMS = [
  { id: 'keuken', label: 'Keuken', icon: 'keuken' },
  { id: 'woonkamer', label: 'Woonkamer', icon: 'woonkamer' },
  { id: 'badkamer', label: 'Badkamer', icon: 'badkamer' },
  { id: 'slaapkamer', label: 'Slaapkamer', icon: 'slaapkamer' },
  { id: 'was', label: 'Was', icon: 'was' },
  { id: 'toilet', label: 'Toilet', icon: 'toilet' },
  { id: 'boven', label: 'Boven', icon: 'boven' },
  { id: 'beneden', label: 'Beneden', icon: 'beneden' },
  { id: 'hal', label: 'Hal en trap', icon: 'hal' },
  { id: 'werkkamer', label: 'Werkkamer', icon: 'werkkamer' },
  { id: 'kinderkamer', label: 'Kinderkamer', icon: 'kinderkamer' },
  { id: 'huisdier', label: 'Huisdier', icon: 'huisdier' },
  { id: 'tuin', label: 'Tuin', icon: 'buiten' },
  { id: 'balkon', label: 'Balkon', icon: 'huis' },
  { id: 'buiten', label: 'Tuin en balkon', icon: 'buiten' },
  { id: 'auto', label: 'Auto en fiets', icon: 'auto' },
  { id: 'overig', label: 'Overig', icon: 'overig' },
] as const

export const room = (id: string | null) => {
  const r = ROOMS.find((x) => x.id === id) ?? ROOMS[ROOMS.length - 1]
  return { ...r, label: t(`room.${r.id}` as TKey) }
}

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

/** "ma & do" / "elke 2 dagen" / "eenmalig" */
export function scheduleLabel(x: { recurrence: string; weekdays?: number[] | null; interval_days?: number | null }) {
  const days = t('days.short').split(',')
  if (x.recurrence === 'weekly') return (x.weekdays ?? []).map((d) => days[d]).join(' · ')
  if (x.recurrence === 'interval') {
    const n = x.interval_days ?? 7
    const named: Record<number, TKey> = { 1: 'freq.daily', 2: 'freq.2', 7: 'freq.weekly', 14: 'freq.biweekly', 30: 'freq.monthly', 60: 'freq.2months', 90: 'freq.quarter', 120: 'freq.4months' }
    return named[n] ? t(named[n]) : t('freq.n', { n })
  }
  return t('freq.once')
}
