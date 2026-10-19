# DESIGN.md

Planning record for adityamadan.cv. Copy lives in `context/copy.md` (the owner's doc, source of truth). Facts allowed on the site are in `context/design.md`.

## Brief

- **Subject:** Aditya Madan. CS student at VIT Vellore, originally from Delhi. Developer, designer, AvGeek, Punjabi music listener, traveller, professional overthinker.
- **Audience:** people who find him (friends, peers, recruiters, other builders).
- **Job:** a personal corner of the internet. Not a résumé. Visitors should meet a person.
- **Assets:** his photos (`public/me/`), project screenshots (`public/work/`), his copy doc.

## Concept card

```
Idea:        His desk, seen from above: a light paper board of real objects you fly between like a plane on a route.
Metaphor:    A designer's canvas crossed with a flight plan (waypoints, departure board, logbook, boarding pass).
Signature:   Scroll flies a camera between zones on one board; the terminal prompt at the bottom is the nav (cd hangar).
Emotion:     curious, warm, a little nerdy. "Someone put real thought into this."
Motion verb: settle like paper (objects lift on hover and set down), fly between frames (eased camera with a mid-flight zoom-out).
Screenshot:  the ASCII portrait printout next to "Hi, I'm Aditya." on the paper board.
```

Anchor: he is an AvGeek who notices details. The flight vocabulary is his, and the board is how a designer works.

## System

- **Palette** (light / night):
  - ground `#efede8` / `#0d0d0c`
  - ink `#141312` / `#ebe9e4`
  - muted `#77736c` / `#8b877f`
  - paper `#fbfaf7` / `#1a1a18`
  - accent `#ff4f00` (international orange), used once per zone
  - selection blue `#2f5bff`, only for Figma-style chrome
- **Type:** Geist (text), Geist Mono (data, labels, terminal), Caveat (one handwritten note per zone).
- **Scale:** mono labels 11, small 13, body 15, lead 17, card title 22, zone title 32, hero 48.
- **Grid:** each zone is 1200 × 680 on a 12-column grid (100 px columns, 24 px gutters). The camera frames one zone at a time.
- **Shape:** paper objects have 2 to 6 px radius and rotations of 2° or less. Pills only for primary CTAs and chips.
- **Motion:**
  - Easing: one family, `cubic-bezier(.2,.8,.2,1)` and `cubic-bezier(.76,0,.24,1)` for curtains.
  - Camera: frame-rate-independent damping.
  - Hover lifts move an inner element, never the hover target.
  - Nothing animates while its zone is inactive.
- **Idle:** the ASCII sky drifts, the portrait breathes under the pointer, and the radar sweeps when on screen. The board keeps moving at rest.

## Owner decisions that override award defaults (deliberate)

1. **Custom cursor.** The plane cursor replaces the native arrow. The owner rejected a reticle and chose this one. An award jury penalises hiding the native cursor; the alternative is the plane as a follower next to the native arrow.
2. **Normal text sizes.** The owner dislikes oversized display type, so the hero stays at 48 px. Display type stays expressive through VariableProximity, decrypt and the split-flap instead of size.
3. **One board, no case-study pages.** The copy doc says project cards stay compact. Projects expand in place ("under the hood"). The only inner page is a designed 404.
4. **Music on by default.** Browsers block audio until a gesture, so music starts on the first click or key anywhere. The terminal's `music` command or chip mutes it, and a mute sticks.

## Loading and continuity

- **Boot screen:** `#loader` in `index.html` paints before any JS. `Preloader.tsx` ticks the checklist as fonts and photos arrive. It finishes at 650 ms at the earliest and 1.8 s at the latest, both measured from navigation start, and then lifts like a curtain over the hero.
- **Skipping:** the loader plays once per session (sessionStorage `boarded`). It takes the short path when the visitor arrives from another page of the site.
- **Page transitions:** cross-document view transitions (`@view-transition`) between the board and the 404.
- **Zone wake-up:** a zone becomes "active" halfway through the camera's flight toward it, so headlines, typing and art have settled by the time it parks.

## QA log

- Two outside critic passes scored it 7.3, against a typical Site of the Day of 7.2 to 7.6.
- Final automated state:
  - 0 audit FAILs, 0 axe violations, 0 console errors
  - no overflow and no small targets
  - no text hidden under reduced motion, and no invisible focus
  - throttled mobile LCP about 1.6 s, CLS 0.002
  - first JS 89 KB gzipped, page about 155 KB
- Known ceiling: the throttled-phone loader is about 3.5 s because the board renders on the client. Prerendering the board (SSR) is the upgrade path.

## Composition (zones in flight order)

| Zone | Layout family |
|---|---|
| hero | printout left, loose text layer, sticker overlap |
| about | two-page paper sheet plus polaroid |
| interests | four pinned notes in a row |
| hangar | strip-bay index plus dossier (master detail) |
| design desk | artboard figure plus notes card |
| logbook | open book spread |
| currently | departure board plus NOTAM |
| contact | boarding pass, gate, links card, footer line |

On phones, the zones stack vertically and the objects keep their materials.
