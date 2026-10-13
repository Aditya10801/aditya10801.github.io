// Board map: every section is a zone on one big canvas. Scroll flies a camera zone to zone.

export type Rect = { x: number; y: number; w: number; h: number }

export const ZONE_W = 1040
export const ZONE_H = 660

export const ORDER = ['hero', 'about', 'into', 'hangar', 'now', 'contact'] as const
export type ZoneId = (typeof ORDER)[number]

// top row runs left to right, bottom row comes back right to left
export const ZONES: Record<ZoneId, Rect> = {
  hero: { x: 200, y: 200, w: ZONE_W, h: ZONE_H },
  about: { x: 1500, y: 120, w: ZONE_W, h: ZONE_H },
  into: { x: 2800, y: 260, w: ZONE_W, h: ZONE_H },
  hangar: { x: 2800, y: 1240, w: ZONE_W, h: ZONE_H },
  now: { x: 1500, y: 1360, w: ZONE_W, h: ZONE_H },
  contact: { x: 200, y: 1200, w: ZONE_W, h: ZONE_H },
}

export const WORLD = { w: 4100, h: 2300 }

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
