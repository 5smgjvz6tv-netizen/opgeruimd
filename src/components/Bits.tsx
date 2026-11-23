import type { ReactNode } from 'react'
import type { Member } from '../lib/data'
import { Icon } from './Icon'

export const Avatar = ({ m, size = 28 }: { m: Pick<Member, 'name' | 'color'>; size?: number }) => (
  <span className="avatar" style={{ background: m.color, width: size, height: size, fontSize: size * 0.45 }}>
    {m.name.slice(0, 1).toUpperCase()}
  </span>
)

export function Check({ done, onClick, label }: { done: boolean; onClick: () => void; label: string }) {
  return (
    <button className={'check' + (done ? ' on' : '')} onClick={onClick} role="checkbox" aria-checked={done} aria-label={label}>
      <Icon name="check" size={16} />
    </button>
  )
}

export function Chips<T extends string | number>({ value, options, onChange, multi }: {
  value: T | T[]; options: { v: T; label: ReactNode }[]; onChange: (v: T) => void; multi?: boolean
}) {
  const on = (v: T) => (multi ? (value as T[]).includes(v) : value === v)
  return (
    <div className="chips">
      {options.map((o) => (
        <button key={String(o.v)} type="button" className={'chip' + (on(o.v) ? ' on' : '')} aria-pressed={on(o.v)} onClick={() => onChange(o.v)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Ring({ value, size = 56, stroke = 6, children }: { value: number; size?: number; stroke?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="ring-bg" />
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="ring-fg"
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, value))} />
      </svg>
      <div className="ring-label">{children}</div>
    </div>
  )
}

export const DAYS = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']
export const DAYS_LONG = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag']

const CONFETTI_COLORS = ['#0FA37F', '#2BD3A0', '#FF8A5B', '#F2B705', '#4F7CFF', '#E5487A']
/** Klein feestje als een opruimronde af is. */
export function Confetti() {
  const bits = Array.from({ length: 26 }, (_, i) => {
    const a = (i / 26) * Math.PI * 2 + Math.random() * 0.4
    const dist = 90 + Math.random() * 90
    return {
      '--x': `${Math.cos(a) * dist}px`, '--y': `${Math.sin(a) * dist * 0.8 + 60}px`, '--r': `${Math.random() * 720 - 360}deg`,
      '--c': CONFETTI_COLORS[i % CONFETTI_COLORS.length], animationDelay: `${Math.random() * 80}ms`,
    } as React.CSSProperties
  })
  return <div className="confetti" aria-hidden="true">{bits.map((st, i) => <i key={i} style={st} />)}</div>
}
