import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Label, reducedMotion } from './ui'
import { Obj, Zone, useFlow, useZoneActive } from './Board'

// copy.md, 06. Logbook. Nothing here that isn't in the doc.
type Entry = { tag: string; title?: string; lead: string; more?: string; quiet?: boolean }
const ENTRIES: Entry[] = [
  { tag: 'ORIGIN', title: 'Delhi', lead: 'Originally from Delhi.' },
  {
    tag: '2024 → 2028',
    title: 'VIT Vellore',
    lead: 'B.Tech in Computer Science and Engineering.',
    more: 'Currently making my way through university, with all the learning, experimenting, overthinking, and figuring things out that comes with it.',
  },
  {
    tag: 'VIT VELLORE',
    title: 'VinnovateIT',
    lead: 'Vice Chairperson of VinnovateIT.',
    more: 'A significant part of my university life, alongside the people, events, and work that come with being involved in a student technology club.',
  },
  { tag: 'GDG VIT · DESIGNATHON · 2025', lead: 'Second place.', quiet: true },
]

// left page: tag | entry, gutter, right page: remarks. 500 + 500.
const COLS = 'grid-cols-[28px_140px_308px_48px_448px_28px]'
const GUTTER = 'rgb(0 0 0 / 0.1)'

export default function Log() {
  const active = useZoneActive('log')
  const flow = useFlow()
  return (
    <Zone id="log">
      <Obj x={0} y={0} w={560}>
        <div>
          <Label n="05">logbook</Label>
          <h2 className="mt-3 text-[32px] font-medium leading-tight tracking-tight text-ink">A few coordinates.</h2>
          <div className="mt-1.5 max-w-[60ch] space-y-1.5 text-[15px] leading-relaxed text-mute">
            <p>A very brief record of where I've been and what currently occupies my time.</p>
            <p>No dramatic origin story. I was simply a person before I made a website about being a person.</p>
          </div>
        </div>
      </Obj>

      <Obj x={180} y={196} w={1000} h={470} r={-0.5} label="logbook">
        {flow ? <Pages /> : <Spread active={active} />}
      </Obj>
    </Zone>
  )
}

/* ---------- board: the open spread ---------- */

function Spread({ active }: { active: boolean }) {
  const [open, setOpen] = useState<number | null>(1)
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

        {/* printed head rule */}
        <div aria-hidden className="mt-8 h-[7px] border-y-[3px] border-double border-ink/25" />

        {/* ruled body: entries on top, blank ruled lines fill whatever is left */}
        <div
          className="relative min-h-0 flex-1"
          style={{ background: 'repeating-linear-gradient(to bottom, transparent 0 35px, var(--line) 35px 36px)' }}
        >
          {[168, 524].map(x => <span key={x} aria-hidden className="absolute inset-y-0 w-px bg-line" style={{ left: x }} />)}
          <ul className="relative">
            {ENTRIES.map((e, i) => (e.quiet ? <Quiet key={e.tag} e={e} /> : <Row key={e.tag} e={e} open={open === i} toggle={() => setOpen(o => (o === i ? null : i))} />))}
          </ul>
        </div>

        {/* page foot: just the signature */}
        <div className={`grid ${COLS} border-t border-ink/25 pb-5 pt-4`}>
          <div className="col-span-2 col-start-2 flex items-end gap-3">
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
  const Tag = e.more ? 'button' : 'div'

  return (
    <li className="relative border-b border-line bg-paper">
      <Tag
        {...(e.more ? { type: 'button' as const, 'aria-expanded': open, onClick: toggle } : {})}
        onPointerEnter={() => { setHover(true); setHits(h => h + 1) }}
        onPointerLeave={() => setHover(false)}
        onFocus={() => { setHover(true); setHits(h => h + 1) }}
        onBlur={() => setHover(false)}
        className={`relative grid w-full ${COLS} items-start py-3 text-left outline-offset-[-2px]`}
      >
        <span />
        <span className="pt-0.5 font-mono text-[11px] tracking-[0.06em] text-ink/80">{e.tag}</span>
        <span className="relative min-w-0 border-l border-line pl-3">
          <span className="block text-[15px] font-medium leading-snug text-ink">{e.title}</span>
          {/* ink stamp, the entry's own tag */}
          {hover && (
            <motion.span
              key={hits}
              aria-hidden
              className="pointer-events-none absolute right-6 top-0 rounded-[3px] border-2 border-accent px-1.5 py-px font-mono text-[10px] font-medium tracking-[0.14em] text-accent"
              initial={still ? false : { scale: 1.8, opacity: 0, rotate: -16 }}
              animate={{ scale: 1, opacity: 0.85, rotate: -8 }}
              transition={{ type: 'spring', stiffness: 600, damping: 17 }}
            >
              {e.tag}
            </motion.span>
          )}
        </span>
        <span />
        <span className="relative border-l border-line pl-3 pr-6">
          <span className="block text-[15px] leading-snug text-ink">
            {e.lead}{' '}
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

/** The award, written small. Found by people who look closely. */
function Quiet({ e }: { e: Entry }) {
  return (
    <li className={`grid ${COLS} items-baseline border-b border-line bg-paper py-1.5 text-mute`}>
      <span />
      <span className="col-span-2 font-mono text-[10px] tracking-[0.1em]">{e.tag}</span>
      <span />
      <span className="pl-3 text-[13px]">{e.lead}</span>
    </li>
  )
}

/* ---------- stacked layout ---------- */

function Pages() {
  const [open, setOpen] = useState<number | null>(1)
  return (
    <div className="rounded-[6px] border border-ink/[0.06] bg-paper p-5 shadow-obj">
      <ul className="border-t-[3px] border-double border-ink/25">
        {ENTRIES.map((e, i) =>
          e.quiet ? (
            <li key={e.tag} className="flex flex-wrap items-baseline gap-x-3 border-b border-line py-2 text-mute">
              <span className="font-mono text-[10px] tracking-[0.1em]">{e.tag}</span>
              <span className="text-[13px]">{e.lead}</span>
            </li>
          ) : (
            <li key={e.tag} className="border-b border-line">
              <button type="button" disabled={!e.more} aria-expanded={e.more ? open === i : undefined} onClick={() => setOpen(o => (o === i ? null : i))} className="block w-full py-3 text-left">
                <span className="font-mono text-[11px] tracking-[0.06em] text-mute">{e.tag}</span>
                <span className="mt-0.5 block text-[15px] font-medium text-ink">{e.title}</span>
                <span className="mt-1 block text-[15px] text-ink">
                  {e.lead}{' '}
                  {e.more && <span aria-hidden className={`inline-block font-mono text-[11px] text-mute transition-transform ${open === i ? 'rotate-90' : ''}`}>›</span>}
                </span>
                {open === i && e.more && <span className="mt-1 block text-[13px] leading-relaxed text-mute">{e.more}</span>}
              </button>
            </li>
          ),
        )}
      </ul>
    </div>
  )
}
