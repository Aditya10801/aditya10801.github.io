import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useAnimate, useMotionValue, useSpring, useTransform, useVelocity } from 'motion/react'
import { Obj, Zone, useFlow, useZoneActive } from './Board'
import { Label, RollText, reducedMotion, useFinePointer } from './ui'
import { sfx } from './sound'

type Project = { id: string; call: string; type: string; route: string[]; line: string; href?: string; host?: string; status: string; edge: CSSProperties }


const PROJECTS: Project[] = [
  {
    id: 'loom',
    call: 'LOOM',
    type: 'web app',
    route: ['nextjs', 'postgres', 'prisma', 'genai'],
    line: 'One portfolio from your GitHub, résumé and LinkedIn.',
    href: 'https://useloom.vercel.app',
    host: 'useloom.vercel.app',
    status: 'LIVE',
    edge: { background: 'var(--accent)' },
  },
  {
    id: 'flux',
    call: 'FLUX',
    type: 'web app',
    route: ['react', 'node', 'mongodb'],
    line: "An offline task manager that knows what's urgent.",
    href: 'https://flux-space.vercel.app',
    host: 'flux-space.vercel.app',
    status: 'LIVE',
    edge: { background: 'var(--ink)' },
  },
  {
    id: 'messit',
    call: 'MESSIT',
    type: 'ux redesign',
    route: ['figma', 'ux research'],
    line: "VIT's mess app, from four taps to two.",
    status: 'ON APP STORES',
    edge: { background: 'repeating-linear-gradient(-45deg, var(--accent) 0 4px, transparent 4px 8px)' },
  },
]

/* ---------- ascii art: each piece is a pure function of a frame counter ---------- */

const bar = (n: number) => '█'.repeat(n) + '░'.repeat(5 - n)
const TASKS = ['ship api', 'fix login bug', 'lab record', 'dsa sheet', 'reply to mails']
const fluxOrder = (f: number) =>
  TASKS.map((t, i) => ({ t, i, u: Math.round(2.5 + 2.5 * Math.sin(f * 0.55 + i * 1.7)) })).sort((a, b) => b.u - a.u || a.i - b.i)

const ART: Record<string, { ms: number; rest: number; draw: (f: number) => string }> = {
  loom: {
    ms: 150,
    rest: 0,
    draw: f => {
      const labels = ['github', '', 'résumé', '', 'linkedin', '']
      const rows = labels.map((l, y) => {
        const s = y % 2 ? f : -f
        let r = ''
        for (let x = 0; x < 24; x++) r += (((x + s) % 4) + 4) % 4 < 2 ? '╱' : '╲'
        return ` ${l.padEnd(9)}${r}`
      })
      return [...rows, '', ` ${'─'.repeat(15)}▸ portfolio ${f % 2 ? '▮' : '▯'}`].join('\n')
    },
  },
  flux: {
    ms: 950,
    rest: 0,
    draw: f => {
      const prev = fluxOrder(f - 1).map(r => r.i)
      const rows = fluxOrder(f).map((r, k) => {
        const was = prev.indexOf(r.i)
        const mv = was > k ? '↑' : was < k ? '↓' : ' '
        return ` ${k === 0 ? '▸' : ' '} ${r.t.padEnd(15)}[${bar(r.u)}] ${mv}`
      })
      return [' flux / today       by urgency', ' ' + '─'.repeat(30), ...rows, ` ● offline        sorting ${'◐◓◑◒'[f % 4]}`].join('\n')
    },
  },
  messit: {
    ms: 420,
    rest: 15,
    draw: f => {
      const t = f % 16
      const old = t < 8
      const taps = old ? Math.min(t, 4) : Math.min(t - 8, 2)
      const items = ['menu', 'book', 'pay']
      const screen = items.map((it, k) => `│ ${taps > 0 && k === (taps - 1) % 3 ? '▸' : ' '} ${it.padEnd(8)}│`)
      const side = [
        old ? 'old flow' : 'old flow ✗',
        `${'●'.repeat(old ? taps : 4).padEnd(4, '·')}  4 taps`,
        '',
        old ? '' : 'redesign',
        old ? '' : `${'●'.repeat(taps).padEnd(2, '·')}    2 taps`,
      ]
      const phone = ['┌───────────┐', '│ messit  ▪ │', '├───────────┤', ...screen, `│  ${`${taps} tap${taps === 1 ? '' : 's'}`.padEnd(7)}  │`, '└───────────┘']
      return phone.map((p, k) => ` ${p}   ${side[k - 1] ?? ''}`).join('\n')
    },
  },
}

function useTick(ms: number) {
  const [f, setF] = useState(0)
  useEffect(() => {
    if (reducedMotion()) return
    const id = setInterval(() => setF(v => v + 1), ms)
    return () => clearInterval(id)
  }, [ms])
  return f
}

function Art({ id }: { id: string }) {
  const a = ART[id]
  const f = useTick(a.ms)
  return (
    <pre aria-hidden className="m-0 whitespace-pre font-mono text-[10px] leading-[1.3] text-ink">
      {a.draw(reducedMotion() ? a.rest : f)}
    </pre>
  )
}

/** Little browser-ish window chrome around a preview. */
function Window({ p, children, className = '' }: { p: Project; children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-[3px] border border-ink/25 bg-bg ${className}`}>
      <div className="flex items-center gap-1 border-b border-line px-2.5 py-1.5 font-mono text-[10px] text-mute">
        <span className="size-[5px] rounded-full bg-accent" />
        <span className="size-[5px] rounded-full bg-mute/50" />
        <span className="size-[5px] rounded-full bg-mute/50" />
        <span className="ml-2">{p.host ?? `${p.id}.preview`}</span>
      </div>
      {children}
    </div>
  )
}


/* ---------- flight strips ---------- */

function Strip({ p, fine, flow, onEnter, open, onToggle }: { p: Project; fine: boolean; flow: boolean; onEnter: () => void; open: boolean; onToggle: () => void }) {
  const [scope, animate] = useAnimate<HTMLSpanElement>()
  const [nope, setNope] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  const shake = () => {
    if (!reducedMotion()) animate(scope.current, { x: [0, -8, 8, -5, 5, -2, 0] }, { duration: 0.45 })
    setNope(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setNope(false), 1500)
  }

  const status = (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={nope ? 'nope' : 'ok'}
        initial={{ y: 6, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -6, opacity: 0 }}
        transition={{ duration: 0.16 }}
        className="block font-mono text-[11px] uppercase leading-[1.35] tracking-[0.08em]"
      >
        {nope ? (
          <span className="text-accent">no public link</span>
        ) : p.href ? (
          <span className="inline-flex items-center gap-1.5 text-ink">
            {p.status}
            <span aria-hidden className="inline-block text-mute transition-[rotate,translate,color] duration-300 group-hover:translate-x-0.5 group-hover:rotate-45 group-hover:text-accent">
              ↗
            </span>
          </span>
        ) : (
          <span className="text-mute">{p.status}</span>
        )}
      </motion.span>
    </AnimatePresence>
  )
  const stack = <span className="font-mono text-[10.5px] lowercase tracking-[0.04em] text-mute">{p.route.join(' · ')}</span>

  const strip = flow ? (
    <span ref={scope} className="relative flex border border-ink/20 bg-bg">
      <span aria-hidden className="w-2 shrink-0" style={p.edge} />
      <span className="flex min-w-0 flex-1 flex-col gap-1.5 px-4 py-3">
        <span className="flex items-baseline justify-between gap-3">
          <span className="font-mono text-[18px] font-medium tracking-[0.08em] text-ink">{p.call}</span>
          {status}
        </span>
        <span className="text-[15px] leading-snug text-ink/85">{p.line}</span>
        {stack}
      </span>
    </span>
  ) : (
    <span
      ref={scope}
      className="relative flex h-[64px] border border-ink/20 bg-bg transition-[translate,box-shadow] duration-500 ease-[cubic-bezier(.2,.9,.3,1.1)] group-hover:translate-x-7 group-hover:shadow-[0_10px_22px_-12px_rgb(0_0_0/0.35)]"
    >
      <span aria-hidden className="w-2 shrink-0 transition-[width] duration-300 group-hover:w-3" style={p.edge} />
      <span className="flex w-[150px] shrink-0 flex-col justify-center px-4">
        <span className="font-mono text-[19px] font-medium leading-none tracking-[0.08em] text-ink">
          <RollText text={p.call} />
        </span>
        <span className="mt-1.5 font-mono text-[10px] uppercase leading-none tracking-[0.12em] text-mute">{p.type}</span>
      </span>
      <span className="relative flex min-w-0 flex-1 items-center border-l border-ink/15 px-4">
        <span className="truncate text-[14.5px] text-ink/85 transition-[translate] duration-300 group-hover:-translate-y-2">{p.line}</span>
        {/* the stack stays out of the way until hover */}
        <span className="absolute bottom-2 left-4 translate-y-1 opacity-0 transition-[opacity,translate] duration-300 group-hover:translate-y-0 group-hover:opacity-100">{stack}</span>
      </span>
      <span className="flex w-[132px] shrink-0 items-center border-l border-ink/15 px-4">{status}</span>
    </span>
  )

  const hit = 'group relative block w-full text-left'
  return (
    <li className="relative">
      {/* the empty slot you see when a strip slides out */}
      {!flow && <span aria-hidden className="absolute inset-0 rounded-[2px] bg-ink/[0.07] shadow-[inset_0_1px_3px_rgb(0_0_0/0.18)]" />}
      {fine && p.href ? (
        <a href={p.href} target="_blank" rel="noreferrer" className={hit} onMouseEnter={onEnter} aria-label={`${p.call}, ${p.line} Opens ${p.host}`}>
          {strip}
        </a>
      ) : (
        <button type="button" className={hit} onMouseEnter={fine ? onEnter : undefined} onClick={fine ? shake : onToggle} aria-expanded={fine ? undefined : open}>
          {strip}
        </button>
      )}
      {!fine && (
        <AnimatePresence initial={false}>
          {open && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: [0.2, 0.9, 0.3, 1] }} className="overflow-hidden">
              <Window p={p} className="mt-2">
                <div className="overflow-x-auto p-3">
                  <Art id={p.id} />
                </div>
                <div className="flex justify-end border-t border-line px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em]">
                  {p.href ? (
                    <a href={p.href} target="_blank" rel="noreferrer" className="text-accent">
                      open ↗
                    </a>
                  ) : (
                    <span className="text-mute">no public link, sorry</span>
                  )}
                </div>
              </Window>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </li>
  )
}

/** Heading letters rise in on first arrival, and do a little wave on hover. */
function Heading({ text, seen }: { text: string; seen: boolean }) {
  const still = reducedMotion()
  return (
    <h2 className="hw mt-3 text-[26px] font-medium leading-tight tracking-[-0.01em] text-ink" aria-label={text}>
      {[...text].map((c, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="inline-block whitespace-pre"
          style={{ '--i': i } as CSSProperties}
          initial={still ? false : { y: '0.5em', opacity: 0, filter: 'blur(4px)' }}
          animate={seen || still ? { y: 0, opacity: 1, filter: 'blur(0px)' } : undefined}
          transition={{ delay: 0.2 + i * 0.03, duration: 0.5, ease: [0.2, 0.9, 0.3, 1] }}
        >
          <span className="hw-c inline-block">{c}</span>
        </motion.span>
      ))}
    </h2>
  )
}


/* ---------- zone ---------- */

export default function Hangar() {
  const fine = useFinePointer()
  const flow = useFlow()
  const zoneOn = useZoneActive('hangar')
  const [seen, setSeen] = useState(false)
  const [active, setActive] = useState<Project | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  useEffect(() => {
    if (zoneOn) setSeen(true)
    else setOpen(null) // closing the accordion also stops its ascii ticker
  }, [zoneOn])

  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const x = useSpring(mx, { stiffness: 260, damping: 26, mass: 0.6 })
  const y = useSpring(my, { stiffness: 260, damping: 26, mass: 0.6 })
  const tilt = useSpring(useTransform(useVelocity(x), [-1600, 1600], [-9, 9], { clamp: true }), { stiffness: 300, damping: 30 })

  const place = (e: React.MouseEvent, jump = false) => {
    const nx = Math.min(e.clientX + 28, innerWidth - 270)
    const ny = Math.min(Math.max(e.clientY - 90, 70), innerHeight - 190)
    mx.set(nx)
    my.set(ny)
    if (jump) {
      x.jump(nx)
      y.jump(ny)
    }
  }
  const shown = zoneOn ? active : null

  return (
    <Zone id="hangar">
      <style>{`
        @keyframes hw-wave { 40% { transform: translateY(-0.18em) } }
        .hw:hover .hw-c { animation: hw-wave 0.45s cubic-bezier(.3,0,.3,1) calc(var(--i) * 22ms); color: var(--accent) }
        .hw .hw-c { transition: color .4s calc(var(--i) * 22ms) }
      `}</style>

      <Obj x={0} y={40} w={520}>
        <Label n="03">the hangar</Label>
        <Heading text="Things I've built" seen={seen} />
      </Obj>

      <Obj x={140} y={210} w={760} label="strip bay">
        <ul
          className="flex flex-col gap-2.5 rounded-[3px] border border-line bg-card p-3"
          onMouseEnter={fine ? e => place(e, true) : undefined}
          onMouseMove={fine ? e => place(e) : undefined}
          onMouseLeave={() => setActive(null)}
        >
          {PROJECTS.map(p => (
            <Strip key={p.id} p={p} fine={fine} flow={flow} onEnter={() => { setActive(p); sfx('paper') }} open={open === p.id} onToggle={() => setOpen(o => (o === p.id ? null : p.id))} />
          ))}
        </ul>
      </Obj>

      {fine &&
        createPortal(
          <motion.div aria-hidden className="pointer-events-none fixed left-0 top-0 z-40 w-[250px]" style={{ x, y, rotate: reducedMotion() ? 0 : tilt }}>
            <AnimatePresence>
              {shown && (
                <motion.div
                  key="win"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                  style={{ transformOrigin: '0% 50%' }}
                >
                  <Window p={shown} className="shadow-[6px_6px_0_0_var(--line)]">
                    <div className="relative h-[136px]">
                      <AnimatePresence initial={false}>
                        <motion.div
                          key={shown.id}
                          className="absolute inset-0 p-3"
                          initial={{ opacity: 0, filter: 'blur(3px)' }}
                          animate={{ opacity: 1, filter: 'blur(0px)' }}
                          exit={{ opacity: 0, filter: 'blur(3px)' }}
                          transition={{ duration: 0.25 }}
                        >
                          <Art id={shown.id} />
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </Window>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>,
          document.body,
        )}
    </Zone>
  )
}
