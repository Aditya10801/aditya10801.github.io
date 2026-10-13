import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { motion } from 'motion/react'
import DecryptedText from '@/components/DecryptedText'

export const LINKS = {
  email: 'adityamadan01@gmail.com',
  github: 'https://github.com/Aditya10801',
  linkedin: 'https://www.linkedin.com/in/aditya-madan-90b49526b',
  instagram: 'https://www.instagram.com/your.avg.engineer/',
  resume: `${import.meta.env.BASE_URL}resume.pdf`,
}

export const asset = (p: string) => `${import.meta.env.BASE_URL}${p}`

export const reducedMotion = () => typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** Fine pointer = mouse/trackpad. Touch devices get tap fallbacks. */
export function useFinePointer() {
  const [fine, setFine] = useState(() => typeof window !== 'undefined' && matchMedia('(hover: hover) and (pointer: fine)').matches)
  useEffect(() => {
    const m = matchMedia('(hover: hover) and (pointer: fine)')
    const on = () => setFine(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return fine
}

export function useMedia(query: string) {
  const [match, setMatch] = useState(() => typeof window !== 'undefined' && matchMedia(query).matches)
  useEffect(() => {
    const m = matchMedia(query)
    const on = () => setMatch(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [query])
  return match
}

/** Current theme, kept in sync with <html data-theme>. Fires 'themechange' on window. */
export function useTheme() {
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => (document.documentElement.dataset.theme as 'light' | 'dark') || 'light')
  useEffect(() => {
    const on = () => setThemeState(document.documentElement.dataset.theme as 'light' | 'dark')
    window.addEventListener('themechange', on)
    return () => window.removeEventListener('themechange', on)
  }, [])
  const setTheme = (t: 'light' | 'dark') => {
    document.documentElement.dataset.theme = t
    try { localStorage.setItem('theme', t) } catch { /* private mode */ }
    window.dispatchEvent(new Event('themechange'))
  }
  return [theme, setTheme] as const
}

/** Reads a CSS custom property, e.g. cssVar('--ink'). */
export const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

export function useClock(ms = 1000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ms)
    return () => clearInterval(id)
  }, [ms])
  return now
}
export const istTime = (d: Date, seconds = true) =>
  d.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit', ...(seconds && { second: '2-digit' }) })

/** Letters roll up to an accent copy on hover. Hover triggers on itself or any `.group` ancestor. */
export function RollText({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span className={`roll ${className}`} aria-label={text} role="text">
      {[...text].map((c, i) => (
        <span key={i} aria-hidden className="roll-c" style={{ '--i': i } as CSSProperties}>{c}</span>
      ))}
    </span>
  )
}

/** Figma-style selection box with live W × H readout on hover. */
export function Selectable({ children, name = 'Frame', className = '' }: { children: ReactNode; name?: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState([0, 0])
  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setSize([Math.round(e.contentRect.width), Math.round(e.contentRect.height)]))
    ro.observe(ref.current!)
    return () => ro.disconnect()
  }, [])
  return (
    <div ref={ref} className={`group/sel relative ${className}`}>
      {children}
      <span aria-hidden className="sel-box">
        {['-left-1 -top-1', '-right-1 -top-1', '-left-1 -bottom-1', '-right-1 -bottom-1'].map(p => <span key={p} className={`sel-handle ${p}`} />)}
        <span className="absolute -top-6 left-0 font-mono text-[10px] text-sel">{name}</span>
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-sm bg-sel px-1.5 py-px font-mono text-[10px] text-white">
          {size[0]} × {size[1]}
        </span>
      </span>
    </div>
  )
}

const SCRIBBLES = {
  line: { vb: '0 0 200 14', d: 'M3 9 C 40 3, 70 13, 104 7 S 165 4, 197 8' },
  double: { vb: '0 0 200 18', d: 'M4 7 C 60 3, 130 4, 196 6 M 12 14 C 70 10, 140 11, 190 13' },
  circle: { vb: '0 0 200 60', d: 'M108 5 C 160 3 198 14 196 30 C 194 47 140 56 96 54 C 44 52 4 43 6 28 C 8 13 50 5 118 8' },
}

/** Hand-drawn mark that draws itself in view and redraws on hover. */
export function Scribble({ children, kind = 'line', className = '' }: { children: ReactNode; kind?: keyof typeof SCRIBBLES; className?: string }) {
  const [n, setN] = useState(0)
  const s = SCRIBBLES[kind]
  const circle = kind === 'circle'
  return (
    <span className={`relative inline-block ${className}`} onMouseEnter={() => setN(v => v + 1)}>
      {children}
      <svg
        aria-hidden
        viewBox={s.vb}
        preserveAspectRatio="none"
        className={`pointer-events-none absolute overflow-visible text-accent ${circle ? '-inset-x-3 -inset-y-2 h-[calc(100%+16px)] w-[calc(100%+24px)]' : '-bottom-1.5 left-0 h-2.5 w-full'}`}
      >
        <motion.path
          key={n}
          d={s.d}
          fill="none"
          stroke="currentColor"
          strokeWidth={circle ? 1.6 : 2}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: n === 0, amount: 1 }}
          transition={{ duration: 0.7, ease: [0.6, 0, 0.3, 1] }}
        />
      </svg>
    </span>
  )
}

/** Section label like `[01] about`, decrypts on hover. */
export function Label({ n, children }: { n: string; children: string }) {
  return (
    <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-mute">
      <span className="text-accent">[{n}]</span>
      <DecryptedText text={children} animateOn="inViewHover" sequential speed={35} characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ#/*+" />
    </div>
  )
}

/** Handwritten margin note. */
export function Note({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`font-hand text-[19px] leading-none text-mute ${className}`}>{children}</span>
}
