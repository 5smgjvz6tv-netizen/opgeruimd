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

export function RoundCoach({ done, total, nextTask }: { done: number; total: number; nextTask?: string }) {
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
  return <div className="round-coach">
    <Bas key={done} cheer={cheering || complete} />
    <span aria-live="polite"><b>Bas</b>{complete ? t('bas.finish') : cheering ? t('bas.cheer') : t('bas.start', { task: lowerFirst(nextTask ?? '') })}</span>
  </div>
}
