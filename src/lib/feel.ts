// Gevoel: korte trillingen en zachte geluidjes bij belangrijke momenten.

const KEY = 'opgeruimd.sound'
export const soundOn = () => { try { return localStorage.getItem(KEY) !== 'off' } catch { return true } }
export const setSound = (on: boolean) => { try { localStorage.setItem(KEY, on ? 'on' : 'off') } catch { /* privémodus */ } }

/**
 * Trilling. Android: navigator.vibrate. iPhone (Safari 18+): een verborgen iOS-schakelaar
 * omzetten geeft een echte haptische tik — de enige manier voor web apps.
 */
let sw: HTMLLabelElement | null = null
export function haptic(pattern: number | number[] = 8) {
  if ('vibrate' in navigator) { try { navigator.vibrate(pattern) } catch { /* niet ondersteund */ } return }
  if (!sw) {
    sw = document.createElement('label')
    sw.ariaHidden = 'true'
    sw.style.cssText = 'position:fixed;opacity:0;pointer-events:none;width:1px;height:1px;overflow:hidden'
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.setAttribute('switch', '')
    sw.append(input)
    document.body.append(sw)
  }
  const times = Array.isArray(pattern) ? Math.ceil(pattern.length / 2) : 1
  for (let i = 0; i < times; i++) setTimeout(() => sw?.click(), i * 90)
}

let ctx: AudioContext | null = null
function audio() {
  if (!ctx) {
    // Respecteer de stil-schakelaar van de iPhone waar dat kan.
    const s = (navigator as { audioSession?: { type: string } }).audioSession
    if (s) s.type = 'ambient'
    ctx = new AudioContext()
  }
  return ctx
}
function tone(freq: number, at: number, dur = 0.12, vol = 0.12, type: OscillatorType = 'sine') {
  const c = audio(), o = c.createOscillator(), g = c.createGain()
  o.type = type; o.frequency.setValueAtTime(freq, c.currentTime + at)
  g.gain.setValueAtTime(0.0001, c.currentTime + at)
  g.gain.exponentialRampToValueAtTime(vol, c.currentTime + at + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + at + dur)
  o.connect(g); g.connect(c.destination); o.start(c.currentTime + at); o.stop(c.currentTime + at + dur + 0.02)
}

/** pop = afvinken · done = opruimronde af · kudos = high five · tick = draaiknop */
export function sound(kind: 'pop' | 'done' | 'kudos' | 'tick') {
  if (!soundOn()) return
  try {
    if (kind === 'pop') { tone(660, 0, 0.09); tone(990, 0.05, 0.1, 0.08) }
    if (kind === 'tick') tone(1400, 0, 0.03, 0.04, 'triangle')
    if (kind === 'kudos') { tone(523, 0, 0.1); tone(784, 0.08, 0.14) }
    if (kind === 'done') [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.22, 0.1))
  } catch { /* geen geluid mogelijk */ }
}

/** Zwevend "+8 pt" boven een element. */
export function floatText(el: Element | null, text: string) {
  if (!el) return
  const r = el.getBoundingClientRect()
  const f = document.createElement('div')
  f.className = 'float-pts'
  f.textContent = text
  f.style.left = `${r.left + r.width / 2}px`
  f.style.top = `${r.top}px`
  document.body.append(f)
  setTimeout(() => f.remove(), 1100)
}
