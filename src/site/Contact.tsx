import { useEffect, useId, useMemo, useRef, useState, type PointerEvent as RPointerEvent, type RefObject } from 'react'
import { AnimatePresence, animate, motion, useInView, useMotionValue, useSpring } from 'motion/react'
import DecryptedText from '@/components/DecryptedText'
import Magnet from '@/components/Magnet'
import { LINKS, Label, RollText, reducedMotion, useFinePointer } from './ui'
import { Obj, Zone, useFlow, useZoneActive } from './Board'
import { board, goto } from './map'
import { sfx } from './sound'

const PASS_INK = '#141312' // printed ink on the orange pass, same in both themes
// e-gate LEDs are hardware colors, not theme colors
const LED = { amber: '#ffb800', green: '#3ddc84', red: '#ff4d3d', glass: '#121211' }
const CLASSES = ['HELLO', 'COLLAB', 'AVGEEK TALK', 'OTHER'] as const
type Cls = (typeof CLASSES)[number]
const SUBJECT: Record<Cls, string> = { HELLO: 'Hello', COLLAB: 'Collab', 'AVGEEK TALK': 'AvGeek talk', OTHER: 'Other' }
type Gate = 'idle' | 'over' | 'scan' | 'ok' | 'denied' | 'offline'

const ROW = 'group relative grid grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-3 py-3.5 sm:grid-cols-[88px_minmax(0,1fr)_auto]'
const VAL = 'text-[14px] sm:text-[15px]'
const LBL = 'font-mono text-[11px] uppercase tracking-[0.14em] text-mute'

const hash = (s: string) => {
  let h = 2166136261
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}

const copyEmail = async () => {
  try {
    await navigator.clipboard.writeText(LINKS.email)
    return true
  } catch {
    return false
  }
}

/** copied flag that resets itself after `ms` */
function useCopied(ms = 2000) {
  const [copied, setCopied] = useState(false)
  const t = useRef(0)
  useEffect(() => () => clearTimeout(t.current), [])
  const copy = async () => {
    if (!(await copyEmail())) return
    setCopied(true)
    clearTimeout(t.current)
    t.current = window.setTimeout(() => setCopied(false), ms)
  }
  return [copied, copy] as const
}

type Field = 'name' | 'email' | 'message'
type Form = Record<Field, string>
const EMPTY: Form = { name: '', email: '', message: '' }
const KEY = import.meta.env.VITE_WEB3FORMS_KEY as string | undefined

// copy.md, 08. Contact: interaction states
const SAY = {
  idle: 'ready when you are',
  hover: 'this is less complicated than airport security',
  scan: 'transmitting...',
  ok: 'message received. thanks for stopping by.',
  offline: 'transmission failed. try the direct email route.',
}

/** The browser's own "fill out this field" message, so validation adds no copy of ours. */
const requiredMsg = () => {
  const i = document.createElement('input')
  i.required = true
  return i.validationMessage
}

export default function Contact() {
  const active = useZoneActive('contact')
  const [form, setForm] = useState<Form>(EMPTY)
  const [cls, setCls] = useState<Cls>('HELLO')
  const [gate, setGate] = useState<Gate>('idle')
  const [hint, setHint] = useState(false) // pointer on the clearance button
  const [denied, setDenied] = useState('')
  const scanner = useRef<HTMLDivElement>(null)
  const bot = useRef<HTMLInputElement>(null)
  const timers = useRef<number[]>([])
  const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms))
  const clear = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  useEffect(() => clear, [])

  const nm = form.name.trim()
  const em = form.email.trim()
  const msg = form.message.trim()
  const subject = `${SUBJECT[cls]} from ${nm}`
  const mailto = `mailto:${LINKS.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`${msg}\n\n${nm}`)}`

  const deliver = async () => {
    const sweep = new Promise(r => setTimeout(r, reducedMotion() ? 0 : 900)) // let the scan line play
    let ok = !!bot.current?.checked // honeypot ticked: pretend it worked, send nothing
    if (!ok && KEY) {
      try {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ access_key: KEY, subject, from_name: nm, name: nm, email: em, message: msg, class: cls, botcheck: '' }),
        })
        ok = !!(await res.json()).success
      } catch {
        ok = false
      }
    }
    await sweep
    if (!ok) return setGate('offline')
    setGate('ok')
    sfx('beep')
    later(4000, () => setForm(EMPTY))
    later(6000, () => setGate(g => (g === 'ok' ? 'idle' : g)))
  }

  const deny = (message: string) => {
    clear()
    setDenied(message)
    setGate('denied')
    sfx('deny')
    later(2600, () => setGate(g => (g === 'denied' ? 'idle' : g)))
  }
  const send = () => {
    clear()
    setGate('scan')
    void deliver()
  }

  return (
    <Zone id="contact">
      <Obj x={0} y={0} w={520}>
        <Header active={active} />
      </Obj>

      <Obj x={0} y={300} w={720} h={320} r={-1} z={2} label="boarding-pass">
        <Pass
          form={form}
          setForm={setForm}
          cls={cls}
          setCls={setCls}
          gate={gate}
          setGate={setGate}
          setHint={setHint}
          denied={denied}
          deny={deny}
          send={send}
          mailto={mailto}
          scanner={scanner}
          bot={bot}
          active={active}
        />
      </Obj>

      <Obj x={860} y={330} w={240} r={1.5} z={5} label="gate">
        <Scanner ref={scanner} gate={gate} hint={hint} denied={denied} active={active} />
      </Obj>

      <Obj x={780} y={0} w={420} label="other-ways-in">
        <Channels active={active} />
      </Obj>

      <Obj x={780} y={598} w={420}>
        <FooterLine />
      </Obj>
    </Zone>
  )
}

/* ---------- header ---------- */

const TITLE = "Say hi. Don't overthink it."
const BODY = [
  "Have an interesting idea, a good recommendation, a question about something I've made, or a plane you've been trying to identify?",
  "I'm happy to hear from you.",
  'We can talk about software, design, aviation, travel, music, or absolutely nothing important.',
  "You don't need a perfectly written message. I spend enough time trying to make things perfect already.",
]

function Header({ active }: { active: boolean }) {
  const still = reducedMotion()
  return (
    <div>
      <Label n="07">contact</Label>
      <h2 className="mt-2 flex flex-wrap gap-x-[0.28em] text-[32px] font-medium leading-tight tracking-tight text-ink" aria-label={TITLE}>
        {TITLE.split(' ').map((w, wi, all) => {
          const at = all.slice(0, wi).join('').length // letter index offset for the stagger
          return (
            <span key={wi} aria-hidden className="inline-flex overflow-hidden pt-1">
              {[...w].map((c, i) => (
                <motion.span
                  key={i}
                  className="inline-block transition-[color,translate] duration-200 hover:-translate-y-1 hover:text-accent"
                  initial={false}
                  animate={{ y: active || still ? '0%' : '110%' }}
                  transition={{ duration: 0.5, delay: active ? 0.1 + (at + i) * 0.02 : 0, ease: [0.2, 0.8, 0.2, 1] }}
                >
                  {c}
                </motion.span>
              ))}
            </span>
          )
        })}
      </h2>
      <div className="mt-2 max-w-[60ch] space-y-2 text-[15px] leading-relaxed text-mute">
        {BODY.map(p => <p key={p}>{p}</p>)}
      </div>
    </div>
  )
}

/* ---------- boarding pass (a real form) ---------- */

type PassProps = {
  form: Form
  setForm: (f: (f: Form) => Form) => void
  cls: Cls
  setCls: (c: Cls) => void
  gate: Gate
  setGate: (g: Gate) => void
  setHint: (v: boolean) => void
  denied: string
  deny: (message: string) => void
  send: () => void
  mailto: string
  scanner: RefObject<HTMLDivElement | null>
  bot: RefObject<HTMLInputElement | null>
  active: boolean
}

const FIELD_LBL = 'block text-[11px] tracking-[0.16em] opacity-60'
const UNDERLINE = 'relative block border-b border-current/40 transition-colors focus-within:border-current'

function Pass({ form, setForm, cls, setCls, gate, setGate, setHint, denied, deny, send, mailto, scanner, bot, active }: PassProps) {
  const flow = useFlow()
  const fine = useFinePointer()
  const id = useId()
  const self = useRef<HTMLDivElement>(null)
  const refs = { name: useRef<HTMLInputElement>(null), email: useRef<HTMLInputElement>(null), message: useRef<HTMLTextAreaElement>(null) }
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rx = useSpring(0, { stiffness: 200, damping: 20 })
  const ry = useSpring(0, { stiffness: 200, damping: 20 })
  const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [focused, setFocused] = useState(false)
  const busy = gate === 'scan' || gate === 'ok'
  const set = (k: Field) => (e: { target: { value: string } }) => setForm(f => ({ ...f, [k]: e.target.value }))

  const home = (delay = 0) => {
    const o = { type: 'spring' as const, stiffness: 260, damping: 22, delay }
    animate(x, 0, o)
    animate(y, 0, o)
  }
  const shake = async () => {
    if (reducedMotion()) return home()
    const cx = x.get()
    await animate(x, [cx, cx - 12, cx + 10, cx - 6, cx + 3, cx], { duration: 0.42 })
    home()
  }
  /** Validate with the browser's own rules, then hand over to the gate. */
  const run = () => {
    if (busy) return home()
    const bad = (['name', 'email', 'message'] as const).find(k => {
      const el = refs[k].current
      return !el || !el.value.trim() || !el.checkValidity()
    })
    if (bad) {
      const el = refs[bad].current!
      deny(el.value.trim() ? el.validationMessage : requiredMsg())
      el.focus({ preventScroll: true })
      shake()
      return
    }
    send()
    home(1.2)
  }

  const over = (e: RPointerEvent) => {
    const s = scanner.current?.getBoundingClientRect()
    const p = self.current?.getBoundingClientRect()
    if (!s || !p) return false
    if (e.clientX > s.left && e.clientX < s.right && e.clientY > s.top && e.clientY < s.bottom) return true
    const ox = Math.max(0, Math.min(s.right, p.right) - Math.max(s.left, p.left))
    const oy = Math.max(0, Math.min(s.bottom, p.bottom) - Math.max(s.top, p.top))
    return ox * oy > 0.3 * s.width * s.height
  }

  const down = (e: RPointerEvent<HTMLDivElement>) => {
    if (flow || e.button !== 0 || (e.target as Element).closest('input, textarea, button, a')) return
    e.stopPropagation()
    drag.current = { px: e.clientX, py: e.clientY, ox: x.get(), oy: y.get() }
    e.currentTarget.setPointerCapture(e.pointerId)
    rx.set(0)
    ry.set(0)
    setDragging(true)
  }
  const move = (e: RPointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) {
      // hover tilt goes on the inner card, the hover target never moves
      if (!fine || flow || reducedMotion()) return
      const r = e.currentTarget.getBoundingClientRect()
      ry.set(((e.clientX - r.left) / r.width - 0.5) * 4)
      rx.set(-((e.clientY - r.top) / r.height - 0.5) * 5)
      return
    }
    const z = board.cam.z || 1
    x.set(d.ox + (e.clientX - d.px) / z)
    y.set(d.oy + (e.clientY - d.py) / z)
    if (gate === 'idle' || gate === 'over') setGate(over(e) ? 'over' : 'idle')
  }
  const up = (e: RPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    drag.current = null
    setDragging(false)
    if (over(e)) run()
    else {
      if (gate === 'over') setGate('idle')
      home()
    }
  }

  // barcode: bars and gaps as flex weights, so a new seed animates instead of popping
  const bars = useMemo(() => {
    let s = hash(`${form.name.trim().toUpperCase()}|${cls}`) || 1
    const rnd = () => ((s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909)) >>> 0) / 4294967296
    return Array.from({ length: 56 }, (_, i) => (i % 2 ? 1 + Math.floor(rnd() * 2) : 1 + Math.floor(rnd() * 4)))
  }, [form.name, cls])

  const status = gate === 'scan' ? SAY.scan : gate === 'ok' ? SAY.ok : gate === 'offline' ? SAY.offline : gate === 'denied' ? denied : ''

  return (
    <motion.div
      ref={self}
      style={{ x, y }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onPointerLeave={() => { if (!drag.current) { rx.set(0); ry.set(0) } }}
      className={`relative ${flow ? '' : 'h-full touch-none'} ${dragging ? 'cursor-grabbing' : flow ? '' : 'cursor-grab'}`}
    >
      <motion.form
        noValidate
        aria-label="Boarding pass. Write to Aditya"
        onSubmit={e => { e.preventDefault(); run() }}
        style={{ rotateX: rx, rotateY: ry, transformPerspective: 900, color: PASS_INK }}
        className={`flex h-full overflow-hidden rounded-[14px] bg-accent font-mono transition-shadow duration-300 ${flow ? 'flex-col' : ''} ${dragging ? 'shadow-lift' : 'shadow-obj'}`}
      >
        {/* honeypot, people never see it */}
        <input ref={bot} type="checkbox" name="botcheck" tabIndex={-1} autoComplete="off" aria-hidden style={{ display: 'none' }} />

        {/* body */}
        <div className="flex min-w-0 flex-1 flex-col gap-3 p-6">
          <div className="flex items-baseline justify-between">
            <span className="flex items-baseline gap-2">
              <span className={FIELD_LBL}>PASSENGER</span>
              <span className="text-[12px] font-medium tracking-[0.14em]">ADITYA / ADI</span>
            </span>
            <span aria-hidden className="text-[13px]">✈︎</span>
          </div>

          <div className={`grid gap-4 ${flow ? '' : 'grid-cols-[1fr_1.2fr]'}`}>
            <div>
              <label htmlFor={`${id}-name`} className={FIELD_LBL}>YOUR NAME</label>
              <span className={UNDERLINE}>
                <input
                  id={`${id}-name`}
                  ref={refs.name}
                  name="name"
                  value={form.name}
                  onChange={set('name')}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  readOnly={busy}
                  required
                  maxLength={40}
                  spellCheck={false}
                  autoComplete="name"
                  aria-invalid={(gate === 'denied' && !form.name.trim()) || undefined}
                  className="w-full bg-transparent py-0.5 text-[17px] font-medium uppercase tracking-[0.08em]"
                  style={{ caretColor: PASS_INK, outline: 'none' }} // focus shows as the solid underline
                />
                {!focused && !busy && (
                  <span
                    aria-hidden
                    className={`${active ? 'blink' : ''} pointer-events-none absolute top-1/2 h-[1.05em] w-[0.55em] -translate-y-1/2 bg-current text-[17px]`}
                    style={{ left: `calc(${Math.min(form.name.length, 20)} * (1ch + 0.08em) + 2px)` }}
                  />
                )}
              </span>
            </div>
            <div>
              <label htmlFor={`${id}-email`} className={FIELD_LBL}>REPLY-TO EMAIL</label>
              <span className={UNDERLINE}>
                <input
                  id={`${id}-email`}
                  ref={refs.email}
                  name="email"
                  type="email"
                  inputMode="email"
                  pattern="[^\s@]+@[^\s@]+\.[^\s@]{2,}"
                  value={form.email}
                  onChange={set('email')}
                  readOnly={busy}
                  required
                  maxLength={120}
                  spellCheck={false}
                  autoComplete="email"
                  className="w-full bg-transparent py-0.5 text-[15px] font-medium tracking-[0.02em]"
                  style={{ caretColor: PASS_INK, outline: 'none' }}
                />
              </span>
            </div>
          </div>

          <div>
            <label htmlFor={`${id}-msg`} className={FIELD_LBL}>MESSAGE</label>
            <textarea
              id={`${id}-msg`}
              ref={refs.message}
              name="message"
              value={form.message}
              onChange={set('message')}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); run() } }}
              readOnly={busy}
              required
              rows={2}
              maxLength={2000}
              aria-keyshortcuts="Control+Enter Meta+Enter"
              className="block w-full resize-none bg-transparent text-[14px] leading-[22px]"
              style={{
                caretColor: PASS_INK,
                outline: 'none',
                // ruled lines, like the back of a ticket
                background: 'repeating-linear-gradient(to bottom, transparent 0 21px, color-mix(in srgb, currentColor 32%, transparent) 21px 22px)',
              }}
            />
          </div>

          <div>
            <span className={FIELD_LBL} id={`${id}-class`}>CLASS</span>
            <div role="radiogroup" aria-labelledby={`${id}-class`} className="mt-1 flex flex-wrap gap-1.5">
              {CLASSES.map(c => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={cls === c}
                  onClick={() => setCls(c)}
                  className={`relative rounded-[3px] border px-2 py-0.5 text-[12px] tracking-[0.1em] transition-[opacity,border-color] ${cls === c ? 'border-current font-medium' : 'border-dashed border-current/35 opacity-60 hover:opacity-100'}`}
                >
                  {c}
                  {cls === c && <Stamp key={c} />}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto flex items-end gap-3">
            <div aria-hidden className="flex h-8 flex-1">
              {bars.map((w, i) => (
                <span
                  key={i}
                  className="basis-0 transition-[flex-grow] duration-300 ease-out"
                  style={{ flexGrow: w, background: i % 2 ? 'transparent' : 'currentColor', transitionDelay: `${i * 4}ms` }}
                />
              ))}
            </div>
            <button
              type="submit"
              disabled={gate === 'scan'}
              onPointerEnter={() => setHint(true)}
              onPointerLeave={() => setHint(false)}
              onFocus={() => setHint(true)}
              onBlur={() => setHint(false)}
              className="group/scan shrink-0 rounded-[3px] bg-current px-2.5 py-1.5 text-[12px] tracking-[0.12em] transition-transform active:scale-95 disabled:opacity-60"
            >
              <span className="text-accent">
                REQUEST CLEARANCE <span aria-hidden className="inline-block transition-transform group-hover/scan:translate-x-0.5">→</span>
              </span>
            </button>
          </div>
        </div>

        {/* perforation, printed not torn */}
        <div aria-hidden className={flow ? 'mx-4 border-t-2 border-dotted border-current/40' : 'my-4 border-l-2 border-dotted border-current/40'} />

        {/* stub */}
        <dl className={`relative flex shrink-0 gap-4 p-6 ${flow ? 'flex-wrap justify-between' : 'w-[170px] flex-col justify-between'}`}>
          {[['SEAT', 'YOUR CHOICE'], ['FROM', 'WHEREVER YOU ARE'], ['TO', "ADITYA'S INBOX"]].map(([k, v]) => (
            <div key={k}>
              <dt className="text-[11px] tracking-[0.16em] opacity-60">{k}</dt>
              <dd className={`font-medium tracking-[0.04em] ${k === 'SEAT' ? 'text-[15px]' : 'text-[12px]'}`}>{v}</dd>
            </div>
          ))}
          <AnimatePresence>
            {gate === 'ok' && (
              <motion.span
                aria-hidden
                initial={{ scale: 1.8, opacity: 0, rotate: -18 }}
                animate={{ scale: 1, opacity: 0.9, rotate: -12 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                className="pointer-events-none absolute left-1/2 top-1/2 -ml-8 -mt-8 grid size-16 place-items-center rounded-full border-[3px] border-double border-current text-[26px]"
              >
                ✓
              </motion.span>
            )}
          </AnimatePresence>
        </dl>
      </motion.form>

      {/* quiet status line under the pass, also the live region */}
      <p
        role="status"
        aria-live="polite"
        className={`flex min-h-6 flex-wrap items-center gap-x-3 font-mono text-[13px] text-mute ${flow ? 'mt-3' : 'absolute left-6 top-full mt-4'}`}
      >
        <span className={gate === 'denied' ? 'text-ink' : ''}>{status}</span>
        {gate === 'offline' && (
          <a href={mailto} className="text-ink underline decoration-line underline-offset-4 transition-colors hover:decoration-ink">
            {LINKS.email} <span aria-hidden className="inline-block">↗</span>
          </a>
        )}
      </p>
    </motion.div>
  )
}

/** Rubber stamp that thumps onto the selected class chip. */
function Stamp() {
  return (
    <motion.span
      aria-hidden
      initial={reducedMotion() ? false : { scale: 1.9, opacity: 0, rotate: -14 }}
      animate={{ scale: 1, opacity: 1, rotate: -6 }}
      transition={{ type: 'spring', stiffness: 600, damping: 16 }}
      className="pointer-events-none absolute -inset-[4px] rounded-[4px] border-2 border-current"
    />
  )
}

function Scanner({ ref, gate, hint, denied, active }: { ref: RefObject<HTMLDivElement | null>; gate: Gate; hint: boolean; denied: string; active: boolean }) {
  const still = reducedMotion()
  const light = gate === 'ok' ? LED.green : gate === 'denied' ? LED.red : gate === 'idle' ? '' : LED.amber
  const color = gate === 'ok' ? LED.green : gate === 'denied' ? LED.red : LED.amber
  const text =
    gate === 'ok' ? SAY.ok
    : gate === 'denied' ? denied
    : gate === 'scan' ? SAY.scan
    : gate === 'offline' ? SAY.offline
    : hint ? SAY.hover
    : SAY.idle
  const long = text.length > 22 && !still && active

  return (
    <div ref={ref} className="rounded-[12px] border border-ink/[0.06] bg-paper p-3 shadow-obj">
      <div className="flex items-center gap-2.5">
        {/* the status line under the pass speaks for screen readers */}
        <div
          aria-hidden
          className="relative min-w-0 flex-1 overflow-hidden whitespace-nowrap rounded-[3px] px-2.5 py-2 font-mono text-[12px] tracking-[0.06em]"
          style={{ background: LED.glass, color, textShadow: `0 0 6px ${color}80` }}
        >
          <motion.div key={text} initial={still ? false : { y: '-100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.2 }}>
            {long ? (
              <span className="inline-block animate-[led-marquee_9s_linear_infinite]">{text}{' '.repeat(6)}{text}{' '.repeat(6)}</span>
            ) : (
              <span className="block truncate">{text}</span>
            )}
          </motion.div>
        </div>
        <span
          aria-hidden
          className={`size-3 shrink-0 rounded-full transition-[background-color,box-shadow] duration-200 ${gate === 'scan' || gate === 'over' ? 'animate-[blink_0.5s_steps(1)_infinite]' : ''}`}
          style={light ? { background: light, boxShadow: `0 0 10px ${light}` } : { background: 'color-mix(in srgb, var(--ink) 14%, transparent)' }}
        />
      </div>
      {/* scan window */}
      <div className={`relative mt-3 h-[112px] overflow-hidden rounded-[6px] border bg-ink/[0.04] transition-colors ${gate === 'over' ? 'border-accent' : 'border-line'}`}>
        {gate === 'scan' && !still && (
          <motion.span
            aria-hidden
            className="absolute inset-x-1 h-[2px] rounded-full"
            style={{ background: LED.red, boxShadow: `0 0 12px 2px ${LED.red}` }}
            initial={{ top: '4%' }}
            animate={{ top: ['4%', '92%', '4%'] }}
            transition={{ duration: 0.9, ease: 'easeInOut', repeat: Infinity }}
          />
        )}
      </div>
      <style>{`@keyframes led-marquee { to { transform: translateX(-50%) } }`}</style>
    </div>
  )
}

/* ---------- channels ---------- */

function Channels({ active }: { active: boolean }) {
  return (
    <ul className="divide-y divide-line rounded-[8px] border border-ink/[0.06] bg-paper px-5 py-1.5 shadow-obj">
      <EmailRow />
      <GithubRow active={active} />
      <LinkedinRow />
      <InstaRow />
      <ResumeRow />
    </ul>
  )
}

function EmailRow() {
  const [copied, copy] = useCopied()
  return (
    <li className={ROW}>
      <span className={LBL}>email</span>
      <button onClick={copy} className={`min-w-0 truncate text-left ${VAL}`} aria-label={`Copy email address ${LINKS.email}`}>
        <DecryptedText
          key={String(copied)}
          text={copied ? `${LINKS.email} ✓` : LINKS.email}
          animateOn="view"
          sequential
          speed={22}
          characters="abcdefghijklmnopqrstuvwxyz@._"
          encryptedClassName="text-accent"
        />
      </button>
      <a
        href={`mailto:${LINKS.email}?subject=hi%20aditya`}
        aria-label="Write an email"
        className="font-mono text-[13px] text-mute transition-[color,translate] hover:-translate-y-0.5 hover:translate-x-0.5 hover:text-accent"
      >
        ↗
      </a>
      <span role="status" className="sr-only">{copied ? 'Email copied to clipboard' : ''}</span>
    </li>
  )
}

function GithubRow({ active }: { active: boolean }) {
  const fine = useFinePointer()
  const ref = useRef<HTMLAnchorElement>(null)
  const inView = useInView(ref, { amount: 0.8 })
  const [hover, setHover] = useState(false)
  const [cells, setCells] = useState<number[]>(() => Array(21).fill(0))
  const on = (fine ? hover : inView) && active // touch: plays while the row is on screen

  useEffect(() => {
    if (!on) return
    const roll = () => setCells(Array.from({ length: 21 }, () => (Math.random() < 0.5 ? 1 + Math.floor(Math.random() * 4) : 0)))
    roll()
    if (reducedMotion()) return
    const id = setInterval(roll, 150)
    return () => clearInterval(id)
  }, [on])

  return (
    <li>
      <a
        ref={ref}
        href={LINKS.github}
        target="_blank"
        rel="noreferrer"
        className={ROW}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
        aria-label="GitHub, github.com/Aditya10801"
      >
        <span className={LBL}>github</span>
        <Magnet padding={24} magnetStrength={5} maxOffset={5} className="min-w-0">
          <span className={`block truncate ${VAL}`}>github.com/Aditya10801</span>
        </Magnet>
        <span className="relative font-mono text-[13px] text-mute transition-colors group-hover:text-accent">
          {/* contribution grid, only while hovered */}
          <span aria-hidden className={`pointer-events-none absolute right-full top-1/2 mr-2 hidden -translate-y-1/2 grid-cols-7 gap-[2px] transition-opacity duration-300 sm:grid ${on ? 'opacity-100' : 'opacity-0'}`}>
            {cells.map((c, i) => (
              <span
                key={i}
                className="h-[5px] w-[5px] rounded-[1px] bg-line transition-colors duration-200"
                style={on && c ? { background: `color-mix(in srgb, var(--accent) ${c * 25}%, transparent)` } : undefined}
              />
            ))}
          </span>
          <span aria-hidden>↗</span>
        </span>
      </a>
    </li>
  )
}

function LinkedinRow() {
  const draw = 'stroke-accent [stroke-dasharray:1] [stroke-dashoffset:1] transition-[stroke-dashoffset] ease-out group-hover:[stroke-dashoffset:0] group-focus-visible:[stroke-dashoffset:0]'
  return (
    <li>
      <a href={LINKS.linkedin} target="_blank" rel="noreferrer" className={ROW} aria-label="LinkedIn, linkedin.com/in/aditya-madan">
        <span className={LBL}>linkedin</span>
        <RollText text="linkedin.com/in/aditya-madan" className={VAL} />
        <svg viewBox="0 0 16 16" fill="none" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 overflow-visible" aria-hidden>
          <path d="M3 13 L13 3" className="stroke-mute/40" />
          <path d="M5.5 3 H13 V10.5" className="stroke-mute/40" />
          <path d="M3 13 L13 3" pathLength={1} className={`${draw} duration-300`} />
          <path d="M5.5 3 H13 V10.5" pathLength={1} className={`${draw} duration-200 group-hover:delay-200`} />
        </svg>
      </a>
    </li>
  )
}

function InstaRow() {
  const [n, setN] = useState(0)
  const snap = () => { if (!reducedMotion()) setN(v => v + 1) }
  return (
    <li>
      <a
        href={LINKS.instagram}
        target="_blank"
        rel="noreferrer"
        className={`${ROW} overflow-hidden`}
        onPointerEnter={e => e.pointerType === 'mouse' && snap()}
        onPointerDown={e => e.pointerType !== 'mouse' && snap()}
        aria-label="Instagram, @your.avg.engineer"
      >
        <span className={LBL}>instagram</span>
        <span key={n} className={`truncate ${VAL}`}>
          {[...'@your.avg.engineer'].map((c, i) => (
            <motion.span
              key={i}
              className="inline-block whitespace-pre"
              animate={n ? { y: [0, -3, 1.5, 0], rotate: [0, i % 2 ? 9 : -9, i % 2 ? -5 : 5, 0] } : undefined}
              transition={{ duration: 0.42, delay: 0.06 + i * 0.012 }}
            >
              {c}
            </motion.span>
          ))}
        </span>
        <span aria-hidden className="font-mono text-[13px] text-mute transition-colors group-hover:text-accent">↗</span>
        {n > 0 && (
          <motion.span
            key={`f${n}`}
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-ink"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.85, 0] }}
            transition={{ duration: 0.15, times: [0, 0.25, 1] }}
          />
        )}
      </a>
    </li>
  )
}

function ResumeRow() {
  const [pct, setPct] = useState(-1) // -1 = idle
  const timer = useRef(0)
  useEffect(() => () => clearInterval(timer.current), [])
  const start = () => {
    clearInterval(timer.current)
    if (reducedMotion()) return setPct(100)
    setPct(0)
    timer.current = window.setInterval(() => setPct(p => Math.min(100, p + 3 + Math.floor(Math.random() * 9))), 60)
  }
  const stop = () => {
    clearInterval(timer.current)
    setPct(-1)
  }
  const W = 10
  const k = Math.round((Math.max(0, pct) / 100) * W)
  return (
    <li>
      <a
        href={LINKS.resume}
        download
        className={ROW}
        onPointerEnter={start}
        onPointerLeave={stop}
        onFocus={start}
        onBlur={stop}
        onClick={() => pct < 0 && start()}
        aria-label="Download résumé, PDF"
      >
        <span className={LBL}>résumé</span>
        <span className="flex min-w-0 items-baseline gap-3">
          <span className={VAL}>resume.pdf</span>
          <span aria-hidden className="truncate whitespace-pre font-mono text-[11px] text-mute">
            {pct < 0 ? '' : `[${'#'.repeat(k)}${'.'.repeat(W - k)}] ${String(Math.min(pct, 100)).padStart(3)}%`}
          </span>
        </span>
        <span aria-hidden className="font-mono text-[13px] text-mute group-hover:animate-bounce group-hover:text-accent">↓</span>
      </a>
    </li>
  )
}

/* ---------- footer ---------- */

function FooterLine() {
  return (
    <footer className="font-mono text-[11px] leading-relaxed text-mute">
      <p className="text-ink/80">made with an unreasonable amount of attention to detail.</p>
      <p>and probably one more adjustment after this.</p>
      <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 tracking-[0.08em]">
        <span>
          ©{' '}
          <span tabIndex={0} aria-describedby="year-note" className="group/year relative cursor-default outline-offset-2">
            2026
            {/* the perfectionist's easter egg: an alignment guide and a note */}
            <span aria-hidden className="pointer-events-none absolute -inset-x-1 -bottom-0.5 h-px bg-sel opacity-0 transition-opacity group-hover/year:opacity-100 group-focus/year:opacity-100" />
            <span
              id="year-note"
              role="tooltip"
              className="pointer-events-none absolute bottom-full left-0 mb-1.5 whitespace-nowrap rounded-[3px] bg-ink px-1.5 py-0.5 text-[11px] tracking-normal text-bg opacity-0 transition-[opacity,translate] duration-200 translate-y-1 group-hover/year:translate-y-0 group-hover/year:opacity-100 group-focus/year:translate-y-0 group-focus/year:opacity-100"
            >
              yes, I checked the alignment.
            </span>
          </span>{' '}
          ADITYA MADAN
        </span>
        <span aria-hidden>·</span>
        <span>DELHI ⇄ VELLORE</span>
        <span aria-hidden>·</span>
        <button onClick={() => goto(0)} className="group/back tracking-normal text-ink/80 transition-colors hover:text-accent">
          return to departure <span aria-hidden className="inline-block transition-transform duration-500 group-hover/back:-rotate-[360deg]">↺</span>
        </button>
      </p>
    </footer>
  )
}
