import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { registerSW } from './lib/push'
import './styles.css'
import './motion.css'

registerSW()
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
