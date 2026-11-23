import { useRef } from 'react'
import { haptic, sound } from '../lib/feel'
import { list, t } from '../lib/i18n'
import { Icon } from './Icon'

export const fmtTime = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
export const toMin = (s: string | null | undefined, fallback = 18 * 60 + 30) => (s ? Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5)) : fallback)

/** Draaiknop: sleep rond de ring (of gebruik de pijltjestoetsen). */
export function Dial({ value, min, max, step, onChange, label }: { value: number; min: number; max: number; step: number; onChange: (v: number) => void; label: string }) {
  const ref = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)
  const R = 50, C = 2 * Math.PI * R, SPAN = 280 / 360
  const frac = (value - min) / (max - min)
  const ang = ((-220 + frac * 280) * Math.PI) / 180
  const set = (v: number) => { const c = Math.min(max, Math.max(min, v)); if (c !== value) { haptic(4); sound('tick'); onChange(c) } }
  const fromPoint = (cx: number, cy: number) => {
    const r = ref.current!.getBoundingClientRect()
    let a = (Math.atan2(cy - (r.top + r.height / 2), cx - (r.left + r.width / 2)) * 180) / Math.PI
    a = (a + 220 + 360) % 360
    if (a > 280) a = a > 320 ? 0 : 280
    set(Math.round((min + (a / 280) * (max - min)) / step) * step)
  }
  return (
    <div className="dial">
      <svg ref={ref} viewBox="0 0 124 124" role="slider" tabIndex={0} aria-label={label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={value}
        aria-valuetext={`${value} ${t('common.minutes')}`}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') set(value + step)
          if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') set(value - step)
        }}
        onPointerDown={(e) => { dragging.current = true; (e.currentTarget as Element).setPointerCapture?.(e.pointerId); fromPoint(e.clientX, e.clientY) }}
        onPointerMove={(e) => dragging.current && fromPoint(e.clientX, e.clientY)}
        onPointerUp={() => { dragging.current = false }} onPointerCancel={() => { dragging.current = false }}>
        <circle cx="62" cy="62" r={R} className="dial-track" strokeDasharray={`${C * SPAN} ${C}`} transform="rotate(140 62 62)" />
        <circle cx="62" cy="62" r={R} className="dial-fill" strokeDasharray={`${C * SPAN * frac} ${C}`} transform="rotate(140 62 62)" />
        <circle cx={62 + R * Math.cos(ang)} cy={62 + R * Math.sin(ang)} r="11" className="dial-knob" />
      </svg>
      <div className="dial-label"><b>{value}</b><span>{t('common.min')}</span></div>
    </div>
  )
}

/** Tijdslider (15:00–22:00) met een wolkje dat meeschuift. */
export function TimeSlider({ value, disabled, onChange }: { value: number; disabled?: boolean; onChange: (v: number) => void }) {
  const MIN = 15 * 60, MAX = 22 * 60
  const pct = ((value - MIN) / (MAX - MIN)) * 100
  return (
    <div className={'tslider' + (disabled ? ' off' : '')}>
      <div className="ts-bubble" style={{ left: `calc(16px + (100% - 32px) * ${pct / 100})` }}>{fmtTime(value)}</div>
      <input type="range" min={MIN} max={MAX} step={15} value={value} disabled={disabled} aria-label={t('set.time')} aria-valuetext={fmtTime(value)}
        onChange={(e) => { haptic(3); onChange(Number(e.target.value)) }} />
      <div className="ts-ends"><span><Icon name="sun" size={14} />15:00</span><span><Icon name="moon" size={14} />22:00</span></div>
    </div>
  )
}

/** Zeven dagbolletjes; aangetikt = rustdag. */
export function DayPicker({ rest, onToggle }: { rest: number[]; onToggle: (day: number) => void }) {
  const short = list('days.short'), long = list('days.long')
  return (
    <div className="days">
      {short.map((l, i) => {
        const on = rest.includes(i)
        return (
          <button key={l} className={'day' + (on ? ' rest' : '')} aria-pressed={on} aria-label={long[i]} onClick={() => { haptic(4); onToggle(i) }}>
            <span>{l}</span>
            <span className="day-dot"><Icon name={on ? 'leaf' : 'broom'} size={18} /></span>
          </button>
        )
      })}
    </div>
  )
}

export function Stepper({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button onClick={() => { haptic(3); onChange(value - 1) }} disabled={value <= min} aria-label="−"><Icon name="minus" size={16} /></button>
      <b>{value}</b>
      <button onClick={() => { haptic(3); onChange(value + 1) }} disabled={value >= max} aria-label="+"><Icon name="plus" size={16} /></button>
    </div>
  )
}
