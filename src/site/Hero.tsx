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
  const [h, m] = istTime(now, false).split(':')
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
      <span aria-hidden className="size-1.5 rounded-full bg-ink/60" />
      <span className="inline-grid overflow-hidden">
        <span aria-hidden className="invisible [grid-area:1/1]">your time 00:00</span>
        <AnimatePresence initial={false}>
          {mine
            ? face('you', <>your time {local}</>)
            : face('ist', <>IST {h}<span className="blink">:</span>{m}</>)}
        </AnimatePresence>
      </span>
    </span>
  )
}

/** "delhi ⇄ vellore": the cities trade places on hover (tap on touch). */
function Route() {
  const fine = useFinePointer()
  const [flip, setFlip] = useState(false)
  const cities = flip ? ['vellore', 'delhi'] : ['delhi', 'vellore']
  const spring = { type: 'spring', stiffness: 420, damping: 30 } as const
  return (
    <span
      className="inline-flex select-none items-center gap-1.5 transition-colors hover:text-ink"
      aria-label="delhi to vellore"
      onMouseEnter={() => fine && setFlip(true)}
      onMouseLeave={() => fine && setFlip(false)}
      onClick={() => !fine && setFlip(f => !f)}
    >
      <motion.span layout="position" key={cities[0]} transition={spring}>{cities[0]}</motion.span>
      <motion.span aria-hidden className="inline-block" animate={{ rotateX: flip ? 180 : 0 }} transition={{ duration: 0.4 }}>⇄</motion.span>
      <motion.span layout="position" key={cities[1]} transition={spring}>{cities[1]}</motion.span>
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
        <rect x="-1.5" y="10" width="11" height="5" rx="1" className="fill-ink transition-[fill] duration-300 group-hover:fill-accent" />
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

// tractor-feed holes, painted in the board colour so they read as punched through
const holes = (side: 'left' | 'right') =>
  `radial-gradient(circle 4px at ${side === 'left' ? '12px' : 'calc(100% - 12px)'} 11px, var(--bg) 3.4px, color-mix(in oklab, var(--ink) 14%, transparent) 4px, transparent 4.6px)`

function Printout({ active, children }: { active: boolean; children?: ReactNode }) {
  const [cols, setCols] = useState(0)
  const [printed] = useState(() => istTime(new Date(), false))
  return (
    <div className="group/print relative">
      <div
        className="relative border border-ink/[0.06] bg-paper px-[36px] pb-3 pt-3 shadow-obj"
        style={{ backgroundImage: `${holes('left')}, ${holes('right')}`, backgroundSize: '100% 22px', backgroundRepeat: 'repeat-y' }}
      >
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-6 border-l border-dashed border-ink/15" />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-6 border-r border-dashed border-ink/15" />
        {/* single header line; on hover it turns into the how-to */}
        <div className="relative grid font-mono text-[11px] uppercase tracking-[0.1em] text-mute">
          <span className="[grid-area:1/1] whitespace-nowrap transition-opacity duration-300 group-hover/print:opacity-0">
            portrait.txt · {cols || '...'} cols · IST {printed}
          </span>
          <span aria-hidden className="[grid-area:1/1] whitespace-nowrap text-ink opacity-0 transition-opacity duration-300 group-hover/print:opacity-100">
            click: charset · hold: the real me
          </span>
        </div>
        <AsciiPortrait src={asset('me/face.jpg')} scattered={!active} onCols={setCols} className="mt-2" />
      </div>
      {children}
    </div>
  )
}

/* ───────────── quick facts index card ───────────── */

const rowBase = 'group/row relative flex w-full items-start gap-3 overflow-hidden border-b border-line px-4 py-2.5 text-left last:border-b-0'
const rowValue = 'flex-1 font-mono text-[12px] leading-5 text-ink'

/** Mono label that rolls to something else on hover ("building" becomes "→ hangar"). */
function RowLabel({ text, alt }: { text: string; alt: ReactNode }) {
  return (
    <span className="relative inline-grid w-[72px] shrink-0 overflow-hidden font-mono text-[11px] uppercase leading-5 tracking-[0.08em] text-mute">
      <span className="[grid-area:1/1] transition-transform duration-300 group-hover/row:-translate-y-full">{text}</span>
      <span aria-hidden className="[grid-area:1/1] translate-y-full whitespace-nowrap text-ink transition-transform duration-300 group-hover/row:translate-y-0">{alt}</span>
    </span>
  )
}

function Facts() {
  return (
    <div className="border border-ink/[0.06] bg-paper shadow-obj">
      <div className="border-b-[3px] border-double border-ink/10 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-mute">quick facts</div>

      {/* studying: label becomes a year-of-course meter */}
      <div className={rowBase}>
        <RowLabel text="studying" alt={<>▓▓▓<span className="text-mute">░</span> 3/4</>} />
        <span className={rowValue}>B.Tech Computer Science, VIT Vellore (3rd year, &apos;28)</span>
      </div>

      {/* based: a tiny plane makes the trip along the row */}
      <div className={rowBase}>
        <span className="w-[72px] shrink-0 font-mono text-[11px] uppercase leading-5 tracking-[0.08em] text-mute">based</span>
        <span className={rowValue}>Vellore, from Delhi</span>
        <span aria-hidden className="facts-trip pointer-events-none absolute bottom-0.5 text-[9px] leading-none text-mute">✈</span>
      </div>

      {/* building: each project underlines in turn */}
      <button type="button" className={rowBase} onClick={() => goto('hangar')}>
        <RowLabel text="building" alt="→ hangar" />
        <span className={rowValue}>
          {['Loom', 'Flux', 'MessIT'].map((p, i) => (
            <Fragment key={p}>
              <span
                className="relative after:absolute after:inset-x-0 after:-bottom-px after:h-px after:origin-left after:scale-x-0 after:bg-ink after:transition-transform after:duration-300 after:[transition-delay:var(--d)] group-hover/row:after:scale-x-100"
                style={{ ['--d' as string]: `${i * 110}ms` }}
              >
                {p}
              </span>
              {i < 2 && ', '}
            </Fragment>
          ))}
        </span>
      </button>

      {/* also: a quiet context line unfolds */}
      <button type="button" className={rowBase} onClick={() => goto('log')}>
        <RowLabel text="also" alt="→ log" />
        <span className={rowValue}>
          VinnovateIT, vice chair
          <span className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 group-hover/row:grid-rows-[1fr]">
            <span className="overflow-hidden text-[11px] text-mute">
              a student tech club at VIT
            </span>
          </span>
        </span>
      </button>
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
        .facts-trip { right: 100%; opacity: 0; }
        .group\\/row:hover .facts-trip { animation: facts-trip 1.4s cubic-bezier(.45,0,.3,1) forwards; }
        @keyframes facts-trip { 0% { right: 100%; opacity: 0; } 15%, 85% { opacity: 1; } 100% { right: 8px; opacity: 0; } }
        .group:hover .hi-plane { animation: hi-glide 1.15s cubic-bezier(.5,0,.4,1) forwards; }
        @keyframes hi-glide {
          0% { left: 0; transform: translateX(-14px); opacity: 0; }
          18%, 82% { opacity: 1; }
          100% { left: 100%; transform: translateX(4px) translateY(-2px); opacity: 0; }
        }
      `}</style>

      {/* DOM order is the stacked mobile order */}
      <Obj x={540} y={56} w={440} z={2} label="h1 / hello">
        <div>
          <div className="flex items-center gap-2.5 whitespace-nowrap font-mono text-[11px] text-mute [&>*]:shrink-0">
            <DecryptedText
              text="N 28.61° E 77.21°"
              animateOn="hover"
              sequential
              speed={38}
              characters="0123456789.°NESW"
              encryptedClassName="text-ink"
              parentClassName="!whitespace-nowrap select-none transition-colors hover:text-ink"
              title="new delhi"
            />
            <span aria-hidden>·</span>
            <Route />
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
            <ScrambledText className="mt-5 max-w-[40ch] text-[17px] leading-[1.5] text-ink" radius={70} duration={0.9} speed={0.6} scrambleChars=".:/">
              {/* SplitText makes every char inline-block, so words need their own nowrap box or they break mid-word */}
              {['Software,', 'design,'].map((w, i) => (
                <Fragment key={i}><span className="inline-block whitespace-nowrap">{w}</span>{' '}</Fragment>
              ))}
              <span className="inline-block whitespace-nowrap">
                <span data-plane className="cursor-pointer border-b border-dashed border-ink/35">aircraft</span>,
              </span>{' '}
              {'and an unreasonable number of open tabs.'.split(' ').map((w, i) => (
                <Fragment key={i}><span className="inline-block whitespace-nowrap">{w}</span>{i < 6 && ' '}</Fragment>
              ))}
            </ScrambledText>
          </div>
          <p className="mt-4 max-w-[60ch] text-[15px] leading-[1.6] text-mute">
            I&apos;m a developer and designer who likes making things work, making them look good, and occasionally disappearing into an aviation rabbit hole. I build products, obsess over the details, and tend to learn best when I can get my hands on something and break it a little.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
            <SayHi />
            <Resume />
            <Github />
          </div>
        </div>
      </Obj>

      <Obj x={24} y={64} w={460} r={-1.5} z={1} label="portrait.txt">
        <Printout active={active}>
          {/* the one intentional overlap */}
          <Sticker kind="name" width={flow ? 118 : 150} rotate={-8} className={flow ? '-bottom-7 -right-2' : '-bottom-12 -right-16'} />
        </Printout>
      </Obj>

      <Obj x={808} y={470} w={360} r={1} z={2} label="facts.card">
        <Facts />
      </Obj>

      <Obj x={590} y={604} w={170} r={-3} boardOnly>
        <div className="pointer-events-none flex items-center gap-1">
          <Note className="text-[21px]">scroll to fly →</Note>
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
