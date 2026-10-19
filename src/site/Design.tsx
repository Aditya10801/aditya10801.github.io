import { useEffect, useState } from 'react'
import { Obj, Zone, useFlow, useZoneActive } from './Board'
import { Heading } from './Hangar'
import { Label, Selectable, reducedMotion } from './ui'
import { sfx } from './sound'

const INTRO = [
  'Not everything I work on starts with a code editor.',
  'Sometimes the problem is the experience itself: what a person sees, where they get stuck, and how much unnecessary effort a simple task demands.',
  'This is where design work belongs.',
]
const BODY = [
  'MessIT is a campus mess app at VIT. My contribution was to its UI/UX design, focusing on making routine interactions simpler and more intuitive.',
  'The goal was to reduce unnecessary steps between opening the app and getting something done.',
  'For a key action, the redesign reduced the interaction from four taps to two.',
]
const CONTRIBUTION = ['UI/UX', 'Interaction design', 'Interface design']
const FOOTER = 'Design is not decoration. And good design should not need a paragraph explaining why a button is where it is.'

/* ---------- ascii prototype: 4 taps vs 2 taps on the same clock ---------- */

function phone(taps: number, total: number) {
  const rows = [1, 2, 3, 4].map(k => (k <= total ? ` ${taps === k ? '▸' : ' '}[tap ${k}]   ` : ' '.repeat(12)))
  return [
    '┌────────────┐',
    '│ messit   ≡ │',
    '├────────────┤',
    ...rows.map(r => `│${r}│`),
    '│            │',
    `│${taps === total ? '   ✓ done   ' : ' '.repeat(12)}│`,
    '└────────────┘',
  ].join('\n')
}

/** One artboard on the canvas, with a figma-style frame title and selection on hover. */
function Artboard({ title, taps, total }: { title: string; taps: number; total: number }) {
  return (
    <div className="group/ab flex flex-col items-center">
      <p className="mb-2 self-start font-mono text-[11px] text-mute transition-colors group-hover/ab:text-sel">{title}</p>
      <Selectable name="">
        <div className="rounded-[12px] border border-ink/10 bg-paper px-5 py-5 shadow-obj">
          <pre aria-hidden className="m-0 font-mono text-[12.5px] leading-[1.3] text-ink">
            {phone(taps, total)}
          </pre>
          <p aria-hidden className="mt-2 text-center font-mono text-[11px] text-mute">
            {'●'.repeat(taps)}
            {'○'.repeat(total - taps)} <span className="ml-1 tabular-nums">{taps}/{total}</span>
          </p>
        </div>
      </Selectable>
    </div>
  )
}

function Canvas({ run, flow }: { run: boolean; flow: boolean }) {
  const [f, setF] = useState(0)
  useEffect(() => {
    if (!run || reducedMotion()) return
    const id = setInterval(() => setF(v => v + 1), 520)
    return () => clearInterval(id)
  }, [run])
  const t = reducedMotion() ? 11 : f % 12

  return (
    <div className="overflow-hidden rounded-[6px] border border-ink/[0.08] bg-paper shadow-obj">
      {/* file toolbar */}
      <div className="flex items-center justify-between border-b border-ink/[0.08] px-3.5 py-2 font-mono text-[11px] text-mute">
        <span>
          MessIT <span className="text-ink/30">/</span> <span className="text-ink">key action</span>
        </span>
        <span>100%</span>
      </div>
      <button
        type="button"
        onClick={() => {
          setF(0)
          sfx('click')
        }}
        className={`relative block w-full cursor-default bg-card ${flow ? 'px-4 py-6' : 'px-10 py-9'}`}
        style={{ backgroundImage: 'radial-gradient(var(--line) 1px, transparent 1px)', backgroundSize: '16px 16px' }}
      >
        <span className="sr-only">Replay the prototype: four taps before, two taps after</span>
        <span aria-hidden className={`relative flex items-start justify-center ${flow ? 'gap-5' : 'gap-24'}`}>
          <Artboard title="before" taps={Math.min(t, 4)} total={4} />
          {/* prototype link between the frames */}
          {!flow && (
            <svg aria-hidden viewBox="0 0 80 20" className="absolute left-1/2 top-[46%] h-5 w-20 -translate-x-1/2 text-sel">
              <path d="M2 10 H 72" fill="none" stroke="currentColor" strokeWidth="1.2" />
              <path d="M66 5 L 74 10 L 66 15" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
              <circle cx="2" cy="10" r="2.2" fill="currentColor" />
            </svg>
          )}
          <Artboard title="after" taps={Math.min(t, 2)} total={2} />
        </span>
      </button>
    </div>
  )
}

function Spec({ flow }: { flow: boolean }) {
  return (
    <article className={`rounded-[4px] border border-ink/[0.06] bg-paper shadow-obj ${flow ? 'p-5' : 'grid grid-cols-[220px_1fr] gap-7 p-7'}`}>
      <div className="flex flex-col">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-mute">UI/UX DESIGN CONTRIBUTION</p>
        <h3 className="mt-2 font-mono text-[22px] font-medium leading-tight tracking-[0.06em] text-ink">MESSIT</h3>
        <ul className="mt-4 flex flex-col gap-1 font-mono text-[12px] text-ink/70" aria-label="Contribution">
          {CONTRIBUTION.map(c => (
            <li key={c} className="group/c flex items-center gap-2">
              <span aria-hidden className="text-[9px] text-ink/30 transition-[color,rotate] duration-300 group-hover/c:rotate-45 group-hover/c:text-ink">
                ◆
              </span>
              <span className="transition-colors group-hover/c:text-ink">{c}</span>
            </li>
          ))}
        </ul>
        <div className={`font-mono text-[12px] text-mute ${flow ? 'mt-4' : 'mt-auto pt-4'}`}>
          <p>No public case-study link available</p>
          <a
            href="https://apps.apple.com/in/app/messit/id6748703795"
            target="_blank"
            rel="noreferrer"
            className="group/as mt-1 inline-flex min-h-[24px] items-center gap-1 text-ink/70 underline decoration-ink/20 underline-offset-4 transition-colors hover:text-ink hover:decoration-accent"
          >
            MessIT on the App Store
            <span aria-hidden className="inline-block transition-transform duration-300 group-hover/as:-translate-y-0.5 group-hover/as:translate-x-0.5">↗</span>
          </a>
        </div>
      </div>
      <div className={flow ? 'mt-5' : ''}>
        {BODY.map((t, i) => (
          <p key={i} className={`text-[15px] leading-[1.6] text-ink/80 ${i ? 'mt-3' : ''}`}>
            {t}
          </p>
        ))}
        <p className="mt-4 font-hand text-[20px] leading-none text-mute">less tapping. more getting on with your day.</p>
      </div>
    </article>
  )
}

function Header({ seen }: { seen: boolean }) {
  return (
    <div>
      <Label n="04">design desk</Label>
      <Heading text="Things I've helped make better." seen={seen} />
      {INTRO.map((t, i) => (
        <p key={i} className="mt-3 max-w-[60ch] text-[15px] leading-[1.6] text-mute">
          {t}
        </p>
      ))}
    </div>
  )
}

export default function Design() {
  const flow = useFlow()
  const active = useZoneActive('design')
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    if (active) setSeen(true)
  }, [active])

  return (
    <Zone id="design">
      <Obj x={0} y={0} w={410}>
        <Header seen={seen} />
      </Obj>

      <Obj x={460} y={0} w={740} label="messit.fig">
        <Canvas run={active} flow={flow} />
      </Obj>

      {/* the one overlap: the spec card sits on the canvas's bottom edge */}
      <Obj x={490} y={372} w={710} r={-0.8} z={2} label="design notes">
        <Spec flow={flow} />
      </Obj>

      <Obj x={0} y={560} w={380}>
        <p className={`leading-[1.6] text-mute ${flow ? 'text-[15px]' : 'text-[13px]'}`}>{FOOTER}</p>
      </Obj>
    </Zone>
  )
}
