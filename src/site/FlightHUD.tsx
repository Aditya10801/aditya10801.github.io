import { useEffect, useRef, useState, type ReactNode } from 'react'
import { reducedMotion } from './ui'
import { goto } from './map'

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const M = ({ children }: { children: ReactNode }) => <span className="text-mute">{children}</span>

export default function FlightHUD() {
  const root = useRef<HTMLButtonElement>(null)
  const [flash, setFlash] = useState(false)
  const flashT = useRef(0)

  // rAF writes straight into the DOM, no React render per frame
  useEffect(() => {
    const el = root.current!
    const q = (k: string) => [...el.querySelectorAll<HTMLElement>(`[data-hud="${k}"]`)]
    const out = { alt: q('alt'), gs: q('gs'), hdg: q('hdg'), phase: q('phase') }
    const put = (els: HTMLElement[], s: string) => els.forEach(e => { if (e.textContent !== s) e.textContent = s })
    const still = reducedMotion()
    let raf = 0, lastT = performance.now(), lastY = scrollY, v = 0, hdg = 90

    const tick = (t: number) => {
      const dt = clamp((t - lastT) / 1000, 0.001, 0.1)
      lastT = t
      const y = scrollY
      v += ((y - lastY) / dt - v) * (1 - Math.exp(-dt / 0.3))
      lastY = y
      const max = document.documentElement.scrollHeight - innerHeight
      const p = max > 0 ? clamp(y / max, 0, 1) : 0

      const [alt, phase] =
        p < 0.02 ? [0, 'AT GATE']
        : p < 0.18 ? [(36000 * (p - 0.02)) / 0.16, 'CLIMB']
        : p < 0.82 ? [36000 + (still ? 0 : Math.sin(t / 700) * 90 + Math.sin(t / 260) * 40), 'CRUISE']
        : p < 0.97 ? [(36000 * (0.97 - p)) / 0.15, 'DESCENT']
        : [0, 'LANDED']

      // heading: course drifts 078 to 102 along the route, reciprocal when scrolling back up
      if (Math.abs(v) > 30) {
        const want = 78 + p * 24 + (v < 0 ? 180 : 0)
        const diff = ((want - hdg + 540) % 360) - 180
        hdg = (hdg + diff * (1 - Math.exp(-dt / 0.35)) + 360) % 360
      }

      put(out.alt, (Math.round(alt / 100) * 100).toLocaleString('en-US').padStart(6))
      put(out.gs, String(Math.round(clamp(Math.abs(v) * 0.5, 0, 560))).padStart(3))
      put(out.hdg, String(Math.round(hdg) % 360).padStart(3, '0'))
      put(out.phase, phase.padEnd(7))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const go = () => {
    setFlash(true)
    clearTimeout(flashT.current)
    flashT.current = window.setTimeout(() => setFlash(false), 1300)
    goto('contact')
  }

  return (
    <button
      ref={root}
      onClick={go}
      aria-label="Flight instrument showing scroll progress. Click to fly direct to contact"
      className="group fixed bottom-3 left-3 z-40 overflow-hidden rounded-sm border border-line bg-bg/90 px-3 py-2 text-left md:bottom-4 md:left-4"
    >
      {/* index.css resets button font and color, so type styles live on this inner span */}
      <span className="block whitespace-pre font-mono text-[10px] leading-[1.7] text-ink md:text-[10.5px]">
        <span className="block">
          <M>ALT </M><span data-hud="alt" /><span className="hidden md:inline"> FT</span>
          <M> · GS </M><span data-hud="gs" /> KT
          <span className="hidden md:inline"><M> · HDG </M><span data-hud="hdg" />°</span>
          <span className="md:hidden"><M> · </M><span data-hud="phase" className="text-accent" /></span>
        </span>
        <span className="hidden md:block">
          <M>PHASE </M><span className="text-accent">✈︎ </span><span data-hud="phase" className="text-accent" />
        </span>
        <span className="hidden grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out group-hover:grid-rows-[1fr] group-focus-visible:grid-rows-[1fr] md:grid">
          <span className="overflow-hidden">
            <span className="mt-1 block border-t border-dashed border-line pt-1 text-mute">
              SQUAWK 7000 · click: <span className="text-ink">direct to contact</span>
            </span>
          </span>
        </span>
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-0 grid place-items-center bg-bg tracking-[0.22em] text-accent transition-opacity duration-200 ${flash ? 'opacity-100' : 'opacity-0'}`}
        >
          <span className={flash ? 'animate-[blink_0.4s_steps(1)_infinite]' : ''}>DIRECT TO CONTACT</span>
        </span>
      </span>
    </button>
  )
}
