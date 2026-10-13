import { useEffect, useState } from 'react'
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'motion/react'
import { Label, reducedMotion } from './ui'
import { Obj, Zone, useFlow, useZoneActive } from './Board'

type Entry = { date: string; org: string; sub: string; role: string; summary: string; more?: string; stamp?: string }

// facts only (context/design.md + copy.md). VIT is the anchor, so it leads.
const ENTRIES: Entry[] = [
  {
    date: '2024 → 2028',
    org: 'VIT Vellore',
    sub: 'B.TECH CSE',
    role: 'B.Tech Computer Science',
    summary: '3rd year.',
    more: 'B.Tech in Computer Science at VIT Vellore, 2024 to 2028.',
    stamp: '2024',
  },
  {
    date: 'JAN 2026 → NOW',
    org: 'VinnovateIT',
    sub: 'VIT VELLORE',
    role: 'Vice Chair',
    summary: 'Vice chair of VinnovateIT, a student tech club at VIT.',
    stamp: '2026',
  },
  {
    date: '2025',
    org: 'GDG VIT',
    sub: 'HEXATHON DESIGNATHON',
    role: 'Designer',
    summary: '2nd place, graph-based expense settling.',
    more: 'A system that minimizes multi-party settlement transactions through debt consolidation.',
  },
  {
    date: 'BEFORE',
    org: 'Delhi Public School',
    sub: 'ROHINI',
    role: 'School',
    summary: 'Delhi.',
    more: 'Delhi Public School Rohini, back home in Delhi.',
    stamp: 'VERIFIED',
  },
]

const TOTALS = [
  { n: 3, suffix: 'rd', label: 'year' },
  { n: 3, suffix: '', label: 'projects shipped' },
  { n: 1, suffix: '', label: 'student club' },
]

// left page: date | aircraft | role, gutter, right page: remarks. 500 + 500.
const COLS = 'grid-cols-[28px_116px_170px_162px_48px_448px_28px]'
const MONO = 'font-mono text-[11px] uppercase tracking-[0.14em] text-mute'
const GUTTER = 'rgb(0 0 0 / 0.1)'

export default function Log() {
  const active = useZoneActive('log')
  const flow = useFlow()
  return (
    <Zone id="log">
      <Obj x={0} y={0} w={520}>
        <div>
          <Label n="04">logbook</Label>
          <h2 className="mt-3 text-[32px] font-medium leading-tight tracking-tight text-ink">Logged hours.</h2>
          <p className="mt-1.5 max-w-[60ch] text-[15px] text-mute">Where I've been logging hours.</p>
        </div>
      </Obj>

      <Obj x={180} y={128} w={1000} h={540} r={-0.5} label="logbook">
        {flow ? <Pages active={active} /> : <Spread active={active} />}
      </Obj>
    </Zone>
  )
}

/* ---------- board: the open spread ---------- */

function Spread({ active }: { active: boolean }) {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <div className="group/book relative h-full">
      {/* page block thickness */}
      <div aria-hidden className="absolute inset-x-1.5 -bottom-1.5 h-4 rounded-b-[6px] border border-ink/[0.06] bg-paper" />
      <div aria-hidden className="absolute inset-x-3 -bottom-3 h-4 rounded-b-[6px] border border-ink/[0.06] bg-paper" />

      <div className="relative flex h-full flex-col overflow-hidden rounded-[6px] border border-ink/[0.06] bg-paper shadow-obj">
        {/* gutter shadow + spine */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-1/2 w-[120px] -translate-x-1/2"
          style={{ background: `linear-gradient(to right, transparent, ${GUTTER} 48%, rgb(0 0 0 / 0.16) 50%, ${GUTTER} 52%, transparent)` }}
        />

        {/* running heads */}
        <div className={`grid ${COLS} items-end pt-5`}>
          <span />
          <span className={`${MONO} col-span-3`}>pilot logbook · a. madan</span>
          <span />
          <span className={`${MONO} flex justify-between`}>
            <span>remarks and endorsements</span>
            <span>p. 04</span>
          </span>
        </div>

        {/* column heads */}
        <div className={`mt-4 grid ${COLS} border-y-[3px] border-double border-ink/25 py-2 ${MONO} text-ink/70`}>
          <span />
          <span>date</span>
          <span>aircraft</span>
          <span>role</span>
          <span />
          <span>remarks</span>
        </div>

        {/* ruled body: entries on top, blank ruled lines fill whatever is left */}
        <div
          className="relative min-h-0 flex-1"
          style={{ background: 'repeating-linear-gradient(to bottom, transparent 0 35px, var(--line) 35px 36px)' }}
        >
          {[144, 314, 524].map(x => <span key={x} aria-hidden className="absolute inset-y-0 w-px bg-line" style={{ left: x }} />)}
          <ul className="relative">
            {ENTRIES.map((e, i) => (
              <Row key={e.org} e={e} open={open === i} toggle={() => setOpen(o => (o === i ? null : i))} />
            ))}
          </ul>
        </div>

        {/* page feet: certification left, totals right */}
        <div className={`grid ${COLS} border-t border-ink/25 pb-5 pt-3`}>
          <div className="col-span-3 col-start-2">
            <p className="text-[13px] text-mute">I certify that the entries in this log are true.</p>
            <div className="mt-1 flex items-end gap-3">
              <motion.span
                aria-label="Signed, Aditya Madan"
                className="font-hand text-[26px] leading-none text-ink"
                initial={false}
                animate={{ clipPath: active || reducedMotion() ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)' }}
                transition={{ duration: 1.1, delay: active ? 0.6 : 0, ease: [0.5, 0, 0.3, 1] }}
              >
                Aditya Madan
              </motion.span>
              <span className="mb-1 h-px flex-1 bg-ink/25" />
            </div>
          </div>
          <div className="col-start-6">
            <Totals active={active} />
          </div>
        </div>

        {/* page curl, lifts a little when the book is hovered */}
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-0 right-0 size-6 transition-[width,height] duration-300 ease-out group-hover/book:size-10"
          style={{
            background: 'linear-gradient(315deg, var(--bg) 50%, color-mix(in srgb, var(--paper) 86%, var(--ink)) 50%, var(--paper) 100%)',
            filter: 'drop-shadow(-2px -2px 3px rgb(0 0 0 / 0.12))',
          }}
        />
      </div>
    </div>
  )
}

function Row({ e, open, toggle }: { e: Entry; open: boolean; toggle: () => void }) {
  const [hits, setHits] = useState(0) // remount key for the stamp thump
  const [hover, setHover] = useState(false)
  const still = reducedMotion()
  const on = hover || open
  const Tag = e.more ? 'button' : 'div'

  return (
    <li className="relative border-b border-line bg-paper">
      <Tag
        {...(e.more ? { type: 'button' as const, 'aria-expanded': open, onClick: toggle } : {})}
        onPointerEnter={() => { setHover(true); setHits(h => h + 1) }}
        onPointerLeave={() => setHover(false)}
        onFocus={() => { setHover(true); setHits(h => h + 1) }}
        onBlur={() => setHover(false)}
        className={`relative grid w-full ${COLS} items-start py-2.5 text-left outline-offset-[-2px]`}
      >
        <span />
        <span className="pt-0.5 font-mono text-[11px] tracking-[0.06em] text-ink/80">{e.date}</span>
        <span className="min-w-0 border-l border-line pl-3">
          <span className="block text-[15px] font-medium leading-snug text-ink">{e.org}</span>
          <span className="block font-mono text-[10px] tracking-[0.12em] text-mute">{e.sub}</span>
        </span>
        <span className="border-l border-line pl-3 text-[13px] leading-snug text-ink/85">{e.role}</span>
        <span />
        <span className="relative border-l border-line pl-3 pr-16">
          <span className="block text-[15px] leading-snug text-ink">
            {e.summary}{' '}
            {e.more && <span aria-hidden className={`inline-block font-mono text-[11px] text-mute transition-transform duration-300 ${open ? 'rotate-90' : ''}`}>›</span>}
          </span>
          <AnimatePresence initial={false}>
            {open && e.more && (
              <motion.span
                className="block overflow-hidden"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: still ? 0 : 0.3, ease: [0.3, 0, 0.2, 1] }}
              >
                <span className="block pt-1.5 text-[13px] leading-relaxed text-mute">{e.more}</span>
              </motion.span>
            )}
          </AnimatePresence>
          {/* ink stamp */}
          {on && e.stamp && (
            <motion.span
              key={hits}
              aria-hidden
              className="pointer-events-none absolute right-1 top-0 rounded-[3px] border-2 border-accent px-1.5 py-px font-mono text-[10px] font-medium tracking-[0.14em] text-accent"
              initial={still ? false : { scale: 1.8, opacity: 0, rotate: -16 }}
              animate={{ scale: 1, opacity: 0.85, rotate: -8 }}
              transition={{ type: 'spring', stiffness: 600, damping: 17 }}
            >
              {e.stamp}
            </motion.span>
          )}
        </span>
        <span />
      </Tag>

      {/* ruler laid under the line you're reading */}
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-x-3 -bottom-[7px] z-10 h-[13px] origin-left rounded-[2px] border border-ink/15 transition-[transform,opacity] duration-300 ease-out ${hover ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'}`}
        style={{
          background:
            'repeating-linear-gradient(to right, color-mix(in srgb, var(--ink) 35%, transparent) 0 1px, transparent 1px 8px) top / 100% 5px no-repeat, repeating-linear-gradient(to right, color-mix(in srgb, var(--ink) 45%, transparent) 0 1px, transparent 1px 40px) top / 100% 8px no-repeat, color-mix(in srgb, var(--paper) 70%, var(--card))',
        }}
      />
    </li>
  )
}

function Totals({ active }: { active: boolean }) {
  return (
    <div>
      <div className={`${MONO} border-b border-line pb-1`}>totals carried forward</div>
      <ul className="mt-2 grid grid-cols-3 gap-3">
        {TOTALS.map(t => (
          <li key={t.label}>
            <span className="block text-[22px] font-medium leading-none tabular-nums text-ink">
              <Count n={t.n} suffix={t.suffix} active={active} />
            </span>
            <span className="mt-1 block text-[13px] leading-snug text-mute">{t.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Count({ n, suffix, active }: { n: number; suffix: string; active: boolean }) {
  const v = useMotionValue(reducedMotion() ? n : 0)
  const text = useTransform(v, x => `${Math.round(x)}${suffix}`)
  useEffect(() => {
    if (!active || reducedMotion()) return
    const c = animate(v, n, { duration: 1.2, delay: 0.3, ease: [0.2, 0.7, 0.2, 1] })
    return () => c.stop()
  }, [active, n, v])
  return <motion.span>{text}</motion.span>
}

/* ---------- stacked layout: one page per entry block ---------- */

function Pages({ active }: { active: boolean }) {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <div className="rounded-[6px] border border-ink/[0.06] bg-paper p-5 shadow-obj">
      <div className={`${MONO} flex justify-between`}>
        <span>pilot logbook</span>
        <span>p. 04</span>
      </div>
      <ul className="mt-3 border-t-[3px] border-double border-ink/25">
        {ENTRIES.map((e, i) => (
          <li key={e.org} className="border-b border-line">
            <button type="button" disabled={!e.more} aria-expanded={e.more ? open === i : undefined} onClick={() => setOpen(o => (o === i ? null : i))} className="block w-full py-3 text-left">
              <span className="font-mono text-[11px] tracking-[0.06em] text-mute">{e.date}</span>
              <span className="mt-0.5 block text-[15px] font-medium text-ink">{e.org}</span>
              <span className="block text-[13px] text-ink/80">{e.role}</span>
              <span className="mt-1 block text-[15px] text-ink">
                {e.summary}{' '}
                {e.more && <span aria-hidden className={`inline-block font-mono text-[11px] text-mute transition-transform ${open === i ? 'rotate-90' : ''}`}>›</span>}
              </span>
              {open === i && e.more && <span className="mt-1 block text-[13px] leading-relaxed text-mute">{e.more}</span>}
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-5">
        <Totals active={active} />
      </div>
    </div>
  )
}
