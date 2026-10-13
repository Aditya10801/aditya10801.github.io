import { Fragment, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import VariableProximity from '@/components/VariableProximity'
import ScrambledText from '@/components/ScrambledText'
import DecryptedText from '@/components/DecryptedText'
import Magnet from '@/components/Magnet'
import AsciiPortrait from './AsciiPortrait'
import { Sticker } from './Stickers'
import { Obj, Zone, useFlow, useZoneActive } from './Board'
import { goto } from './map'
import { LINKS, Note, RollText, Selectable, asset, istTime, reducedMotion, useClock, useFinePointer } from './ui'

/* ───────────── meta line: coords · IST clock ───────────── */

function Clock() {
  const now = useClock()
  const fine = useFinePointer()
  const [mine, setMine] = useState(false)
  const [h, m, s] = istTime(now).split(':')
  const local = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
  const face = (k: string, child: ReactNode) => (
    <motion.span
      key={k}
      className="[grid-area:1/1] whitespace-nowrap"
      initial={{ y: '110%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '-110%', opacity: 0 }}
      transition={{ duration: 0.28, ease: [0.3, 0.7, 0.2, 1] }}
    >
      {child}
    </motion.span>
  )
  return (
    <span
      className="inline-flex select-none items-center gap-1.5 tabular-nums transition-colors hover:text-ink"
      onMouseEnter={() => fine && setMine(true)}
      onMouseLeave={() => fine && setMine(false)}
      onClick={() => !fine && setMine(v => !v)}
      title="Aditya's local time"
    >
      <span aria-hidden className="size-1.5 rounded-full bg-accent" />
      <span className="inline-grid overflow-hidden">
        <span aria-hidden className="invisible [grid-area:1/1]">your time 00:00</span>
        <AnimatePresence initial={false}>
          {mine
            ? face('you', <>your time {local}</>)
            : face('ist', <>IST {h}<span className="blink">:</span>{m}<span className="blink">:</span>{s}</>)}
        </AnimatePresence>
      </span>
    </span>
  )
}

/* ───────────── CTAs ───────────── */

function SayHi() {
  return (
    <Magnet padding={40} magnetStrength={3} maxOffset={8}>
      <button
        type="button"
        onClick={() => goto('contact')}
        className="group relative inline-flex h-10 items-center overflow-hidden rounded-full bg-ink px-5 text-[14px] font-medium text-bg"
      >
        <span aria-hidden className="hi-plane pointer-events-none absolute top-[4px] text-[9px] leading-none text-accent">✈</span>
        <RollText text="say hi" />
      </button>
    </Magnet>
  )
}

const PCT = [0, 7, 15, 22, 31, 40, 48, 48, 63, 76, 88, 96, 100]

/** Tiny file icon + name. Hover fakes a download bar, click really downloads. */
function Resume() {
  const [k, setK] = useState(-1) // -1 idle, 0..12 loading, 13 ready
  const timer = useRef(0)
  const start = () => {
    clearInterval(timer.current)
    if (reducedMotion()) return setK(13)
    setK(0)
    timer.current = window.setInterval(() => setK(v => {
      if (v >= PCT.length - 1) { clearInterval(timer.current); return 13 }
      return v + 1
    }), 75)
  }
  const stop = () => { clearInterval(timer.current); setK(-1) }
  useEffect(() => () => clearInterval(timer.current), [])
  const pct = PCT[Math.min(k, PCT.length - 1)] ?? 0
  const bars = Math.round(pct / 20)
  return (
    <a
      href={LINKS.resume}
      download="aditya-madan-resume.pdf"
      aria-label="download resume, pdf"
      onMouseEnter={start}
      onMouseLeave={stop}
      onFocus={start}
      onBlur={stop}
      className="group inline-flex items-center gap-2 text-[14px] text-ink"
    >
      <svg aria-hidden viewBox="0 0 14 18" className="h-[18px] w-[14px] shrink-0 overflow-visible transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:-rotate-6">
        <path d="M.5 .5 H9.5 L13.5 4.5 V17.5 H.5 Z" className="fill-bg stroke-ink/50" />
        <path d="M9.5 .5 V4.5 H13.5" className="fill-none stroke-ink/50" />
        <rect x="-1.5" y="10" width="11" height="5" rx="1" className="fill-accent" />
      </svg>
      <span className="inline-grid">
        <span aria-hidden className="invisible [grid-area:1/1] font-mono text-[11px]">[▓▓▓▓▓] 100%</span>
        <span className="[grid-area:1/1] self-center whitespace-pre">
          {k < 0 ? (
            'resume.pdf'
          ) : k < 13 ? (
            <span className="font-mono text-[11px]">[<span className="text-accent">{'▓'.repeat(bars)}</span><span className="text-mute">{'░'.repeat(5 - bars)}</span>] {String(pct).padStart(3, ' ')}%</span>
          ) : (
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-accent">ready ↓</span>
          )}
        </span>
      </span>
    </a>
  )
}

function Github() {
  return (
    <a href={LINKS.github} target="_blank" rel="noreferrer" className="group inline-flex items-center gap-1 text-[14px] text-ink" aria-label="github, opens in a new tab">
      <DecryptedText text="github" animateOn="hover" sequential speed={45} characters="01<>/{}#_" encryptedClassName="text-accent" />
      <span aria-hidden className="inline-block text-mute transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent">↗</span>
    </a>
  )
}

/* ───────────── printout ───────────── */

const holes = (side: 'left' | 'right') =>
  `radial-gradient(circle 4px at ${side === 'left' ? '12px' : 'calc(100% - 12px)'} 11px, #0000 95%, #000)`

function Printout({ active, children }: { active: boolean; children?: ReactNode }) {
  const [cols, setCols] = useState(0)
  const [printed] = useState(() => istTime(new Date(), false))
  return (
    <div className="group/print relative">
      {/* shadow lives on a wrapper so it follows the punched tractor-feed holes */}
      <div className="drop-shadow-[0_12px_16px_rgb(0_0_0/0.12)]">
        <div
          className="relative bg-card px-[34px] pb-3 pt-3"
          style={{ maskImage: `${holes('left')}, ${holes('right')}`, maskSize: '100% 22px', maskRepeat: 'repeat-y', maskComposite: 'intersect' }}
        >
          <div aria-hidden className="pointer-events-none absolute inset-y-0 left-6 border-l border-dashed border-ink/15" />
          <div aria-hidden className="pointer-events-none absolute inset-y-0 right-6 border-r border-dashed border-ink/15" />
          {/* single header line; on hover it turns into the how-to */}
          <div className="relative grid font-mono text-[10px] uppercase tracking-[0.12em] text-mute">
            <span className="[grid-area:1/1] transition-opacity duration-300 group-hover/print:opacity-0">
              portrait.txt · {cols || '...'} cols · IST {printed}
            </span>
            <span aria-hidden className="[grid-area:1/1] text-accent opacity-0 transition-opacity duration-300 group-hover/print:opacity-100">
              click: charset · hold: the real me
            </span>
          </div>
          <AsciiPortrait src={asset('me/face.jpg')} scattered={!active} onCols={setCols} className="mt-2" />
        </div>
      </div>
      {children}
    </div>
  )
}

/* ───────────── hero zone ───────────── */

export default function Hero() {
  const flow = useFlow()
  const active = useZoneActive('hero')
  const rm = reducedMotion()
  // VariableProximity treats the mouse as (0,0) of its container until it moves; use <body> so that point is far away
  const bodyRef = useRef<HTMLElement>(document.body)

  // ✈ that takes off from "airplanes". SplitText clones the word's span, so React
  // handlers on it never fire: delegate from the wrapper and find the word by attribute.
  const [planes, setPlanes] = useState<{ id: number; x: number; y: number }[]>([])
  const lastLaunch = useRef(0)
  const overWord = useRef(false)
  const launch = (e: ReactMouseEvent<HTMLElement>, force = false) => {
    const word = (e.target as Element).closest('[data-plane]')
    const entering = !!word && !overWord.current
    overWord.current = !!word
    if (!word || !(entering || force)) return
    const t = performance.now()
    if (rm || t - lastLaunch.current < 450) return
    lastLaunch.current = t
    const r = word.getBoundingClientRect()
    setPlanes(p => [...p.slice(-3), { id: t, x: r.right, y: r.top + r.height / 2 }])
  }

  return (
    <Zone id="hero">
      <style>{`
        .vp-h1 > span > span:nth-last-child(2) > span:last-child { color: var(--accent); }
        .hi-plane { left: 0; opacity: 0; transform: translateX(-14px); }
        .group:hover .hi-plane { animation: hi-glide 1.15s cubic-bezier(.5,0,.4,1) forwards; }
        @keyframes hi-glide {
          0% { left: 0; transform: translateX(-14px); opacity: 0; }
          18%, 82% { opacity: 1; }
          100% { left: 100%; transform: translateX(4px) translateY(-2px); opacity: 0; }
        }
      `}</style>

      {/* DOM order is the stacked mobile order */}
      <Obj x={600} y={150} w={380} z={2} label="h1 / hello">
        <div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-mute">
            <DecryptedText
              text="N 28.61° E 77.21°"
              animateOn="hover"
              sequential
              speed={38}
              characters="0123456789.°NESW"
              encryptedClassName="text-accent"
              parentClassName="select-none transition-colors hover:text-ink"
              title="new delhi"
            />
            <span aria-hidden>·</span>
            <Clock />
          </div>
          <Selectable name="" className="mt-4 w-fit">
            <h1 className="vp-h1 text-[clamp(34px,9vw,48px)] font-normal leading-[1.05] tracking-tight text-ink">
              {/* VariableProximity runs a rAF loop and restyles letters on every mousemove, so only mount it while parked here */}
              {active ? (
                <VariableProximity
                  label="Hi, I'm Aditya."
                  fromFontVariationSettings="'wght' 400"
                  toFontVariationSettings="'wght' 800"
                  containerRef={bodyRef}
                  radius={110}
                  falloff="linear"
                  style={{ fontFamily: 'Geist, sans-serif' }}
                />
              ) : (
                <>Hi, I&apos;m Aditya<span className="text-accent">.</span></>
              )}
            </h1>
          </Selectable>
          <div onMouseOver={e => launch(e)} onClick={e => launch(e, true)}>
            <ScrambledText className="mt-5 max-w-[34ch] text-[17px] leading-[1.5] text-ink" radius={70} duration={0.9} speed={0.6} scrambleChars=".:/">
              {/* SplitText makes every char inline-block, so words need their own nowrap box or they break mid-word */}
              {'I build things, obsess over details, and occasionally get distracted by'.split(' ').map((w, i) => (
                <Fragment key={i}><span className="inline-block whitespace-nowrap">{w}</span>{' '}</Fragment>
              ))}
              <span className="inline-block whitespace-nowrap">
                <span data-plane className="cursor-pointer border-b border-dashed border-accent/70">airplanes</span>.
              </span>
            </ScrambledText>
          </div>
          <p className="mt-3 max-w-[38ch] text-[15px] text-mute">A developer and designer who likes turning ideas into things people can actually use.</p>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
            <SayHi />
            <Resume />
            <Github />
          </div>
        </div>
      </Obj>

      <Obj x={140} y={56} w={400} r={-1.5} z={1} label="portrait.txt">
        <Printout active={active}>
          {/* the one intentional overlap */}
          <Sticker kind="name" width={flow ? 118 : 140} rotate={-8} className={flow ? '-bottom-7 -right-2' : '-bottom-10 -right-16'} />
        </Printout>
      </Obj>

      <Obj x={820} y={560} w={170} r={-3} boardOnly>
        <div className="pointer-events-none flex items-center gap-1">
          <Note className="text-[21px]">scroll to fly</Note>
          <svg aria-hidden viewBox="0 0 60 24" className="h-5 w-12 overflow-visible text-accent">
            <path d="M2 14 C 18 4, 36 22, 54 10 M46 6 L55 10 L48 17" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </Obj>

      {createPortal(
        planes.map(p => (
          <motion.span
            key={p.id}
            aria-hidden
            className="pointer-events-none fixed z-[70] text-[16px] leading-none text-accent"
            style={{ left: p.x, top: p.y - 9 }}
            initial={{ x: -6, y: 0, rotate: 0, opacity: 0 }}
            animate={{ x: window.innerWidth - p.x + 60, y: -90, rotate: -16, opacity: 1 }}
            transition={{
              x: { duration: 1.6, ease: [0.45, 0, 0.8, 0.4] },
              y: { duration: 1.6, ease: [0.75, 0, 0.9, 0.55] },
              rotate: { duration: 1.6, ease: [0.75, 0, 0.9, 0.55] },
              opacity: { duration: 0.15 },
            }}
            onAnimationComplete={() => setPlanes(ps => ps.filter(q => q.id !== p.id))}
          >
            ✈
          </motion.span>
        )),
        document.body,
      )}
    </Zone>
  )
}
