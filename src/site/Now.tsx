import { useEffect, useState, type CSSProperties } from 'react'
import { motion } from 'motion/react'
import SplitFlapText from '@/components/SplitFlapText'
import DecryptedText from '@/components/DecryptedText'
import { Obj, Zone, useFlow, useZoneActive } from './Board'
import { Label, istTime, reducedMotion, useFinePointer, useMedia } from './ui'
import { sfx } from './sound'

const ROWS = [
  { code: 'AM101', to: 'GO + SOFTWARE', status: 'IN PROGRESS', detail: 'learning, building, breaking, repeating' },
  { code: 'AM202', to: 'NEW THINGS TO LEARN', status: 'BOARDING', detail: "the list of things I don't know remains ambitious" },
  { code: 'AM303', to: 'INTERESTING PROBLEMS', status: 'ALWAYS', detail: 'the interesting part is usually figuring out the actual problem' },
  { code: 'AM404', to: 'VINNOVATEIT', status: 'VICE CHAIR', detail: 'one of the many things happening at VIT' },
  { code: 'AM505', to: 'THE SKY', status: 'LOOKING UP', detail: 'aircraft overhead remain a valid interruption' },
]
const TO_W = 20
const ST_W = 11

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

type Size = { fs: number; gap: number; cols: string; pad: string; code: string; flight: boolean }

function Row({ r, i, live, s, fine, on, pick }: { r: (typeof ROWS)[number]; i: number; live: boolean; s: Size; fine: boolean; on: boolean; pick: (v: boolean) => void }) {
  const [n, setN] = useState(0)
  const enter = () => {
    if (!live) return
    pick(true)
    setN(k => k + 1)
  }
  const flap = {
    charset: CHARSET,
    loop: false,
    fontSize: s.fs,
    tileColor: '#1d1d1b',
    tileRadius: 2,
    flipDuration: 0.08,
    stagger: 0.018,
    flipsPerChar: 4,
    // the component sets --split-flap-gap but never uses it, so the gap goes on the flex container
    style: { fontFamily: "'Geist Mono', ui-monospace, monospace", fontWeight: 500, gap: s.gap },
  }

  return (
    <li
      tabIndex={0}
      aria-label={`Flight ${r.code} to ${r.to}, ${r.status}. ${r.detail}`}
      className={`relative grid items-center border-t border-white/[0.07] outline-none transition-colors duration-300 ${s.cols} ${s.pad} ${on ? 'bg-white/[0.035]' : ''}`}
      onMouseEnter={fine ? enter : undefined}
      onMouseLeave={fine ? () => pick(false) : undefined}
      onFocus={enter}
      onClick={fine ? undefined : enter}
    >
      <span
        aria-hidden
        className={`absolute bottom-2 left-0 top-2 w-[2px] bg-accent transition-[translate,opacity] duration-300 ease-[cubic-bezier(.2,.9,.3,1)] ${on ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0'}`}
      />
      {s.flight && (
        <span aria-hidden className={`tracking-[0.08em] ${s.code}`} style={{ color: on ? PAPER : `${PAPER}99` }}>
          {on && n > 0 && !still() ? (
            <DecryptedText key={n} text={r.code} animateOn="view" sequential speed={45} characters="ABCDEFGHJKLMNPQRSTUVWXYZ0123456789" encryptedClassName="text-[#ffb800]" />
          ) : (
            r.code
          )}
        </span>
      )}
      <SplitFlapText aria-hidden words={live ? ['', r.to] : ['']} cycleDelay={450 + i * 160} padTo={TO_W} textColor={PAPER} {...flap} />
      <SplitFlapText
        aria-hidden
        words={live ? ['', r.status] : ['']}
        cycleDelay={1000 + i * 160}
        padTo={ST_W}
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
  const [hot, setHot] = useState<number | null>(null)
  const [shown, setShown] = useState(0)
  useEffect(() => (visit ? flapSound(450, 2600) : undefined), [visit])
  // 20-character destinations: on a phone the flight column goes, so the flaps stay readable
  const s: Size = !flow
    ? { fs: 19, gap: 2.5, cols: 'grid-cols-[100px_1fr_auto] gap-6', pad: '-mx-8 px-8 py-4', code: 'text-[15px]', flight: true }
    : md
      ? { fs: 14, gap: 2, cols: 'grid-cols-[72px_1fr_auto] gap-4', pad: '-mx-5 px-5 py-2.5', code: 'text-[12px]', flight: true }
      : { fs: 11.5, gap: 1, cols: 'grid-cols-[1fr_auto] gap-2', pad: '-mx-3.5 px-3.5 py-2', code: '', flight: false }
  const live = visit > 0
  const d = ROWS[shown]

  return (
    <div
      className={`relative overflow-hidden rounded-[6px] bg-[#121211] font-mono shadow-obj ${!flow ? 'px-8 pb-6 pt-7' : md ? 'px-5 pb-4 pt-4' : 'px-3.5 pb-3 pt-4'}`}
      style={{ color: PAPER }}
    >
      <div className={`flex items-center justify-between pb-4 ${!flow ? 'text-[15px]' : 'text-[11px]'}`}>
        <span className="flex items-center gap-2.5 tracking-[0.24em]">
          <span style={{ color: AMBER }}>{PLANE}</span>DEPARTURES
        </span>
        <Clock on={active} />
      </div>
      <div className={`grid pb-2 text-[11px] uppercase opacity-45 ${s.cols} ${s.fs > 12 ? 'tracking-[0.14em]' : 'tracking-[0.06em]'}`}>
        {s.flight && <span>Flight</span>}
        <span>To</span>
        {/* match the status flap width so the header lines up */}
        <span style={{ width: ST_W * 0.78 * s.fs + (ST_W - 1) * s.gap }}>Status</span>
      </div>
      <ul onMouseLeave={() => setHot(null)}>
        {ROWS.map((r, i) => (
          // remount per visit so every arrival flips the board in again
          <Row
            key={`${r.code}-${visit}`}
            r={r}
            i={i}
            live={live}
            s={s}
            fine={fine}
            on={hot === i}
            pick={v => {
              setHot(v ? i : null)
              if (v) setShown(i)
            }}
          />
        ))}
      </ul>
      {/* hover details: one slim strip that follows whichever row you're on */}
      <div aria-live="polite" className={`border-t border-white/[0.07] pt-3 ${!flow ? 'text-[13px]' : 'text-[11px]'}`}>
        {live && (
          <motion.p
            key={shown}
            className={flow ? '' : 'truncate'}
            initial={still() ? false : { clipPath: 'inset(0 100% 0 0)' }}
            animate={{ clipPath: 'inset(0 0% 0 0)' }}
            transition={{ duration: Math.min(0.9, d.detail.length * 0.014), ease: 'linear' }}
          >
            <span style={{ color: AMBER }}>{d.code}</span>
            <span className="opacity-40"> · </span>
            <span className="opacity-80">{d.detail}</span>
          </motion.p>
        )}
      </div>
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

// punched tractor-feed holes, filled with the board colour so they read as holes
const HOLES: CSSProperties = { backgroundImage: 'radial-gradient(circle, var(--bg) 0 3.5px, transparent 4px)', backgroundSize: '20px 22px' }

function Notam({ seen }: { seen: boolean }) {
  const fine = useFinePointer()
  const [n, setN] = useState(0)
  const fly = () => !still() && setN(v => v + 1)
  // once the highlight has run, drop its delay so a theme switch recolours instantly
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    if (!seen) return
    const t = setTimeout(() => setSettled(true), 1800)
    return () => clearTimeout(t)
  }, [seen])
  return (
    <div className="relative rounded-[2px] bg-paper px-12 pb-8 pt-7 font-mono text-ink shadow-obj">
      <span aria-hidden className="absolute inset-y-0 left-0 w-5 border-r border-dashed border-ink/10" style={HOLES} />
      <span aria-hidden className="absolute inset-y-0 right-0 w-5 border-l border-dashed border-ink/10" style={HOLES} />

      <p className="text-[11px] uppercase tracking-[0.14em] text-mute">NOTAM A0110/26</p>
      <h3 className="mt-2 text-[17px] font-medium leading-snug text-ink">A note from the cockpit</h3>

      <div className="mt-4 flex flex-col gap-3 border-t border-dashed border-ink/15 pt-4 text-[15px] leading-[1.6] text-ink/70">
        <p>
          Currently{' '}
          <span
            className={`bg-[linear-gradient(var(--ink),var(--ink))] bg-no-repeat transition-[color,background-size] duration-700 ease-[cubic-bezier(.6,0,.3,1)] [background-position:0_100%] ${
              seen ? 'text-ink [background-size:100%_1px]' : '[background-size:0%_1px]'
            }`}
            style={{ transitionDelay: settled ? '0ms' : '600ms' }}
          >
            learning, building, exploring
          </span>
          , and trying to convince myself that I am making enough progress.
        </p>
        <p>Some days feel productive. Other days I open my laptop, discover twelve things I don't know, and somehow make the list longer.</p>
        {/* hover (or tap) sends a plane across with a dotted contrail */}
        <p className="relative select-none pt-5 text-ink" onMouseEnter={fine ? fly : undefined} onClick={fine ? undefined : fly}>
          {n > 0 && (
            <span key={n} aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-3">
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
          Progress continues. Confidence is operating under intermittent conditions.
        </p>
      </div>
    </div>
  )
}

/* ---------- header ---------- */

function Header({ seen }: { seen: boolean }) {
  const text = 'Current conditions.'
  return (
    <div>
      <Label n="06">currently</Label>
      <h2 className="mt-3 text-[32px] font-medium leading-tight tracking-tight text-ink" aria-label={text}>
        {[...text].map((c, i) => (
          <span key={i} aria-hidden className="inline-block overflow-hidden align-bottom">
            <motion.span
              className="inline-block whitespace-pre transition-[translate] duration-200 hover:-translate-y-1"
              initial={still() ? false : { y: '105%' }}
              animate={seen || still() ? { y: '0%' } : undefined}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.035, ease: [0.2, 0.8, 0.2, 1] }}
            >
              {c}
            </motion.span>
          </span>
        ))}
      </h2>
      <p className="mt-2 max-w-[60ch] text-[15px] leading-[1.6] text-mute">
        A snapshot of what's occupying my time lately. Subject to change without notice, occasionally without my knowledge.
      </p>
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
      <Obj x={0} y={0} w={640}>
        <Header seen={visit > 0} />
      </Obj>

      <Obj x={0} y={176} w={780} label="departures">
        <Departures visit={visit} active={active} />
      </Obj>

      {/* the notam sits just off the board, slightly turned */}
      <Obj x={804} y={156} w={396} r={1.2} z={2} label="notam">
        <Notam seen={visit > 0} />
      </Obj>
    </Zone>
  )
}
