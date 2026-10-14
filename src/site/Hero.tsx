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
      className="group inline-flex items-center gap-1.5 text-[13px] text-mute transition-colors hover:text-ink"
    >
      <svg aria-hidden viewBox="0 0 14 18" className="h-[15px] w-[12px] shrink-0 overflow-visible transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:-rotate-6">
        <path d="M.5 .5 H9.5 L13.5 4.5 V17.5 H.5 Z" className="fill-bg stroke-ink/50" />
        <path d="M9.5 .5 V4.5 H13.5" className="fill-none stroke-ink/50" />
        <rect x="-1.5" y="10" width="11" height="5" rx="1" className="fill-mute transition-[fill] duration-300 group-hover:fill-ink" />
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
    <a
      href={LINKS.github}
      target="_blank"
      rel="noreferrer"
      className="relative inline-flex text-[14px] text-ink after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-ink after:transition-transform after:duration-300 hover:after:scale-x-100"
      aria-label="github, opens in a new tab"
    >
      <DecryptedText text="github" animateOn="hover" sequential speed={45} characters="01<>/{}#_" encryptedClassName="text-mute" />
    </a>
  )
}

/* ───────────── printout ───────────── */

// tractor-feed holes, painted in the board colour so they read as punched through
const holes = (side: 'left' | 'right') =>
  `radial-gradient(circle 4px at ${side === 'left' ? '12px' : 'calc(100% - 12px)'} 11px, var(--bg) 3.4px, color-mix(in oklab, var(--ink) 14%, transparent) 4px, transparent 4.6px)`

function Printout({ active, children }: { active: boolean; children?: ReactNode }) {
  const flow = useFlow()
  return (
    <div className="relative">
      <div
        className="relative border border-ink/[0.06] bg-paper px-[36px] pb-3 pt-3 shadow-obj"
        style={{ backgroundImage: `${holes('left')}, ${holes('right')}`, backgroundSize: '100% 22px', backgroundRepeat: 'repeat-y' }}
      >
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-6 border-l border-dashed border-ink/15" />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-6 border-r border-dashed border-ink/15" />
        <p className="relative font-mono text-[11px] uppercase tracking-[0.1em] text-mute">SUBJECT: ADITYA</p>
        <div className="relative mt-2">
          <AsciiPortrait src={asset('me/face.jpg')} scattered={!active} />
          {/* rubber stamp: thumps down once each time the camera parks here */}
          <motion.span
            className={`pointer-events-none absolute ${flow ? "top-1" : "-top-8"} right-1 rotate-[5deg] rounded-[3px] border-2 border-double border-ink/55 bg-paper/85 px-2 py-1 font-mono text-[11px] font-medium uppercase leading-none tracking-[0.14em] text-ink/55`}
            initial={false}
            animate={active && !reducedMotion() ? { scale: [1.6, 0.94, 1], opacity: [0, 1, 1] } : { scale: 1, opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.6, times: [0, 0.7, 1], ease: 'easeOut' }}
          >
            GENERALLY OPERATIONAL
          </motion.span>
          <Note className="pointer-events-none absolute bottom-10 left-0 max-w-[150px] rotate-[-4deg] leading-[1.05]">photogenic under controlled conditions</Note>
        </div>
      </div>
      {children}
    </div>
  )
}

/* ───────────── small metadata labels ───────────── */

function Labels() {
  const meta = 'group/l relative flex w-fit items-baseline gap-2 font-mono text-[11px] lowercase leading-5 text-mute'
  return (
    <ul className="space-y-1.5">
      {/* currently: a caret keeps thinking */}
      <li className={meta}>
        <span>currently:</span>
        <span className="text-ink">figuring it out<span aria-hidden className="ml-px opacity-0 group-hover/l:animate-[blink_1s_steps(1)_infinite] group-hover/l:opacity-100">_</span></span>
      </li>
      {/* operating status: the status light flickers like a loose wire */}
      <li className={meta}>
        <span aria-hidden className="relative top-[-1px] size-1.5 self-center rounded-full bg-ink/50 group-hover/l:animate-[flicker_0.9s_steps(1)_1]" />
        <span>operating status:</span>
        <span className="text-ink">mostly functional</span>
      </li>
      {/* open tabs: easter egg 01 */}
      <li className={meta}>
        <span>open tabs:</span>
        <span className="text-ink">classified</span>
        <span className="pointer-events-none absolute left-0 top-full mt-1 whitespace-nowrap normal-case text-mute opacity-0 transition-all duration-300 [translate:0_-3px] group-hover/l:opacity-100 group-hover/l:[translate:0_0]">
          no, I don&apos;t remember opening all of these either.
        </span>
      </li>
    </ul>
  )
}

/** Easter egg 02: a print registration mark that's been nudged into place. */
function RegMark() {
  return (
    <span className="group/reg relative inline-block">
      <svg viewBox="0 0 16 16" aria-hidden className="size-4 text-ink/30 transition-transform duration-500 ease-[steps(2)] group-hover/reg:translate-x-[4px]">
        <circle cx="8" cy="8" r="4.5" fill="none" stroke="currentColor" strokeWidth="1" />
        <path d="M8 0 V16 M0 8 H16" stroke="currentColor" strokeWidth="1" />
      </svg>
      <span className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[11px] text-mute opacity-0 transition-opacity duration-300 group-hover/reg:opacity-100">
        this was moved 2px. twice.
      </span>
    </span>
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
        @keyframes flicker { 0%, 30%, 55% { opacity: 1; } 15%, 45% { opacity: 0.1; } }
        .hi-plane { left: 0; opacity: 0; transform: translateX(-14px); }
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
          <div className="flex items-center gap-2.5 whitespace-nowrap font-mono text-[11px] uppercase text-mute [&>*]:shrink-0">
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
          <div className="mt-4 max-w-[60ch] space-y-3 text-[15px] leading-[1.6] text-mute">
            <p>I&apos;m a student at VIT Vellore, originally from Delhi. I like figuring things out, making things look right, travelling somewhere new, and occasionally spending an embarrassing amount of time researching something that started as a passing thought.</p>
            <p>Some days that means building something on my laptop. Other days it means sitting around with friends, going nowhere in particular, and somehow making an entire evening out of it.</p>
            <p className="text-ink">Either way, I&apos;m probably thinking about something.</p>
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
            <SayHi />
            <Github />
            <Resume />
          </div>
        </div>
      </Obj>

      <Obj x={24} y={64} w={460} r={-1.5} z={1} label="portrait.txt">
        <Printout active={active}>
          {/* the one intentional overlap */}
          <Sticker kind="name" width={flow ? 118 : 150} rotate={-8} className={flow ? '-bottom-7 -right-2' : '-bottom-12 -right-16'} />
        </Printout>
      </Obj>

      <Obj x={848} y={506} w={330} z={2}>
        <Labels />
      </Obj>

      <Obj x={540} y={596} w={160} z={2}>
        <p className="group/look inline-flex items-center gap-1.5 font-mono text-[11px] text-mute">
          look around
          <span aria-hidden className="inline-block transition-transform duration-300 group-hover/look:translate-y-1">↓</span>
        </p>
      </Obj>

      <Obj x={500} y={44} w={16} boardOnly>
        <RegMark />
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
