import { useEffect, useState } from 'react'
import { localDate } from '../../supabase/functions/_shared/planner'
import { hasChecks, recordCheck, savedRound } from '../lib/offlineRound'
import { RoundCoach } from '../components/Bas'
import { Check, Ring } from '../components/Bits'
import { t } from '../lib/i18n'

export function OfflineRound({ uid, retry, message }: { uid: string; retry: () => void; message: string }) {
  const [round, setRound] = useState(() => savedRound(uid))
  const refresh = () => setRound(savedRound(uid))
  useEffect(() => { addEventListener('storage', refresh); return () => removeEventListener('storage', refresh) }, [uid])
  const items = round?.date === localDate() ? round.items : []
  const done = items.filter(i => i.done_at).length
  return <main className="app page">
    <header className="hdr"><h1>{t('offline.title')}</h1></header>
    <p className="group-f" role="status">{message || t(round ? 'offline.note' : 'offline.need')}</p>
    <section className="card round">
      <div className="round-head"><Ring value={items.length ? done / items.length : 0}>{done}/{items.length}</Ring>
        <h2>{t(items.length ? 'today.round' : 'offline.empty')}</h2></div>
      <RoundCoach done={done} total={items.length} nextTask={items.find(i => !i.done_at)?.title} />
      <ul className="tasks">{items.map(i => <li className="task" key={i.id}>
        <Check done={!!i.done_at} label={i.title} onClick={() => {
          recordCheck(uid, round!.household, i.id, i.done_at, !i.done_at); refresh()
        }} /><span className="task-main">{i.title}</span><span>{i.minutes} {t('common.min')}</span>
      </li>)}</ul>
    </section>
    {navigator.onLine && <button className="btn soft" onClick={retry}>{t(hasChecks(uid) ? 'offline.retrySync' : 'offline.retry')}</button>}
  </main>
}
