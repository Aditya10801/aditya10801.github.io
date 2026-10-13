import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import FlipCard from '@/components/FlipCard'
import { Obj, Zone, useFlow, useZoneActive } from './Board'
import { sfx } from './sound'
import { asset, Label, reducedMotion, Scribble } from './ui'

const EDGE = 'border border-ink/[0.06]'

/* ───────────── typing helper ───────────── */

/** Reveals `text` two chars at a time while `go` is true. Returns [shown, setShown]. */
function useTyping(text: string, go: boolean, start: number, ms = 26, onKey?: (c: string) => void) {
  const [n, setN] = useState(() => (reducedMotion() ? text.length : start))
  const key = useRef(onKey)
  key.current = onKey
  useEffect(() => {
    if (!go || n >= text.length) return
    const id = setTimeout(() => {
      setN(v => Math.min(text.length, v + 2))
      key.current?.(text[n])
    }, /[,.]/.test(text[n]) ? ms * 6 : ms)
    return () => clearTimeout(id)
  }, [go, n, text, ms])
  return [n, setN] as const
}

/** Typed part visible, the rest invisible so layout never jumps. Screen readers get the whole string. */
const typed = (text: string, n: number, caret?: ReactNode) => (
  <>
    <span aria-hidden>{text.slice(0, n)}</span>
    {caret}
    <span aria-hidden className="invisible">{text.slice(n)}</span>
    <span className="sr-only">{text}</span>
  </>
)

/* ───────────── paper sheet ───────────── */

const LEAD =
  "I can spend an afternoon thinking about how an application should work, then lose the next hour reading about an aircraft I've spotted in the sky. Both feel like time well spent."

function Lead({ go }: { go: boolean }) {
  const last = useRef(0)
  const [n] = useTyping(LEAD, go, 0, 26, c => {
    const now = performance.now()
    if (c === ' ' || now - last.current < 90) return
    last.current = now
    sfx('flap')
  })
  const caret = <span aria-hidden className={`mx-px inline-block h-[1.05em] w-[2px] translate-y-[0.15em] bg-accent ${n >= LEAD.length ? 'blink' : ''}`} />
  return <p className="text-[17px] leading-[1.55] text-ink">{typed(LEAD, n, caret)}</p>
}

const P = 'text-[15px] leading-[1.6] text-mute transition-colors duration-500 hover:text-ink'

function Paper({ active }: { active: boolean }) {
  const flow = useFlow()
  const [page, setPage] = useState(0)
  const pages = [
    <Fragment key="1">
      <Lead go={active} />
      <p className={P}>
        I'm Aditya, a computer science student at VIT Vellore, originally from Delhi. I like understanding{' '}
        <Scribble>the machinery behind things</Scribble>, whether that's the code running an application, the decisions behind a well-designed interface, or the systems that keep an aircraft moving safely through the sky.
      </p>
    </Fragment>,
    <Fragment key="2">
      <p className={P}>
        I got into building software because I wanted to make things, not just learn how they work in theory. One of my favourite examples is{' '}
        <Scribble kind="circle">Altos</Scribble>, an aviation weather application. I designed the interface in Figma, built the frontend and backend, and got it deployed in about five hours. It was messy in places, but it existed. I could use it, test it, and make it better. That feeling is a big part of why I build.
      </p>
      <p className={P}>
        I'm equally drawn to the details people notice and the systems they never see. A button that feels exactly right. An API that behaves predictably. A complicated idea made simple enough that someone doesn't have to think twice about using it.
      </p>
      <p className={P}>I don't have everything figured out. I'd rather keep learning, ship things, and get a little better with every attempt.</p>
    </Fragment>,
  ]
  const turn = () => {
    setPage(p => 1 - p)
    sfx('paper')
  }
  return (
    <div
      className={`relative bg-paper pb-6 pt-6 shadow-obj transition-[rotate,box-shadow] duration-500 ease-[cubic-bezier(.2,.9,.3,1.2)] group-hover/obj:rotate-[1deg] group-hover/obj:shadow-lift ${EDGE} ${flow ? 'px-6' : 'px-8'}`}
    >
      <div className="flex justify-between font-mono text-[11px] uppercase tracking-[0.12em] text-mute">
        <span>about.txt</span>
        {!flow && <span>{page + 1} / 2</span>}
      </div>
      {/* both pages share one grid cell, so the sheet keeps the height of the longer page. Phones just stack them. */}
      {flow ? (
        <div className="mt-4 space-y-3">{pages}</div>
      ) : (
      <div className="mt-4 grid">
        {pages.map((content, i) => (
          <div
            key={i}
            aria-hidden={page !== i}
            inert={page !== i}
            className={`space-y-3 [grid-area:1/1] transition-[opacity,translate] duration-500 ease-[cubic-bezier(.2,.9,.3,1)] ${
              page === i ? 'opacity-100' : `pointer-events-none opacity-0 ${i ? 'translate-x-4' : '-translate-x-4'}`
            }`}
          >
            {content}
          </div>
        ))}
      </div>
      )}
      {!flow && <button
        onClick={turn}
        className="group/turn mt-5 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-mute transition-colors hover:text-ink"
      >
        {page ? <span className="transition-transform group-hover/turn:-translate-x-1">←</span> : null}
        {page ? 'back' : 'continue reading'}
        {page ? null : <span className="transition-transform group-hover/turn:translate-x-1">→</span>}
      </button>}
    </div>
  )
}

/* ───────────── spec sheet ───────────── */

const SPECS: [label: string, value: string][] = [
  ['languages', 'JavaScript (ES6+), TypeScript, Go, Python, C, HTML/CSS'],
  ['frameworks', 'Next.js, React, Node.js, Express, Tailwind CSS, Framer Motion'],
  ['data', 'PostgreSQL (Prisma), MongoDB'],
  ['tools', 'Git, GitHub, Vercel, Figma'],
  ['concepts', 'REST API design, system design, auth, database optimization, offline-first, AI-assisted data extraction, UI/UX'],
]

/** One ruled row. Hover highlights it and re-stamps its values fast. */
function SpecRow({ label, value }: { label: string; value: string }) {
  const [go, setGo] = useState(false)
  const [n, setN] = useTyping(value, go, value.length, 8)
  useEffect(() => {
    if (n >= value.length) setGo(false)
  }, [n, value])
  return (
    <div
      onMouseEnter={() => {
        if (reducedMotion()) return
        setN(0)
        setGo(true)
      }}
      className="group/row relative grid grid-cols-[96px_1fr] gap-3 border-t border-ink/10 py-2.5 first:border-t-0"
    >
      <span aria-hidden className="pointer-events-none absolute -inset-x-3 inset-y-0 bg-ink/[0.035] opacity-0 transition-opacity duration-200 group-hover/row:opacity-100" />
      <span className="relative font-mono text-[11px] uppercase leading-[20px] tracking-[0.12em] text-mute transition-[color,translate] duration-200 group-hover/row:translate-x-1 group-hover/row:text-ink">
        {label}
      </span>
      <span className="relative font-mono text-[13px] leading-[20px] text-ink/80 transition-colors group-hover/row:text-ink">{typed(value, n)}</span>
    </div>
  )
}

function SpecSheet() {
  return (
    <div className={`relative bg-paper shadow-obj ${EDGE}`}>
      <div className="border-b-2 border-ink/80 px-6 pb-3 pt-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-mute">data plate</p>
        <p className="mt-1 text-[22px] font-medium leading-tight tracking-tight text-ink">Aditya Madan</p>
        <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.1em] text-mute">developer + designer · avgeek</p>
      </div>
      <div className="px-6 pr-10 pt-1">
        {SPECS.map(([l, v]) => <SpecRow key={l} label={l} value={v} />)}
      </div>
      <div className="mt-1 flex justify-between border-t border-dashed border-ink/15 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.1em] text-mute">
        <span>b.tech cse · vit vellore</span>
        <span>2024 to 2028</span>
      </div>
    </div>
  )
}

/* ───────────── polaroid ───────────── */

const photo = 'absolute inset-0 h-full w-full object-cover'

const front = <img src={asset('me/japan.jpg')} alt="Aditya at the matanozoki viewing platform, Amanohashidate, Japan" className={photo} draggable={false} />

const back = (
  <>
    <img src={asset('me/japan.jpg')} alt="" className={`${photo} rotate-180`} draggable={false} />
    <div className="absolute inset-x-2 top-2 bg-paper/95 p-3 text-ink">
      <p className="text-[15px] font-medium leading-tight">Matanozoki.</p>
      <p className="mt-1.5 text-[13px] leading-snug text-ink/80">
        At Amanohashidate, there's a tradition of bending over and looking at the view between your legs. The sandbar appears upside down, almost like a bridge stretching into the sky.
      </p>
      <p className="mt-1.5 text-[13px] leading-snug text-ink/80">A reminder that sometimes you don't need a new view. You just need to look at things differently.</p>
    </div>
  </>
)

function Polaroid() {
  return (
    <div className={`relative bg-paper p-2.5 pb-0 shadow-obj ${EDGE}`}>
      <span aria-hidden className="absolute -top-3 left-1/2 z-10 h-6 w-24 -translate-x-1/2 -rotate-3 bg-mute/25" />
      <FlipCard
        front={front}
        back={back}
        width={220}
        height={392}
        radius={1}
        background="var(--card)"
        color="var(--ink)"
        shadow={false}
        tiltMax={7}
        hoverScale={1.015}
        glareOpacity={0.14}
        onFlipChange={() => sfx('pop')}
        ariaLabel="Flip the Japan photo"
      />
      <div className="flex items-baseline justify-between gap-2 px-0.5 pb-2.5 pt-2">
        <span className="font-hand text-[21px] leading-none text-ink">flip it, trust me</span>
        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-mute">japan</span>
      </div>
    </div>
  )
}

/* ───────────── zone ───────────── */

export default function About() {
  const active = useZoneActive('about')
  return (
    <Zone id="about">
      <Obj x={0} y={0} w={640}>
        <Label n="01">about</Label>
        <h2 className="mt-2 text-[32px] font-medium leading-tight tracking-tight text-ink">
          Curious by default. <Scribble kind="double">AvGeek by choice.</Scribble>
        </h2>
        <p className="mt-1.5 font-mono text-[13px] text-mute">
          {["developer + designer", "vit '28", 'delhi → vellore'].map((t, i) => (
            <Fragment key={t}>
              {i ? ' · ' : ''}
              <span className="whitespace-nowrap">{t}</span>
            </Fragment>
          ))}
        </p>
      </Obj>

      <Obj x={0} y={122} w={486} r={-1} z={2} label="about.txt">
        <Paper active={active} />
      </Obj>

      <Obj x={510} y={150} w={420} r={-0.6} z={2} label="spec-sheet">
        <SpecSheet />
      </Obj>

      <Obj x={900} y={70} w={240} r={2} z={3} label="amanohashidate.jpg">
        <Polaroid />
      </Obj>
    </Zone>
  )
}
