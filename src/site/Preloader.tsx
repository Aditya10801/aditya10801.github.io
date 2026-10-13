import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { asset, reducedMotion } from './ui'
import { setSound } from './sound'

const CHECKS = ['fonts', 'portrait', 'photos', 'sound'] as const
const BAR = 24

const loadImage = (src: string) =>
  new Promise<void>(res => {
    const img = new Image()
    img.onload = img.onerror = () => res()
    img.src = src
  })

/** Pre-flight checklist that really waits for fonts and photos, then asks to board. Entering is the gesture that unlocks audio. */
export default function Preloader({ onEnter }: { onEnter: () => void }) {
  const [done, setDone] = useState<Set<string>>(new Set())
  const [shown, setShown] = useState(0) // eased progress, 0..1
  const ready = done.size === CHECKS.length

  useEffect(() => {
    const tick = (k: string) => setDone(d => new Set(d).add(k))
    const min = new Promise(r => setTimeout(r, reducedMotion() ? 0 : 900))
    document.fonts.ready.then(() => min).then(() => tick('fonts'))
    loadImage(asset('me/face.jpg')).then(() => min).then(() => tick('portrait'))
    loadImage(asset('me/japan.jpg')).then(() => min).then(() => tick('photos'))
    min.then(() => tick('sound'))
  }, [])

  useEffect(() => {
    const target = done.size / CHECKS.length
    if (shown >= target) return
    const id = setTimeout(() => setShown(s => Math.min(target, s + 0.04)), 16)
    return () => clearTimeout(id)
  }, [done, shown])

  const enter = (withSound: boolean) => {
    if (!ready) return
    setSound(withSound)
    onEnter()
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter') enter(true) }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  })

  const filled = Math.round(shown * BAR)

  return (
    <motion.div
      role="dialog"
      aria-label="Loading"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-bg px-6"
      initial={{ clipPath: 'inset(0 0 0% 0)' }}
      exit={{ clipPath: 'inset(0 0 100% 0)', transition: { duration: reducedMotion() ? 0 : 0.8, ease: [0.76, 0, 0.24, 1] } }}
    >
      <div className="w-full max-w-[340px] font-mono text-[12px] leading-[1.9]">
        <p className="text-[15px] font-medium tracking-tight font-sans">aditya madan</p>
        <p className="mb-6 text-mute">corner of the internet</p>

        <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-mute">pre-flight</p>
        {CHECKS.map(k => (
          <div key={k} className="flex">
            <span>{k}</span>
            <span className="mx-2 flex-1 overflow-hidden whitespace-nowrap text-mute/50">{'.'.repeat(60)}</span>
            <span className={done.has(k) ? 'text-accent' : 'blink text-mute'}>{done.has(k) ? 'ok' : '..'}</span>
          </div>
        ))}

        <div className="mt-4 flex justify-between tabular-nums">
          <span aria-hidden>
            [<span className="text-accent">{'█'.repeat(filled)}</span>
            <span className="text-mute/40">{'░'.repeat(BAR - filled)}</span>]
          </span>
          <span>{Math.round(shown * 100)}%</span>
        </div>

        <div className={`mt-8 flex items-center gap-5 transition-opacity duration-500 ${ready && shown >= 1 ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
          <button
            onClick={() => enter(true)}
            className="group flex items-center gap-2 rounded-full bg-ink px-4 py-2 font-sans text-[13px] text-bg transition-transform active:scale-95"
          >
            enter
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-0.5">↵</span>
            <span className="ml-1 font-mono text-[10px] opacity-60">♪ on</span>
          </button>
          <button onClick={() => enter(false)} className="text-[11px] text-mute underline-offset-4 transition-colors hover:text-ink hover:underline">
            enter muted
          </button>
        </div>
      </div>
    </motion.div>
  )
}
