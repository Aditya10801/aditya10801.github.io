import { useEffect } from 'react'
import { asset, reducedMotion } from './ui'

const CHECKS = ['fonts', 'portrait', 'photos', 'sound'] as const
const BAR = 24
// both measured from navigation start, so a slow phone that took 3 s to boot doesn't wait again
const MIN_MS = 650 // long enough to read the checklist
const CAP_MS = 1800 // never hold the site hostage to a slow image

const loadImage = (src: string) =>
  new Promise<void>(res => {
    const img = new Image()
    img.onload = img.onerror = () => res()
    img.src = src
  })

/**
 * Drives the boot screen that index.html paints before any JS (#loader): ticks the pre-flight
 * checklist as real assets arrive, then mounts the board and lifts the screen like a curtain.
 */
export default function Preloader({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const root = document.getElementById('loader')
    if (!root) return onDone()
    if (document.documentElement.classList.contains('boarded')) { root.remove(); return onDone() }
    const rm = reducedMotion()
    const since = performance.now()
    const done = new Set<string>()
    const bar = root.querySelector('[data-bar]')!, rest = root.querySelector('[data-rest]')!, pct = root.querySelector('[data-pct]')!
    const timers: ReturnType<typeof setTimeout>[] = []
    let shown = 0, alive = true

    const render = () => {
      const f = Math.round(shown * BAR)
      bar.textContent = '█'.repeat(f)
      rest.textContent = '░'.repeat(BAR - f)
      pct.textContent = `${Math.round(shown * 100)}%`
      root.setAttribute('aria-label', `Loading, ${Math.round(shown * 100)} percent`)
    }
    const tick = (k: string) => {
      if (!alive || done.has(k)) return
      done.add(k)
      const el = root.querySelector(`[data-ck="${k}"]`)
      if (el) { el.textContent = 'ok'; el.className = 'ld-ok' }
    }
    // a phone that took longer than the cap to boot, or a visitor coming from another page here, has already waited: no ramp, quicker curtain
    let fromSite = false
    try { fromSite = !!document.referrer && new URL(document.referrer).origin === location.origin } catch { /* bad referrer */ }
    const late = since > CAP_MS || fromSite
    const finish = () => {
      try { sessionStorage.setItem('boarded', '1') } catch { /* private mode */ }
      onDone() // the board mounts under the screen
      const lift = root.animate([{ clipPath: 'inset(0 0 0% 0)' }, { clipPath: 'inset(0 0 100% 0)' }], {
        duration: rm ? 0 : late ? 420 : 600,
        easing: 'cubic-bezier(.76,0,.24,1)',
        delay: rm || late ? 0 : 120,
        fill: 'forwards',
      })
      lift.finished.then(() => root.remove())
    }

    const min = new Promise(r => timers.push(setTimeout(r, rm ? 0 : Math.max(0, MIN_MS - since))))
    document.fonts.ready.then(() => min).then(() => tick('fonts'))
    loadImage(asset('me/face.jpg')).then(() => min).then(() => tick('portrait'))
    loadImage(asset('me/japan.jpg')).then(() => min).then(() => tick('photos'))
    min.then(() => tick('sound'))
    timers.push(setTimeout(() => CHECKS.forEach(tick), Math.max(0, CAP_MS - since)))

    // ease the bar toward the share of checks that are done
    const step = setInterval(() => {
      const target = done.size / CHECKS.length
      shown = rm || late ? target : Math.min(target, shown + 0.08)
      render()
      if (shown >= 1) { clearInterval(step); alive = false; finish() }
    }, 16)

    return () => { alive = false; clearInterval(step); timers.forEach(clearTimeout) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}
