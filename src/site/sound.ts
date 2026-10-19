// All audio is synthesized with WebAudio: no files, no licensing. Starts on the visitor's first click or key.

type Sfx = 'tick' | 'click' | 'flap' | 'beep' | 'deny' | 'paper' | 'pop' | 'chime'

let ac: AudioContext | null = null
let master: GainNode, music: GainNode, fx: GainNode, verb: ConvolverNode
let on = false
let started = false
const listeners = new Set<(on: boolean) => void>()

const noiseBuffer = (ctx: AudioContext, seconds: number, brown = false) => {
  const b = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate)
  const d = b.getChannelData(0)
  let last = 0
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1
    d[i] = brown ? (last = (last + 0.02 * w) / 1.02) * 3.5 : w
  }
  return b
}

function init() {
  if (ac) return
  ac = new AudioContext()
  master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination)
  // tiny room for the chime effect
  verb = ac.createConvolver()
  const ir = ac.createBuffer(2, ac.sampleRate * 3, ac.sampleRate)
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c)
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 3
  }
  verb.buffer = ir
  const wet = ac.createGain(); wet.gain.value = 0.35
  verb.connect(wet).connect(master)
  music = ac.createGain(); music.gain.value = 0.55; music.connect(master)
  fx = ac.createGain(); fx.gain.value = 0.6; fx.connect(master)
}

/* ---------- music: generated lo-fi loop (drums, keys, bass, vinyl) ---------- */

const hz = (m: number) => 440 * 2 ** ((m - 69) / 12)
const BPM = 76
const STEP = 60 / BPM / 4 // one 16th
const SWING = 0.16 // late off-beat 16ths
// ii V I vi in C: Dm9, G13, Cmaj9, Am9 (rootless voicings) with bass roots
const PROG = [
  { keys: [53, 57, 60, 64], bass: 38 },
  { keys: [53, 59, 64, 69], bass: 43 },
  { keys: [52, 55, 59, 62], bass: 36 },
  { keys: [55, 59, 60, 64], bass: 45 },
]
const KICK = [0, 7, 10]
const KICK_FILL = [0, 7, 9, 11]
const SNARE = [4, 12]

let white: AudioBuffer
let lofi: BiquadFilterNode

function kick(t: number, v = 1) {
  const ctx = ac!
  const o = ctx.createOscillator(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12)
  const g = ctx.createGain(); g.gain.setValueAtTime(0.55 * v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38)
  o.connect(g).connect(lofi); o.start(t); o.stop(t + 0.4)
}
function noiseHit(t: number, dur: number, vol: number, type: BiquadFilterType, freq: number) {
  const ctx = ac!
  const s = ctx.createBufferSource(); s.buffer = white
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq
  const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  s.connect(f).connect(g).connect(lofi); s.start(t, Math.random() * 0.5, dur + 0.02)
}
function snare(t: number) {
  noiseHit(t, 0.2, 0.22, 'bandpass', 1700)
  const o = ac!.createOscillator(); o.frequency.value = 185
  const g = ac!.createGain(); g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1)
  o.connect(g).connect(lofi); o.start(t); o.stop(t + 0.12)
}
/** Rhodes-ish: sine + soft 2nd harmonic, quick bark then long decay, gentle tremolo. */
function keys(t: number, notes: number[], len: number) {
  const ctx = ac!
  const trem = ctx.createOscillator(); trem.frequency.value = 4.2
  const depth = ctx.createGain(); depth.gain.value = 0.012
  const bus = ctx.createGain(); bus.gain.value = 0.05
  trem.connect(depth).connect(bus.gain); trem.start(t); trem.stop(t + len + 1.2)
  bus.connect(lofi)
  notes.forEach((n, i) => {
    const at = t + i * 0.018 // lazy strum
    for (const [mult, vol, decay] of [[1, 1, len], [2, 0.25, 0.35]] as const) {
      const o = ctx.createOscillator(); o.frequency.value = hz(n) * mult; o.detune.value = (Math.random() - 0.5) * 8
      const g = ctx.createGain()
      g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(vol, at + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, at + decay + 0.8)
      o.connect(g).connect(bus); o.start(at); o.stop(at + decay + 0.9)
    }
  })
}
function bass(t: number, note: number, len: number) {
  const ctx = ac!
  const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = hz(note)
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 280
  const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.26, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + len)
  o.connect(f).connect(g).connect(lofi); o.start(t); o.stop(t + len + 0.05)
}

function startMusic() {
  if (started || !ac) return
  started = true
  const ctx = ac
  white = noiseBuffer(ctx, 1)
  lofi = ctx.createBiquadFilter(); lofi.type = 'lowpass'; lofi.frequency.value = 3200; lofi.Q.value = 0.4
  lofi.connect(music)

  // vinyl: soft hiss plus random crackle pops, looped
  const vinyl = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate)
  const vd = vinyl.getChannelData(0)
  for (let i = 0; i < vd.length; i++) vd[i] = (Math.random() * 2 - 1) * 0.012 + (Math.random() < 0.0004 ? (Math.random() * 2 - 1) * 0.5 : 0)
  const vs = ctx.createBufferSource(); vs.buffer = vinyl; vs.loop = true
  const vf = ctx.createBiquadFilter(); vf.type = 'highpass'; vf.frequency.value = 900
  const vg = ctx.createGain(); vg.gain.value = 0.35
  vs.connect(vf).connect(vg).connect(music); vs.start()

  let step = 0
  let next = ctx.currentTime + 0.1
  const schedule = () => {
    if (!on) { next = ctx.currentTime + 0.1; return }
    while (next < ctx.currentTime + 0.15) {
      const s = step % 16, bar = Math.floor(step / 16) % PROG.length
      const t = next + (s % 2 ? STEP * SWING : 0)
      const chord = PROG[bar]
      const fill = bar === PROG.length - 1
      if ((fill ? KICK_FILL : KICK).includes(s)) kick(t, s === 0 ? 1 : 0.8)
      if (SNARE.includes(s)) snare(t)
      if (s % 2 === 0) noiseHit(t, 0.035, s % 4 === 2 ? 0.05 : 0.08 * (0.7 + Math.random() * 0.3), 'highpass', 7500)
      if (s === 0) keys(t, chord.keys, STEP * 10)
      if (s === 10 && Math.random() < 0.6) keys(t, chord.keys.slice(1), STEP * 5)
      if (s === 0) bass(t, chord.bass, STEP * 6)
      if (s === 10) bass(t, chord.bass + (Math.random() < 0.3 ? 7 : 0), STEP * 5)
      next += STEP
      step++
    }
  }
  setInterval(schedule, 25)
  // no point running audio in a hidden tab
  document.addEventListener('visibilitychange', () => { if (document.hidden) ctx.suspend(); else if (on) ctx.resume() })
}

/* ---------- one-shot effects ---------- */

let lastTick = 0
export function sfx(name: Sfx) {
  if (!ac || !on) return
  const ctx = ac, t = ctx.currentTime
  const tone = (freq: number, dur: number, vol: number, type: OscillatorType = 'sine', at = t, out: AudioNode = fx) => {
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(vol, at + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
    o.connect(g).connect(out); o.start(at); o.stop(at + dur + 0.02)
  }
  const burst = (dur: number, vol: number, freq: number, q = 1) => {
    const s = ctx.createBufferSource(); s.buffer = noiseBuffer(ctx, dur)
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    s.connect(f).connect(g).connect(fx); s.start(t)
  }
  switch (name) {
    case 'tick': if (performance.now() - lastTick < 60) return; lastTick = performance.now(); tone(2400, 0.03, 0.035, 'sine'); break
    case 'click': tone(900, 0.06, 0.08, 'triangle'); tone(1800, 0.03, 0.03); break
    case 'flap': burst(0.025, 0.25, 3200, 2); break
    case 'beep': tone(1320, 0.14, 0.09, 'square'); break
    case 'deny': tone(220, 0.18, 0.09, 'square'); tone(196, 0.2, 0.08, 'square', t + 0.12); break
    case 'paper': burst(0.18, 0.12, 1800, 0.5); break
    case 'pop': tone(520, 0.08, 0.1, 'sine'); tone(780, 0.06, 0.05, 'sine', t + 0.03); break
    case 'chime': tone(hz(84), 1.2, 0.05, 'sine', t, verb); tone(hz(84), 0.8, 0.04); break
  }
}

/* ---------- on/off ---------- */

export const soundOn = () => on
export function onSoundChange(fn: (on: boolean) => void) { listeners.add(fn); return () => { listeners.delete(fn) } }

let decided = false // the visitor turned it on or off themselves

/** Music is on by default, which browsers allow only after a gesture: start it on the first click or key anywhere. */
export function armMusic() {
  const go = (e: Event) => {
    // the terminal's own music controls decide for themselves
    if ((e.target as Element).closest?.('[data-terminal]')) return
    disarm()
    if (!decided) setSound(true)
  }
  const disarm = () => { removeEventListener('pointerdown', go, true); removeEventListener('keydown', go, true) }
  addEventListener('pointerdown', go, true)
  addEventListener('keydown', go, true)
  return disarm
}

export function setSound(next: boolean, byUser = false) {
  if (byUser) decided = true
  on = next
  if (next) {
    init()
    ac!.resume()
    startMusic()
    master.gain.setTargetAtTime(0.9, ac!.currentTime, 0.4)
  } else if (ac) {
    master.gain.setTargetAtTime(0, ac.currentTime, 0.15)
  }
  listeners.forEach(fn => fn(on))
}

// global UI sounds: hover ticks and click blips on anything interactive
if (typeof window !== 'undefined') {
  let hovered: Element | null = null
  addEventListener('pointerover', e => {
    const el = (e.target as Element).closest?.('a, button, [role="button"], [data-drag]')
    if (el && el !== hovered) sfx('tick')
    hovered = el
  }, { passive: true })
  addEventListener('click', e => { if ((e.target as Element).closest?.('a, button, [role="button"]')) sfx('click') }, { passive: true })
}
