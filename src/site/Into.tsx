import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import VariableProximity from '@/components/VariableProximity'
import { Obj, Zone, useZoneActive } from './Board'
import { sfx } from './sound'
import { cssVar, Label, reducedMotion, useFinePointer, useTheme } from './ui'

type Art = { hot: boolean; on: boolean }

/* ───────────── 01 terminal ───────────── */

type Frame = [screen: string, ms: number]

function script(cmd: string, out: string[], typeMs: number, outMs: number): Frame[] {
  const f: Frame[] = []
  for (let i = 0; i <= cmd.length; i++) f.push([`$ ${cmd.slice(0, i)}`, i === cmd.length ? 400 : typeMs * (0.6 + Math.random())])
  let s = `$ ${cmd}`
  for (const l of out) f.push([(s += `\n${l}`), outMs])
  f.push([`${s}\n$ `, 2200])
  return f
}

function Terminal({ hot, on }: Art) {
  const frames = useMemo(
    () =>
      hot ? script('go test ./...', [' ', 'tests running...', 'expectations high...'], 24, 380) : script('go test ./...', [' ', 'tests running...', 'expectations high...'], 70, 900),
    [hot],
  )
  // at rest (zone asleep) the card shows its finished run, so a still frame never reads as an empty prompt
  const [i, setI] = useState(() => frames.length - 1)
  useEffect(() => setI(reducedMotion() || !on ? frames.length - 1 : 0), [frames, on])
  useEffect(() => {
    if (!on || reducedMotion()) return
    const id = setTimeout(() => setI(v => (v + 1) % frames.length), frames[i]?.[1] ?? 0)
    return () => clearTimeout(id)
  }, [i, on, frames])

  const lines = (frames[i] ?? frames[0])[0].split('\n')
  return (
    <div className="h-full px-3 py-2.5">
      {lines.map((l, k) => (
        <div key={k} className="whitespace-pre">
          {l.startsWith('$ ') ? <><span className="font-medium text-ink">$</span>{l.slice(1)}</> : <span className={l.startsWith('ok') || l === 'PASS' ? 'text-ink' : 'text-mute'}>{l}</span>}
          {k === lines.length - 1 && <span className="blink">█</span>}
        </div>
      ))}
    </div>
  )
}

/* ───────────── 02 figma window ───────────── */

const W = 28
const row = (s = '') => `│${s.padEnd(W - 2)}│`
const FIG = [
  `┌─ untitled.fig ${'─'.repeat(W - 17)}┐`,
  row(' F frame  P pen  T text'),
  `├${'─'.repeat(W - 2)}┤`,
  ...Array.from({ length: 6 }, () => row()),
  `└${'─'.repeat(W - 2)}┘`,
].join('\n')

// cursor [col, row], button pressed?, ms to hold
const FIG_STEPS: [number, number, boolean, number][] = [
  [23, 8.2, false, 700],
  [17, 5.45, false, 1000],
  [17, 5.45, true, 1500],
  [23, 3.6, true, 900],
  [23, 3.6, false, 500],
]

function Figma({ hot, on }: Art) {
  const [s, setS] = useState(() => (reducedMotion() ? 2 : 0))
  const k = hot ? 0.45 : 1
  useEffect(() => {
    if (!on || reducedMotion()) return
    const id = setTimeout(() => setS(v => (v + 1) % FIG_STEPS.length), FIG_STEPS[s][3] * k)
    return () => clearTimeout(id)
  }, [s, on, k])
  const [c, r, pressed] = FIG_STEPS[s]
  const at = (col: number, rw: number) => ({ left: `${col}ch`, top: `${rw * 1.25}em` })
  return (
    <div className="flex h-full items-center justify-center">
      <pre className="relative m-0 font-mono text-mute">
        {FIG}
        <span
          className={`absolute whitespace-pre transition-[color,background-color,translate] duration-300 ${pressed ? 'bg-ink text-bg' : 'text-ink'} ${hot ? 'translate-x-[2px]' : ''}`}
          style={at(9, 5)}
        >
          [ button ]
          {pressed && (
            <>
              <span className="pointer-events-none absolute -inset-[3px] border border-sel" />
              <span className="absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-sm bg-sel px-1 text-[10px] leading-[1.4] text-white">
                80 × 24
              </span>
            </>
          )}
        </span>
        <span
          className="absolute text-ink"
          style={{
            ...at(c, r),
            transition: `left ${0.9 * k}s cubic-bezier(.6,0,.25,1), top ${0.9 * k}s cubic-bezier(.6,0,.25,1), transform .12s`,
            transform: pressed && s === 2 ? 'scale(.8)' : 'none',
          }}
        >
          ↖<span className="absolute left-[1.1ch] top-[1em] rounded-sm bg-sel px-1 text-[10px] leading-[1.4] text-white">you</span>
        </span>
      </pre>
    </div>
  )
}

/* ───────────── 03 radar ───────────── */

const TAU = Math.PI * 2
// playful traffic, not a live feed. x/y in scope radii, h = heading (0 = north)
const TRAFFIC = [
  { call: 'AM101', fl: 'FL350', x: -0.55, y: -0.25, h: 1.2 },
  { call: 'AM202', fl: 'FL280', x: 0.4, y: -0.45, h: 3.9 },
  { call: 'AM303', fl: 'FL120', x: 0.3, y: 0.5, h: 5.2 },
  { call: 'AM404', fl: 'FL390', x: -0.25, y: 0.55, h: 0.4 },
]

/** 2D radar scope: sweep, range rings, aircraft that light up when the sweep passes. */
function Scope({ hot, on }: Art) {
  const ref = useRef<HTMLCanvasElement>(null)
  const hotRef = useRef(hot)
  hotRef.current = hot
  const [theme] = useTheme()
  useEffect(() => {
    const cv = ref.current!
    const g = cv.getContext('2d')!
    const dpr = Math.min(2, devicePixelRatio || 1)
    const Wd = cv.clientWidth
    const Hd = cv.clientHeight
    cv.width = Wd * dpr
    cv.height = Hd * dpr
    g.scale(dpr, dpr)
    const ink = cssVar('--ink')
    const acc = cssVar('--accent')
    const cx = Wd / 2
    const cy = Hd / 2
    const R = Hd / 2 - 8
    const still = reducedMotion()
    const planes = TRAFFIC.map(p => ({ ...p, lit: still ? 0 : 9, trail: [] as [number, number][] }))
    let a = -Math.PI / 2

    const plane = (p: (typeof planes)[number]) => {
      const glow = Math.exp(-p.lit / 2.4)
      const px = cx + p.x * R
      const py = cy + p.y * R
      g.fillStyle = ink
      p.trail.forEach(([tx, ty], i) => {
        g.globalAlpha = 0.28 * (1 - i / 4)
        g.fillRect(cx + tx * R - 1, cy + ty * R - 1, 2, 2)
      })
      g.globalAlpha = 0.25 + 0.75 * glow
      g.save()
      g.translate(px, py)
      g.rotate(p.h)
      g.beginPath()
      g.moveTo(0, -5); g.lineTo(0, 5) // fuselage
      g.moveTo(-5, 0.5); g.lineTo(0, -1.5); g.lineTo(5, 0.5) // wings
      g.moveTo(-2, 4.5); g.lineTo(0, 3.5); g.lineTo(2, 4.5) // tail
      g.strokeStyle = ink
      g.lineWidth = 1.3
      g.stroke()
      g.restore()
      // data block with a short leader
      g.globalAlpha = 0.2 + 0.8 * glow
      g.lineWidth = 0.8
      g.beginPath(); g.moveTo(px + 5, py - 5); g.lineTo(px + 10, py - 10); g.stroke()
      g.font = '10px "Geist Mono", ui-monospace, monospace'
      g.fillText(p.call, px + 12, py - 12)
      g.globalAlpha = 0.12 + 0.5 * glow
      g.fillText(p.fl, px + 12, py - 1)
    }

    const draw = () => {
      g.clearRect(0, 0, Wd, Hd)
      g.globalAlpha = 0.14
      g.strokeStyle = ink
      g.lineWidth = 1
      for (const k of [1 / 3, 2 / 3, 1]) {
        g.beginPath()
        g.arc(cx, cy, R * k, 0, TAU)
        g.stroke()
      }
      g.beginPath()
      g.moveTo(cx - R, cy); g.lineTo(cx + R, cy)
      g.moveTo(cx, cy - R); g.lineTo(cx, cy + R)
      g.stroke()
      g.fillStyle = acc
      for (let i = 0; i < 26; i++) {
        g.globalAlpha = 0.2 * (1 - i / 26)
        g.beginPath()
        g.moveTo(cx, cy)
        g.arc(cx, cy, R, a - (i + 1) * 0.03, a - i * 0.03)
        g.closePath()
        g.fill()
      }
      g.globalAlpha = 0.9
      g.strokeStyle = acc
      g.lineWidth = 1.5
      g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); g.stroke()
      planes.forEach(plane)
      g.globalAlpha = 1
    }

    draw()
    if (!on || still) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const k = hotRef.current ? 2.6 : 1
      const prev = a
      const step = dt * 0.85 * k
      a = (a + step) % TAU
      for (const p of planes) {
        p.lit += dt
        p.x += Math.sin(p.h) * 0.012 * k * dt
        p.y -= Math.cos(p.h) * 0.012 * k * dt
        if (Math.hypot(p.x, p.y) > 0.9) {
          p.x *= -0.95
          p.y *= -0.95
          p.trail = []
        }
        const bearing = Math.atan2(p.y, p.x)
        if ((((bearing - prev) % TAU) + TAU) % TAU <= step) {
          p.lit = 0
          p.trail.unshift([p.x, p.y])
          p.trail.length = Math.min(p.trail.length, 4)
        }
      }
      draw()
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [on, theme])
  return <canvas ref={ref} className="block size-full" />
}

/* ───────────── 04 passport stamp ───────────── */

/** A passport page with one stamp. Hover presses it again. */
function Stamp({ hot }: Art) {
  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden bg-[repeating-linear-gradient(135deg,transparent_0_7px,var(--line)_7px_8px)]">
      <svg
        viewBox="0 0 180 104"
        className={`w-[170px] text-ink/75 ${hot && !reducedMotion() ? 'stamp-press' : ''}`}
        style={{ rotate: '-7deg' }}
      >
        <rect x="3" y="3" width="174" height="98" rx="12" fill="none" stroke="currentColor" strokeWidth="2.4" />
        <rect x="10" y="10" width="160" height="84" rx="7" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
        <text x="90" y="62" textAnchor="middle" fill="currentColor" className="font-mono" fontSize="30" fontWeight="600" letterSpacing="6">JAPAN</text>
        <path d="M70 80 h40 M84 76 l6 4 l-6 4 M66 26 h48" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  )
}

/* ───────────── notes ───────────── */

type NoteData = { title: string; body: string[]; reveal: string; Art: (p: Art) => ReactNode; x: number; y: number; r: number }

const NOTES: NoteData[] = [
  {
    title: 'making things work',
    body: [
      'I like learning how things work by getting my hands dirty. Sometimes I build something useful. Sometimes I spend an unreasonable amount of time figuring out why something that should work absolutely refuses to cooperate.',
      "I'm interested in the details behind the result, not just getting something to run once and declaring victory.",
    ],
    reveal: 'it passed. I checked twice.',
    Art: Terminal,
    x: 0, y: 150, r: -1.2,
  },
  {
    title: 'one pixel off',
    body: [
      'I care about how things look, but also about how they feel to use. A beautiful interface that makes a simple task unnecessarily difficult is still a bad experience.',
      'I can spend far too long thinking about spacing, interactions, or whether something feels right. The difference between "good enough" and "exactly right" is sometimes a few pixels and sometimes a complete lack of perspective.',
      'I am still working on knowing when to stop.',
    ],
    reveal: "moved it 2px. you're welcome.",
    Art: Figma,
    x: 308, y: 162, r: 0.8,
  },
  {
    title: 'look up',
    body: [
      "I'm an AvGeek. Aircraft overhead have a habit of interrupting whatever I'm doing.",
      "One minute I'm going about my day. The next I'm trying to work out what is flying past, where it might be going, or what else I can find out about it.",
      "I'm interested in the aircraft themselves, but also the wider world behind a flight: weather, operations, systems, and the coordination that makes it all happen.",
      "There is a perfectly reasonable explanation for this. I just don't always have time to give it.",
    ],
    reveal: 'yes, I looked up again.',
    Art: Scope,
    x: 616, y: 146, r: -0.6,
  },
  {
    title: 'somewhere else',
    body: [
      'I like travelling because it lets me experience a place rather than just read about it.',
      'Japan made a particularly strong impression on me. I loved seeing another culture up close and noticing how technology, everyday life, and public systems fit together.',
      'I like coming back from somewhere with more than photographs. New observations, new questions, and a camera roll that will eventually need organising.',
      'Eventually.',
    ],
    reveal: 'camera roll: a future problem.',
    Art: Stamp,
    x: 924, y: 158, r: 1.1,
  },
]

function Pin() {
  return (
    <svg aria-hidden viewBox="0 0 24 30" className="pin absolute -top-3 left-1/2 z-10 h-[30px] w-6 -translate-x-1/2 overflow-visible">
      <ellipse cx="14" cy="27" rx="5" ry="1.6" className="fill-ink/20" />
      <path d="M12 14 L 13.5 26" strokeWidth="1.4" strokeLinecap="round" className="stroke-mute" />
      <circle cx="12" cy="9" r="7.5" className="fill-ink" />
      <circle cx="9.5" cy="6.5" r="2.2" className="fill-paper" opacity=".5" />
    </svg>
  )
}

/** Unfolds between 0 and full height without measuring. */
const fold = (open: boolean) => `grid transition-[grid-template-rows,margin,opacity] duration-500 ease-[cubic-bezier(.2,.9,.3,1)] ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`

/**
 * One pinned note. The static outer div is the hover target; only the inner card lifts.
 * Focus (click) brings it forward, folds the art away and unfolds the rest of the copy.
 */
function PinnedNote({ n, focused, onFocus, on }: { n: number; focused: boolean; onFocus: () => void; on: boolean }) {
  const { title, body, reveal, Art } = NOTES[n]
  const fine = useFinePointer()
  const [hover, setHover] = useState(false)
  const [artHover, setArtHover] = useState(false)
  const hot = hover || focused
  return (
    // the whole note is clickable for the mouse; the title is the real button for keyboard and screen readers
    <div
      onMouseEnter={fine ? () => setHover(true) : undefined}
      onMouseLeave={fine ? () => setHover(false) : undefined}
      onClick={onFocus}
      className="group/pin block cursor-pointer"
    >
      <div
        className={`relative origin-top border border-ink/[0.06] bg-paper p-5 pt-6 transition-[translate,scale,box-shadow] duration-300 ease-[cubic-bezier(.2,.9,.3,1.2)] ${
          focused ? '-translate-y-12 scale-[1.05] shadow-lift' : hot ? '-translate-y-1.5 shadow-lift' : 'shadow-obj'
        }`}
      >
        <Pin />
        <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.14em] text-mute">
          <span className={`transition-colors ${hot ? 'text-ink' : ''}`}>0{n + 1} / 04</span>
        </div>
        <div className={`${fold(!focused)} ${focused ? 'mt-0' : 'mt-3'}`}>
          <div className="min-h-0 overflow-hidden">
            <div
              aria-hidden
              onMouseEnter={() => setArtHover(true)}
              onMouseLeave={() => setArtHover(false)}
              className="relative h-[140px] overflow-hidden border border-ink/10 bg-bg/50 font-mono text-[11px] leading-[1.25] text-ink"
            >
              <Art hot={hot} on={on && !focused} />
              {Art === Scope && (
                <span
                  className={`absolute inset-x-0 top-0 bg-paper/90 px-2.5 py-1 font-mono text-[11px] text-ink transition-[opacity,translate] duration-300 ${
                    artHover ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
                  }`}
                >
                  conversation paused. aircraft overhead.
                </span>
              )}
            </div>
          </div>
        </div>
        <h3 className="mt-4 text-[22px] font-medium leading-tight tracking-tight text-ink">
          <button type="button" aria-expanded={focused} onClick={e => { e.stopPropagation(); onFocus() }} className="text-left">
            {title}
          </button>
        </h3>
        <p className="mt-1.5 text-[15px] leading-[1.6] text-mute">{body[0]}</p>
        <div className={fold(focused)}>
          <div className="min-h-0 overflow-hidden">
            {body.slice(1).map(p => (
              <p key={p} className="mt-3 text-[15px] leading-[1.6] text-mute">{p}</p>
            ))}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 font-mono text-[11px] text-mute">
          <span className={`transition-[opacity,translate] duration-300 ${hot ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'}`}>{reveal}</span>
          <span aria-hidden className={`transition-[opacity,rotate] duration-300 ${focused ? 'rotate-180 opacity-100' : 'opacity-0 group-hover/pin:opacity-100'}`}>↓</span>
        </div>
      </div>
    </div>
  )
}

function Interstitial() {
  const [open, setOpen] = useState(false)
  return (
    <p className="text-[15px] leading-[1.6] text-mute">
      Other recurring interests include Punjabi music, particularly Karan Aujla, and conversations that were supposed to take ten minutes.{' '}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="group/m inline-flex min-h-[24px] items-center gap-1 whitespace-nowrap font-mono text-[13px] text-ink underline decoration-ink/30 underline-offset-4 transition-colors hover:decoration-ink"
      >
        a little music detour
        <span aria-hidden className="inline-block transition-transform duration-300 group-hover/m:-rotate-12 group-hover/m:scale-110">♪</span>
      </button>
      {open && <span className="ml-2 animate-[fade-in_.4s_ease] text-ink">currently accepting Punjabi music recommendations, despite having Karan Aujla on repeat.</span>}
    </p>
  )
}

export default function Into() {
  const on = useZoneActive('into')
  const [focus, setFocus] = useState<number | null>(null)
  const head = useRef<HTMLDivElement>(null)
  return (
    <Zone id="into">
      <style>{`
        @keyframes pin-wobble { 0%,100% { rotate: 0deg } 25% { rotate: -14deg } 55% { rotate: 10deg } 80% { rotate: -4deg } }
        .group\\/pin:hover .pin { animation: pin-wobble .55s ease-in-out; transform-origin: 50% 90%; }
        @keyframes stamp-press { 0% { scale: 1 } 35% { scale: 1.18; opacity: .4 } 70% { scale: .96; opacity: 1 } 100% { scale: 1 } }
        .stamp-press { animation: stamp-press .5s cubic-bezier(.3,.7,.3,1) }
        @keyframes fade-in { from { opacity: 0 } }
      `}</style>

      <Obj x={0} y={0} w={900}>
        <div ref={head}>
          <Label n="02">interests</Label>
          <h2 className="mt-2 text-[32px] font-medium leading-tight tracking-tight text-ink">
            <VariableProximity
              label="Things that occupy my brain rent-free."
              containerRef={head}
              fromFontVariationSettings="'wght' 480"
              toFontVariationSettings="'wght' 780"
              radius={120}
              falloff="gaussian"
              style={{ fontFamily: 'inherit' }}
            />
          </h2>
          <p className="mt-1.5 text-[15px] text-mute">Some are serious interests. Some are hobbies. Some started with one question and have since become a minor research project.</p>
          <p className="text-[15px] text-mute">No particular order. My brain does not have a very good filing system.</p>
        </div>
      </Obj>

      {NOTES.map(({ x, y, r }, i) => (
        <Obj key={i} x={x} y={y} w={276} r={r} z={focus === i ? 30 : 1}>
          <PinnedNote
            n={i}
            on={on}
            focused={focus === i}
            onFocus={() => {
              if (focus !== i) sfx('pop')
              setFocus(f => (f === i ? null : i))
            }}
          />
        </Obj>
      ))}

      <Obj x={0} y={650} w={1200}>
        <Interstitial />
      </Obj>
    </Zone>
  )
}
