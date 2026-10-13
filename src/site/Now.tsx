import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import SplitFlapText from '@/components/SplitFlapText'
import DecryptedText from '@/components/DecryptedText'
import { Obj, Zone, useZoneActive } from './Board'
import { Label, istTime, reducedMotion, useFinePointer, useMedia } from './ui'
import { sfx } from './sound'

const ROWS = [
  { code: 'AM101', to: 'GO + WEB', status: 'IN PROGRESS', alt: 'ON TIME' },
  { code: 'AM202', to: 'SOFTWARE ENG', status: 'BOARDING', alt: 'GATE OPEN' },
  { code: 'AM303', to: 'NEW PROBLEMS', status: 'SEARCHING', alt: 'ALWAYS' },
  { code: 'AM404', to: 'VINNOVATEIT', status: 'LEADING', alt: 'VICE CHAIR' },
  { code: 'AM505', to: 'THE SKY', status: 'LOOKING UP', alt: 'DAILY' },
]

// the board is always dark, so these are fixed on purpose
const PAPER = '#f3f1ea'
const AMBER = '#ffb800'
const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 +'
const PLANE = '✈︎'

/** SplitFlapText has no flip callback, so tick the flap sound on our own clock while a flip runs. */
const flapSound = (from: number, to: number) => {
  const ids: ReturnType<typeof setTimeout>[] = []
  for (let t = from; t < to; t += 50) ids.push(setTimeout(() => sfx('flap'), t))
  return () => ids.forEach(clearTimeout)
}

/* ---------- departure board ---------- */

function Row({ r, i, live, fs, gap, fine }: { r: (typeof ROWS)[number]; i: number; live: boolean; fs: number; gap: number; fine: boolean }) {
  const [on, setOn] = useState(false)
  const [n, setN] = useState(0)
  const since = useRef(0)
  // left before the hover flip even started: just settle back, no flip
  const [quick, setQuick] = useState(false)
  const flip = (v: boolean) => {
    if (v === on || !live) return
    const q = !v && Date.now() - since.current < 420
    if (v) since.current = Date.now()
    if (!q) flapSound(400, 1200)
    setQuick(q)
    setOn(v)
    setN(k => k + 1)
  }

  const flap = {
    charset: CHARSET,
    loop: false,
    fontSize: fs,
    tileColor: '#1d1d1b',
    tileRadius: 2,
    flipDuration: 0.08,
    stagger: 0.035,
    flipsPerChar: 5,
    // the component sets --split-flap-gap but never uses it, so the gap goes on the flex container
    style: { fontFamily: "'Geist Mono', ui-monospace, monospace", fontWeight: 500, gap },
  }
  const status = !live ? [''] : n === 0 ? ['', r.status] : on ? [r.status, r.alt] : quick ? [r.status] : [r.alt, r.status]

  return (
    <li
      tabIndex={0}
      aria-label={`Flight ${r.code} to ${r.to}, ${on ? r.alt : r.status}`}
      className={`relative -mx-3.5 grid grid-cols-[44px_1fr_auto] items-center gap-2.5 border-t border-white/[0.07] px-3.5 py-2 outline-none transition-colors duration-300 md:-mx-5 md:grid-cols-[76px_1fr_auto] md:gap-4 md:px-5 ${on ? 'bg-white/[0.035]' : ''}`}
      onMouseEnter={fine ? () => flip(true) : undefined}
      onMouseLeave={fine ? () => flip(false) : undefined}
      onFocus={fine ? () => flip(true) : undefined}
      onBlur={fine ? () => flip(false) : undefined}
      onClick={fine ? undefined : () => flip(!on)}
    >
      <span
        aria-hidden
        className={`absolute bottom-1.5 left-0 top-1.5 w-[2px] bg-accent transition-[translate,opacity] duration-300 ease-[cubic-bezier(.2,.9,.3,1)] ${on ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0'}`}
      />
      <span aria-hidden className="text-[10px] tracking-[0.08em] md:text-[12px]" style={{ color: on ? PAPER : `${PAPER}99` }}>
        {on && !reducedMotion() ? (
          <DecryptedText key={n} text={r.code} animateOn="view" sequential speed={45} characters="ABCDEFGHJKLMNPQRSTUVWXYZ0123456789" encryptedClassName="text-[#ffb800]" />
        ) : (
          r.code
        )}
      </span>
      <SplitFlapText aria-hidden words={live ? ['', r.to] : ['']} cycleDelay={450 + i * 160} padTo={12} textColor={PAPER} {...flap} />
      <SplitFlapText
        aria-hidden
        key={`st-${n}`}
        words={status}
        cycleDelay={n ? 400 : 900 + i * 160}
        padTo={11}
        textColor={r.status === 'BOARDING' ? 'var(--accent)' : AMBER}
        {...flap}
      />
    </li>
  )
}

/** Own component so only this text re-renders each second, and only while the zone is in view. */
function Clock({ on }: { on: boolean }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    if (!on) return
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [on])
  return <span className="tabular-nums opacity-70">{istTime(now)} IST</span>
}

function Departures({ visit, active }: { visit: number; active: boolean }) {
  const md = useMedia('(min-width: 768px)')
  const fine = useFinePointer()
  useEffect(() => (visit ? flapSound(450, 2400) : undefined), [visit])
  const fs = md ? 15 : 11
  const gap = md ? 2 : 1.5

  return (
    <div className="relative overflow-hidden rounded-md bg-[#121211] px-3.5 pb-3 pt-4 font-mono ring-1 ring-ink/10 md:px-5 md:pb-4" style={{ color: PAPER }}>
      <div className="flex items-center justify-between pb-3 text-[11px] md:text-[12px]">
        <span className="tracking-[0.22em]">DEPARTURES</span>
        <Clock on={active} />
      </div>
      <div className="grid grid-cols-[44px_1fr_auto] gap-2.5 pb-1.5 text-[10px] uppercase tracking-[0.14em] opacity-45 md:grid-cols-[76px_1fr_auto] md:gap-4">
        <span>Flight</span>
        <span>To</span>
        {/* match the status flap width so the header lines up */}
        <span style={{ width: 11 * 0.78 * fs + 10 * gap }}>Status</span>
      </div>
      <ul>
        {ROWS.map((r, i) => (
          // remount per visit so every arrival flips the board in again
          <Row key={`${r.code}-${visit}`} r={r} i={i} live={visit > 0} fs={fs} gap={gap} fine={fine} />
        ))}
      </ul>
      {/* one crt layer: scanlines with a soft top glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'repeating-linear-gradient(0deg, rgb(255 255 255 / 0.025) 0 1px, transparent 1px 3px), radial-gradient(120% 70% at 50% 0%, rgb(255 255 255 / 0.05), transparent 65%)',
        }}
      />
    </div>
  )
}

/* ---------- notam strip ---------- */

const PARTS: (string | [string])[] = ['Working with ', ['Go and web technologies'], ', going deeper into ', ['software engineering'], '.']

function Notam({ seen }: { seen: boolean }) {
  const fine = useFinePointer()
  const [n, setN] = useState(0)
  const fly = () => !reducedMotion() && setN(v => v + 1)
  let k = 0
  return (
    <div className="drop-shadow-[0_8px_12px_rgb(0_0_0/0.1)]">
      <div className="notam border border-ink/15 bg-bg px-5 pb-6 pt-8 font-mono text-[14px] leading-[1.6]">
        <p className="text-[10px] uppercase tracking-[0.16em] text-mute">notam a0110/26</p>
        <p className="mt-1.5 text-mute">
          {PARTS.map((p, i) =>
            typeof p === 'string' ? (
              <span key={i}>{p}</span>
            ) : (
              <span
                key={i}
                className={`bg-[linear-gradient(var(--accent),var(--accent))] bg-no-repeat transition-[color,background-size] duration-700 ease-[cubic-bezier(.6,0,.3,1)] [background-position:0_100%] ${
                  seen ? 'text-ink [background-size:100%_1px]' : '[background-size:0%_1px]'
                }`}
                style={{ transitionDelay: `${600 + k++ * 450}ms` }}
              >
                {p[0]}
              </span>
            ),
          )}
        </p>
        {/* hover (or tap) sends a plane across with a dotted contrail */}
        <p className="relative select-none pt-3 text-ink" onMouseEnter={fine ? fly : undefined} onClick={fine ? undefined : fly}>
          {n > 0 && (
            <span key={n} aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-3">
              <motion.span
                className="absolute left-0 top-1/2 w-full origin-left border-t border-dotted border-mute"
                initial={{ scaleX: 0, opacity: 1 }}
                animate={{ scaleX: 1, opacity: [1, 1, 0] }}
                transition={{ scaleX: { duration: 1.6, ease: [0.45, 0, 0.55, 1] }, opacity: { duration: 2.6, times: [0, 0.6, 1] } }}
              />
              <motion.span
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 font-sans text-[13px] leading-none text-accent"
                initial={{ left: '0%', opacity: 1 }}
                animate={{ left: '100%', opacity: [1, 1, 0] }}
                transition={{ duration: 1.6, ease: [0.45, 0, 0.55, 1] }}
              >
                {PLANE}
              </motion.span>
            </span>
          )}
          Always looking up at passing aircraft.
        </p>
      </div>
    </div>
  )
}

/* ---------- achievement ---------- */

const PLEATS = Array.from({ length: 56 }, (_, i) => {
  const a = (i / 56) * Math.PI * 2
  const r = i % 2 ? 33 : 40
  return `${(55 + r * Math.sin(a)).toFixed(1)},${(64 - r * Math.cos(a)).toFixed(1)}`
}).join(' ')

function Rosette() {
  const swing = reducedMotion() ? undefined : { rotate: [0, 11, -8, 5, -2.5, 1, 0], transition: { duration: 1.6, ease: 'easeOut' as const } }
  return (
    <div className="relative mx-auto h-[150px] w-[84px] shrink-0">
      <motion.div className="absolute inset-0 origin-[50%_5px]" whileHover={swing} whileTap={swing}>
        <svg viewBox="0 0 110 196" className="h-full w-full overflow-visible" role="img" aria-label="Second place rosette">
          <line x1="55" y1="6" x2="55" y2="26" stroke="var(--ink)" strokeWidth="1" />
          <path d="M40 82 L54 82 L49 186 L41 177 L32 183 Z" fill="var(--accent)" />
          <path d="M56 82 L70 82 L78 183 L69 177 L61 186 Z" fill="var(--ink)" />
          <polygon points={PLEATS} fill="var(--card)" stroke="var(--ink)" strokeWidth="1" strokeLinejoin="round" />
          <circle cx="55" cy="64" r="26" fill="var(--accent)" />
          <text x="55" y="70" textAnchor="middle" fill="var(--bg)" style={{ font: "500 16px 'Geist Mono', monospace", letterSpacing: '0.04em' }}>
            2ND
          </text>
        </svg>
      </motion.div>
      {/* the pin stays put while the ribbon swings */}
      <span aria-hidden className="absolute left-1/2 top-0 size-2.5 -translate-x-1/2 rounded-full bg-ink" />
    </div>
  )
}

function Medal() {
  const [flip, setFlip] = useState(false)
  const face = 'absolute inset-0 flex flex-col justify-center border border-ink/20 bg-bg px-4 [backface-visibility:hidden]'
  return (
    <button
      type="button"
      aria-pressed={flip}
      aria-label={flip ? 'What won it. Click to flip back' : 'Hexathon Designathon 2025, 2nd place. Click for details'}
      onClick={() => {
        setFlip(f => !f)
        sfx('pop')
      }}
      className="group relative block h-[100px] w-full text-left [perspective:900px]"
    >
      <motion.span
        className="relative block h-full w-full [transform-style:preserve-3d]"
        animate={{ rotateY: flip ? 180 : 0 }}
        transition={reducedMotion() ? { duration: 0 } : { type: 'spring', stiffness: 150, damping: 17 }}
      >
        <span className={face}>
          <span aria-hidden className="absolute right-3 top-2 text-[13px] text-mute opacity-0 transition-[opacity,rotate] duration-500 group-hover:rotate-180 group-hover:opacity-100">
            ↻
          </span>
          <span className="text-[15px] font-medium leading-tight text-ink">Hexathon Designathon 2025</span>
          <span className="mt-1 text-[13.5px] leading-snug text-mute">
            <span className="text-accent">2nd place</span>, Google Developer Groups VIT
          </span>
        </span>
        <span className={`${face} [transform:rotateY(180deg)]`}>
          <span className="text-[14px] leading-snug text-ink">A graph-based way to settle group expenses in the fewest payments.</span>
        </span>
      </motion.span>
    </button>
  )
}

/* ---------- zone ---------- */

export default function Now() {
  const active = useZoneActive('now')
  const [visit, setVisit] = useState(0)
  useEffect(() => {
    if (active) setVisit(v => v + 1)
  }, [active])

  return (
    <Zone id="now">
      <style>{`.notam { --z: 6px; mask: conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) 50% / calc(2 * var(--z)) 100%; }`}</style>

      <Obj x={0} y={40} w={400}>
        <Label n="04">currently</Label>
      </Obj>

      <Obj x={0} y={100} w={540} z={2} label="departures">
        <Departures visit={visit} active={active} />
      </Obj>

      {/* the one overlap: the notam prints out from under the board */}
      <Obj x={36} y={362} w={468} r={-1.5} z={1}>
        <Notam seen={visit > 0} />
      </Obj>

      <Obj x={690} y={150} w={290} label="achievements">
        <div className="flex flex-col items-center gap-3">
          <Rosette />
          <Medal />
        </div>
      </Obj>
    </Zone>
  )
}
