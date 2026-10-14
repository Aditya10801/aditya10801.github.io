import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent, type ReactNode } from 'react'
import { ORDER, SEG, WORLD, ZONES, board, goto, type Rect, type ZoneId } from './map'
import { reducedMotion, useMedia } from './ui'
import { sfx } from './sound'

const FlowCtx = createContext(false)
/** True when the board is off (small screens) and objects stack vertically. */
export const useFlow = () => useContext(FlowCtx)

const TOP = 28 // breathing room, no top bar
const BOTTOM = 116 // terminal + chips
const N = ORDER.length

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)
const fit = (r: Rect, vw: number, vh: number) => Math.min(1, (vw * 0.92) / r.w, ((vh - TOP - BOTTOM) * 0.94) / r.h)

/** Where the camera wants to be for route progress p. Dwells on each zone, zooms out a little mid-flight. */
function aim(p: number, vw: number, vh: number) {
  if (board.overview) {
    return { x: WORLD.w / 2, y: WORLD.h / 2, z: Math.min(vw / WORLD.w, (vh - TOP - BOTTOM) / WORLD.h) * 0.94 }
  }
  const i = Math.min(N - 1, Math.max(0, Math.floor(p)))
  const a = ZONES[ORDER[i]], b = ZONES[ORDER[Math.min(N - 1, i + 1)]]
  const e = smoother(clamp01((p - i - 0.18) / 0.64))
  return {
    x: lerp(a.x + a.w / 2, b.x + b.w / 2, e),
    y: lerp(a.y + a.h / 2, b.y + b.h / 2, e),
    z: lerp(fit(a, vw, vh), fit(b, vw, vh), e) * (1 - 0.22 * Math.sin(Math.PI * e)),
  }
}

export default function Board({ children }: { children: ReactNode }) {
  const flow = useMedia('(max-width: 899px)')
  board.flow = flow
  if (flow) {
    return (
      <FlowCtx.Provider value>
        <main className="relative z-10 flex flex-col gap-28 px-5 pb-44 pt-12">{children}</main>
      </FlowCtx.Provider>
    )
  }
  return <Canvas>{children}</Canvas>
}

function Canvas({ children }: { children: ReactNode }) {
  const world = useRef<HTMLDivElement>(null)
  const [overview, setOverview] = useState(false)
  const pan = useRef({ x: 0, y: 0, decay: false, drag: null as null | { x: number; y: number } })

  useEffect(() => {
    board.overview = overview
    if (overview) pan.current.x = pan.current.y = 0
    dispatchEvent(new CustomEvent('board:overviewchange', { detail: overview }))
  }, [overview])

  useEffect(() => {
    const set = (e: Event) => setOverview((e as CustomEvent<boolean>).detail)
    addEventListener('board:setoverview', set)
    return () => removeEventListener('board:setoverview', set)
  }, [])

  useEffect(() => {
    const still = reducedMotion()
    const cam = board.cam
    let raf = 0, first = true, last = '', prev = performance.now()
    const shown = new Map<Element, boolean>()
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(0.1, (now - prev) / 1000)
      prev = now
      const vw = innerWidth, vh = innerHeight
      board.p = Math.min(N - 1, scrollY / SEG)
      const t = aim(board.p, vw, vh)
      const P = pan.current
      if (P.decay) { const d = Math.exp(-dt * 9); P.x *= d; P.y *= d; if (Math.abs(P.x) + Math.abs(P.y) < 0.5) { P.x = P.y = 0; P.decay = false } }
      // frame-rate independent easing, so a dropped frame doesn't stutter the camera
      const k = first || still ? 1 : 1 - Math.exp(-dt * 7)
      first = false
      cam.x += (t.x + P.x - cam.x) * k
      cam.y += (t.y + P.y - cam.y) * k
      cam.z += (t.z - cam.z) * k
      const cx = vw / 2, cy = TOP + (vh - TOP - BOTTOM) / 2
      const tf = `translate3d(${(cx - cam.x * cam.z).toFixed(2)}px, ${(cy - cam.y * cam.z).toFixed(2)}px, 0) scale(${cam.z.toFixed(4)})`
      if (tf !== last) world.current!.style.transform = last = tf
      // only paint zones near the camera: far ones would still re-raster on every clock tick and animation
      world.current!.querySelectorAll<HTMLElement>('[data-zone]').forEach(el => {
        const near = board.overview || Math.abs(board.p - ORDER.indexOf(el.dataset.zone as ZoneId)) < 1.1
        if (shown.get(el) !== near) { shown.set(el, near); el.style.visibility = near ? '' : 'hidden' }
      })
    }
    raf = requestAnimationFrame(tick)

    const onScroll = () => { if (!pan.current.drag) pan.current.decay = true }
    const onWheel = () => setOverview(false)
    const onClose = () => setOverview(false)
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement).closest?.('input, textarea, [contenteditable]')) return
      if (e.key === 'z' || e.key === 'Z') setOverview(o => !o)
      else if (e.key === 'Escape') setOverview(false)
      else if (/^[1-8]$/.test(e.key)) goto(+e.key - 1)
    }
    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('wheel', onWheel, { passive: true })
    addEventListener('board:closeoverview', onClose)
    addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('scroll', onScroll)
      removeEventListener('wheel', onWheel)
      removeEventListener('board:closeoverview', onClose)
      removeEventListener('keydown', onKey)
    }
  }, [])

  // drag empty board to pan
  const down = (e: RPointerEvent) => {
    if (e.button !== 0 || (e.target as Element).closest('[data-obj], a, button, input, textarea, canvas, [role="button"]')) return
    pan.current.drag = { x: e.clientX, y: e.clientY }
    pan.current.decay = false
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
  }
  const move = (e: RPointerEvent) => {
    const d = pan.current.drag
    if (!d) return
    pan.current.x -= (e.clientX - d.x) / board.cam.z
    pan.current.y -= (e.clientY - d.y) / board.cam.z
    pan.current.drag = { x: e.clientX, y: e.clientY }
  }
  const up = () => { pan.current.drag = null }

  return (
    <FlowCtx.Provider value={false}>
      {/* scroll runway: native scroll drives the camera */}
      <div aria-hidden style={{ height: `calc(${(N - 1) * SEG}px + 100vh)` }} />
      <main
        data-pan
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        className="fixed inset-0 z-10 touch-none select-none overflow-clip"
      >
        <div ref={world} className="absolute left-0 top-0 origin-top-left will-change-transform" style={{ width: WORLD.w, height: WORLD.h }}>
          {/* figma canvas dots */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-[600px] opacity-60"
            style={{ backgroundImage: 'radial-gradient(var(--line) 1.2px, transparent 1.2px)', backgroundSize: '28px 28px' }}
          />
          <Route />
          {children}
          {overview &&
            ORDER.map((id, i) => {
              const r = ZONES[id]
              return (
                <button
                  key={id}
                  onClick={() => goto(i)}
                  aria-label={`Fly to ${id}`}
                  className="group absolute z-50 border-2 border-transparent transition-colors hover:border-sel hover:bg-sel/5"
                  style={{ left: r.x - 30, top: r.y - 30, width: r.w + 60, height: r.h + 60 }}
                >
                  <span className="absolute -top-14 left-0 font-mono text-[44px] lowercase text-sel opacity-70 group-hover:opacity-100">
                    {String(i + 1).padStart(2, '0')} {id}
                  </span>
                </button>
              )
            })}
        </div>
      </main>
    </FlowCtx.Provider>
  )
}

/** Dashed flight route through every zone, drawn on the board. */
function Route() {
  const pts = ORDER.map(id => [ZONES[id].x + ZONES[id].w / 2, ZONES[id].y + ZONES[id].h / 2])
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ')
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 overflow-visible" width={WORLD.w} height={WORLD.h}>
      <path d={d} fill="none" stroke="var(--mute)" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="2 10" strokeLinecap="round" />
    </svg>
  )
}


/** A section's area on the board. Children use coordinates local to the zone (ZONE_W × ZONE_H). */
export function Zone({ id, children, className = '' }: { id: ZoneId; children: ReactNode; className?: string }) {
  const flow = useFlow()
  if (flow) return <section id={id} className={`relative flex flex-col items-center gap-12 ${className}`}>{children}</section>
  const r = ZONES[id]
  return (
    <section id={id} data-zone={id} className={`absolute ${className}`} style={{ left: r.x, top: r.y, width: r.w, height: r.h }}>
      {children}
    </section>
  )
}

type ObjProps = {
  x: number
  y: number
  w: number
  h?: number
  r?: number // rotation, degrees
  z?: number
  /** Figma-style frame name shown above the object; also the drag handle. Omit for loose decorations. */
  label?: string
  /** Hide in the stacked mobile layout (decorations that only make sense on the board). */
  boardOnly?: boolean
  className?: string
  style?: CSSProperties
  children: ReactNode
}

/** A physical thing on the board. Drag it by its label to move it around. */
export function Obj({ x, y, w, h, r = 0, z, label, boardOnly, className = '', style, children }: ObjProps) {
  const flow = useFlow()
  const [off, setOff] = useState({ x: 0, y: 0 })
  const [lifted, setLifted] = useState(false)
  const drag = useRef<{ x: number; y: number } | null>(null)

  if (flow && boardOnly) return null

  const grab = (e: RPointerEvent) => {
    if (flow) return
    e.stopPropagation()
    drag.current = { x: e.clientX, y: e.clientY }
    setLifted(true)
    sfx('paper')
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
  }
  const move = (e: RPointerEvent) => {
    const d = drag.current
    if (!d) return
    const z = board.cam.z
    setOff(o => ({ x: o.x + (e.clientX - d.x) / z, y: o.y + (e.clientY - d.y) / z }))
    drag.current = { x: e.clientX, y: e.clientY }
  }
  const drop = () => { if (drag.current) sfx('pop'); drag.current = null; setLifted(false) }

  const pos: CSSProperties = flow
    ? { width: '100%', maxWidth: w, rotate: `${r / 2}deg`, zIndex: z }
    : {
        position: 'absolute',
        left: x + off.x,
        top: y + off.y,
        width: w,
        height: h,
        zIndex: lifted ? 40 : z,
        rotate: `${r + (lifted ? 1.5 : 0)}deg`,
        scale: lifted ? 1.02 : 1,
        filter: lifted ? 'drop-shadow(0 18px 24px rgb(0 0 0 / 0.18))' : undefined,
        transition: 'rotate .25s, scale .25s, filter .25s',
      }

  return (
    <div data-obj className={`group/obj relative ${className}`} style={{ ...pos, ...style }}>
      {label && (
        <div
          onPointerDown={grab}
          onPointerMove={move}
          onPointerUp={drop}
          onPointerCancel={drop}
          data-drag
          className={`absolute -top-6 left-0 flex select-none items-center gap-1.5 whitespace-nowrap font-mono text-[10px] text-mute transition-colors group-hover/obj:text-sel ${flow ? '' : 'cursor-grab touch-none'}`}
        >
          <span aria-hidden className="text-[9px]">#</span>
          {label}
        </div>
      )}
      {label && !flow && (
        <span aria-hidden className="pointer-events-none absolute -inset-[3px] border border-sel opacity-0 transition-opacity duration-150 group-hover/obj:opacity-100" />
      )}
      {children}
    </div>
  )
}

// one shared loop for every useZoneActive
const zoneWatchers = new Set<() => void>()
let zoneRaf = 0
function zoneTick() {
  if (!zoneWatchers.size) { zoneRaf = 0; return }
  zoneWatchers.forEach(fn => fn())
  zoneRaf = requestAnimationFrame(zoneTick)
}

/** True while the camera is parked on this zone (board), or while the section is on screen (stacked layout). */
export function useZoneActive(id: ZoneId) {
  const flow = useFlow()
  const [on, setOn] = useState(false)
  useEffect(() => {
    if (flow) {
      const el = document.getElementById(id)
      if (!el) return
      const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { threshold: 0.25 })
      io.observe(el)
      return () => io.disconnect()
    }
    const i = ORDER.indexOf(id)
    const fn = () => { const v = !board.overview && Math.abs(board.p - i) < 0.3; setOn(o => (o === v ? o : v)) }
    zoneWatchers.add(fn)
    if (!zoneRaf) zoneRaf = requestAnimationFrame(zoneTick)
    return () => { zoneWatchers.delete(fn) }
  }, [flow, id])
  return on
}
