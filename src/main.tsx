import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { registerSW } from './lib/push'
import { lang } from './lib/i18n'
import './styles.css'
import './motion.css'

document.documentElement.lang = lang
registerSW()
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
