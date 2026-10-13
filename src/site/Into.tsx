import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Radar from '@/components/Radar'
import VariableProximity from '@/components/VariableProximity'
import { Obj, Zone, useZoneActive } from './Board'
import { sfx } from './sound'
import { cssVar, Label, reducedMotion, useFinePointer, useTheme } from './ui'

const PAPER = 'bg-[color-mix(in_srgb,var(--bg),white_55%)] [[data-theme=dark]_&]:bg-card'

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
          {l.startsWith('$ ') ? <><span className="text-accent">$</span>{l.slice(1)}</> : <span className={l.startsWith('ok') || l === 'PASS' ? 'text-ink' : 'text-mute'}>{l}</span>}
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
  ...Array.from({ length: 4 }, () => row()),
  `└${'─'.repeat(W - 2)}┘`,
].join('\n')

// cursor [col, row], button pressed?, ms to hold
const FIG_STEPS: [number, number, boolean, number][] = [
  [23, 6.2, false, 700],
  [17, 4.45, false, 1000],
  [17, 4.45, true, 1500],
  [23, 3.2, true, 900],
  [23, 3.2, false, 500],
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
        <span className={`absolute whitespace-pre transition-colors duration-150 ${pressed ? 'bg-ink text-bg' : 'text-ink'}`} style={at(9, 4)}>
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
          ↖<span className="absolute left-[1.1ch] top-[1em] rounded-sm bg-accent px-1 text-[10px] leading-[1.4] text-white">you</span>
        </span>
      </pre>
    </div>
  )
}

/* ───────────── 03 radar ───────────── */

function Scope({ hot, on }: Art) {
  const [theme] = useTheme()
  const accent = useMemo(() => cssVar('--accent') || '#ff4f00', [theme])
  return (
    <Radar
      mode="sweep"
      color={accent}
      lightMode={theme === 'light'}
      paused={!on}
      speed={hot ? 2.6 : 0.9}
      targets={4}
      ringCount={4}
      spokeCount={8}
      clutter={0.2}
      grain={0}
      scale={0.96}
    />
  )
}

/* ───────────── 04 venn ───────────── */

const VW = 30
const VH = 8
const ASPECT = 2.05 // char cell is ~2x taller than wide
const R = 6.5

function vennFrame(d: number) {
  const cy = (VH - 2) / 2
  const c1 = VW / 2 - d
  const c2 = VW / 2 + d
  const in1 = (x: number, y: number) => Math.hypot(x - c1, (y - cy) * ASPECT) < R
  const in2 = (x: number, y: number) => Math.hypot(x - c2, (y - cy) * ASPECT) < R
  const edge = (f: typeof in1, x: number, y: number) => f(x, y) && !(f(x - 1, y) && f(x + 1, y) && f(x, y - 1) && f(x, y + 1))
  let out = ''
  for (let y = 0; y < VH - 1; y++) {
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
  const lbl = (s: string, cx: number) => Math.max(0, Math.round(cx - s.length / 2))
  const a = lbl('design', c1)
  const b = Math.max(a + 7, lbl('engineering', c2))
  return out + `${' '.repeat(a)}design${' '.repeat(b - a - 6)}engineering`
}

function Venn({ hot, on }: Art) {
  const ref = useRef<HTMLPreElement>(null)
  const hotRef = useRef(hot)
  hotRef.current = hot
  useEffect(() => {
    const el = ref.current!
    let d = 4.5
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
      const goal = hotRef.current ? 0 : 4 + 3.4 * Math.sin(t * 0.8)
      d += (goal - d) * (hotRef.current ? 0.14 : 0.08)
      el.innerHTML = vennFrame(d)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [on])
  return (
    <div className="flex h-full items-center justify-center">
      <pre ref={ref} className="m-0 font-mono text-mute [&_b]:font-normal [&_b]:text-accent [&_i]:not-italic [&_i]:text-accent/70" />
    </div>
  )
}

/* ───────────── notes ───────────── */

const NOTES: { title: string; body: string; status: string; Art: (p: Art) => ReactNode; x: number; y: number; r: number }[] = [
  { title: 'Software & building', body: 'Web and Go, and how things work under the hood.', status: 'testing', Art: Terminal, x: 0, y: 244, r: -1.2 },
  { title: 'UI/UX & product', body: 'The experience behind the interface, down to the details.', status: 'shipping', Art: Figma, x: 268, y: 256, r: 0.8 },
  { title: 'Aviation & aircraft', body: 'Aircraft, engines, flight ops and aviation weather.', status: 'squawking', Art: Scope, x: 536, y: 240, r: -0.6 },
  { title: 'The intersection', body: 'Aviation meets software. Design meets engineering.', status: 'merged', Art: Venn, x: 804, y: 252, r: 1.1 },
]

function Pin() {
  return (
    <svg aria-hidden viewBox="0 0 24 30" className="pin absolute -top-3 left-1/2 z-10 h-[30px] w-6 -translate-x-1/2 overflow-visible">
      <ellipse cx="14" cy="27" rx="5" ry="1.6" className="fill-ink/20" />
      <path d="M12 14 L 13.5 26" strokeWidth="1.4" strokeLinecap="round" className="stroke-mute" />
      <circle cx="12" cy="9" r="7.5" className="fill-accent" />
      <circle cx="9.5" cy="6.5" r="2.2" fill="white" opacity=".55" />
    </svg>
  )
}

/** One pinned note. The static outer div is the hover target; only the inner card lifts and scales. */
function PinnedNote({ n, focused, onFocus, on }: { n: number; focused: boolean; onFocus: () => void; on: boolean }) {
  const { title, body, status, Art } = NOTES[n]
  const fine = useFinePointer()
  const [hover, setHover] = useState(false)
  const hot = hover || focused
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={focused}
      aria-label={`${title}: ${body}`}
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
        className={`relative border border-line p-4 pt-5 transition-[translate,scale,filter] duration-300 ease-[cubic-bezier(.2,.9,.3,1.2)] ${PAPER} ${
          focused ? 'scale-[1.06] drop-shadow-[0_24px_28px_rgb(0_0_0/0.26)]' : 'drop-shadow-[0_8px_12px_rgb(0_0_0/0.10)]'
        } ${hot ? '-translate-y-1.5' : ''}`}
      >
        <Pin />
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-mute">
          <span className={`transition-colors ${hot ? 'text-accent' : ''}`}>0{n + 1} / 04</span>
          <span className={`transition-opacity duration-300 ${hot ? 'opacity-100' : 'opacity-0'}`}>{status}</span>
        </div>
        <div aria-hidden className="relative mt-3 h-[120px] overflow-hidden border border-line bg-bg/60 font-mono text-[11px] leading-[1.25] text-ink">
          <Art hot={hot} on={on} />
        </div>
        <h3 className="mt-3.5 text-[16px] font-medium leading-snug tracking-tight text-ink">{title}</h3>
        <p className="mt-1 text-[15px] leading-[1.45] text-mute">{body}</p>
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

      <Obj x={0} y={128} w={240}>
        <div ref={head}>
          <Label n="02">things i'm into</Label>
          <h2 className="mt-2 text-[24px] font-medium leading-[1.25] tracking-tight text-ink">
            <VariableProximity
              label="Things I'm into"
              containerRef={head}
              fromFontVariationSettings="'wght' 480"
              toFontVariationSettings="'wght' 860"
              radius={110}
              falloff="gaussian"
              style={{ fontFamily: 'inherit' }}
            />
          </h2>
        </div>
      </Obj>

      {NOTES.map(({ x, y, r }, i) => (
        <Obj key={i} x={x} y={y} w={240} r={r} z={focus === i ? 30 : 1}>
          <PinnedNote
            n={i}
            on={on}
            focused={focus === i}
            onFocus={() => {
              setFocus(f => (f === i ? null : i))
              if (focus !== i) sfx('pop')
            }}
          />
        </Obj>
      ))}
    </Zone>
  )
}
