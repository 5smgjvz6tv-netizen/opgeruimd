import type { CSSProperties, ReactNode } from 'react'
import type { Member } from '../lib/data'
import { Icon } from './Icon'

export const Avatar = ({ m, size = 28 }: { m: Pick<Member, 'name' | 'color'>; size?: number }) => (
  <span className="avatar" style={{ background: m.color, width: size, height: size, fontSize: size * 0.42 }} aria-hidden="true">
    {(m.name || '?').slice(0, 1).toUpperCase()}
  </span>
)

export function Check({ done, onClick, label }: { done: boolean; onClick: (e?: React.MouseEvent<HTMLButtonElement>) => void; label: string }) {
  return (
    <button className={'check' + (done ? ' on' : '')} onClick={onClick} role="checkbox" aria-checked={done} aria-label={label}>
      <Icon name="check" size={16} />
    </button>
  )
}

/** Gekleurd vierkantje met een icoon: het vaste beginpunt van elke rij. */
export const Ic = ({ name, tone, size = 18, lg }: { name: string; tone?: 'gold' | 'coral' | 'gray' | 'red'; size?: number; lg?: boolean }) => (
  <span className={'ic' + (tone ? ' ' + tone : '') + (lg ? ' lg' : '')}><Icon name={name} size={lg ? 22 : size} /></span>
)

export function Chips<T extends string | number>({ value, options, onChange, multi }: {
  value: T | T[]; options: { v: T; label: ReactNode; icon?: string }[]; onChange: (v: T) => void; multi?: boolean
}) {
  const on = (v: T) => (multi ? (value as T[]).includes(v) : value === v)
  return (
    <div className="chips">
      {options.map((o) => (
        <button key={String(o.v)} type="button" className={'chip' + (on(o.v) ? ' on' : '')} aria-pressed={on(o.v)} onClick={() => onChange(o.v)}>
          {o.icon && <Icon name={o.icon} size={16} />}{o.label}
        </button>
      ))}
    </div>
  )
}

export function Segmented<T extends string | number>({ value, options, onChange }: { value: T; options: { v: T; label: ReactNode }[]; onChange: (v: T) => void }) {
  const i = Math.max(0, options.findIndex((o) => o.v === value))
  return (
    <div className="segmented" role="radiogroup" data-active={i} style={{ '--n': options.length } as CSSProperties}>
      <span className="seg-pill" />
      {options.map((o) => (
        <button key={String(o.v)} type="button" role="radio" aria-checked={o.v === value} className={o.v === value ? 'on' : ''} onClick={() => onChange(o.v)}>{o.label}</button>
      ))}
    </div>
  )
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button className="switch" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} />
}

export function Ring({ value, size = 52, stroke = 6, children }: { value: number; size?: number; stroke?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="ring-bg" />
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="ring-fg" strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, value))} />
      </svg>
      <div className="ring-label">{children}</div>
    </div>
  )
}

export const XpBar = ({ frac, color }: { frac: number; color?: string }) => (
  <div className="xpbar" role="presentation"><i style={{ width: `${Math.max(2, Math.min(100, frac * 100))}%`, ...(color ? { background: color } : {}) }} /></div>
)

const CONFETTI_COLORS = ['#12A27E', '#2FD1A1', '#FF7A59', '#E09A2C', '#4F7CFF']
export function Confetti() {
  const bits = Array.from({ length: 20 }, (_, i) => {
    const a = (i / 20) * Math.PI * 2 + Math.random() * 0.4
    const dist = 70 + Math.random() * 70
    return {
      '--x': `${Math.cos(a) * dist}px`, '--y': `${Math.sin(a) * dist * 0.7 + 50}px`, '--r': `${Math.random() * 540 - 270}deg`,
      '--c': CONFETTI_COLORS[i % CONFETTI_COLORS.length], animationDelay: `${Math.random() * 60}ms`,
    } as CSSProperties
  })
  return <div className="confetti" aria-hidden="true">{bits.map((st, i) => <i key={i} style={st} />)}</div>
}
