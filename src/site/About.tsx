import { Fragment, useEffect, useRef, useState } from 'react'
import FlipCard from '@/components/FlipCard'
import { Obj, Zone, useFlow, useZoneActive } from './Board'
import { sfx } from './sound'
import { asset, Label, reducedMotion, Scribble } from './ui'

/** Off-white paper in light mode, lifted card in dark. Token-derived, no hardcoded theme colors. */
const PAPER = 'bg-[color-mix(in_srgb,var(--bg),white_55%)] [[data-theme=dark]_&]:bg-card'

/* ───────────── paper sheet ───────────── */

const LEAD = 'I like understanding how things work, from the logic behind software to the systems that get a few hundred tonnes of metal safely across the sky.'

/** Types itself in the first time `go` turns true. Untyped text stays invisible so the layout never jumps. */
function Typed({ text, go }: { text: string; go: boolean }) {
  const [n, setN] = useState(() => (reducedMotion() ? text.length : 0))
  const lastKey = useRef(0)
  useEffect(() => {
    if (!go || n >= text.length) return
    const id = setTimeout(() => {
      setN(v => Math.min(text.length, v + 2))
      const now = performance.now()
      if (now - lastKey.current > 90 && text[n] !== ' ') {
        lastKey.current = now
        sfx('flap')
      }
    }, /[,.]/.test(text[n]) ? 160 : 26)
    return () => clearTimeout(id)
  }, [go, n, text])
  const done = n >= text.length
  return (
    <p className="text-[16px] leading-[1.55] text-ink">
      {text.slice(0, n)}
      <span aria-hidden className={`mx-px inline-block h-[1.05em] w-[2px] translate-y-[0.15em] bg-accent ${done ? 'blink' : ''}`} />
      <span aria-hidden className="invisible">{text.slice(n)}</span>
      <span className="sr-only">{text.slice(n)}</span>
    </p>
  )
}

/** Each letter hops like a typebar on hover. Static outer span is the hover target, the inner one moves. */
function Keys({ text }: { text: string }) {
  return (
    <span aria-label={text} role="text">
      {text.split(' ').map((w, wi, all) => (
        <span key={wi} className="inline-block whitespace-nowrap">
          {[...w].map((c, i) => (
            <span key={i} aria-hidden className="group/k inline-block">
              <span className="inline-block transition-[transform,color] duration-150 group-hover/k:-translate-y-[3px] group-hover/k:text-accent">{c}</span>
            </span>
          ))}
          {wi < all.length - 1 && ' '}
        </span>
      ))}
    </span>
  )
}

function Paper({ active, flow }: { active: boolean; flow: boolean }) {
  return (
    <div
      className={`relative border border-line pb-8 pt-8 font-mono shadow-[0_18px_40px_-24px_rgb(0_0_0/0.45)] transition-[rotate,box-shadow] duration-500 ease-[cubic-bezier(.2,.9,.3,1.2)] group-hover/obj:rotate-[1.2deg] group-hover/obj:shadow-[0_28px_50px_-24px_rgb(0_0_0/0.5)] ${flow ? 'px-6' : 'px-9'} ${PAPER}`}
    >
      <h2 className="text-[22px] font-medium leading-[1.3] tracking-tight text-ink">
        <Keys text="Curious by default." /> <Scribble kind="double"><Keys text="AvGeek by choice." /></Scribble>
      </h2>
      <div className="mt-5">
        <Typed text={LEAD} go={active} />
      </div>
      <p className="mt-4 text-[15px] leading-[1.6] text-mute transition-colors duration-500 hover:text-ink">
        I'm a builder who enjoys{' '}
        {flow ? <>connecting seemingly <Scribble>unrelated interests</Scribble></> : <Scribble>connecting seemingly unrelated interests</Scribble>}, and I like{' '}
        <Scribble kind="circle">learning by doing</Scribble>: getting my hands dirty and figuring things out.
      </p>
      <p className="mt-6 border-t border-dashed border-line pt-3 text-[11px] uppercase tracking-[0.12em] text-mute">
        {["developer + designer", "vit '28", 'delhi → vellore'].map((t, i) => (
          <Fragment key={t}>
            {i ? ' · ' : ''}
            <span className="whitespace-nowrap">{t}</span>
          </Fragment>
        ))}
      </p>
    </div>
  )
}

/* ───────────── polaroid ───────────── */

const photo = 'absolute inset-0 h-full w-full object-cover'

const front = <img src={asset('me/japan.jpg')} alt="Aditya at the matanozoki viewing platform, Amanohashidate, Japan" className={photo} draggable={false} />

const back = (
  <>
    <img src={asset('me/japan.jpg')} alt="" className={`${photo} rotate-180`} draggable={false} />
    <div className="absolute inset-x-2 top-2 border border-line bg-bg/90 p-3 text-ink">
      <p className="text-[15px] font-medium leading-tight">
        股のぞき <span className="font-normal text-mute">matanozoki</span>
      </p>
      <p className="mt-1.5 text-[13px] leading-snug text-ink/80">
        the tradition here is to bend over and look at the view through your legs. upside down, the sandbar looks like a bridge into the sky.
      </p>
    </div>
  </>
)

function Polaroid() {
  return (
    <div className={`relative p-2.5 pb-0 shadow-[0_20px_40px_-22px_rgb(0_0_0/0.5)] ${PAPER}`}>
      {/* signature detail: one strip of tape */}
      <span aria-hidden className="absolute -top-3 left-1/2 z-10 h-6 w-24 -translate-x-1/2 -rotate-3 bg-[color-mix(in_srgb,var(--mute)_30%,transparent)]" />
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
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-mute">japan</span>
      </div>
    </div>
  )
}

/* ───────────── zone ───────────── */

export default function About() {
  const flow = useFlow()
  const active = useZoneActive('about')
  return (
    <Zone id="about">
      <Obj x={110} y={40} w={480}>
        <Label n="01">about</Label>
      </Obj>

      <Obj x={110} y={112} w={480} r={-1.2} z={2} label="about.txt">
        <Paper active={active} flow={flow} />
      </Obj>

      <Obj x={690} y={92} w={240} r={2.5} z={3} label="amanohashidate.jpg">
        <Polaroid />
      </Obj>
    </Zone>
  )
}
