import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { motion } from 'motion/react'
import SplitFlapText from '@/components/SplitFlapText'
import DecryptedText from '@/components/DecryptedText'
import { Obj, Zone, useFlow, useZoneActive } from './Board'
import { Label, istTime, reducedMotion, useFinePointer, useMedia } from './ui'
import { sfx } from './sound'

const ROWS = [
  { code: 'AM101', to: 'GO + WEB', status: 'BUILDING', alt: 'SHIPPED CODE' },
  { code: 'AM202', to: 'SOFTWARE ENG', status: 'DEEP DIVING', alt: 'UNDER THE HOOD' },
  { code: 'AM303', to: 'NEW PROBLEMS', status: 'BOARDING', alt: 'ALWAYS' },
  { code: 'AM404', to: 'VINNOVATEIT', status: 'LEADING', alt: 'VICE CHAIR' },
  { code: 'AM505', to: 'THE SKY', status: 'LOOKING UP', alt: 'DAILY' },
]

// the board is always dark, so these are fixed on purpose
const PAPER = '#f3f1ea'
const AMBER = '#ffb800'
const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 +'
const PLANE = '✈︎'
const still = () => reducedMotion()

/** SplitFlapText has no flip callback, so tick the flap sound on our own clock while a flip runs. */
const flapSound = (from: number, to: number) => {
  const ids: ReturnType<typeof setTimeout>[] = []
  for (let t = from; t < to; t += 50) ids.push(setTimeout(() => sfx('flap'), t))
  return () => ids.forEach(clearTimeout)
}

/* ---------- departure board ---------- */

type Size = { fs: number; gap: number; cols: string; pad: string; code: string }

function Row({ r, i, live, s, fine }: { r: (typeof ROWS)[number]; i: number; live: boolean; s: Size; fine: boolean }) {
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
    fontSize: s.fs,
    tileColor: '#1d1d1b',
    tileRadius: 2,
    flipDuration: 0.08,
    stagger: 0.035,
    flipsPerChar: 5,
    // the component sets --split-flap-gap but never uses it, so the gap goes on the flex container
    style: { fontFamily: "'Geist Mono', ui-monospace, monospace", fontWeight: 500, gap: s.gap },
  }
  const status = !live ? [''] : n === 0 ? ['', r.status] : on ? [r.status, r.alt] : quick ? [r.status] : [r.alt, r.status]

  return (
    <li
      tabIndex={0}
      aria-label={`Flight ${r.code} to ${r.to}, ${on ? r.alt : r.status}`}
      className={`relative grid items-center border-t border-white/[0.07] outline-none transition-colors duration-300 ${s.cols} ${s.pad} ${on ? 'bg-white/[0.035]' : ''}`}
      onMouseEnter={fine ? () => flip(true) : undefined}
      onMouseLeave={fine ? () => flip(false) : undefined}
      onFocus={fine ? () => flip(true) : undefined}
      onBlur={fine ? () => flip(false) : undefined}
      onClick={fine ? undefined : () => flip(!on)}
    >
      <span
        aria-hidden
        className={`absolute bottom-2 left-0 top-2 w-[2px] bg-accent transition-[translate,opacity] duration-300 ease-[cubic-bezier(.2,.9,.3,1)] ${on ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0'}`}
      />
      <span aria-hidden className={`tracking-[0.08em] ${s.code}`} style={{ color: on ? PAPER : `${PAPER}99` }}>
        {on && !still() ? (
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
        padTo={14}
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
  const flow = useFlow()
  const md = useMedia('(min-width: 768px)')
  const fine = useFinePointer()
  useEffect(() => (visit ? flapSound(450, 2400) : undefined), [visit])
  const s: Size = !flow
    ? { fs: 23, gap: 3, cols: 'grid-cols-[112px_1fr_auto] gap-6', pad: '-mx-8 px-8 py-4', code: 'text-[15px]' }
    : md
      ? { fs: 15, gap: 2, cols: 'grid-cols-[76px_1fr_auto] gap-4', pad: '-mx-5 px-5 py-2.5', code: 'text-[12px]' }
      : { fs: 10.5, gap: 1.25, cols: 'grid-cols-[48px_1fr_auto] gap-2', pad: '-mx-3.5 px-3.5 py-2', code: 'text-[10px]' }

  return (
    <div
      className={`relative overflow-hidden rounded-[6px] bg-[#121211] font-mono shadow-obj ${!flow ? 'px-8 pb-7 pt-7' : md ? 'px-5 pb-4 pt-4' : 'px-3.5 pb-3 pt-4'}`}
      style={{ color: PAPER }}
    >
      <div className={`flex items-center justify-between pb-4 ${!flow ? 'text-[15px]' : 'text-[11px]'}`}>
        <span className="flex items-center gap-2.5 tracking-[0.24em]">
          <span style={{ color: AMBER }}>{PLANE}</span>DEPARTURES
        </span>
        <Clock on={active} />
      </div>
      <div className={`grid pb-2 text-[11px] uppercase opacity-45 ${s.cols} ${s.fs > 11 ? 'tracking-[0.14em]' : 'tracking-[0.06em]'}`}>
        <span>Flight</span>
        <span>To</span>
        {/* match the status flap width so the header lines up */}
        <span style={{ width: 14 * 0.78 * s.fs + 13 * s.gap }}>Status</span>
      </div>
      <ul>
        {ROWS.map((r, i) => (
          // remount per visit so every arrival flips the board in again
          <Row key={`${r.code}-${visit}`} r={r} i={i} live={visit > 0} s={s} fine={fine} />
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

/* ---------- notam printout ---------- */

const PARTS: (string | [string])[] = [
  "I've been getting deeper into ",
  ['software engineering'],
  ', building with ',
  ['Go and web technologies'],
  ', and trying to understand ',
  ['the systems behind the interfaces'],
  '.',
]

// punched tractor-feed holes, filled with the board colour so they read as holes
const HOLES: CSSProperties = { backgroundImage: 'radial-gradient(circle, var(--bg) 0 3.5px, transparent 4px)', backgroundSize: '20px 22px' }

function Notam({ seen }: { seen: boolean }) {
  const fine = useFinePointer()
  const [n, setN] = useState(0)
  const fly = () => !still() && setN(v => v + 1)
  // once the highlights have run, drop their delays so a theme switch recolours instantly
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    if (!seen) return
    const t = setTimeout(() => setSettled(true), 2800)
    return () => clearTimeout(t)
  }, [seen])
  let k = 0
  return (
    <div className="relative rounded-[2px] bg-paper px-12 pb-8 pt-7 font-mono text-ink shadow-obj">
      <span aria-hidden className="absolute inset-y-0 left-0 w-5 border-r border-dashed border-ink/10" style={HOLES} />
      <span aria-hidden className="absolute inset-y-0 right-0 w-5 border-l border-dashed border-ink/10" style={HOLES} />

      <p className="text-[11px] uppercase tracking-[0.14em] text-mute">notam a0110/26</p>

      <p className="mt-4 border-t border-dashed border-ink/15 pt-4 text-[15px] leading-[1.6] text-ink/60">
        {PARTS.map((p, i) =>
          typeof p === 'string' ? (
            <span key={i}>{p}</span>
          ) : (
            <span
              key={i}
              className={`bg-[linear-gradient(var(--ink),var(--ink))] bg-no-repeat transition-[color,background-size] duration-700 ease-[cubic-bezier(.6,0,.3,1)] [background-position:0_100%] ${
                seen ? 'text-ink [background-size:100%_1px]' : '[background-size:0%_1px]'
              }`}
              style={{ transitionDelay: settled ? '0ms' : `${600 + k++ * 450}ms` }}
            >
              {p[0]}
            </span>
          ),
        )}
      </p>

      {/* hover (or tap) sends a plane across with a dotted contrail */}
      <p className="relative mt-3 select-none border-t border-dashed border-ink/15 pt-6 text-[15px] leading-[1.6] text-ink" onMouseEnter={fine ? fly : undefined} onClick={fine ? undefined : fly}>
        {n > 0 && (
          <span key={n} aria-hidden className="pointer-events-none absolute inset-x-0 top-2 h-3">
            <motion.span
              className="absolute left-0 top-1/2 w-full origin-left border-t border-dotted border-mute"
              initial={{ scaleX: 0, opacity: 1 }}
              animate={{ scaleX: 1, opacity: [1, 1, 0] }}
              transition={{ scaleX: { duration: 1.6, ease: [0.45, 0, 0.55, 1] }, opacity: { duration: 2.6, times: [0, 0.6, 1] } }}
            />
            <motion.span
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 font-sans text-[13px] leading-none text-ink"
              initial={{ left: '0%', opacity: 1 }}
              animate={{ left: '100%', opacity: [1, 1, 0] }}
              transition={{ duration: 1.6, ease: [0.45, 0, 0.55, 1] }}
            >
              {PLANE}
            </motion.span>
          </span>
        )}
        Outside the code editor, I'm still the same AvGeek who looks up when an aircraft passes overhead.
      </p>
    </div>
  )
}

/* ---------- header ---------- */

function Header({ seen }: { seen: boolean }) {
  const text = 'Right now'
  return (
    <div>
      <Label n="05">currently</Label>
      <h2 className="mt-3 text-[32px] font-medium leading-tight tracking-tight text-ink" aria-label={text}>
        {[...text].map((c, i) => (
          <span key={i} aria-hidden className="inline-block overflow-hidden align-bottom">
            <motion.span
              className="inline-block whitespace-pre transition-[translate] duration-200 hover:-translate-y-1"
              initial={still() ? false : { y: '105%' }}
              animate={seen || still() ? { y: '0%' } : undefined}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.04, ease: [0.2, 0.8, 0.2, 1] }}
            >
              {c}
            </motion.span>
          </span>
        ))}
      </h2>
    </div>
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
      <Obj x={0} y={0} w={460}>
        <Header seen={visit > 0} />
      </Obj>

      <Obj x={0} y={140} w={780} label="departures">
        <Departures visit={visit} active={active} />
      </Obj>

      {/* the one overlap: the notam is tucked over the board's edge */}
      <Obj x={756} y={180} w={424} r={1.2} z={2} label="notam">
        <Notam seen={visit > 0} />
      </Obj>

    </Zone>
  )
}
