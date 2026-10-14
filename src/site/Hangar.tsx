import { Fragment, useEffect, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion, type Variants } from 'motion/react'
import { Obj, Zone, useFlow, useZoneActive } from './Board'
import { Label, RollText, asset, reducedMotion } from './ui'
import { sfx } from './sound'

type Project = {
  id: string
  n: string
  call: string
  type: string
  body: string[]
  caption: string
  hood: string[]
  stack: string[]
  href: string
  host: string
  img: string
}

const PROJECTS: Project[] = [
  {
    id: 'loom',
    n: '03.1',
    call: 'LOOM',
    type: 'WEB APP',
    body: [
      'Your work lives in a dozen different places. GitHub over here, your résumé over there, LinkedIn somewhere else, and the actual story of what you can do scattered across all of them.',
      'LOOM explores bringing those pieces together into a single portfolio, using AI to help connect the dots.',
    ],
    caption: 'trying to make the internet tell a more coherent story',
    hood: [
      'pulls the relevant details from résumés and LinkedIn PDFs',
      "validates the AI's structured output before saving",
      'themes and a recruiter view',
      'discards uploaded files after extraction',
    ],
    stack: ['Next.js', 'PostgreSQL', 'Prisma', 'GenAI'],
    href: 'https://loom.buildspace.cv',
    host: 'loom.buildspace.cv',
    img: 'work/loom.jpg',
  },
  {
    id: 'flux',
    n: '03.2',
    call: 'FLUX',
    type: 'WEB APP',
    body: [
      'Most task managers are excellent at helping you collect tasks. The actual challenge is deciding what deserves your attention.',
      'FLUX explores a different approach: a task manager that helps bring urgency into the picture instead of leaving you with an endless list and an increasingly guilty conscience.',
    ],
    caption: "because apparently making the list longer wasn't helping",
    hood: ['offline-first task handling', 'batched updates', 'per-user data isolation', 'IndexedDB storage with sync'],
    stack: ['React', 'Node.js', 'MongoDB'],
    href: 'https://flux-space.vercel.app',
    host: 'flux-space.vercel.app',
    img: 'work/flux.jpg',
  },
]

const INTRO = [
  'A few things that made it beyond an idea in my notes.',
  "Some are software projects. Some are experiments. They don't all have the same story, and they don't all need to pretend they're changing the world.",
]
const FOOTER = 'More things will appear here when they are ready. I would rather show fewer things properly than pad out the hangar.'

const still = () => reducedMotion()

/* ---------- zone heading, shared with the design desk ---------- */

/** Letters rise in on first arrival; words stay whole when the line wraps; a little wave on hover. */
export function Heading({ text, seen }: { text: string; seen: boolean }) {
  return (
    <h2 className="hw mt-3 text-[32px] font-medium leading-tight tracking-tight text-ink" aria-label={text}>
      <style>{`
        @keyframes hw-wave { 40% { transform: translateY(-0.16em) } }
        .hw:hover .hw-c { animation: hw-wave 0.45s cubic-bezier(.3,0,.3,1) calc(var(--i) * 22ms) }
      `}</style>
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
  )
}

/* ---------- dossier ---------- */

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
function Visual({ p }: { p: Project }) {
  return (
    <div className="group/vis overflow-hidden rounded-[4px] border border-ink/10 bg-card">
      <div className="flex items-center gap-1.5 border-b border-ink/10 px-2.5 py-1.5">
        {[0, 1, 2].map(i => (
          <span key={i} className="size-[7px] rounded-full bg-ink/15" />
        ))}
        <span className="ml-2 flex-1 truncate rounded-[3px] bg-paper px-2 py-0.5 font-mono text-[11px] text-mute">{p.host}</span>
      </div>
      <div className="relative aspect-[16/10] overflow-hidden">
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
        {!still() && (
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

/** Optional expansion, collapsed by default. */
function Hood({ p }: { p: Project }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-t border-dashed border-ink/15 pt-3">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          setOpen(o => !o)
          sfx('click')
        }}
        className="group/hood flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-mute transition-colors hover:text-ink"
      >
        <span aria-hidden className={`inline-block transition-transform duration-300 ${open ? 'rotate-45' : 'group-hover/hood:rotate-90'}`}>
          +
        </span>
        under the hood
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: still() ? 0 : 0.3, ease: [0.2, 0.8, 0.2, 1] }}
            className="grid grid-cols-1 gap-x-7 gap-y-1.5 overflow-hidden pt-3 font-mono text-[12px] text-ink/70 sm:grid-cols-2"
          >
            {p.hood.map(h => (
              <li key={h} className="flex gap-2.5">
                <span aria-hidden className="text-ink/25">/</span>
                {h}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

function Dossier({ p, flow }: { p: Project; flow: boolean }) {
  return (
    <motion.div variants={sheet} initial={still() ? false : 'hidden'} animate="show" exit="exit" className="flex flex-col gap-5">
      <div className={flow ? 'flex flex-col gap-5' : 'grid grid-cols-[440px_1fr] gap-7'}>
        <motion.div variants={line}>
          <Visual p={p} />
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
          <motion.p variants={line} className="mt-4 font-mono text-[12px] leading-snug text-mute">
            {p.caption}
          </motion.p>
        </div>
      </div>

      <motion.div variants={line}>
        <Hood p={p} />
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
        <a href={p.href} target="_blank" rel="noreferrer" className="group/link inline-flex items-center gap-1.5 font-mono text-[12px] text-ink">
          <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-px transition-[background-size] duration-300 group-hover/link:bg-[length:100%_1px]">
            {p.host}
          </span>
          <span aria-hidden className="inline-block transition-[rotate,translate] duration-300 group-hover/link:translate-x-0.5 group-hover/link:rotate-45">
            ↗
          </span>
        </a>
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
            <span className="mt-1.5 font-mono text-[11px] leading-none tracking-[0.1em] text-mute">{p.type}</span>
          </span>
        </span>
      </button>
    </li>
  )
}

/* ---------- zone ---------- */

function Header({ seen }: { seen: boolean }) {
  return (
    <div>
      <Label n="03">hangar</Label>
      <Heading text="Things I've built." seen={seen} />
      {INTRO.map((t, i) => (
        <p key={i} className="mt-3 max-w-[60ch] text-[15px] leading-[1.6] text-mute">
          {t}
        </p>
      ))}
    </div>
  )
}

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
              <Dossier p={q} flow />
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

      <Obj x={0} y={290} w={376} label="strip bay">
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
          <article id="dossier" role="tabpanel" aria-labelledby={`strip-${p.id}`} className="relative min-h-[480px] rounded-[4px] border border-ink/[0.06] bg-paper p-7 shadow-obj">
            <AnimatePresence mode="wait" initial={false}>
              <Dossier key={`${p.id}-${seen}`} p={p} flow={false} />
            </AnimatePresence>
          </article>
        </div>
      </Obj>

      <Obj x={0} y={540} w={376}>
        <p className="text-[13px] leading-[1.6] text-mute">{FOOTER}</p>
      </Obj>
    </Zone>
  )
}
