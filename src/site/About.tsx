import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import FlipCard from '@/components/FlipCard'
import { Obj, Zone, useFlow, useZoneActive } from './Board'
import { sfx } from './sound'
import { asset, Label, reducedMotion, Scribble } from './ui'

const EDGE = 'border border-ink/[0.06]'

/* ───────────── typed lead ───────────── */

const LEAD =
  'I have a habit of getting interested in things and then wanting to know everything about them. The original question is usually innocent. The next forty-seven browser tabs are not.'

/** Types itself in, two chars at a time, while `go` is true. Untyped text stays invisible so the layout never jumps. */
function Lead({ go }: { go: boolean }) {
  const [n, setN] = useState(() => (reducedMotion() ? LEAD.length : 0))
  const last = useRef(0)
  useEffect(() => {
    if (!go || n >= LEAD.length) return
    const id = setTimeout(() => {
      setN(v => Math.min(LEAD.length, v + 2))
      const now = performance.now()
      if (LEAD[n] !== ' ' && now - last.current > 90) {
        last.current = now
        sfx('flap')
      }
    }, /[,.]/.test(LEAD[n]) ? 160 : 26)
    return () => clearTimeout(id)
  }, [go, n])
  return (
    <p className="text-[17px] leading-[1.55] text-ink">
      <span aria-hidden>{LEAD.slice(0, n)}</span>
      <span aria-hidden className={`mx-px inline-block h-[1.05em] w-[2px] translate-y-[0.15em] bg-accent ${n >= LEAD.length ? 'blink' : ''}`} />
      <span aria-hidden className="invisible">{LEAD.slice(n)}</span>
      <span className="sr-only">{LEAD}</span>
    </p>
  )
}

/* ───────────── paper sheet ───────────── */

const P = 'text-[15px] leading-[1.6] text-mute transition-colors duration-500 hover:text-ink'

function Paper({ active }: { active: boolean }) {
  const flow = useFlow()
  const [page, setPage] = useState(0)
  const pages: ReactNode[] = [
    <Fragment key="1">
      <Lead go={active} />
      <p className={P}>I'm from Delhi and currently studying Computer Science at VIT Vellore.</p>
      <p className={P}>
        When I'm not in class, I'm usually out with friends, wandering around, or sitting somewhere talking about absolutely anything. If I'm at my laptop, there's a reasonable chance I'm trying to learn something new, looking up something random, or convincing myself that everyone else has figured life out except me.
      </p>
      <p className={P}>
        That last activity is <Scribble>particularly unproductive</Scribble>.
      </p>
    </Fragment>,
    <Fragment key="2">
      <p className={P}>
        I like software and design, but I'm not interested in spending my entire life staring at a screen. I like travelling, listening to music, discovering places, and understanding how things work outside my immediate bubble.
      </p>
      <p className={P}>
        Japan was one of those experiences that stayed with me. Beyond the places themselves, I was fascinated by the culture, the technology, and the thought put into everyday systems. So many little things seemed considered. It made me want to{' '}
        <Scribble kind="circle">look closer</Scribble> rather than simply tick places off a list.
      </p>
      <p className={P}>I notice details. Sometimes that's useful. Sometimes I'm still adjusting something that nobody else would have noticed in the first place.</p>
    </Fragment>,
  ]
  const turn = () => {
    setPage(p => 1 - p)
    sfx('paper')
  }
  return (
    <div
      className={`relative bg-paper pb-6 pt-6 shadow-obj transition-[rotate,box-shadow] duration-500 ease-[cubic-bezier(.2,.9,.3,1.2)] group-hover/obj:rotate-[1deg] group-hover/obj:shadow-lift ${EDGE} ${flow ? 'px-6' : 'px-9'}`}
    >
      <div className="flex justify-between font-mono text-[11px] uppercase tracking-[0.12em] text-mute">
        <span>about.txt</span>
        {!flow && <span>{page + 1} / 2</span>}
      </div>
      {flow ? (
        <div className="mt-4 space-y-3">{pages}</div>
      ) : (
        // both pages share one grid cell, so the sheet keeps the height of the longer page
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
      {!flow && (
        <button
          onClick={turn}
          aria-label={page ? 'previous page' : 'next page'}
          className="group/turn mt-5 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-mute transition-colors hover:text-ink"
        >
          <span className={`inline-block transition-transform ${page ? 'group-hover/turn:-translate-x-1' : 'group-hover/turn:translate-x-1'}`}>{page ? '←' : '→'}</span>
          <span>{page ? 'p.1' : 'p.2'}</span>
        </button>
      )}
    </div>
  )
}

/* ───────────── polaroid ───────────── */

const photo = 'absolute inset-0 h-full w-full object-cover'

const front = <img src={asset('me/japan.jpg')} alt="Aditya at Amanohashidate, Japan" className={photo} draggable={false} />

const back = (
  <>
    <img src={asset('me/japan.jpg')} alt="" className={`${photo} rotate-180`} draggable={false} />
    <div className="absolute inset-x-2.5 top-2.5 space-y-2 bg-paper/95 p-3.5 text-[13px] leading-snug text-ink/85">
      <p>
        Amanohashidate is famous for its sandbar, which can look like a bridge reaching into the sky when viewed upside down through the traditional <em>matanozoki</em> pose.
      </p>
      <p>I liked the place, but I also liked everything around it: the details, the atmosphere, and seeing a different way of doing things.</p>
      <p className="text-ink">Japan made me want to pay attention.</p>
    </div>
  </>
)

function Polaroid() {
  const [flipped, setFlipped] = useState(false)
  // the terminal's `open japan` flies here, then asks for the back
  useEffect(() => {
    const open = () => {
      sfx('pop')
      setFlipped(true)
    }
    addEventListener('open:japan', open)
    return () => removeEventListener('open:japan', open)
  }, [])
  return (
    <div className={`relative bg-paper p-2.5 pb-0 shadow-obj ${EDGE}`}>
      <span aria-hidden className="absolute -top-3 left-1/2 z-10 h-6 w-24 -translate-x-1/2 -rotate-3 bg-mute/25" />
      <FlipCard
        front={front}
        back={back}
        flipped={flipped}
        onFlipChange={f => {
          setFlipped(f)
          sfx('pop')
        }}
        width={300}
        height={534}
        radius={1}
        background="var(--card)"
        color="var(--ink)"
        shadow={false}
        tiltMax={6}
        hoverScale={1.012}
        glareOpacity={0.14}
        ariaLabel="Amanohashidate, Japan. Flip the photo"
      />
      <div className="flex items-end justify-between gap-2 px-1 pb-3 pt-2.5">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-mute">Amanohashidate, Japan</p>
          <p className="mt-1 text-balance font-hand text-[20px] leading-[1.05] text-ink">a very good place to stand around and think</p>
        </div>
        <span aria-hidden className={`font-mono text-[13px] text-mute transition-transform duration-500 ${flipped ? 'rotate-180' : ''}`}>↻</span>
      </div>
    </div>
  )
}

/* ───────────── zone ───────────── */

const TAG = ['student', 'delhi → vellore', 'avgeek', 'perpetual browser of things']

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
          {TAG.map((t, i) => (
            <Fragment key={t}>
              {i ? ' · ' : ''}
              <span className="whitespace-nowrap">{t}</span>
            </Fragment>
          ))}
        </p>
      </Obj>

      <Obj x={0} y={124} w={560} r={-0.8} z={2} label="about.txt">
        <Paper active={active} />
      </Obj>

      <Obj x={720} y={24} w={320} r={1.6} z={3} label="amanohashidate.jpg">
        <Polaroid />
      </Obj>
    </Zone>
  )
}
