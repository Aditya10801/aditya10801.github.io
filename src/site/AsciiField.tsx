import { useEffect, useRef } from 'react'
import { cssVar, reducedMotion } from './ui'
import { board } from './map'

const CW = 16 // cell width
const CH = 20 // cell height
const RAMP = ['.', ':', '+', '*']
const R = 150 // cursor glow radius

/** Faint drifting ASCII sky behind the page. Glyphs thicken around the cursor and parallax with scroll. */
export default function AsciiField() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current!
    const ctx = canvas.getContext('2d')!
    const still = reducedMotion()
    let w = 0, h = 0, raf = 0, last = 0, t = 0, lastCam = 0
    let ink = '', accent = ''
    const mouse = { x: -999, y: -999, sx: -999, sy: -999 }

    const colors = () => { ink = cssVar('--ink'); accent = cssVar('--accent') }
    const resize = () => {
      const dpr = 1
      w = innerWidth; h = innerHeight
      canvas.width = w * dpr; canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.font = '11px "Geist Mono", monospace'
      ctx.textBaseline = 'top'
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      const par = board.flow ? scrollY * 0.3 : board.cam.y * board.cam.z * 0.3
      const parX = board.flow ? 0 : board.cam.x * board.cam.z * 0.3
      const off = ((par % CH) + CH) % CH
      const row0 = Math.floor(par / CH)
      const offX = ((parX % CW) + CW) % CW
      const col0 = Math.floor(parX / CW)
      lastCam = board.cam.x + board.cam.y + board.cam.z
      const cols = Math.ceil(w / CW) + 1, rows = Math.ceil(h / CH) + 2
      for (let r = 0; r < rows; r++) {
        const gy = r + row0
        const y = r * CH - off
        for (let c = 0; c < cols; c++) {
          const x = c * CW - offX
          const gc = c + col0
          let f = (Math.sin(gc * 0.11 + t * 0.3 + gy * 0.03) + Math.sin(gy * 0.17 - t * 0.22 + gc * 0.02) + Math.sin((gc - gy) * 0.07 + t * 0.15) + Math.sin(Math.hypot(gc - 40, gy - 20) * 0.15 - t * 0.4) + 4) / 8
          const d = Math.hypot(x - mouse.sx, y - mouse.sy)
          const boost = d < R ? (1 - d / R) ** 2 : 0
          f += boost * 0.55
          if (f < 0.64) continue
          const i = Math.min(RAMP.length - 1, Math.floor((f - 0.64) / 0.08))
          ctx.globalAlpha = 0.14 + boost * 0.5 + i * 0.03
          ctx.fillStyle = boost > 0.25 ? accent : ink
          ctx.fillText(RAMP[i], x, y)
        }
      }
      ctx.globalAlpha = 1
    }

    // ~20fps ambient drift, faster settle while the cursor glow catches up
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      mouse.sx += (mouse.x - mouse.sx) * 0.2
      mouse.sy += (mouse.y - mouse.sy) * 0.2
      const chasing = Math.abs(mouse.x - mouse.sx) + Math.abs(mouse.y - mouse.sy) > 1 || Math.abs(board.cam.x + board.cam.y + board.cam.z - lastCam) > 0.05
      if (now - last < (chasing ? 33 : 50)) return
      t += (now - last) / 1000
      last = now
      draw()
    }

    const onMove = (e: PointerEvent) => { mouse.x = e.clientX; mouse.y = e.clientY }
    const onLeave = () => { mouse.x = mouse.y = -999 }
    const onTheme = () => { colors(); draw() }
    const onResize = () => { resize(); draw() }
    const onVis = () => { cancelAnimationFrame(raf); if (!document.hidden && !still) raf = requestAnimationFrame(loop) }

    colors(); resize()
    document.fonts.ready.then(() => { resize(); draw() })
    addEventListener('resize', onResize)
    addEventListener('themechange', onTheme)
    if (still) {
      addEventListener('scroll', draw, { passive: true })
    } else {
      addEventListener('pointermove', onMove, { passive: true })
      document.addEventListener('pointerleave', onLeave)
      document.addEventListener('visibilitychange', onVis)
      raf = requestAnimationFrame(loop)
    }
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('resize', onResize)
      removeEventListener('themechange', onTheme)
      removeEventListener('scroll', draw)
      removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-0 h-full w-full" />
}
