import { VAPID_PUBLIC_KEY } from '../config'
import { sb } from './data'

export const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
export const isStandalone = matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true
export const pushSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

export function registerSW() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js').catch(console.error)
}

const b64 = (s: string) => {
  const p = '='.repeat((4 - (s.length % 4)) % 4)
  return Uint8Array.from(atob((s + p).replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0))
}

export async function pushState(): Promise<'on' | 'off' | 'denied' | 'unsupported'> {
  if (!pushSupported) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  if (Notification.permission !== 'granted') return 'off'
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  return sub ? 'on' : 'off'
}

/** Moet vanuit een tik worden aangeroepen (iOS-eis). */
export async function enablePush(userId: string) {
  if ((await Notification.requestPermission()) !== 'granted') throw new Error('Meldingen zijn niet toegestaan')
  const reg = await navigator.serviceWorker.ready
  const sub = (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(VAPID_PUBLIC_KEY) }))
  const j = sub.toJSON()
  const { error } = await sb.from('push_subscriptions').upsert({
    endpoint: sub.endpoint, user_id: userId, p256dh: j.keys!.p256dh, auth: j.keys!.auth,
  })
  if (error) throw error
}

/** Laat de server direct meldingen versturen (in plaats van te wachten op de minuut-tik). */
export const flush = () => sb.functions.invoke('tick').catch(() => {})
