import { useEffect, useRef, useState } from 'react'
import { cssVar, reducedMotion } from './ui'
import { sfx } from './sound'

const SETS = [
  { name: 'ascii', chars: " .'`^\",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$" },
  { name: 'blocks', chars: ' ░▒▓█' },
  { name: 'binary', chars: '01' },
  { name: 'dots', chars: ' ·•●' },
]
const SCRAMBLE = '!<>-_\\/[]{}=+*^?#'
const R = 80 // pointer radius
const PUSH = 16
const LENS = 90
const HOLD_MS = 180
const INTRO_MS = 1100
const MASK = { cx: 0.52, cy: 0.45, rx: 0.4, ry: 0.53 }
const TONE = { fine: 1.2, coarse: 0.6, gammaDark: 0.8, gammaLight: 0.9, s0: 0.06, s1: 0.94 }

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}
const pick = (s: string) => s[(Math.random() * s.length) | 0]

/** separable box blur on a cols x rows grid, edges clamped */
function boxBlur(src: Float32Array, cols: number, rows: number, r: number) {
  const tmp = new Float32Array(src.length), out = new Float32Array(src.length), k = 2 * r + 1
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let s = 0
      for (let d = -r; d <= r; d++) s += src[y * cols + clamp(x + d, 0, cols - 1)]
      tmp[y * cols + x] = s / k
    }
  }
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let s = 0
      for (let d = -r; d <= r; d++) s += tmp[clamp(y + d, 0, rows - 1) * cols + x]
      out[y * cols + x] = s / k
    }
  }
  return out
}

type Props = {
  src: string
  className?: string
  /** true: cells fly apart and fade (e.g. camera left the zone). false: they reassemble. */
  scattered?: boolean
  /** reports the column count after each relayout (for "116 COLS" style labels) */
  onCols?: (cols: number) => void
}

export default function AsciiPortrait({ src, className = '', scattered = false, onCols }: Props) {
  const boxRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lensRef = useRef<HTMLImageElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const modeRef = useRef(0)
  const kickRef = useRef<() => void>(() => {})
  const [mode, setMode] = useState(0)
  const scatterRef = useRef(scattered)
  const colsRef = useRef(onCols)
  scatterRef.current = scattered
  colsRef.current = onCols
  useEffect(() => kickRef.current(), [scattered])

  const cycle = () => {
    modeRef.current = (modeRef.current + 1) % SETS.length
    sfx('pop')
    setMode(modeRef.current)
    kickRef.current()
  }

  useEffect(() => {
    const box = boxRef.current!
    const canvas = canvasRef.current!
    const lensImg = lensRef.current!
    const ring = ringRef.current!
    const ctx = canvas.getContext('2d')!
    const rm = reducedMotion()

    const img = new Image()
    img.src = src
    const sampler = document.createElement('canvas')
    const sctx = sampler.getContext('2d', { willReadFrequently: true })!

    // layout
    let W = 0, H = 0, cols = 0, rows = 0, cellW = 0, cellH = 0, oy = 0
    // per-cell data
    let dens = new Float32Array(0) // 0..1 glyph density (after mask)
    let mask = new Float32Array(0)
    let heat = new Float32Array(0)
    let jitter = new Float32Array(0) // stable random 0..1
    let ink = '#000', accent = '#f50'
    let ready = false, visible = true, raf = 0
    let introStart = -1
    let sc = 0 // scatter amount, eases toward scatterRef
    let hot: number[] = [] // cells with a fading heat trail
    const base = document.createElement('canvas')
    const bctx = base.getContext('2d')!
    let baseDirty = true, baseMode = -1

    const ptr = { x: 0, y: 0, sx: 0, sy: 0, inside: false, power: 0 }
    const lens = { on: false, r: 0 }

    const readColors = () => { ink = cssVar('--ink'); accent = cssVar('--accent') }

    const sample = () => {
      if (!img.complete || !img.naturalWidth || !cols) return
      sampler.width = cols
      sampler.height = rows
      sctx.imageSmoothingQuality = 'high'
      sctx.drawImage(img, 0, 0, cols, rows)
      const px = sctx.getImageData(0, 0, cols, rows).data
      const n = cols * rows
      const lum = new Float32Array(n)
      for (let i = 0; i < n; i++) lum[i] = (0.2126 * px[i * 4] + 0.7152 * px[i * 4 + 1] + 0.0722 * px[i * 4 + 2]) / 255
      // soft elliptical cutout around face + hair
      mask = new Float32Array(n)
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const ex = (c / cols - MASK.cx) / MASK.rx, ey = (r / rows - MASK.cy) / MASK.ry
          mask[r * cols + c] = 1 - smooth(0.55, 1, ex * ex + ey * ey)
        }
      }
      // local contrast: fine (r=1) unsharp for edges (glasses, brows, mouth), coarse (r=6) to flatten lighting
      const fine = boxBlur(lum, cols, rows, 1)
      const coarse = boxBlur(lum, cols, rows, 6)
      const sharp = new Float32Array(n)
      for (let i = 0; i < n; i++) sharp[i] = lum[i] + TONE.fine * (lum[i] - fine[i]) + TONE.coarse * (lum[i] - coarse[i])
      // histogram stretch over the face region only (p2..p98), gamma, then an S curve
      const face: number[] = []
      for (let i = 0; i < n; i++) if (mask[i] > 0.5) face.push(sharp[i])
      face.sort((a, b) => a - b)
      const lo = face[(face.length * 0.02) | 0] ?? 0, hi = face[(face.length * 0.98) | 0] ?? 1
      const dark = document.documentElement.dataset.theme === 'dark'
      dens = new Float32Array(n)
      for (let i = 0; i < n; i++) {
        const t = clamp((sharp[i] - lo) / Math.max(0.01, hi - lo), 0, 1)
        // light theme: dark features get dense glyphs. dark theme: bright skin does.
        const v = (dark ? t : 1 - t) ** (dark ? TONE.gammaDark : TONE.gammaLight)
        dens[i] = smooth(TONE.s0, TONE.s1, v) * mask[i]
      }
      baseDirty = true
    }

    const layout = () => {
      W = box.clientWidth
      H = box.clientHeight
      if (!W || !H) return
      cols = clamp(Math.round(W / 3.48), 92, 128) // 111 cols at the board printout width, never coarser than 92
      cellW = W / cols
      cellH = cellW / 0.58
      rows = Math.floor(H / cellH)
      oy = (H - rows * cellH) / 2
      colsRef.current?.(cols)
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      for (const [c, g] of [[canvas, ctx], [base, bctx]] as const) {
        c.width = Math.round(W * dpr)
        c.height = Math.round(H * dpr)
        g.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
      const n = cols * rows
      hot = []
      heat = new Float32Array(n)
      jitter = new Float32Array(n)
      for (let i = 0; i < n; i++) {
        const h = Math.sin(i * 12.9898 + 78.233) * 43758.5453
        jitter[i] = h - Math.floor(h)
      }
      sample()
    }

    // glyph + alpha for a resolved cell, or null for blank
    const glyphAt = (i: number, chars: string, binary: boolean): [string, number] | null => {
      const d = dens[i]
      if (binary) return d < 0.06 ? null : [jitter[i] > 0.5 ? '1' : '0', d]
      const g = chars[Math.round(d * (chars.length - 1))]
      return g === ' ' ? null : [g, 0.3 + 0.7 * d]
    }

    // the resting portrait, cached so hover frames only redraw the cells around the pointer
    const renderBase = (chars: string, binary: boolean) => {
      bctx.clearRect(0, 0, W, H)
      bctx.font = `500 ${cellH}px "Geist Mono"`
      bctx.textBaseline = 'top'
      bctx.fillStyle = ink
      for (let i = 0; i < cols * rows; i++) {
        const g = glyphAt(i, chars, binary)
        if (!g) continue
        bctx.globalAlpha = g[1]
        bctx.fillText(g[0], (i % cols) * cellW, oy + ((i / cols) | 0) * cellH)
      }
      bctx.globalAlpha = 1
      baseDirty = false
      baseMode = modeRef.current
    }

    const draw = () => {
      raf = 0
      const now = performance.now()
      if (!ready || !visible || !cols) return
      if (introStart === 0) introStart = now // intro starts the first time it's actually on screen
      const set = SETS[modeRef.current]
      const chars = set.chars
      const binary = set.name === 'binary'
      const intro = introStart < 0 ? 1 : clamp((now - introStart) / INTRO_MS, 0, 1)
      const scTarget = scatterRef.current && !rm && intro >= 1 ? 1 : 0
      sc += (scTarget - sc) * 0.12
      if (Math.abs(scTarget - sc) < 0.004) sc = scTarget

      // smoothed pointer + influence that eases in/out
      ptr.sx += (ptr.x - ptr.sx) * 0.25
      ptr.sy += (ptr.y - ptr.sy) * 0.25
      ptr.power += ((ptr.inside && !rm ? 1 : 0) - ptr.power) * 0.15
      if (ptr.power < 0.005) ptr.power = 0

      // lens
      const lensTarget = lens.on ? LENS : 0
      lens.r = rm ? lensTarget : lens.r + (lensTarget - lens.r) * 0.22
      if (Math.abs(lens.r - lensTarget) < 0.5) lens.r = lensTarget
      lensImg.style.clipPath = `circle(${lens.r.toFixed(1)}px at ${ptr.sx.toFixed(1)}px ${ptr.sy.toFixed(1)}px)`
      ring.style.opacity = lens.r > 1 ? '1' : '0'
      ring.style.transform = `translate(${ptr.sx - lens.r}px, ${ptr.sy - lens.r}px)`
      ring.style.width = ring.style.height = `${lens.r * 2}px`

      // full redraw only during intro / scatter. at rest: cached base + a small dirty box.
      const full = intro < 1 || sc > 0
      ctx.clearRect(0, 0, W, H)
      let r0 = 0, r1 = rows - 1, c0 = 0, c1 = cols - 1
      if (!full) {
        if (baseDirty || baseMode !== modeRef.current) renderBase(chars, binary)
        ctx.drawImage(base, 0, 0, W, H)
        r0 = rows; r1 = -1; c0 = cols; c1 = -1
        if (ptr.power > 0) {
          r0 = Math.floor((ptr.sy - R - oy) / cellH); r1 = Math.ceil((ptr.sy + R - oy) / cellH)
          c0 = Math.floor((ptr.sx - R) / cellW); c1 = Math.ceil((ptr.sx + R) / cellW)
        }
        for (const i of hot) {
          const r = (i / cols) | 0, c = i % cols
          if (r < r0) r0 = r
          if (r > r1) r1 = r
          if (c < c0) c0 = c
          if (c > c1) c1 = c
        }
        r0 = Math.max(0, r0); r1 = Math.min(rows - 1, r1); c0 = Math.max(0, c0); c1 = Math.min(cols - 1, c1)
        if (r1 >= r0 && c1 >= c0) ctx.clearRect(c0 * cellW, oy + r0 * cellH, (c1 - c0 + 1) * cellW, (r1 - r0 + 1) * cellH)
      }

      ctx.font = `500 ${cellH}px "Geist Mono"`
      ctx.textBaseline = 'top'
      const front = intro * 1.15 // resolve front in 0..1.15 so the jitter band clears
      const accents: number[] = []
      const nextHot: number[] = []

      ctx.fillStyle = ink
      for (let r = r0; r <= r1; r++) {
        const ry = r / rows
        for (let c = c0; c <= c1; c++) {
          const i = r * cols + c
          let x = c * cellW, y = oy + r * cellH

          // pointer push + heat
          if (ptr.power > 0) {
            const dx = x + cellW / 2 - ptr.sx, dy = y + cellH / 2 - ptr.sy
            const dist = Math.hypot(dx, dy)
            if (dist < R) {
              const f = (1 - dist / R) ** 2
              const k = (f * PUSH * ptr.power) / (dist || 1)
              x += dx * k
              y += dy * k
              if (f * ptr.power > heat[i]) heat[i] = f * ptr.power
            }
          }
          if (heat[i] > 0.01) {
            heat[i] *= 0.9
            nextHot.push(i)
          } else heat[i] = 0

          // scatter: outward from the center, a bit of gravity, fade
          let alpha = 1
          if (sc > 0) {
            const vx = x - W / 2, vy = y - H / 2
            const len = Math.hypot(vx, vy) || 1
            const s = sc * 120 * (0.35 + 0.65 * jitter[i])
            x += (vx / len) * s
            y += (vy / len) * s + sc * sc * 80 * jitter[i]
            alpha = 1 - sc
            if (alpha <= 0.02) continue
          }

          if (heat[i] > 0.08 && (dens[i] > 0.03 || mask[i] > 0.3)) {
            accents.push(x, y, Math.min(1, heat[i] * 1.6) * alpha)
            continue
          }

          // intro: unresolved cells show a random glyph inside the cutout
          if (front < ry * 0.85 + jitter[i] * 0.3) {
            if (mask[i] < 0.15) continue
            ctx.globalAlpha = 0.35 * mask[i] * alpha
            ctx.fillText(pick(chars.trim() || SCRAMBLE), x, y)
            continue
          }

          const g = glyphAt(i, chars, binary)
          if (!g) continue
          ctx.globalAlpha = g[1] * alpha
          ctx.fillText(g[0], x, y)
        }
      }
      hot = nextHot

      ctx.fillStyle = accent
      for (let k = 0; k < accents.length; k += 3) {
        ctx.globalAlpha = accents[k + 2]
        ctx.fillText(pick(SCRAMBLE), accents[k], accents[k + 1])
      }

      // faint accent scan line at the resolve front
      if (intro < 1) {
        const sy = oy + (front / 1.15) * rows * cellH
        const g = ctx.createLinearGradient(0, sy - 28, 0, sy)
        g.addColorStop(0, 'transparent')
        g.addColorStop(1, accent)
        ctx.globalAlpha = 0.12
        ctx.fillStyle = g
        ctx.fillRect(0, sy - 28, W, 28)
        ctx.globalAlpha = 0.6
        ctx.fillStyle = accent
        ctx.fillRect(0, sy, W, 1)
      }
      ctx.globalAlpha = 1

      // keep going only while something is actually changing
      const busy = intro < 1 || sc !== scTarget || ptr.power > 0 || hot.length > 0 || lens.r !== lensTarget || (lens.on && Math.hypot(ptr.x - ptr.sx, ptr.y - ptr.sy) > 0.3)
      if (busy) kick()
    }

    function kick() {
      if (!raf && visible && ready) raf = requestAnimationFrame(draw)
    }
    kickRef.current = kick

    // events
    const local = (e: PointerEvent) => {
      // offsetX/Y are in the canvas's own (unscaled, unrotated) space, so this works inside the zoomed board
      if (e.target === canvas) { ptr.x = e.offsetX; ptr.y = e.offsetY; return }
      const r = box.getBoundingClientRect()
      const k = r.width / (box.offsetWidth || 1) || 1
      ptr.x = (e.clientX - r.left) / k
      ptr.y = (e.clientY - r.top) / k
    }
    const onEnter = (e: PointerEvent) => {
      local(e)
      if (ptr.power === 0 && lens.r === 0) { ptr.sx = ptr.x; ptr.sy = ptr.y }
      ptr.inside = true
      kick()
    }
    const onMove = (e: PointerEvent) => { local(e); ptr.inside = true; kick() }
    const onLeave = () => { ptr.inside = false; lens.on = false; downAt = 0; clearTimeout(holdTimer); kick() }
    let holdTimer = 0, downAt = 0
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      onEnter(e)
      downAt = performance.now()
      clearTimeout(holdTimer)
      holdTimer = window.setTimeout(() => { lens.on = true; sfx('chime'); kick() }, HOLD_MS)
    }
    const onUp = (e: PointerEvent) => {
      if (!downAt) return
      clearTimeout(holdTimer)
      if (performance.now() - downAt < HOLD_MS) cycle()
      downAt = 0
      lens.on = false
      if (e.pointerType !== 'mouse') ptr.inside = false
      kick()
    }
    const onCancel = () => onLeave()
    const onTheme = () => { readColors(); sample(); kick() }

    box.addEventListener('pointerenter', onEnter)
    box.addEventListener('pointermove', onMove)
    box.addEventListener('pointerleave', onLeave)
    box.addEventListener('pointerdown', onDown)
    box.addEventListener('pointerup', onUp)
    box.addEventListener('pointercancel', onCancel)
    window.addEventListener('themechange', onTheme)

    const ro = new ResizeObserver(() => { layout(); kick() })
    ro.observe(box)
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick() })
    io.observe(box)

    let alive = true
    Promise.all([
      document.fonts.load('500 12px "Geist Mono"').catch(() => {}),
      document.fonts.ready,
      img.decode().catch(() => {}),
    ]).then(() => {
      if (!alive) return
      readColors()
      layout()
      ready = true
      introStart = rm ? -1 : 0
      kick()
    })

    return () => {
      alive = false
      cancelAnimationFrame(raf)
      clearTimeout(holdTimer)
      ro.disconnect()
      io.disconnect()
      box.removeEventListener('pointerenter', onEnter)
      box.removeEventListener('pointermove', onMove)
      box.removeEventListener('pointerleave', onLeave)
      box.removeEventListener('pointerdown', onDown)
      box.removeEventListener('pointerup', onUp)
      box.removeEventListener('pointercancel', onCancel)
      window.removeEventListener('themechange', onTheme)
    }
  }, [src]) // cycle, scattered and onCols are read through refs

  return (
    <div className={className}>
      <div
        ref={boxRef}
        className="relative aspect-[580/640] cursor-crosshair w-full select-none [-webkit-touch-callout:none] [-webkit-tap-highlight-color:transparent]"
        onContextMenu={e => e.preventDefault()}
      >
        <canvas ref={canvasRef} role="img" aria-label="ASCII portrait of Aditya" className="absolute inset-0 h-full w-full" />
        <img
          ref={lensRef}
          src={src}
          alt=""
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          style={{ clipPath: 'circle(0px at 50% 50%)' }}
        />
        <div ref={ringRef} aria-hidden className="pointer-events-none absolute left-0 top-0 rounded-full border border-accent opacity-0" />
      </div>
      <button
        type="button"
        onClick={cycle}
        className="group mt-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase leading-none tracking-[0.12em] text-mute transition-colors hover:text-ink"
      >
        <span aria-hidden className="inline-block text-accent transition-transform duration-300 group-hover:rotate-180">↻</span>
        <span>charset: <span className="text-ink">{SETS[mode].name}</span> ({mode + 1}/{SETS.length})</span>
      </button>
    </div>
  )
}
