import { useEffect, useRef, useState } from 'react'
import { t } from '../lib/i18n'

const art = (pose: string) => import.meta.env.BASE_URL + 'bas-' + pose + '.webp'

export function Bas({ cheer = false, className = '' }: { cheer?: boolean; className?: string }) {
  return <span className={`bas-pose ${cheer ? 'cheering' : 'waving'} ${className}`} aria-hidden="true">
    <img src={art(cheer ? 'cheer' : 'wave')} alt="" />
    {!cheer && <img className="wave-in" src={art('wave-in')} alt="" />}
  </span>
}

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
    <span aria-live="polite"><b>Bas</b>{complete ? t('bas.finish') : cheering ? t('bas.cheer') : t('bas.start', { task: nextTask ?? '' })}</span>
  </div>
}
