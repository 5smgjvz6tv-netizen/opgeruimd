import { lang, locale } from './i18n'

export type ShareCardInput = {
  name: string
  minutes: number
  xp: number
  streak: number
  tasks: { title: string; extra?: boolean }[]
  extraCount: number
}

function loadImg(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
  ctx.closePath()
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  if (ctx.measureText(text).width <= maxW) return text
  let s = text
  while (s.length > 3 && ctx.measureText(s + '…').width > maxW) s = s.slice(0, -1)
  return s.trimEnd() + '…'
}

/** Teken een deelbare 1080×1350 Opgeruimd-trofeekaart (PNG) voor WhatsApp / iMessage. */
export async function renderShareCard(input: ShareCardInput): Promise<Blob | null> {
  const W = 1080, H = 1350
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const nl = lang === 'nl'
  const font = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'

  // 1. Achtergrond: rijk dennengroen verloop met subtiele gloed
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#183d27')
  bg.addColorStop(0.55, '#245839')
  bg.addColorStop(1, '#122a1c')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  const glow = ctx.createRadialGradient(W * 0.5, 290, 40, W * 0.5, 290, 440)
  glow.addColorStop(0, 'rgba(182, 244, 81, 0.24)')
  glow.addColorStop(1, 'rgba(182, 244, 81, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  // Subtiele confetti-stippen
  const dots = [
    [130, 150, 10, '#b6f451'], [940, 180, 12, '#f6c66a'], [200, 320, 7, '#ffffff'],
    [870, 350, 8, '#b6f451'], [110, 450, 9, '#f6c66a'], [960, 480, 7, '#ffffff'],
  ] as const
  for (const [x, y, r, c] of dots) {
    ctx.globalAlpha = 0.55
    ctx.fillStyle = c
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  // 2. Datum-pill bovenaan
  const dateLabel = new Date().toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' })
  const dateText = dateLabel[0].toUpperCase() + dateLabel.slice(1)
  ctx.font = `600 28px ${font}`
  const dw = ctx.measureText(dateText).width + 52
  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  roundRect(ctx, (W - dw) / 2, 68, dw, 54, 27)
  ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.88)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(dateText, W / 2, 95)

  // 3. Juichende Bas + gesloten voortgangsring
  ctx.beginPath()
  ctx.arc(W / 2, 285, 134, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(16, 26, 20, 0.55)'
  ctx.fill()
  ctx.lineWidth = 14
  ctx.strokeStyle = '#b6f451'
  ctx.stroke()

  const basImg = await loadImg(import.meta.env.BASE_URL + 'bas-cheer.webp')
  if (basImg) ctx.drawImage(basImg, W / 2 - 108, 175, 216, 216)

  // 4. Headline & ondertitel
  ctx.fillStyle = '#ffffff'
  ctx.font = `800 62px ${font}`
  const headline = input.extraCount > 0
    ? (nl ? `${input.name} ging los!` : `${input.name} crushed it!`)
    : (nl ? `${input.name} is klaar!` : `${input.name} is done!`)
  ctx.fillText(fitText(ctx, headline, W - 120), W / 2, 488)

  ctx.fillStyle = 'rgba(229, 241, 229, 0.85)'
  ctx.font = `500 32px ${font}`
  const sub = input.extraCount > 0
    ? (nl ? `Hele opruimronde + ${input.extraCount} extra afgevinkt` : `Full tidy-up round + ${input.extraCount} bonus done`)
    : (nl ? 'Opruimronde van vandaag helemaal afgevinkt' : 'Today’s tidy-up round is completely checked off')
  ctx.fillText(fitText(ctx, sub, W - 120), W / 2, 548)

  // 5. Drie stat-kaartjes
  const stats = [
    { val: `${input.minutes} min`, label: nl ? 'Opgeruimd' : 'Tidied', accent: '#ffffff' },
    { val: `+${input.xp} XP`, label: nl ? 'Verdiend' : 'Earned', accent: '#f6c66a' },
    { val: input.streak > 0 ? `${input.streak}d` : `${input.tasks.length}`, label: input.streak > 0 ? 'Streak' : (nl ? 'Klussen' : 'Chores'), accent: '#b6f451' },
  ]
  const cardW = 290, gap = 28, startX = (W - (cardW * 3 + gap * 2)) / 2
  stats.forEach((s, idx) => {
    const x = startX + idx * (cardW + gap)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
    roundRect(ctx, x, 608, cardW, 136, 28)
    ctx.fill()
    ctx.fillStyle = s.accent
    ctx.font = `800 46px ${font}`
    ctx.fillText(s.val, x + cardW / 2, 662)
    ctx.fillStyle = 'rgba(255,255,255,0.72)'
    ctx.font = `600 24px ${font}`
    ctx.fillText(s.label, x + cardW / 2, 712)
  })

  // 6. Lijst van afgevinkte klussen
  const shown = input.tasks.slice(0, 5)
  const extraMore = input.tasks.length - shown.length
  const boxY = 786
  const rowH = 74
  const boxH = Math.max(120, shown.length * rowH + (extraMore > 0 ? 52 : 0) + 44)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.96)'
  roundRect(ctx, 78, boxY, W - 156, boxH, 34)
  ctx.fill()

  ctx.textAlign = 'left'
  shown.forEach((task, i) => {
    const y = boxY + 58 + i * rowH
    // Groen vinkje-bolletje
    ctx.fillStyle = '#28613e'
    ctx.beginPath()
    ctx.arc(134, y, 20, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(125, y + 1)
    ctx.lineTo(132, y + 8)
    ctx.lineTo(144, y - 6)
    ctx.stroke()

    ctx.fillStyle = '#18191c'
    ctx.font = `600 31px ${font}`
    const maxTitleW = task.extra ? W - 400 : W - 260
    ctx.fillText(fitText(ctx, task.title, maxTitleW), 174, y + 1)

    if (task.extra) {
      const tag = 'BONUS'
      ctx.font = `800 20px ${font}`
      const tw = ctx.measureText(tag).width + 26
      ctx.fillStyle = '#ffebc3'
      roundRect(ctx, W - 114 - tw, y - 18, tw, 36, 12)
      ctx.fill()
      ctx.fillStyle = '#a4681f'
      ctx.textAlign = 'center'
      ctx.fillText(tag, W - 114 - tw / 2, y + 1)
      ctx.textAlign = 'left'
    }
  })

  if (extraMore > 0) {
    ctx.fillStyle = '#61636a'
    ctx.font = `600 26px ${font}`
    ctx.fillText(nl ? `+ nog ${extraMore} klus(sen)` : `+ ${extraMore} more chore(s)`, 174, boxY + 52 + shown.length * rowH)
  }

  // 7. Footer branding
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(255,255,255,0.65)'
  ctx.font = `700 28px ${font}`
  ctx.fillText('Opgeruimd · opgeruimd.vercel.app', W / 2, H - 64)

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'))
}
