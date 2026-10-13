import { Fragment, useEffect, useRef, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion, useAnimate, type Variants } from 'motion/react'
import { Obj, Zone, useFlow, useZoneActive } from './Board'
import { Label, RollText, asset, reducedMotion } from './ui'
import { sfx } from './sound'

type Project = {
  id: string
  n: string
  call: string
  type: string
  status: string
  body: string[]
  hood: string[]
  stack: string[]
  href?: string
  host?: string
  img?: string
}

const PROJECTS: Project[] = [
  {
    id: 'loom',
    n: '03.1',
    call: 'LOOM',
    type: 'web app',
    status: 'LIVE ↗',
    body: [
      'Your professional presence is scattered across GitHub, your résumé, and LinkedIn. LOOM explores bringing those pieces together into one portfolio, with AI helping connect the dots.',
    ],
    hood: ['GenAI extraction validated with Zod before saving', 'themes + recruiter mode', 'raw files discarded after extraction'],
    stack: ['nextjs', 'postgres', 'prisma', 'genai'],
    href: 'https://useloom.vercel.app',
    host: 'useloom.vercel.app',
    img: 'work/loom.jpg',
  },
  {
    id: 'flux',
    n: '03.2',
    call: 'FLUX',
    type: 'web app',
    status: 'LIVE ↗',
    body: [
      'A task manager built around a simple question: what actually needs your attention right now?',
      'FLUX explores an offline-first approach to managing tasks, with urgency helping you decide what deserves your time instead of leaving you with another endless list.',
    ],
    hood: ['batched writes cut updates from 500ms to under 100ms on 1,000+ tasks', 'offline-first with IndexedDB', 'per-user isolated data'],
    stack: ['react', 'node', 'mongodb'],
    href: 'https://flux-space.vercel.app',
    host: 'flux-space.vercel.app',
    img: 'work/flux.jpg',
  },
  {
    id: 'messit',
    n: '03.3',
    call: 'MESSIT',
    type: 'ux redesign',
    status: 'ON APP STORES',
    body: [
      "VIT's mess app is part of everyday campus life. The idea here was simple: make a routine interaction less of a chore.",
      'I explored how the experience could go from four taps to two, cutting unnecessary steps and making the interface more direct.',
    ],
    hood: ['4 taps to 2 for key actions', 'tested with 100+ students', "shipped on VIT's app stores"],
    stack: ['figma', 'ux research'],
  },
]

/* ---------- messit: ascii prototype, 4 taps vs 2 taps on the same clock ---------- */

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
    ` ${'●'.repeat(taps)}${'○'.repeat(total - taps)}  ${taps}/${total}`.padEnd(14),
  ]
}

function Phones({ run }: { run: boolean }) {
  const [f, setF] = useState(0)
  useEffect(() => {
    if (!run || reducedMotion()) return
    const id = setInterval(() => setF(v => v + 1), 520)
    return () => clearInterval(id)
  }, [run])
  const t = reducedMotion() ? 11 : f % 12
  const a = phone(Math.min(t, 4), 4)
  const b = phone(Math.min(t, 2), 2)
  const art = [' before          after', ...a.map((l, i) => ` ${l}  ${b[i]}`)].join('\n')
  return (
    <div className="absolute inset-0 grid place-items-center">
      <pre aria-hidden className="m-0 font-mono text-[11px] leading-[1.3] text-ink">{art}</pre>
      <span className="sr-only">Prototype flow: the key action used to take four taps, now it takes two.</span>
    </div>
  )
}

/* ---------- dossier ---------- */

const still = () => reducedMotion()
const sheet: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.05 } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.14 } },
}
const line: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.2, 0.8, 0.2, 1] } },
}

/** Browser frame with the screenshot, revealed top-down behind a scanline. */
function Visual({ p, run }: { p: Project; run: boolean }) {
  return (
    <div className="group/vis overflow-hidden rounded-[4px] border border-ink/10 bg-card">
      <div className="flex items-center gap-1.5 border-b border-ink/10 px-2.5 py-1.5">
        {[0, 1, 2].map(i => (
          <span key={i} className="size-[7px] rounded-full bg-ink/15" />
        ))}
        <span className="ml-2 flex-1 truncate rounded-[3px] bg-paper px-2 py-0.5 font-mono text-[11px] text-mute">{p.host ?? 'messit · prototype'}</span>
      </div>
      <div className="relative aspect-[16/10] overflow-hidden">
        {p.img ? (
          <motion.div
            key={p.id}
            className="absolute inset-0"
            initial={still() ? false : { clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            transition={{ duration: 0.9, ease: [0.6, 0, 0.2, 1], delay: 0.1 }}
          >
            <img
              src={asset(p.img)}
              alt={`${p.call} screenshot`}
              draggable={false}
              className="h-full w-full object-cover object-top transition-transform duration-700 ease-[cubic-bezier(.2,.8,.2,1)] group-hover/vis:scale-[1.035]"
            />
          </motion.div>
        ) : (
          <Phones run={run} />
        )}
        {p.img && !still() && (
          <motion.span
            key={`scan-${p.id}`}
            aria-hidden
            className="pointer-events-none absolute inset-x-0 h-px bg-ink/50 shadow-[0_0_10px_1px_var(--ink)]"
            initial={{ top: '0%', opacity: 1 }}
            animate={{ top: '100%', opacity: [1, 1, 0] }}
            transition={{ duration: 0.9, ease: [0.6, 0, 0.2, 1], delay: 0.1 }}
          />
        )}
      </div>
    </div>
  )
}

/** MessIT has no public link: the status shakes and says so. */
function NoLink() {
  const [scope, animate] = useAnimate<HTMLButtonElement>()
  const [nope, setNope] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  return (
    <button
      ref={scope}
      type="button"
      onClick={() => {
        if (!still()) animate(scope.current, { x: [0, -7, 7, -4, 4, 0] }, { duration: 0.4 })
        sfx('deny')
        setNope(true)
        clearTimeout(timer.current)
        timer.current = setTimeout(() => setNope(false), 1500)
      }}
      className="font-mono text-[12px] uppercase tracking-[0.08em] text-mute"
    >
      {nope ? <span className="normal-case tracking-normal text-ink">no public link, sorry</span> : 'ON APP STORES'}
    </button>
  )
}

function Dossier({ p, run, flow }: { p: Project; run: boolean; flow: boolean }) {
  return (
    <motion.div variants={sheet} initial={still() ? false : 'hidden'} animate="show" exit="exit" className="flex flex-col gap-5">
      <div className={flow ? 'flex flex-col gap-5' : 'grid grid-cols-[440px_1fr] gap-7'}>
        <motion.div variants={line}>
          <Visual p={p} run={run} />
        </motion.div>
        <div className="flex min-w-0 flex-col">
          <motion.p variants={line} className="font-mono text-[11px] uppercase tracking-[0.12em] text-mute">
            {p.n} · {p.type}
          </motion.p>
          <motion.h3 variants={line} className="mt-2 font-mono text-[22px] font-medium leading-tight tracking-[0.06em] text-ink">
            {p.call}
          </motion.h3>
          {p.body.map((t, i) => (
            <motion.p key={i} variants={line} className="mt-3 text-[15px] leading-[1.6] text-ink/80">
              {t}
            </motion.p>
          ))}
        </div>
      </div>

      {/* under the hood: quiet, mono, real facts only */}
      <motion.div variants={line} className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5 border-t border-dashed border-ink/15 pt-4 font-mono text-[11.5px] text-mute">
        <span className="uppercase tracking-[0.12em]">under the hood</span>
        {p.hood.map(h => (
          <span key={h} className="group/h inline-flex items-baseline gap-3">
            <span aria-hidden className="text-ink/25">/</span>
            <span className="transition-colors duration-200 group-hover/h:text-ink">{h}</span>
          </span>
        ))}
      </motion.div>

      <motion.div variants={line} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-ink/[0.08] pt-4">
        <ul className="flex flex-wrap gap-1.5" aria-label="Stack">
          {p.stack.map(s => (
            <li key={s} className="group/chip">
              <span className="inline-block rounded-[3px] border border-ink/12 px-2 py-1 font-mono text-[11px] leading-none text-ink/70 transition-[translate,border-color,color] duration-200 group-hover/chip:-translate-y-0.5 group-hover/chip:border-ink/40 group-hover/chip:text-ink">
                {s}
              </span>
            </li>
          ))}
        </ul>
        {p.href ? (
          <a href={p.href} target="_blank" rel="noreferrer" className="group/link inline-flex items-center gap-2 font-mono text-[12px] text-ink">
            <span className="tracking-[0.08em]">LIVE</span>
            <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-px text-mute transition-[background-size,color] duration-300 group-hover/link:bg-[length:100%_1px] group-hover/link:text-ink">
              {p.host}
            </span>
            <span aria-hidden className="inline-block transition-[rotate,translate] duration-300 group-hover/link:translate-x-0.5 group-hover/link:rotate-45">
              ↗
            </span>
          </a>
        ) : (
          <NoLink />
        )}
      </motion.div>
    </motion.div>
  )
}

/* ---------- strip bay (the index) ---------- */

function Strip({ p, on, select }: { p: Project; on: boolean; select: () => void }) {
  return (
    <li className="relative">
      {/* the slot you see when a strip is pulled out */}
      <span aria-hidden className="absolute inset-0 rounded-[2px] bg-ink/[0.06] shadow-[inset_0_1px_3px_rgb(0_0_0/0.14)]" />
      <button
        type="button"
        role="tab"
        id={`strip-${p.id}`}
        aria-selected={on}
        aria-controls="dossier"
        onClick={select}
        onMouseEnter={() => !on && sfx('paper')}
        className="group relative block w-full text-left"
      >
        <span
          className={`relative flex h-[84px] border bg-paper transition-[translate,box-shadow,border-color] duration-500 ease-[cubic-bezier(.2,.9,.3,1.1)] ${
            on ? 'translate-x-5 border-ink/20 shadow-lift' : 'border-ink/10 shadow-obj group-hover:translate-x-2'
          }`}
        >
          <span aria-hidden className={`w-2 shrink-0 transition-colors duration-300 ${on ? 'bg-accent' : 'bg-ink/15 group-hover:bg-ink/35'}`} />
          <span className="flex min-w-0 flex-1 flex-col justify-center px-4">
            <span className="font-mono text-[11px] leading-none text-mute">{p.n}</span>
            <span className="mt-1.5 font-mono text-[20px] font-medium leading-none tracking-[0.08em] text-ink">
              <RollText text={p.call} />
            </span>
            <span className="mt-1.5 truncate text-[13px] leading-none text-mute">{p.type}</span>
          </span>
          <span className="flex w-[108px] shrink-0 items-center justify-center border-l border-ink/10 font-mono text-[11px] tracking-[0.08em] text-mute">
            <span className={`transition-colors ${on ? 'text-ink' : ''}`}>{p.status}</span>
          </span>
        </span>
      </button>
    </li>
  )
}

/* ---------- header ---------- */

function Header({ seen }: { seen: boolean }) {
  const text = "Things I've put into the world."
  return (
    <div>
      <style>{`
        @keyframes hw-wave { 40% { transform: translateY(-0.16em) } }
        .hw:hover .hw-c { animation: hw-wave 0.45s cubic-bezier(.3,0,.3,1) calc(var(--i) * 22ms) }
      `}</style>
      <Label n="03">the hangar</Label>
      <h2 className="hw mt-3 text-[32px] font-medium leading-tight tracking-tight text-ink" aria-label={text}>
        {/* words stay whole when the line wraps; letters inside them animate */}
        {text.split(' ').map((w, wi, all) => (
          <Fragment key={wi}>
          <span aria-hidden className="inline-block whitespace-nowrap">
            {[...w].map((c, ci) => {
              const i = all.slice(0, wi).join(' ').length + (wi ? 1 : 0) + ci
              return (
                <motion.span
                  key={ci}
                  className="inline-block"
                  style={{ '--i': i } as CSSProperties}
                  initial={still() ? false : { y: '0.5em', opacity: 0 }}
                  animate={seen || still() ? { y: 0, opacity: 1 } : undefined}
                  transition={{ delay: 0.15 + i * 0.025, duration: 0.5, ease: [0.2, 0.9, 0.3, 1] }}
                >
                  <span className="hw-c inline-block">{c}</span>
                </motion.span>
              )
            })}
          </span>
          {wi < all.length - 1 && ' '}
          </Fragment>
        ))}
      </h2>
      <p className="mt-3 max-w-[60ch] text-[15px] leading-[1.6] text-mute">
        A few experiments, products, and ideas that made it past the notes app. Some are polished, some are still evolving, but each one taught me something worth keeping.
      </p>
    </div>
  )
}

/* ---------- zone ---------- */

const FOOTER = 'Every project starts with a question. The interesting part is finding out whether the answer works.'


export default function Hangar() {
  const flow = useFlow()
  const active = useZoneActive('hangar')
  const [seen, setSeen] = useState(false)
  const [sel, setSel] = useState(0)
  useEffect(() => {
    if (active) setSeen(true)
  }, [active])
  const p = PROJECTS[sel]

  if (flow) {
    return (
      <Zone id="hangar">
        <Obj x={0} y={0} w={560}>
          <Header seen={seen} />
        </Obj>
        {PROJECTS.map(q => (
          <Obj key={q.id} x={0} y={0} w={760}>
            <article className="rounded-[4px] border border-ink/[0.06] bg-paper p-5 shadow-obj">
              <Dossier p={q} run={active} flow />
            </article>
          </Obj>
        ))}
        <Obj x={0} y={0} w={760}>
          <p className="text-[15px] leading-[1.6] text-mute">{FOOTER}</p>
        </Obj>
      </Zone>
    )
  }

  return (
    <Zone id="hangar">
      <Obj x={0} y={0} w={376}>
        <Header seen={seen} />
      </Obj>

      <Obj x={0} y={262} w={376} label="strip bay">
        <ul role="tablist" aria-label="Projects" aria-orientation="vertical" className="flex flex-col gap-3 rounded-[4px] border border-ink/[0.06] bg-card p-3.5">
          {PROJECTS.map((q, i) => (
            <Strip
              key={q.id}
              p={q}
              on={i === sel}
              select={() => {
                if (i !== sel) sfx('click')
                setSel(i)
              }}
            />
          ))}
        </ul>
      </Obj>

      <Obj x={424} y={36} w={776} label="dossier">
        <div className="relative">
          {/* folder tab */}
          <span className="absolute -top-[26px] right-8 rounded-t-[4px] border border-b-0 border-ink/[0.06] bg-paper px-3 pb-1 pt-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-mute">
            file {p.n}
          </span>
          <article id="dossier" role="tabpanel" aria-labelledby={`strip-${p.id}`} className="relative min-h-[500px] rounded-[4px] border border-ink/[0.06] bg-paper p-7 shadow-obj">
            <AnimatePresence mode="wait" initial={false}>
              <Dossier key={`${p.id}-${seen}`} p={p} run={active} flow={false} />
            </AnimatePresence>
          </article>
        </div>
      </Obj>

      <Obj x={0} y={598} w={376}>
        <p className="text-[13px] leading-[1.6] text-mute">{FOOTER}</p>
      </Obj>
    </Zone>
  )
}
