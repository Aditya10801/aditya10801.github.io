import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent } from 'react'
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'motion/react'
import { reducedMotion } from './ui'
import { sfx } from './sound'

/* ───────────── art: drawn once per kind to a canvas, cached as a PNG data URL ───────────── */

export type StickerKind = 'name' | 'avgeek'

const S = 4 // texture scale, crisp up to ~2x zoom on retina

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string) {
  g.beginPath()
  g.roundRect(x, y, w, h, r)
  g.fillStyle = fill
  g.fill()
}

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w * S
  c.height = h * S
  const g = c.getContext('2d')!
  g.scale(S, S)
  return [c, g] as const
}

// sticker art is a printed object, so it keeps fixed colours in both themes
function drawName() {
  const w = 170, h = 116, p = 4
  const [c, g] = canvas(w, h)
  roundRect(g, 0, 0, w, h, 14, '#ffffff') // die-cut edge
  roundRect(g, p, p, w - 2 * p, h - 2 * p, 11, '#ee3a1f')
  g.textAlign = 'center'
  g.fillStyle = '#ffffff'
  g.font = '800 27px Geist'
  g.letterSpacing = '0.5px'
  g.fillText('HELLO!', w / 2, 33)
  g.letterSpacing = '0.3px'
  g.font = '500 10.5px Geist'
  g.fillText('my name is', w / 2, 47)
  roundRect(g, p + 7, 54, w - 2 * p - 14, 45, 4, '#fbfaf7')
  g.letterSpacing = '0px'
  g.fillStyle = '#141312'
  g.font = '700 38px Caveat'
  g.fillText('aditya', w / 2 + 2, 89)
  return c.toDataURL('image/png')
}

function drawAvgeek() {
  const d = 110, r = d / 2
  const [c, g] = canvas(d, d)
  const disk = (rad: number, fill: string) => { g.beginPath(); g.arc(r, r, rad, 0, Math.PI * 2); g.fillStyle = fill; g.fill() }
  disk(r, '#ffffff')
  disk(r - 4, '#141312')
  g.beginPath()
  g.setLineDash([2, 3])
  g.arc(r, r, r - 10, 0, Math.PI * 2)
  g.strokeStyle = 'rgba(255,255,255,0.35)'
  g.lineWidth = 1
  g.stroke()
  const label = 'CERTIFIED'
  g.font = '500 9px "Geist Mono"'
  g.fillStyle = '#ff4f00'
  g.textAlign = 'center'
  ;[...label].forEach((ch, i) => {
    g.save()
    g.translate(r, r)
    g.rotate((i - (label.length - 1) / 2) * 0.2)
    g.fillText(ch, 0, -(r - 20))
    g.restore()
  })
  g.fillStyle = '#ffffff'
  g.font = '800 23px Geist'
  g.fillText('avgeek', r, r + 7)
  g.fillStyle = '#ff4f00'
  g.font = '18px Geist, sans-serif'
  g.fillText('✈︎', r, r + 31)
  return c.toDataURL('image/png')
}

const ART: Record<StickerKind, { w: number; h: number; draw: () => string; alt: string; peel: [number, number] }> = {
  // peel: corner fold on hover / press, as a fraction of the shorter side (a circle needs a deeper fold to show)
  name: { w: 170, h: 116, draw: drawName, alt: 'sticker: hello, my name is aditya', peel: [0.3, 0.46] },
  avgeek: { w: 110, h: 110, draw: drawAvgeek, alt: 'sticker: certified avgeek', peel: [0.5, 0.64] },
}

const cache: Partial<Record<StickerKind, Promise<string>>> = {}
const fontsReady = () =>
  Promise.all([
    document.fonts.load('800 27px Geist'),
    document.fonts.load('500 10px Geist'),
    document.fonts.load('700 38px Caveat'),
    document.fonts.load('500 9px "Geist Mono"'),
  ]).catch(() => {})

/** PNG data URL of a sticker's art. Exported so other places can reuse the artwork. */
export function stickerArt(kind: StickerKind) {
  return (cache[kind] ??= fontsReady().then(() => ART[kind].draw()))
}

/* ───────────── the sticker ───────────── */

type StickerProps = {
  kind: StickerKind
  width?: number
  rotate?: number
  draggable?: boolean
  className?: string
  style?: CSSProperties
  onDragStart?: () => void
}

/**
 * A die-cut sticker: corner peels on hover, lifts and tilts while dragged.
 * Plain DOM (no WebGL, no parent bounds), so it works inside a CSS-scaled parent.
 * Position it with className/style; dragging adds a translate on top.
 */
export function Sticker({ kind, width, rotate = 0, draggable = true, className = '', style, onDragStart }: StickerProps) {
  const art = ART[kind]
  const W = width ?? art.w
  const H = (W * art.h) / art.w
  const short = Math.min(W, H)
  const [src, setSrc] = useState<string | null>(null)
  const [lifted, setLifted] = useState(false)
  const rm = reducedMotion()

  useEffect(() => {
    let alive = true
    stickerArt(kind).then(s => alive && setSrc(s))
    return () => { alive = false }
  }, [kind])

  // drag offset (local px) and a tilt that follows horizontal speed
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const tilt = useSpring(0, { stiffness: 260, damping: 16 })
  const rot = useTransform(tilt, t => rotate + t)

  // peel: p is how far (px) the bottom-right corner is folded back
  const p = useSpring(0, { stiffness: 420, damping: 28 })
  const C = useTransform(p, v => W + H - v)
  const mainClip = useMotionTemplate`polygon(0 0, 100% 0, 100% calc(100% - ${p}px), calc(100% - ${p}px) 100%, 0 100%)`
  const flapClip = useMotionTemplate`polygon(100% calc(100% - ${p}px), 100% 100%, calc(100% - ${p}px) 100%)`
  // reflect the cut-off corner across the fold line x + y = C
  const flapTransform = useMotionTemplate`translate(${C}px, ${C}px) matrix(0, -1, -1, 0, 0, 0)`

  const drag = useRef<{ id: number; sx: number; sy: number; x: number; y: number; k: number; lx: number; moved: boolean } | null>(null)
  const outer = useRef<HTMLDivElement>(null)

  const down = (e: RPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    e.stopPropagation() // don't pan the board
    p.set(short * art.peel[1])
    if (!draggable) return
    const el = outer.current!
    // on-screen scale of the parent: the outer box is never rotated, so its rect/size ratio is the zoom
    const k = el.getBoundingClientRect().width / (el.offsetWidth || 1) || 1
    drag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, x: x.get(), y: y.get(), k, lx: e.clientX, moved: false }
    el.setPointerCapture(e.pointerId)
  }
  const move = (e: RPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const dx = (e.clientX - d.sx) / d.k, dy = (e.clientY - d.sy) / d.k
    if (!d.moved && Math.hypot(dx, dy) > 3) {
      d.moved = true
      setLifted(true)
      sfx('paper')
      onDragStart?.()
    }
    if (!d.moved) return
    x.set(d.x + dx)
    y.set(d.y + dy)
    if (!rm) tilt.set(Math.max(-14, Math.min(14, (e.clientX - d.lx) * 0.9)))
    d.lx = e.clientX
  }
  const up = (e: RPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (d && d.id === e.pointerId) outer.current?.releasePointerCapture(e.pointerId)
    if (d?.moved) sfx('pop')
    drag.current = null
    setLifted(false)
    tilt.set(0)
    p.set(e.pointerType === 'mouse' ? short * art.peel[0] : 0)
  }

  return (
    <motion.div
      ref={outer}
      className={`absolute select-none touch-none ${draggable ? (lifted ? 'cursor-grabbing' : 'cursor-grab') : ''} ${className}`}
      style={{ width: W, height: H, x, y, zIndex: lifted ? 30 : undefined, ...style }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onPointerEnter={e => e.pointerType === 'mouse' && !drag.current && p.set(short * art.peel[0])}
      onPointerLeave={e => e.pointerType === 'mouse' && !drag.current && p.set(0)}
    >
      {src && (
        <motion.div
          className="relative h-full w-full"
          style={{ rotate: rot }}
          initial={rm ? false : { scale: 1.35, opacity: 0 }}
          animate={{
            scale: lifted ? 1.07 : 1,
            opacity: 1,
            filter: lifted ? 'drop-shadow(0 14px 14px rgb(0 0 0 / 0.28))' : 'drop-shadow(0 2px 2px rgb(0 0 0 / 0.22))',
          }}
          transition={{ type: 'spring', stiffness: 380, damping: 22 }}
        >
          <motion.img src={src} alt={art.alt} draggable={false} className="pointer-events-none absolute inset-0 h-full w-full" style={{ clipPath: mainClip }} />
          {/* the folded-back corner: same art, mirrored over the fold line, shown as the sticker's paper back */}
          <div aria-hidden className="pointer-events-none absolute inset-0" style={{ filter: 'drop-shadow(-1px -1px 1.5px rgb(0 0 0 / 0.25))' }}>
            <motion.img
              src={src}
              alt=""
              draggable={false}
              className="absolute left-0 top-0 h-full w-full origin-top-left"
              style={{ clipPath: flapClip, transform: flapTransform, filter: 'brightness(0) invert(0.9)' }}
            />
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default Sticker
