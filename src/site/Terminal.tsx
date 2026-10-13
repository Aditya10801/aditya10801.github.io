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
  log: 'log', logbook: 'log',
  now: 'now', currently: 'now',
  contact: 'contact', hi: 'contact', email: 'contact',
}
const OPEN: Record<string, string> = {
  resume: LINKS.resume, github: LINKS.github, linkedin: LINKS.linkedin, instagram: LINKS.instagram,
  loom: 'https://useloom.vercel.app', flux: 'https://flux-space.vercel.app',
}
const COMMANDS = [
  ...ORDER.filter(z => z !== 'hero').map(z => `cd ${z}`), 'cd ~', 'ls', 'whoami',
  ...Object.keys(OPEN).map(k => `open ${k}`), 'zoom out', 'zoom in',
  'music on', 'music off', 'theme day', 'theme night', 'help', 'clear', 'date', 'pwd',
]
const HELP = [
  'cd <place>      fly somewhere: about, into, hangar, log, now, contact, ~',
  'ls              list everything on the board',
  'open <thing>    resume, github, linkedin, instagram, loom, flux',
  'zoom out | in   see the whole board',
  'music on | off  lo-fi, generated live in your browser',
  'theme day | night',
  'whoami · date · pwd · clear',
]

const pathOf = (z: ZoneId) => (z === 'hero' ? '~' : `~/${z}`)

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
        return say(ORDER.filter(z => z !== 'hero').map(z => `${z}/`).join('  ') + '  resume.pdf')
      case 'open': {
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
        setSound(on)
        return say(on ? '♪ lo-fi on' : 'muted')
      }
      case 'theme': {
        const next = arg === 'day' || arg === 'light' ? 'light' : arg === 'night' || arg === 'dark' ? 'dark' : theme === 'dark' ? 'light' : 'dark'
        setTheme(next)
        return say(next === 'dark' ? 'lights off' : 'lights on')
      }
      case 'whoami':
        return say('aditya madan', 'engineering student at VIT Vellore, from Delhi', 'developer, designer, avgeek')
      case 'pwd':
        return say(pathOf(zone))
      case 'date':
        return say(`${istTime(new Date())} IST, vellore`)
      case 'help':
      case '?':
        return say(...HELP)
      case 'clear':
        setLines([])
        return setShowOut(false)
      case 'sudo':
        return err('nice try.')
      case 'exit':
        goto('contact')
        return say('no exits on this flight. the closest one is contact')
      default:
        return err(`command not found: ${head}. try help`)
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
    i < ORDER.length - 1 && `cd ${ORDER[i + 1]}`,
    i > 0 && `cd ${i === 1 ? '~' : ORDER[i - 1]}`,
    'ls',
    !board.flow && (overview ? 'zoom in' : 'zoom out'),
    music ? 'music off' : 'music on',
    theme === 'dark' ? 'theme day' : 'theme night',
    'help',
  ].filter(Boolean) as string[]
  const chips = value ? matches : idle

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
    <div className="pointer-events-none fixed inset-x-2 bottom-2 z-50 flex flex-col items-center md:inset-x-0 md:bottom-4">
      <div className="pointer-events-auto w-full md:w-[min(640px,calc(100vw-620px))] md:min-w-[440px]">
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
        <div className="mb-1.5 flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
          {chips.map(c => (
            <button
              key={c}
              onMouseDown={e => e.preventDefault()}
              onClick={() => { run(c); setValue('') }}
              className="shrink-0 rounded-[3px] border border-ink/10 bg-paper px-2 py-1 font-mono text-[11px] text-mute shadow-obj transition-[color,border-color,translate] hover:-translate-y-px hover:border-accent/60 hover:text-ink"
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
              onBlur={() => setFocused(false)}
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
                </>
              ) : null}
            </span>
          </span>
          <span className="hidden shrink-0 text-[11px] tabular-nums md:inline" style={{ color: C.mute }}>
            {String(ORDER.indexOf(zone) + 1).padStart(2, '0')}/{String(ORDER.length).padStart(2, '0')} · {istTime(now, false)}
          </span>
        </label>
      </div>
    </div>
  )
}
