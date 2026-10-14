// Board map: every section is a zone on one big canvas. Scroll flies a camera zone to zone.

export type Rect = { x: number; y: number; w: number; h: number }

export const ZONE_W = 1200
export const ZONE_H = 680

export const ORDER = ['hero', 'about', 'into', 'hangar', 'design', 'log', 'now', 'contact'] as const
export type ZoneId = (typeof ORDER)[number]

// top row runs left to right, bottom row comes back right to left
const at = (x: number, y: number): Rect => ({ x, y, w: ZONE_W, h: ZONE_H })
export const ZONES: Record<ZoneId, Rect> = {
  hero: at(200, 200),
  about: at(1680, 120),
  into: at(3160, 260),
  hangar: at(4640, 180),
  design: at(4640, 1320),
  log: at(3160, 1400),
  now: at(1680, 1320),
  contact: at(200, 1260),
}

export const WORLD = { w: 6040, h: 2200 }

/** Scroll distance per leg of the route. */
export const SEG = 1100

/** Live camera state, written by Board every frame. Read it, don't write it. */
export const board = {
  flow: false, // true on small screens: plain vertical layout, no camera
  p: 0, // route progress, 0 at hero, ORDER.length - 1 at contact
  cam: { x: 0, y: 0, z: 1 }, // world point at screen center, and zoom
  overview: false,
}

/** Fly to a zone by index or id. */
export function goto(target: number | ZoneId) {
  const i = typeof target === 'number' ? target : ORDER.indexOf(target)
  if (board.flow) {
    document.getElementById(ORDER[i])?.scrollIntoView({ behavior: 'smooth' })
  } else {
    window.dispatchEvent(new Event('board:closeoverview'))
    window.scrollTo({ top: i * SEG, behavior: 'smooth' })
  }
}
