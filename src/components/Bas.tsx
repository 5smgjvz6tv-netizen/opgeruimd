import { useEffect, useRef, useState } from 'react'
import { haptic, sound } from '../lib/feel'
import { t } from '../lib/i18n'

const art = (pose: string) => import.meta.env.BASE_URL + 'bas-' + pose + '.webp'

export function Bas({ cheer = false, className = '' }: { cheer?: boolean; className?: string }) {
  const [tapCount, setTapCount] = useState(0)
  const [react, setReact] = useState<'cheer' | 'wave' | null>(null)
  const timer = useRef<number | null>(null)

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current) }, [])

  const poke = () => {
    haptic(6)
    sound('pop')
    const next = tapCount % 2 === 0 ? 'cheer' : 'wave'
    setTapCount((n) => n + 1)
    setReact(next)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setReact(null), 1500)
  }

  const isCheering = react ? react === 'cheer' : cheer
  const stateClass = react === 'cheer' ? 'cheering tapped' : react === 'wave' ? 'waving tapped' : cheer ? 'cheering' : 'waving'

  return (
    <button type="button" onClick={poke} aria-label="Bas"
      className={`bas-pose ${stateClass} ${className}`}>
      <img key={`${isCheering}-${tapCount}`} src={art(isCheering ? 'cheer' : 'wave')} alt="" />
      {!isCheering && <img className="wave-in" src={art('wave-in')} alt="" />}
    </button>
  )
}

const lowerFirst = (s: string) => (s.length > 1 && s[1] === s[1].toLowerCase() ? s[0].toLowerCase() + s.slice(1) : s)

const MID_KEYS = ['bas.mid1', 'bas.mid2', 'bas.mid3'] as const
const BONUS_KEYS = ['bas.bonus1', 'bas.bonus2', 'bas.bonus3'] as const
const FINISH_KEYS = ['bas.finish1', 'bas.finish2', 'bas.finish3'] as const
const FINISH_EXTRA_KEYS = ['bas.finishExtra1', 'bas.finishExtra2'] as const

export function RoundCoach({ done, total, nextTask, name = '', isBonus = false, xp = 0, extraDone = 0 }: { done: number; total: number; nextTask?: string; name?: string; isBonus?: boolean; xp?: number; extraDone?: number }) {
  const previous = useRef(done)
  const [cheering, setCheering] = useState(false)
  useEffect(() => {
    const gained = done > previous.current
    previous.current = done
    setCheering(gained)
    if (gained) {
      const timer = window.setTimeout(() => setCheering(false), 3200)
      return () => window.clearTimeout(timer)
    }
  }, [done])
  if (!total) return null
  const complete = done === total
  const task = lowerFirst(nextTask ?? '')
  const line = complete
    ? (extraDone > 0 && name
        ? t(FINISH_EXTRA_KEYS[(total + extraDone) % FINISH_EXTRA_KEYS.length], { name, xp, extra: extraDone })
        : name
          ? t(FINISH_KEYS[(total + xp) % FINISH_KEYS.length], { name, xp })
          : t('bas.finish'))
    : cheering
      ? (extraDone > 0 && name ? t('bas.extraProps', { name }) : t('bas.cheer'))
      : isBonus
        ? t(BONUS_KEYS[(done + total) % BONUS_KEYS.length], { name, task })
        : done > 0
          ? t(MID_KEYS[done % MID_KEYS.length], { name, task })
          : t('bas.start', { task })
  return <div className={'round-coach' + (complete || extraDone > 0 ? ' celebrating' : '')}>
    <Bas key={done} cheer={cheering || complete || isBonus || extraDone > 0} />
    <span aria-live="polite"><b>Bas</b>{line}</span>
  </div>
}
