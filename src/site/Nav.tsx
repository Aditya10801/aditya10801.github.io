import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import SquishSwitch from '@/components/SquishSwitch'
import { istTime, reducedMotion, useClock, useTheme } from './ui'
import { board, goto } from './map'
import { onSoundChange, setSound, soundOn } from './sound'

const BARS = '▁▂▃▄▅▆▇'

/** Sound toggle: ASCII equalizer that dances while music plays. */
function SoundToggle() {
  const [on, setOn] = useState(soundOn)
  const [bars, setBars] = useState('▁▁▁▁')
  useEffect(() => onSoundChange(setOn), [])
  useEffect(() => {
    if (!on) return setBars('▁▁▁▁')
    const id = setInterval(() => setBars(Array.from({ length: 4 }, () => BARS[Math.floor(Math.random() * BARS.length)]).join('')), 140)
    return () => clearInterval(id)
  }, [on])
  return (
    <button
      onClick={() => setSound(!on)}
      aria-pressed={on}
      aria-label={on ? 'Turn sound off' : 'Turn sound on'}
      className="group flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-mute transition-colors hover:text-ink"
    >
      <span aria-hidden className={`w-[4ch] text-[11px] leading-none tracking-normal ${on ? 'text-accent' : ''}`}>{bars}</span>
      <span className="hidden sm:inline">{on ? 'sound' : 'muted'}</span>
    </button>
  )
}

// sections as waypoints on a flight route
const WPTS = [
  { id: 'hero', code: 'DEP', name: 'gate' },
  { id: 'about', code: 'ABT', name: 'about' },
  { id: 'into', code: 'INT', name: 'things i\'m into' },
  { id: 'hangar', code: 'HGR', name: 'the hangar' },
  { id: 'now', code: 'NOW', name: 'currently' },
  { id: 'contact', code: 'ARR', name: 'contact' },
] as const

const PLANE = 'M22 12c0-.8-.7-1.3-1.5-1.3h-5.2L10.6 3.5H8.4l2.3 7.2H5.6L3.9 8.4H2.2l1.1 3.6-1.1 3.6h1.7l1.7-2.3h5.1l-2.3 7.2h2.2l4.7-7.2h5.2c.8 0 1.5-.5 1.5-1.3z'

/** Continuous route position: 0 at the gate, 5 at arrival. */
function routeProgress() {
  const mid = innerHeight * 0.45
  const els = WPTS.map(w => document.getElementById(w.id))
  for (let i = els.length - 1; i >= 0; i--) {
    const el = els[i]
    if (!el) continue
    const r = el.getBoundingClientRect()
    if (r.top <= mid) {
      if (i === els.length - 1) return i
      const next = els[i + 1]?.getBoundingClientRect().top ?? r.bottom
      return i + Math.min(1, (mid - r.top) / Math.max(1, next - r.top))
    }
  }
  return 0
}

/** Types `~/section` like a shell prompt whenever the section changes. */
function TypedPath({ path }: { path: string }) {
  const [shown, setShown] = useState(path)
  useEffect(() => {
    if (reducedMotion()) return setShown(path)
    let cur = shown, id = 0
    const step = () => {
      if (!path.startsWith(cur)) cur = cur.slice(0, -1)
      else if (cur !== path) cur = path.slice(0, cur.length + 1)
      else return
      setShown(cur)
      id = window.setTimeout(step, 28)
    }
    step()
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path])
  return (
    <span className="font-mono text-[11px] text-mute">
      {shown}
      <span className="blink ml-px inline-block h-[11px] w-[6px] translate-y-[1px] bg-accent" />
    </span>
  )
}

export default function Nav() {
  const [active, setActive] = useState(0)
  const [hover, setHover] = useState<number | null>(null)
  const [open, setOpen] = useState(false)
  const [theme, setTheme] = useTheme()
  const now = useClock()
  const track = useRef<HTMLDivElement>(null)
  const fill = useRef<HTMLDivElement>(null)
  const plane = useRef<HTMLSpanElement>(null)
  const mobileFill = useRef<HTMLDivElement>(null)
  const progress = useRef(0)

  useEffect(() => {
    let raf = 0, smooth = 0, lastY = scrollY, dir = 1
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const p = board.flow ? routeProgress() : board.p
      progress.current = p
      if (Math.abs(scrollY - lastY) > 2) dir = scrollY > lastY ? 1 : -1
      lastY = scrollY
      smooth += (p - smooth) * 0.14
      const t = smooth / (WPTS.length - 1)
      if (fill.current) fill.current.style.transform = `scaleX(${t})`
      if (mobileFill.current) mobileFill.current.style.transform = `scaleX(${t})`
      if (plane.current && track.current) {
        const w = track.current.offsetWidth
        const bob = reducedMotion() ? 0 : Math.sin(performance.now() / 420) * 1.2
        plane.current.style.transform = `translate(${t * w}px, ${bob}px) translate(-50%, -50%) rotate(${dir > 0 ? 0 : 180}deg)`
      }
      const idx = Math.min(WPTS.length - 1, Math.floor(p + 0.08))
      setActive(a => (a === idx ? a : idx))
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const go = (i: number) => {
    setOpen(false)
    goto(i)
  }

  // "distance" to a waypoint in nautical miles, for fun (1 section = ~1.2 nm)
  const nm = (i: number) => Math.abs(i - progress.current) * 1.2

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-bg/90">
      <nav className="mx-auto flex h-14 max-w-[1160px] items-center justify-between gap-6 px-5 md:px-10">
        <button onClick={() => go(0)} className="group flex shrink-0 items-baseline gap-2" aria-label="Back to top">
          <span className="text-[14px] font-medium tracking-tight transition-[letter-spacing] duration-300 group-hover:tracking-normal">aditya</span>
          <TypedPath path={`~/${active === 0 ? '' : WPTS[active].id}`} />
        </button>

        {/* route map */}
        <div className="relative hidden h-full flex-1 items-center md:flex lg:max-w-[520px]">
          <div ref={track} className="relative mx-4 h-px w-full">
            <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,var(--mute)_0_2px,transparent_2px_6px)] opacity-50" />
            <div ref={fill} className="absolute inset-0 origin-left bg-ink" style={{ transform: 'scaleX(0)' }} />
            {WPTS.map((w, i) => {
              const x = `${(i / (WPTS.length - 1)) * 100}%`
              const passed = i < active, here = i === active
              return (
                <button
                  key={w.id}
                  onClick={() => go(i)}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  aria-label={`Fly to ${w.name}`}
                  aria-current={here ? 'location' : undefined}
                  className="group absolute top-0 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                  style={{ left: x }}
                >
                  <span
                    className={`block h-[7px] w-[7px] rotate-45 border transition-all duration-300 group-hover:scale-150 ${
                      here ? 'border-accent bg-accent' : passed ? 'border-ink bg-ink' : 'border-mute bg-bg'
                    }`}
                  />
                  <span
                    className={`absolute top-[26px] font-mono text-[9px] tracking-[0.12em] transition-colors ${here ? 'text-accent' : 'text-mute group-hover:text-ink'}`}
                  >
                    {w.code}
                  </span>
                </button>
              )
            })}
            <span ref={plane} aria-hidden className="pointer-events-none absolute left-0 top-0 text-accent will-change-transform">
              <svg viewBox="0 0 24 24" width="15" height="15"><path fill="currentColor" d={PLANE} /></svg>
            </span>
            {/* flight strip tooltip */}
            <AnimatePresence>
              {hover !== null && (
                <motion.div
                  key={hover}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                  className="pointer-events-none absolute top-[38px] -translate-x-1/2 whitespace-nowrap border border-line bg-bg px-2 py-1 font-mono text-[10px] text-ink shadow-sm"
                  style={{ left: `${(hover / (WPTS.length - 1)) * 100}%` }}
                >
                  <span className="text-accent">{WPTS[hover].code}</span> · {WPTS[hover].name} ·{' '}
                  <span className="text-mute">{hover === active ? 'you are here' : `${nm(hover).toFixed(1)} nm ${hover > active ? 'ahead' : 'behind'}`}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <span className="hidden font-mono text-[11px] tabular-nums text-mute lg:inline" title="Aditya's local time">
            IST {istTime(now)}
          </span>
          <SoundToggle />
          <span className="flex items-center gap-2">
            <span aria-hidden className="w-9 text-right font-mono text-[10px] uppercase tracking-[0.14em] text-mute">{theme === 'dark' ? 'night' : 'day'}</span>
            <SquishSwitch
              checked={theme === 'dark'}
              onChange={on => setTheme(on ? 'dark' : 'light')}
              ariaLabel="Toggle dark mode"
              width={40}
              height={22}
              radius={11}
              trackColor="var(--line)"
              trackOnColor="var(--accent)"
              thumbColor="var(--ink)"
              thumbOnColor="var(--bg)"
            />
          </span>
          <button
            onClick={() => setOpen(o => !o)}
            className="font-mono text-[11px] uppercase tracking-[0.14em] md:hidden"
            aria-expanded={open}
          >
            {open ? 'close' : 'route'}
          </button>
        </div>
      </nav>

      {/* mobile: thin route progress under the bar */}
      <div className="relative h-px md:hidden">
        <div ref={mobileFill} className="absolute inset-0 origin-left bg-accent" style={{ transform: 'scaleX(0)' }} />
      </div>

      <AnimatePresence>
        {open && (
          <motion.ol initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden px-5 md:hidden">
            {WPTS.map((w, i) => (
              <motion.li
                key={w.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0, transition: { delay: 0.04 * i } }}
                exit={{ opacity: 0 }}
                className="border-t border-line first:border-t-0"
              >
                <button onClick={() => go(i)} className="flex w-full items-center gap-3 py-3 text-left text-[15px]">
                  <span className={`h-[7px] w-[7px] rotate-45 border ${i === active ? 'border-accent bg-accent' : i < active ? 'border-ink bg-ink' : 'border-mute'}`} />
                  <span className="w-8 font-mono text-[10px] text-mute">{w.code}</span>
                  {w.name}
                  {i === active && <span className="ml-auto font-mono text-[10px] text-accent">you are here</span>}
                </button>
              </motion.li>
            ))}
          </motion.ol>
        )}
      </AnimatePresence>
    </header>
  )
}
