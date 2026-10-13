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
      hot
        ? script('go test ./...', ['ok  api/handlers  0.21s', 'ok  api/store     0.09s', 'PASS'], 22, 260)
        : script('go run ./cmd/api', ['listening on :8080', 'GET /health 200 0.8ms'], 70, 650),
    [hot],
  )
  const [i, setI] = useState(() => (reducedMotion() ? frames.length - 1 : 0))
  useEffect(() => setI(reducedMotion() ? frames.length - 1 : 0), [frames])
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
        <span className={`absolute whitespace-pre transition-colors duration-150 ${pressed ? 'bg-ink text-bg' : 'text-ink'}`} style={at(9, 5)}>
          {hot ? '[ ship it ]' : '[ button ]'}
          {pressed && (
            <>
              <span className="pointer-events-none absolute -inset-[3px] border border-sel" />
              <span className="absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-sm bg-sel px-1 text-[10px] leading-[1.4] text-white">
                {hot ? '88' : '80'} × 24
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

/* ───────────── 04 venn ───────────── */

const VW = 32
const VH = 9 // grid rows; two label rows go under it
const ASPECT = 2.05 // char cell is ~2x taller than wide
const R = 7.5

function vennFrame(d: number) {
  const cy = (VH - 1) / 2
  const c1 = VW / 2 - d
  const c2 = VW / 2 + d
  const in1 = (x: number, y: number) => Math.hypot(x - c1, (y - cy) * ASPECT) < R
  const in2 = (x: number, y: number) => Math.hypot(x - c2, (y - cy) * ASPECT) < R
  const edge = (f: typeof in1, x: number, y: number) => f(x, y) && !(f(x - 1, y) && f(x + 1, y) && f(x, y - 1) && f(x, y + 1))
  let out = ''
  for (let y = 0; y < VH; y++) {
    for (let x = 0; x < VW; x++) {
      const a = in1(x, y)
      const b = in2(x, y)
      if (a && b && x === VW / 2 && y === cy) out += '<b>✦</b>'
      else if (edge(in1, x, y) || edge(in2, x, y)) out += '*'
      else if (a && b) out += '<i>░</i>'
      else if (a || b) out += (x + y) % 3 ? ' ' : '.'
      else out += ' '
    }
    out += '\n'
  }
  const center = (s: string) => ' '.repeat(Math.max(0, Math.round((VW - s.length) / 2))) + s
  if (d < 2.4) return out + center('design + engineering') + '\n' + `<b>${center('= something useful')}</b>`
  const lbl = (s: string, cx: number) => Math.max(0, Math.round(cx - s.length / 2))
  const a = lbl('design', c1)
  const b = Math.max(a + 7, lbl('engineering', c2))
  return out + `${' '.repeat(a)}design${' '.repeat(b - a - 6)}engineering\n `
}

function Venn({ hot, on }: Art) {
  const ref = useRef<HTMLPreElement>(null)
  const hotRef = useRef(hot)
  hotRef.current = hot
  useEffect(() => {
    const el = ref.current!
    let d = 5
    el.innerHTML = vennFrame(d)
    if (!on || reducedMotion()) return
    let t = 0
    let raf = 0
    let last = 0
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      if (now - last < 33) return // ~30fps is plenty for ascii
      t += (now - (last || now)) / 1000
      last = now
      const goal = hotRef.current ? 0 : 4.8 + 3.6 * Math.sin(t * 0.7)
      d += (goal - d) * (hotRef.current ? 0.14 : 0.08)
      el.innerHTML = vennFrame(d)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [on])
  return (
    <div className="flex h-full items-center justify-center">
      <pre ref={ref} className="m-0 font-mono text-mute [&_b]:font-medium [&_b]:text-ink [&_i]:not-italic [&_i]:text-ink/40" />
    </div>
  )
}

/* ───────────── notes ───────────── */

type NoteData = { title: string; body: string[]; status: string; Art: (p: Art) => ReactNode; x: number; y: number; r: number }

const NOTES: NoteData[] = [
  {
    title: 'Software and building',
    body: [
      'I like the moment when something that existed only in my head finally runs on my machine. These days, that means working across web technologies and Go, getting deeper into backend engineering, and understanding what happens beyond the happy path.',
      "I care about more than getting something to work once. I want to know why it works, what happens when it doesn't, and how to make it dependable.",
    ],
    status: 'testing',
    Art: Terminal,
    x: 0, y: 140, r: -1.2,
  },
  {
    title: 'UI/UX and product',
    body: [
      'A product can be technically impressive and still be frustrating to use. That gap interests me.',
      "I enjoy working through flows, questioning unnecessary steps, and getting the little details right. Good design isn't decoration added after the engineering. It's part of how the thing works.",
    ],
    status: 'shipping',
    Art: Figma,
    x: 308, y: 152, r: 0.8,
  },
  {
    title: 'Aviation and aircraft',
    body: [
      "I'm an AvGeek. The kind who notices aircraft overhead, wants to know what's flying, and can end up reading about engines, flight operations, or aviation weather long after intending to do something else.",
      "I love that aviation combines engineering, precision, weather, human judgement, and an enormous amount of coordination. There's so much happening behind a flight that most passengers never have to think about.",
      'Naturally, I ended up building software around it.',
    ],
    status: 'squawking',
    Art: Scope,
    x: 616, y: 136, r: -0.6,
  },
  {
    title: 'Where things overlap',
    body: [
      'My favourite problems tend to sit between disciplines. Design meets engineering. Software meets the real world. An interest turns into an idea, and an idea turns into a project.',
      "I'm interested in the space where understanding a problem matters just as much as knowing how to implement the solution.",
    ],
    status: 'merged',
    Art: Venn,
    x: 924, y: 148, r: 1.1,
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
  const { title, body, status, Art } = NOTES[n]
  const fine = useFinePointer()
  const [hover, setHover] = useState(false)
  const hot = hover || focused
  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={focused}
      aria-label={title}
      onMouseEnter={fine ? () => setHover(true) : undefined}
      onMouseLeave={fine ? () => setHover(false) : undefined}
      onClick={onFocus}
      onKeyDown={e => {
        if (e.key !== 'Enter' && e.key !== ' ') return
        e.preventDefault()
        onFocus()
      }}
      className="group/pin block cursor-pointer outline-none"
    >
      <div
        className={`relative origin-top border border-ink/[0.06] bg-paper p-5 pt-6 transition-[translate,scale,box-shadow] duration-300 ease-[cubic-bezier(.2,.9,.3,1.2)] ${
          focused ? '-translate-y-12 scale-[1.05] shadow-lift' : hot ? '-translate-y-1.5 shadow-lift' : 'shadow-obj'
        }`}
      >
        <Pin />
        <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.14em] text-mute">
          <span className={`transition-colors ${hot ? 'text-ink' : ''}`}>0{n + 1} / 04</span>
          <span className={`transition-opacity duration-300 ${hot ? 'opacity-100' : 'opacity-0'}`}>{status}</span>
        </div>
        <div className={`${fold(!focused)} ${focused ? 'mt-0' : 'mt-3'}`}>
          <div className="min-h-0 overflow-hidden">
            <div aria-hidden className="relative h-[170px] overflow-hidden border border-ink/10 bg-bg/50 font-mono text-[12px] leading-[1.25] text-ink">
              <Art hot={hot} on={on && !focused} />
            </div>
          </div>
        </div>
        <h3 className="mt-4 text-[22px] font-medium leading-tight tracking-tight text-ink">{title}</h3>
        <p className="mt-1.5 text-[15px] leading-[1.6] text-mute">{body[0]}</p>
        <div className={fold(focused)}>
          <div className="min-h-0 overflow-hidden">
            {body.slice(1).map(p => (
              <p key={p} className="mt-3 text-[15px] leading-[1.6] text-mute">{p}</p>
            ))}
          </div>
        </div>
        <span className={`mt-3 block font-mono text-[11px] uppercase tracking-[0.12em] text-mute transition-opacity duration-300 ${focused ? 'opacity-100' : 'opacity-0 group-hover/pin:opacity-100'}`}>
          {focused ? 'fold ↑' : 'read more ↓'}
        </span>
      </div>
    </div>
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
      `}</style>

      <Obj x={0} y={0} w={640}>
        <div ref={head}>
          <Label n="02">things i'm into</Label>
          <h2 className="mt-2 text-[32px] font-medium leading-tight tracking-tight text-ink">
            <VariableProximity
              label="A few things that have my attention."
              containerRef={head}
              fromFontVariationSettings="'wght' 480"
              toFontVariationSettings="'wght' 780"
              radius={120}
              falloff="gaussian"
              style={{ fontFamily: 'inherit' }}
            />
          </h2>
          <p className="mt-1.5 max-w-[60ch] text-[15px] text-mute">Some interests turn into projects. Some stay rabbit holes. Some somehow become both.</p>
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
    </Zone>
  )
}
