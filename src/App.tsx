import { useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Icon } from './components/Icon'
import { TaskSheet } from './components/TaskSheet'
import { actions, Ctx, sb, useHousehold, type Task } from './lib/data'
import { Settings } from './screens/Settings'
import { Tasks } from './screens/Tasks'
import { Today } from './screens/Today'
import { Together } from './screens/Together'
import { Login, Onboarding } from './screens/Welcome'

export function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  useEffect(() => {
    sb.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = sb.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])
  if (session === undefined) return <Splash />
  if (!session) return <Login />
  return <Home userId={session.user.id} key={session.user.id} />
}

const TABS = [
  { id: 'today', label: 'Vandaag', icon: 'today' },
  { id: 'tasks', label: 'Taken', icon: 'list' },
  { id: 'together', label: 'Samen', icon: 'people' },
  { id: 'settings', label: 'Instellingen', icon: 'gear' },
] as const
type Tab = (typeof TABS)[number]['id']

function Home({ userId }: { userId: string }) {
  const { data, setData, load } = useHousehold(userId)
  const [tab, setTab] = useState<Tab>('today')
  const [sheet, setSheet] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null })
  const value = useMemo(() => data && { d: data, act: actions(data, (fn) => setData((x) => (x ? fn(x) : x)), load) }, [data, setData, load])

  if (data === undefined) return <Splash />
  if (data === null || !value) return <Onboarding onDone={load} />

  return (
    <Ctx.Provider value={value}>
      <main className="app">
        {tab === 'today' && <Today goSettings={() => setTab('settings')} />}
        {tab === 'tasks' && <Tasks onAdd={() => setSheet({ open: true, task: null })} onEdit={(task) => setSheet({ open: true, task })} />}
        {tab === 'together' && <Together />}
        {tab === 'settings' && <Settings />}
      </main>
      {tab === 'today' && (
        <button className="fab" onClick={() => setSheet({ open: true, task: null })} aria-label="Taak toevoegen"><Icon name="plus" size={26} /></button>
      )}
      <nav className="tabbar">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => { setTab(t.id); scrollTo({ top: 0 }) }} aria-current={tab === t.id ? 'page' : undefined}>
            <Icon name={t.icon} size={22} /><span>{t.label}</span>
          </button>
        ))}
      </nav>
      <TaskSheet open={sheet.open} task={sheet.task} onClose={() => setSheet((s) => ({ ...s, open: false }))} />
    </Ctx.Provider>
  )
}

const Splash = () => <div className="splash"><img src={import.meta.env.BASE_URL + 'icon.svg'} alt="" className="app-icon" /></div>
