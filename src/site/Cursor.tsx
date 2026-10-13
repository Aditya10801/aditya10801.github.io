import { useEffect, useRef } from 'react'
import { cssVar, reducedMotion, useFinePointer } from './ui'

type Ctx = 'default' | 'link' | 'button' | 'text' | 'drag'

const GLYPH: Record<Ctx, string> = { default: '+', link: '↗', button: '[ ]', text: 'I', drag: '~' }
const SCRAMBLE = '#*/\\<>=+?'

const contextOf = (el: Element | null, down: boolean): Ctx => {
  if (!el) return 'default'
  if (el.closest('[draggable="true"], .cursor-grab, [data-drag]') || (down && el.closest('canvas, [data-pan]'))) return 'drag'
  if (el.closest('a')) return 'link'
  if (el.closest('button, [role="button"], label, summary')) return 'button'
  if (el.closest('p, h1, h2, h3, h4, li, blockquote')) return 'text'
  return 'default'
}

/** Airplane cursor: banks toward travel, leaves twin ASCII contrails, morphs into a glyph over links, buttons and text. */
export default function Cursor() {
  const fine = useFinePointer()
  const root = useRef<HTMLDivElement>(null)
  const plane = useRef<SVGSVGElement>(null)
  const glyph = useRef<HTMLSpanElement>(null)
  const trail = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!fine) return
    document.documentElement.classList.add('custom-cursor')
    const still = reducedMotion()
    const canvas = trail.current!
    const tctx = canvas.getContext('2d')!
    const pos = { x: -100, y: -100, sx: -100, sy: -100, angle: 0, seen: false }
    const pts: { x: number; y: number; t: number }[] = []
    let dirty = false
    let ctx: Ctx = 'default', down = false, raf = 0, shown = '', scrambleUntil = 0, ink = cssVar('--ink')

    const fit = () => {
      const dpr = Math.min(devicePixelRatio, 2)
      canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr
      tctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      tctx.font = '10px "Geist Mono", monospace'
      tctx.textAlign = 'center'; tctx.textBaseline = 'middle'
    }

    const setGlyph = (now: number) => {
      const target = GLYPH[ctx]
      if (target !== shown) { shown = target; scrambleUntil = now + 140 }
      const text = now < scrambleUntil ? SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)] : shown
      if (glyph.current && glyph.current.textContent !== text) glyph.current.textContent = text
    }

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const k = 0.32
      const dx = pos.x - pos.sx, dy = pos.y - pos.sy
      pos.sx += dx * k; pos.sy += dy * k
      const speed = Math.hypot(dx, dy)

      {
        // bank toward the direction of travel, shortest way round
        if (speed > 1.5 && !still) {
          const target = Math.atan2(dy, dx)
          let diff = target - pos.angle
          diff = Math.atan2(Math.sin(diff), Math.cos(diff))
          pos.angle += diff * 0.2
        }
        // twin dotted contrails off the wingtips
        if (!still && speed > 2 && ctx === 'default') {
          const nx = -Math.sin(pos.angle) * 5, ny = Math.cos(pos.angle) * 5
          const bx = pos.sx - Math.cos(pos.angle) * 9, by = pos.sy - Math.sin(pos.angle) * 9
          const last = pts[pts.length - 1]
          if (!last || Math.hypot(last.x - bx, last.y - by) > 7) {
            pts.push({ x: bx + nx, y: by + ny, t: now }, { x: bx - nx, y: by - ny, t: now })
          }
        }
        while (pts.length && now - pts[0].t > 700) pts.shift()
        if (pts.length || dirty) tctx.clearRect(0, 0, innerWidth, innerHeight)
        dirty = pts.length > 0
        tctx.fillStyle = ink
        for (const p of pts) {
          const a = 1 - (now - p.t) / 700
          tctx.globalAlpha = a * 0.55
          tctx.fillText(a > 0.6 ? '•' : '·', p.x, p.y)
        }
        tctx.globalAlpha = 1
        const showPlane = ctx === 'default' || ctx === 'drag'
        if (plane.current) {
          plane.current.style.transform = `translate(-50%,-50%) rotate(${pos.angle}rad) scale(${showPlane ? (down ? 0.8 : 1) : 0})`
        }
        if (glyph.current) glyph.current.style.transform = `translate(-50%,-50%) scale(${showPlane ? 0 : down ? 0.85 : 1})`
      }
      setGlyph(now)
      if (glyph.current) glyph.current.style.color = down ? cssVar('--accent') : ''
      root.current!.style.transform = `translate3d(${pos.sx}px,${pos.sy}px,0)`
      root.current!.style.opacity = pos.seen ? '1' : '0'
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      pos.x = e.clientX; pos.y = e.clientY
      if (!pos.seen) { pos.sx = pos.x; pos.sy = pos.y; pos.seen = true }
      ctx = contextOf(e.target as Element, down)
    }
    const onDown = () => { down = true }
    const onUp = (e: PointerEvent) => { down = false; ctx = contextOf(e.target as Element, false) }
    const onLeave = () => { pos.seen = false }
    const onTheme = () => { ink = cssVar('--ink') }

    fit()
    addEventListener('resize', fit)
    addEventListener('pointermove', onMove, { passive: true })
    addEventListener('pointerdown', onDown)
    addEventListener('pointerup', onUp)
    addEventListener('themechange', onTheme)
    document.documentElement.addEventListener('mouseleave', onLeave)
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      document.documentElement.classList.remove('custom-cursor')
      removeEventListener('resize', fit)
      removeEventListener('pointermove', onMove)
      removeEventListener('pointerdown', onDown)
      removeEventListener('pointerup', onUp)
      removeEventListener('themechange', onTheme)
      document.documentElement.removeEventListener('mouseleave', onLeave)
    }
  }, [fine])

  if (!fine) return null
  return (
    <>
      <style>{`.custom-cursor, .custom-cursor * { cursor: none !important; }`}</style>
      <canvas ref={trail} aria-hidden className="pointer-events-none fixed inset-0 z-[9998] h-full w-full" />
      <div ref={root} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[9999] opacity-0 mix-blend-difference transition-opacity duration-200">
        <svg
          ref={plane}
          viewBox="0 0 24 24"
          width="18"
          height="18"
          className="absolute left-0 top-0 transition-[scale] duration-150"
        >
          {/* top-down airliner, nose pointing +x */}
          <path fill="#fff" d="M22 12c0-.8-.7-1.3-1.5-1.3h-5.2L10.6 3.5H8.4l2.3 7.2H5.6L3.9 8.4H2.2l1.1 3.6-1.1 3.6h1.7l1.7-2.3h5.1l-2.3 7.2h2.2l4.7-7.2h5.2c.8 0 1.5-.5 1.5-1.3z" />
        </svg>
        <span
          ref={glyph}
          className="absolute left-0 top-0 whitespace-nowrap font-mono text-[15px] font-medium leading-none text-white transition-[color] duration-150"
        />
      </div>
    </>
  )
}
