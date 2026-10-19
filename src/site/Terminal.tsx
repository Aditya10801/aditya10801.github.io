import { useEffect, useMemo, useRef, useState, type KeyboardEvent as RKeyboardEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ORDER, board, goto, type ZoneId } from './map'
import { LINKS, istTime, reducedMotion, useClock, useTheme } from './ui'
import { onSoundChange, setSound, sfx, soundOn } from './sound'

type Line = { kind: 'cmd' | 'out' | 'err'; text: string }

// the terminal is always dark, like the departure board
const C = { bg: '#121211', ink: '#e9e7e1', mute: '#8b877f', accent: '#ff5c1f', line: 'rgb(233 231 225 / 0.1)' }

const PLACES: Record<string, ZoneId> = {
  '~': 'hero', home: 'hero', hero: 'hero', gate: 'hero',
  about: 'about', me: 'about',
  into: 'into', interests: 'into',
  hangar: 'hangar', projects: 'hangar', work: 'hangar',
  design: 'design', desk: 'design', 'design-desk': 'design',
  log: 'log', logbook: 'log',
  now: 'now', currently: 'now',
  contact: 'contact', hi: 'contact', email: 'contact',
}
const OPEN: Record<string, string> = {
  resume: LINKS.resume, github: LINKS.github, linkedin: LINKS.linkedin, instagram: LINKS.instagram,
  loom: 'https://loom.buildspace.cv', flux: 'https://flux-space.vercel.app',
}
// friendly names for paths and listings
const NAME: Record<ZoneId, string> = {
  hero: '~', about: 'about', into: 'interests', hangar: 'hangar', design: 'design', log: 'logbook', now: 'currently', contact: 'contact',
}
const pathOf = (z: ZoneId) => (z === 'hero' ? '~' : `~/${NAME[z]}`)

const COMMANDS = [
  ...ORDER.filter(z => z !== 'hero').map(z => `cd ${NAME[z]}`), 'cd ~', 'ls', 'whoami',
  ...Object.keys(OPEN).map(k => `open ${k}`), 'open japan', 'open easter-eggs', 'zoom out', 'zoom in',
  'music', 'music on', 'music off', 'theme', 'theme day', 'theme night', 'help', 'clear', 'date', 'pwd',
]

// copy: context/copy.md, "00. Global Navigation"
const WELCOME = ['Welcome aboard.', '', "This is Aditya's corner of the internet.", 'Look around. There are a few things to find.', '', 'Type help to see what you can do.']
const WHOAMI = [
  'aditya madan', '',
  'student at VIT Vellore, originally from Delhi.', 'developer, designer, AvGeek.', '',
  'usually learning something, looking something up,', "or wondering why I haven't learned enough already.",
]
const HELP = [
  'Available commands:', '',
  '  whoami          a short introduction',
  "  ls              see what's around",
  '  cd <section>    go somewhere',
  '  open <thing>    look a little closer',
  '  music           a small detour',
  '  theme           change the atmosphere',
  '  clear           pretend nothing happened', '',
  'Tip: not everything here is immediately obvious.',
]
const UNKNOWN = [
  'Command not found. Could be a typo. Could be a skill issue.',
  'That command is not in the flight plan.',
  'Nope. Try help.',
  'Interesting theory. Incorrect command.',
]

/** Typed shell path that retypes itself when the zone changes. */
function useTyped(target: string) {
  const [shown, setShown] = useState(target)
  useEffect(() => {
    if (reducedMotion()) return setShown(target)
    let cur = shown, id = 0
    const step = () => {
      if (!target.startsWith(cur)) cur = cur.slice(0, -1)
      else if (cur !== target) cur = target.slice(0, cur.length + 1)
      else return
      setShown(cur)
      id = window.setTimeout(step, 26)
    }
    step()
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])
  return shown
}

/** The site's navigation: a prompt you can type into, with clickable suggestions for mouse users. */
export default function Terminal() {
  const [zone, setZone] = useState<ZoneId>('hero')
  const [value, setValue] = useState('')
  const [lines, setLines] = useState<Line[]>([])
  const [showOut, setShowOut] = useState(false)
  const [focused, setFocused] = useState(false)
  const [music, setMusic] = useState(soundOn)
  const [overview, setOverview] = useState(false)
  const [theme, setTheme] = useTheme()
  const now = useClock()
  const input = useRef<HTMLInputElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const hist = useRef<string[]>([])
  const hi = useRef(-1)
  const hideTimer = useRef(0)
  const said = useRef({ whoami: 0, help: 0, unknown: 0 })
  const path = useTyped(pathOf(zone))

  useEffect(() => onSoundChange(setMusic), [])
  useEffect(() => {
    const on = (e: Event) => setOverview((e as CustomEvent<boolean>).detail)
    addEventListener('board:overviewchange', on)
    return () => removeEventListener('board:overviewchange', on)
  }, [])

  // current zone + route progress line
  useEffect(() => {
    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      let p = board.p
      if (board.flow) {
        // stacked layout: whichever section crosses the middle of the screen
        const mid = innerHeight * 0.45
        p = 0
        ORDER.forEach((id, i) => { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top <= mid) p = i })
      }
      const z = ORDER[Math.min(ORDER.length - 1, Math.max(0, Math.round(p)))]
      setZone(cur => (cur === z ? cur : z))
      if (bar.current) bar.current.style.transform = `scaleX(${p / (ORDER.length - 1)})`
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // "/" or cmd/ctrl+k focuses the prompt from anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement).closest?.('input, textarea, [contenteditable]')
      if ((e.key === '/' && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault()
        input.current?.focus()
      }
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [])

  const print = (out: Line[]) => {
    setLines(l => [...l, ...out].slice(-9))
    setShowOut(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = window.setTimeout(() => { if (document.activeElement !== input.current) setShowOut(false) }, 7000)
  }

  // compact welcome once, then it gets out of the way
  useEffect(() => {
    // phones already show the chips, and the panel would cover the first frame
    if (board.flow) return
    const id = setTimeout(() => print(WELCOME.map(text => ({ kind: 'out' as const, text }))), 900)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // output never sits on top of the board: scrolling or clicking elsewhere tucks it away
  useEffect(() => {
    const away = (e: Event) => {
      if (document.activeElement === input.current) return
      if (e.type === 'pointerdown' && (e.target as Element).closest?.('[data-terminal]')) return
      setShowOut(false)
    }
    addEventListener('scroll', away, { passive: true })
    addEventListener('pointerdown', away)
    return () => { removeEventListener('scroll', away); removeEventListener('pointerdown', away) }
  }, [])

  const run = (raw: string) => {
    const cmd = raw.trim().replace(/\s+/g, ' ')
    if (!cmd) return
    hist.current = [cmd, ...hist.current.filter(h => h !== cmd)].slice(0, 30)
    hi.current = -1
    const [head, ...rest] = cmd.toLowerCase().split(' ')
    const arg = rest.join(' ')
    const echo: Line = { kind: 'cmd', text: `${pathOf(zone)} $ ${cmd}` }
    const say = (...t: string[]) => { sfx('click'); print([echo, ...t.map(text => ({ kind: 'out' as const, text }))]) }
    const err = (t: string) => { sfx('deny'); print([echo, { kind: 'err', text: t }]) }

    switch (head) {
      case 'cd': {
        const i = ORDER.indexOf(zone)
        const target = !arg || arg === '/' ? 'hero' : arg === '..' ? ORDER[Math.max(0, i - 1)] : PLACES[arg.replace(/\/$/, '')]
        if (!target) return err(`cd: no such place: ${arg}. try ls`)
        goto(target)
        return say(`flying to ${pathOf(target)}`)
      }
      case 'ls':
        return say(ORDER.filter(z => z !== 'hero').map(z => `${NAME[z]}/`).join('  ') + '  resume.pdf')
      case 'open': {
        if (arg === 'japan') {
          goto('about')
          setTimeout(() => dispatchEvent(new Event('open:japan')), board.flow ? 600 : 1400)
          return say('flying to the japan polaroid')
        }
        if (arg === 'easter-eggs' || arg === 'easter eggs') return say('a few small things here react when you hover them. the smaller they are, the likelier.')
        const url = OPEN[arg.replace(/\.pdf$/, '')]
        if (!url) return err(`open: can't find ${arg || 'that'}. try: ${Object.keys(OPEN).join(', ')}`)
        window.open(url, '_blank', 'noopener')
        return say(`opening ${arg}`)
      }
      case 'zoom':
      case 'z': {
        if (board.flow) return err('zoom: the board only unfolds on bigger screens')
        const out = arg !== 'in'
        dispatchEvent(new CustomEvent('board:setoverview', { detail: out }))
        return say(out ? 'zoomed out. click any frame to fly there' : 'back in')
      }
      case 'music':
      case 'sound':
      case 'play':
      case 'mute': {
        const on = head === 'play' ? true : head === 'mute' ? false : arg === 'off' ? false : arg === 'on' ? true : !soundOn()
        setSound(on, true)
        return say(...(on ? ['♪ lo-fi on, generated live in your browser.', 'currently accepting Punjabi music recommendations, despite having Karan Aujla on repeat.'] : ['muted.']))
      }
      case 'theme': {
        const next = arg === 'day' || arg === 'light' ? 'light' : arg === 'night' || arg === 'dark' ? 'dark' : theme === 'dark' ? 'light' : 'dark'
        setTheme(next)
        return say(next === 'dark' ? 'lights off' : 'lights on')
      }
      case 'whoami':
        return say(...(said.current.whoami++ ? ['Still Aditya. Identity crisis pending.'] : WHOAMI))
      case 'pwd':
        return say(pathOf(zone))
      case 'date':
        return say(`${new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · ${istTime(new Date())} IST`)
      case 'help':
      case '?':
        return say(...(said.current.help++ ? ['The commands have not changed. Your commitment to exploring them is appreciated.'] : HELP))
      case 'clear':
        sfx('click')
        setLines([{ kind: 'out', text: 'Terminal cleared. Your browser tabs remain your responsibility.' }])
        setShowOut(true)
        clearTimeout(hideTimer.current)
        hideTimer.current = window.setTimeout(() => { if (document.activeElement !== input.current) setShowOut(false) }, 4000)
        return
      case 'sudo':
        return err('Nice try. You have not been granted administrative privileges over my life.')
      case 'exit':
        goto('contact')
        return say('No exits on this flight. The closest one is contact.')
      default:
        return err(UNKNOWN[said.current.unknown++ % UNKNOWN.length])
    }
  }

  // autocomplete: ghost text for the best match, chips for the rest
  const matches = useMemo(() => {
    const v = value.trimStart().toLowerCase()
    return v ? COMMANDS.filter(c => c.startsWith(v) && c !== v).slice(0, 5) : []
  }, [value])
  const ghost = matches[0] && value ? matches[0].slice(value.trimStart().length) : ''

  const i = ORDER.indexOf(zone)
  const idle = [
    i < ORDER.length - 1 && `cd ${NAME[ORDER[i + 1]]}`,
    i > 0 && `cd ${NAME[ORDER[i - 1]]}`,
    'ls',
    !board.flow && (overview ? 'zoom in' : 'zoom out'),
    music ? 'music off' : 'music',
    'theme',
    'help',
  ].filter(Boolean) as string[]
  // phones keep one chip (the next stop) when the prompt is idle; the rest unfold on tap
  const chips = value ? matches : board.flow && !focused ? idle.slice(0, 1) : idle

  const onKeyDown = (e: RKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { run(value); setValue('') }
    else if (e.key === 'Tab' && ghost) { e.preventDefault(); setValue(value + ghost) }
    else if (e.key === 'ArrowUp' && hist.current.length) {
      e.preventDefault(); hi.current = Math.min(hist.current.length - 1, hi.current + 1); setValue(hist.current[hi.current])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault(); hi.current = Math.max(-1, hi.current - 1); setValue(hi.current < 0 ? '' : hist.current[hi.current])
    } else if (e.key === 'Escape') { setValue(''); input.current?.blur() }
    else if (e.key.length === 1) sfx('tick')
  }

  return (
    <>
    {/* a paper band behind the dock (below the flight HUD), so nothing on the board shows through between the chips */}
    <div aria-hidden className="pointer-events-none fixed inset-x-0 bottom-0 z-[39] h-[86px] bg-gradient-to-t from-bg from-60% to-transparent md:h-[140px] md:from-bg/90 md:from-40%" />
    <nav aria-label="Site navigation" className="pointer-events-none fixed inset-x-2 bottom-2 z-50 flex flex-col items-center md:inset-x-0 md:bottom-4">
      <div data-terminal className="pointer-events-auto w-full md:w-[min(640px,calc(100vw-620px))] md:min-w-[440px]">
        {/* output */}
        <AnimatePresence>
          {showOut && lines.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.18 }}
              aria-live="polite"
              className="mb-1.5 rounded-md px-3.5 py-2.5 font-mono text-[12px] leading-[1.65] shadow-lift"
              style={{ background: C.bg, color: C.ink }}
            >
              {lines.map((l, k) => (
                <div key={k} className="whitespace-pre-wrap break-words" style={{ color: l.kind === 'cmd' ? C.mute : l.kind === 'err' ? C.accent : C.ink }}>
                  {l.text}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* suggestion chips */}
        <div className={`mb-1.5 gap-1.5 overflow-x-auto [scrollbar-width:none] flex`}>
          {chips.map(c => (
            <button
              key={c}
              onMouseDown={e => e.preventDefault()}
              onClick={() => { run(c); setValue('') }}
              className="shrink-0 rounded-[3px] border border-ink/10 bg-paper px-2 py-1 font-mono text-[11px] text-mute shadow-obj transition-[color,border-color,translate] hover:-translate-y-px hover:border-ink hover:bg-ink hover:text-bg"
            >
              {c}
            </button>
          ))}
        </div>

        {/* prompt */}
        <label
          className="relative flex cursor-text items-center gap-2 overflow-hidden rounded-md px-3.5 py-2.5 font-mono text-[16px] shadow-lift md:text-[13px]"
          style={{ background: C.bg, color: C.ink }}
        >
          <span aria-hidden className="absolute inset-x-0 top-0 h-px" style={{ background: C.line }} />
          <span ref={bar} aria-hidden className="absolute inset-x-0 top-0 h-px origin-left" style={{ background: C.accent, transform: 'scaleX(0)' }} />
          <span className="shrink-0 whitespace-nowrap">
            <span style={{ color: C.accent }}>aditya</span>
            <span style={{ color: C.mute }}>@board:</span>
            {path}
            <span style={{ color: C.mute }}> $</span>
          </span>
          <span className="relative min-w-0 flex-1">
            <input
              ref={input}
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => { setFocused(true); if (lines.length) setShowOut(true) }}
              // let a tap on a chip land before the chips fold away
              onBlur={() => setTimeout(() => setFocused(false), 180)}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              aria-label="Terminal. Type help for commands"
              className="w-full bg-transparent outline-none [caret-color:#ff5c1f]"
              style={{ outline: 'none' }}
            />
            {/* ghost completion + idle hint */}
            <span aria-hidden className="pointer-events-none absolute inset-0 flex items-center whitespace-pre">
              <span className="invisible">{value}</span>
              {ghost ? (
                <span style={{ color: C.mute }}>{ghost}<span className="ml-2 text-[10px]">tab</span></span>
              ) : !value && !focused ? (
                <>
                  <span className="blink inline-block h-[1.05em] w-[0.6em] translate-y-[1px]" style={{ background: C.accent }} />
                  <span className="ml-2 hidden text-[12px] md:inline" style={{ color: C.mute }}>type help, or press /</span>
                  <span className="ml-2 text-[13px] md:hidden" style={{ color: C.mute }}>tap to fly</span>
                </>
              ) : null}
            </span>
          </span>
          <span className="hidden shrink-0 text-[11px] tabular-nums md:inline" style={{ color: C.mute }}>
            {String(ORDER.indexOf(zone) + 1).padStart(2, '0')}/{String(ORDER.length).padStart(2, '0')} · {istTime(now, false)}
          </span>
        </label>
      </div>
    </nav>
    </>
  )
}
