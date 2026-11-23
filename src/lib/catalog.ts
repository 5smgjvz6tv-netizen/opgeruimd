// Takenbibliotheek: concrete, kant-en-klare taken per ruimte, met slimme standaarden.
// Vorm per taak: [id, titel, minuten, zwaarte (1 licht, 2 normaal, 3 zwaar), hoe vaak, zoekwoorden, populair?]
// "Hoe vaak": een getal = elke N dagen; een tekst als 'ma,do' = vaste weekdagen.

type Raw = [string, string, number, 1 | 2 | 3, number | string, string?, 1?, string?]
export type CatalogTask = {
  id: string; title: string; room: string; minutes: number; effort: number; popular: boolean; keywords: string
  recurrence: 'weekly' | 'interval'; weekdays: number[]; interval_days: number | null
}
export type CatalogRoom = { id: string; label: string; icon: string; tasks: CatalogTask[] }

const DAY: Record<string, number> = { ma: 0, di: 1, wo: 2, do: 3, vr: 4, za: 5, zo: 6 }

const RAW: { id: string; label: string; icon: string; room: string; tasks: Raw[] }[] = [
  { id: 'keuken', label: 'Keuken', icon: 'keuken', room: 'keuken', tasks: [
    ['k-aanrecht', 'Aanrecht en kookplaat afnemen', 5, 1, 2, 'schoonmaken afnemen fornuis', 1],
    ['k-vaatwasser-uit', 'Vaatwasser uitruimen', 5, 1, 1, 'afwas servies', 1],
    ['k-afwas', 'Afwas doen', 15, 2, 2, 'vaat pannen spoelen'],
    ['k-vuilnis', 'Vuilnisbak legen', 5, 1, 3, 'afval prullenbak vuilniszak', 1],
    ['k-pmd', 'Plastic/PMD wegbrengen', 5, 1, 7, 'afval plastic recycling'],
    ['k-papier', 'Oud papier wegbrengen', 5, 1, 14, 'karton afval'],
    ['k-glas', 'Glas wegbrengen', 10, 1, 30, 'flessen glasbak'],
    ['k-koelkast-check', 'Koelkast checken op overdatum', 5, 1, 7, 'eten houdbaarheid', 1],
    ['k-koelkast', 'Koelkast uitsoppen', 20, 2, 30, 'schoonmaken ijskast'],
    ['k-magnetron', 'Magnetron schoonmaken', 10, 2, 14, 'microgolf oven'],
    ['k-oven', 'Oven ontvetten', 30, 3, 60, 'schoonmaken vet'],
    ['k-afzuigkap', 'Afzuigkapfilter reinigen', 15, 2, 60, 'filter vet wasemkap'],
    ['k-kastjes', 'Keukenkastjes afnemen (buitenkant)', 10, 1, 14, 'deurtjes vlekken'],
    ['k-vloer', 'Keukenvloer dweilen', 10, 2, 7, 'vloer dweil', 1],
    ['k-spoelbak', 'Gootsteen en kraan ontkalken', 5, 1, 7, 'kraan kalk spoelbak'],
    ['k-vaatwasser-filter', 'Vaatwasserfilter schoonmaken', 10, 2, 30, 'filter vaatwasser'],
    ['k-koffie', 'Koffiezetapparaat ontkalken', 10, 1, 30, 'koffie kalk senseo nespresso'],
    ['k-waterkoker', 'Waterkoker ontkalken', 5, 1, 30, 'kalk thee'],
    ['k-voorraad', 'Voorraadkast opruimen', 15, 1, 60, 'kast boodschappen'],
    ['k-theedoeken', 'Theedoeken en vaatdoekjes vervangen', 2, 1, 3, 'doekjes handdoek'],
  ] },
  { id: 'woonkamer', label: 'Woonkamer', icon: 'woonkamer', room: 'woonkamer', tasks: [
    ['w-opruimen', 'Woonkamer opruimen', 10, 1, 2, 'rommel spullen netjes', 1],
    ['w-stof', 'Afstoffen (kasten, tv-meubel)', 10, 1, 7, 'stof tv meubel plinten', 1],
    ['w-bank', 'Bank opschudden en stofzuigen', 10, 1, 14, 'kussens sofa bank'],
    ['w-salontafel', 'Salontafel afnemen', 2, 1, 3, 'tafel'],
    ['w-planten', 'Planten water geven', 5, 1, 7, 'water plant', 1],
    ['w-ramen', 'Ramen binnenkant lappen', 20, 2, 30, 'glas zemen ramen'],
    ['w-plinten', 'Plinten afnemen', 15, 2, 30, 'stof plint'],
    ['w-schakelaars', 'Deurklinken en lichtknopjes afnemen', 5, 1, 14, 'klink schakelaar bacterien'],
    ['w-kussenhoezen', 'Kussenhoezen en plaids wassen', 10, 1, 30, 'plaid deken kussen'],
    ['w-gordijnen', 'Gordijnen wassen of uitkloppen', 20, 2, 120, 'gordijn vitrage'],
    ['w-tv', 'Tv-scherm en afstandsbediening schoonmaken', 5, 1, 30, 'scherm afstandsbediening'],
  ] },
  { id: 'slaapkamer', label: 'Slaapkamer', icon: 'slaapkamer', room: 'slaapkamer', tasks: [
    ['s-bed', 'Bed verschonen', 15, 2, 'za', 'beddengoed dekbedovertrek laken kussensloop dekbed', 1],
    ['s-bed-opmaken', 'Bed opmaken en luchten', 2, 1, 1, 'dekbed luchten raam'],
    ['s-dekbed', 'Dekbed wassen', 15, 2, 90, 'dekbed wassen stomerij'],
    ['s-kussens', 'Hoofdkussens wassen', 10, 1, 90, 'kussen'],
    ['s-matras', 'Matras keren en stofzuigen', 15, 3, 90, 'matras keren draaien'],
    ['s-kleding', 'Kleding opruimen en wegleggen', 10, 1, 3, 'stoel kleren kast', 1],
    ['s-kledingkast', 'Kledingkast opruimen', 20, 2, 60, 'kast uitzoeken kleding'],
    ['s-nachtkastje', 'Nachtkastjes afnemen', 5, 1, 14, 'nachtkastje stof'],
    ['s-onder-bed', 'Onder het bed stofzuigen', 10, 2, 30, 'stof bed'],
  ] },
  { id: 'badkamer', label: 'Badkamer', icon: 'badkamer', room: 'badkamer', tasks: [
    ['b-schoonmaken', 'Badkamer schoonmaken', 20, 3, 'za', 'douche wastafel tegels', 1],
    ['b-wastafel', 'Wastafel en spiegel afnemen', 5, 1, 3, 'spiegel kraan tandpasta', 1],
    ['b-douche', 'Douchewand ontkalken', 10, 2, 7, 'kalk douche glas'],
    ['b-afvoer', 'Doucheputje schoonmaken', 5, 2, 14, 'haren afvoer putje verstopt'],
    ['b-handdoeken', 'Handdoeken vervangen', 2, 1, 4, 'handdoek badjas', 1],
    ['b-badmat', 'Badmat wassen', 2, 1, 14, 'mat'],
    ['b-voegen', 'Voegen schrobben', 20, 3, 60, 'schimmel voeg tegels'],
    ['b-kastje', 'Badkamerkastje opruimen', 10, 1, 60, 'verzorging spullen over datum'],
    ['b-vloer', 'Badkamervloer dweilen', 10, 2, 7, 'vloer'],
  ] },
  { id: 'toilet', label: 'Toilet', icon: 'toilet', room: 'toilet', tasks: [
    ['t-wc', 'Wc schoonmaken', 10, 3, 'wo', 'toilet pot bril', 1],
    ['t-wc-snel', 'Wc snel afnemen', 3, 2, 3, 'toilet bril'],
    ['t-fonteintje', 'Fonteintje en kraan afnemen', 3, 1, 7, 'wastafel toilet'],
    ['t-wc-papier', 'Wc-papier aanvullen', 1, 1, 7, 'papier rol'],
    ['t-wc-vloer', 'Toiletvloer dweilen', 5, 2, 7, 'vloer'],
  ] },
  { id: 'was', label: 'Was', icon: 'was', room: 'was', tasks: [
    ['l-donker', 'Donkere was draaien', 10, 2, 'ma', 'zwarte was wasmachine', 1],
    ['l-licht', 'Lichte was draaien', 10, 2, 'do', 'witte was wasmachine', 1],
    ['l-ophangen', 'Was ophangen of in de droger', 10, 1, 3, 'drogen rek droger'],
    ['l-vouwen', 'Was vouwen en opruimen', 15, 1, 3, 'vouwen kast', 1],
    ['l-strijken', 'Strijken', 20, 2, 7, 'strijkijzer overhemd'],
    ['l-wasmachine', 'Wasmachine reinigen (rubber en bakje)', 15, 2, 30, 'wasmachine schimmel'],
    ['l-droger', 'Pluizenfilter droger legen', 2, 1, 3, 'droger filter pluis'],
  ] },
  { id: 'vloeren', label: 'Vloeren', icon: 'vloeren', room: 'overig', tasks: [
    ['v-zuig', 'Stofzuigen', 10, 2, 4, 'vloer stofzuiger'],
    ['v-zuig-2', 'Tweede verdieping stofzuigen', 10, 2, 7, 'vloer boven'],
    ['v-zuig-3', 'Derde verdieping stofzuigen', 10, 2, 7, 'vloer boven'],
    ['v-zuig-beneden', 'Stofzuigen beneden', 15, 2, 'ma,do', 'stofzuiger vloer', 1, 'beneden'],
    ['v-zuig-boven', 'Stofzuigen boven', 15, 2, 'wo', 'stofzuiger vloer slaapkamer', 1, 'boven'],
    ['v-dweil-beneden', 'Dweilen beneden', 15, 3, 'vr', 'dweil mop vloer', undefined, 'beneden'],
    ['v-dweil-boven', 'Dweilen boven', 15, 3, 14, 'dweil mop', undefined, 'boven'],
    ['v-robot', 'Robotstofzuiger legen', 2, 1, 3, 'robot roomba bak'],
    ['v-kleed', 'Vloerkleed uitkloppen of zuigen', 10, 2, 14, 'kleed tapijt'],
  ] },
  { id: 'hal', label: 'Hal en trap', icon: 'hal', room: 'hal', tasks: [
    ['h-schoenen', 'Schoenen en jassen opruimen', 5, 1, 3, 'schoenen jassen kapstok', 1],
    ['h-trap', 'Trap stofzuigen', 10, 2, 7, 'traptreden'],
    ['h-voordeur', 'Voordeur en deurmat schoonmaken', 10, 1, 30, 'deurmat voordeur'],
    ['h-post', 'Post en papieren opruimen', 5, 1, 7, 'post brieven administratie'],
  ] },
  { id: 'werkkamer', label: 'Werkkamer', icon: 'werkkamer', room: 'werkkamer', tasks: [
    ['o-bureau', 'Bureau opruimen', 5, 1, 7, 'bureau thuiswerken'],
    ['o-scherm', 'Scherm en toetsenbord schoonmaken', 5, 1, 30, 'toetsenbord monitor'],
    ['o-papieren', 'Papieren archiveren', 15, 1, 30, 'administratie ordner'],
  ] },
  { id: 'kinderen', label: 'Kinderkamer', icon: 'kinderkamer', room: 'kinderkamer', tasks: [
    ['c-speelgoed', 'Speelgoed opruimen', 10, 1, 1, 'speelgoed lego'],
    ['c-speelgoed-schoon', 'Speelgoed schoonmaken', 15, 1, 30, 'speelgoed desinfecteren'],
    ['c-kleding', 'Kinderkleding uitzoeken (te klein)', 20, 1, 90, 'kleding maat'],
  ] },
  { id: 'huisdier', label: 'Huisdier', icon: 'huisdier', room: 'huisdier', tasks: [
    ['p-bak', 'Kattenbak scheppen', 3, 2, 1, 'kat kattenbak', 1],
    ['p-bak-verschonen', 'Kattenbak helemaal verschonen', 10, 3, 14, 'kat korrels'],
    ['p-bakjes', 'Voer- en waterbakjes wassen', 3, 1, 3, 'hond kat bak'],
    ['p-haren', 'Haren van bank en kleden zuigen', 10, 2, 7, 'haren hond kat'],
    ['p-mand', 'Hondenmand of kattenkussen wassen', 10, 1, 30, 'mand kussen'],
  ] },
  { id: 'tuin', label: 'Tuin', icon: 'buiten', room: 'tuin', tasks: [
    ['g-vegen', 'Terras vegen', 10, 2, 14, 'vegen bladeren'],
    ['g-planten', 'Tuinplanten water geven', 10, 1, 3, 'tuin water'],
    ['g-gras', 'Gras maaien', 30, 3, 14, 'grasmaaier gazon'],
    ['g-onkruid', 'Onkruid wieden', 20, 3, 14, 'onkruid tegels'],
    ['g-container', 'Kliko aan de straat zetten', 5, 1, 'di', 'kliko container vuilnis groen gft', 1],
    ['g-meubels', 'Tuinmeubels afnemen', 15, 1, 30, 'stoelen tafel'],
  ] },
  { id: 'balkon', label: 'Balkon', icon: 'huis', room: 'balkon', tasks: [
    ['b-vegen', 'Balkon vegen', 5, 1, 14, 'bladeren vloer'],
    ['b-planten', 'Balkonplanten water geven', 5, 1, 3, 'bloembak planten'],
  ] },
  { id: 'hele-huis', label: 'Hele huis', icon: 'huis', room: 'overig', tasks: [
    ['a-ramen-buiten', 'Ramen buitenkant lappen', 30, 3, 60, 'glazenwasser ramen'],
    ['a-spinnen', 'Spinnenwebben weghalen', 10, 1, 30, 'spin plafond hoeken'],
    ['a-lampen', 'Lampen afstoffen', 10, 1, 60, 'lamp stof'],
    ['a-radiatoren', 'Radiatoren afstoffen', 10, 2, 60, 'verwarming radiator'],
    ['a-deuren', 'Deuren en kozijnen afnemen', 20, 2, 60, 'kozijn deur vlekken'],
    ['a-rookmelder', 'Rookmelders testen', 5, 1, 90, 'rookmelder brand veiligheid'],
    ['a-ventilatie', 'Ventilatieroosters schoonmaken', 15, 2, 90, 'ventilatie rooster stof'],
    ['a-boodschappen', 'Boodschappenlijst bijwerken', 5, 1, 7, 'boodschappen lijst'],
    ['a-opruimronde', 'Rondje door huis: alles op zijn plek', 10, 1, 1, 'opruimen rommel', 1],
  ] },
  { id: 'auto', label: 'Auto en fiets', icon: 'auto', room: 'auto', tasks: [
    ['m-auto-binnen', 'Auto van binnen opruimen', 15, 1, 30, 'auto rommel'],
    ['m-auto-zuig', 'Auto stofzuigen', 20, 2, 60, 'auto stofzuigen'],
    ['m-fiets', 'Fietsbanden oppompen', 5, 1, 30, 'fiets band'],
  ] },
]

export const CATALOG: CatalogRoom[] = RAW.map((r) => ({
  id: r.id, label: r.label, icon: r.icon,
  tasks: r.tasks.map(([id, title, minutes, effort, freq, keywords = '', popular, roomId]) => ({
    id, title, room: roomId ?? r.room, minutes, effort, popular: !!popular, keywords: `${title} ${r.label} ${keywords}`.toLowerCase(),
    recurrence: typeof freq === 'string' ? 'weekly' : 'interval',
    weekdays: typeof freq === 'string' ? freq.split(',').map((d) => DAY[d]) : [],
    interval_days: typeof freq === 'number' ? freq : null,
  })),
}))

/** Ruimtes die je standaard al hebt aangevinkt in de onboarding. */
export const DEFAULT_ROOMS = ['keuken', 'woonkamer', 'slaapkamer', 'badkamer', 'toilet', 'was', 'vloeren', 'hal', 'hele-huis']

/** Zoeken op elk woord ("dekbed", "kat", "kalk"). */
export function searchCatalog(q: string, rooms?: string[]) {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean)
  return CATALOG.flatMap((r) => (rooms && !rooms.includes(r.id) ? [] : r.tasks.map((t) => ({ ...t, group: r }))))
    .filter((t) => words.every((w) => searchText(t).includes(w)))
}

export const catalogRow = (t: CatalogTask, householdId: string) => ({
  household_id: householdId, catalog_id: t.id, title: catTitle(t), room: t.room, minutes: t.minutes, effort: t.effort,
  recurrence: t.recurrence, weekdays: t.weekdays, interval_days: t.interval_days,
})

// ——— Engels (catalog.en.ts, los bestand) ———
import { lang } from './i18n'
const EN = (Object.values(import.meta.glob('./catalog.en.ts', { eager: true }))[0] as
  { CATALOG_EN?: Record<string, { title: string; keywords: string }>; GROUPS_EN?: Record<string, string> } | undefined) ?? {}
export const catTitle = (t: CatalogTask) => (lang === 'en' && EN.CATALOG_EN?.[t.id]?.title) || t.title
export const groupLabel = (g: CatalogRoom) => (lang === 'en' && EN.GROUPS_EN?.[g.id]) || g.label
/** Zoeken in beide talen. */
export const searchText = (t: CatalogTask) => `${t.keywords} ${EN.CATALOG_EN?.[t.id]?.title ?? ''} ${EN.CATALOG_EN?.[t.id]?.keywords ?? ''}`.toLowerCase()
