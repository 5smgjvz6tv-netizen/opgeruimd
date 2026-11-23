import { useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Icon } from './components/Icon'
import { LogSheet } from './components/LogSheet'
import { TaskSheet } from './components/TaskSheet'
import { actions, Ctx, sb, useHousehold, type Task } from './lib/data'
import { t } from './lib/i18n'
import { loadDraft } from './lib/setup'
import { Onboard } from './screens/Onboard'
import { Settings } from './screens/Settings'
import { Tasks } from './screens/Tasks'
import { Today } from './screens/Today'
import { Together } from './screens/Together'
import { Tour } from './screens/Tour'
import { applyDraft } from './lib/setup'

export function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  useEffect(() => {
    sb.auth.getSession().then(async ({ data }) => {
      if (data.session && (await sb.auth.getUser()).error) { await sb.auth.signOut(); return setSession(null) }
      setSession(data.session)
    })
    const { data } = sb.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])
  if (session === undefined) return <Splash />
  if (!session) return <Onboard onDone={() => {}} />
  return <Home userId={session.user.id} key={session.user.id} />
}

type Tab = 'today' | 'tasks' | 'together' | 'settings'

function Home({ userId }: { userId: string }) {
  const { data, setData, load } = useHousehold(userId)
  const [tab, setTab] = useState<Tab>('today')
  const [sheet, setSheet] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null })
  const [log, setLog] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null })
  const [scrolled, setScrolled] = useState(false)
  const [applying, setApplying] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(scrollY > 56)
    addEventListener('scroll', on, { passive: true })
    return () => removeEventListener('scroll', on)
  }, [])
  // Ingelogd zonder huishouden maar met onboarding-keuzes: die meteen toepassen.
  useEffect(() => {
    const draft = loadDraft()
    if (data === null && draft?.name && !applying) { setApplying(true); applyDraft(draft, userId).finally(() => { setApplying(false); load() }) }
  }, [data, userId, applying, load])
  const value = useMemo(() => data && { d: data, act: actions(data, (fn) => setData((x) => (x ? fn(x) : x)), load) }, [data, setData, load])
  const go = (x: Tab) => { setTab(x); scrollTo({ top: 0 }) }

  if (data === undefined || applying) return <Splash />
  if (data === null || !value) return <Onboard authed userId={userId} onDone={load} />
  if (!data.me.onboarded_at) {
    return (
      <Ctx.Provider value={value}>
        <Tour onDone={(start) => { value.act.patchMe({ onboarded_at: new Date().toISOString() }); go('today'); if (start) value.act.startTimer(data.household.block_minutes) }} />
      </Ctx.Provider>
    )
  }
  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'today', label: t('tab.today'), icon: 'today' },
    { id: 'tasks', label: t('tab.tasks'), icon: 'list' },
    { id: 'together', label: data.solo ? t('tab.progress') : t('tab.together'), icon: data.solo ? 'chart' : 'people' },
    { id: 'settings', label: t('tab.settings'), icon: 'gear' },
  ]
  const openLog = (task: Task | null = null) => setLog({ open: true, task })

  return (
    <Ctx.Provider value={value}>
      <main className="app">
        {tab === 'today' && <Today goSettings={() => go('settings')} goProgress={() => go('together')} onLog={() => openLog()} />}
        {tab === 'tasks' && <Tasks onAdd={() => setSheet({ open: true, task: null })} onEdit={(task) => setSheet({ open: true, task })} />}
        {tab === 'together' && <Together />}
        {tab === 'settings' && <Settings />}
      </main>
      {tab === 'today' && <button className="fab" onClick={() => setSheet({ open: true, task: null })} aria-label={t('task.new')}><Icon name="plus" size={24} /></button>}
      <div className={'topbar' + (scrolled ? ' show' : '')} aria-hidden="true">{TABS.find((x) => x.id === tab)?.label}</div>
      <nav className="tabbar">
        <span className="tab-ind" style={{ transform: `translateX(${TABS.findIndex((x) => x.id === tab) * 100}%)` }} />
        {TABS.map((x) => (
          <button key={x.id} className={tab === x.id ? 'on' : ''} onClick={() => go(x.id)} aria-current={tab === x.id ? 'page' : undefined}>
            <Icon name={x.icon} size={22} /><span>{x.label}</span>
          </button>
        ))}
      </nav>
      <TaskSheet open={sheet.open} task={sheet.task} onClose={() => setSheet((s) => ({ ...s, open: false }))}
        onLogDone={(task) => { setSheet((s) => ({ ...s, open: false })); setTimeout(() => openLog(task), 300) }} />
      <LogSheet open={log.open} preset={log.task} onClose={() => setLog((s) => ({ ...s, open: false }))} />
    </Ctx.Provider>
  )
}

const Splash = () => <div className="splash"><img src={import.meta.env.BASE_URL + 'bas-mark.svg'} alt="" className="app-icon" /></div>
