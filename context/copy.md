# Site copy

All text currently on the site, grouped by board zone, in flight order. Edit here first, then the strings get swapped into the components.

Rules so far: no em or en dashes, normal text sizes, casual tone, keep it short.



---

## Global

**Nav**
- Logo: `aditya` + typed path like `~/about`
- Route waypoints: DEP (gate), ABT (about), INT (things i'm into), HGR (the hangar), NOW (currently), ARR (contact)
- Waypoint tooltip: `{CODE} · {name} · you are here` / `{n} nm ahead` / `{n} nm behind`
- Clock: `IST hh:mm:ss`
- Sound toggle: `sound` / `muted`
- Theme toggle: `day` / `night`
- Mobile menu button: `route` / `close`

**Flight HUD (bottom left)**
- `ALT 36,000 FT · GS 120 KT · HDG 088°`
- Phases: AT GATE, CLIMB, CRUISE, DESCENT, LANDED
- Hover: `SQUAWK 7000 · click: direct to contact`
- Click flash: `DIRECT TO CONTACT`

**Board controls (bottom right)**
- `zoom out Z` / `zoom in Z`
- Overview hint: `pick a frame to fly there · esc`

---

## 01 · Hero (zone: hero)

- Meta line: `N 28.61° E 77.21°` · `delhi ⇄ vellore` · `IST hh:mm` (hover: `your time hh:mm`)
- Headline: **Hi, I'm Aditya.**
- Subheadline: I build things, obsess over details, and occasionally get distracted by airplanes.
- Description: A developer and designer who likes turning ideas into things people can actually use.
- Buttons: `say hi` · `resume.pdf` (hover: progress bar then `ready ↓`) · `github ↗`
- Onboarding note: `scroll to fly →` (board only)
- Portrait printout: `PORTRAIT.TXT · 111 COLS · IST hh:mm`, chip `charset: ascii (1/4)`, hover hint `click: charset · hold: the real me`
- Sticker: `HELLO! my name is aditya`

---

## 02 · About (zone: about)

- Label: `[01] about`
- Paper sheet title: `about.txt`
- Heading: **Curious by default. AvGeek by choice.**
- Lead (types itself in): I like understanding how things work, from the logic behind software to the systems that get a few hundred tonnes of metal safely across the sky.
- Paragraph: I'm a builder who enjoys connecting seemingly unrelated interests, and I like learning by doing: getting my hands dirty and figuring things out.
- Typed tag line: `developer + designer · vit '28 · delhi → vellore`
- Polaroid front: `amanohashidate.jpg`, caption `japan`, handwritten `flip it, trust me`
- Polaroid back: **matanozoki.** the tradition here is to bend over and look at the view through your legs. upside down, the sandbar looks like a bridge into the sky.

---

## 03 · Things I'm into (zone: into)

- Label: `[02] things i'm into`
- Heading: **Things I'm into**
- Note 1 · **Software & building**: Web and Go, and how things work under the hood. (art: terminal running `go run ./cmd/api`, `listening on :8080`, `GET /health 200 0.8ms`, hover `go test ./...`)
- Note 2 · **UI/UX & product**: The experience behind the interface, down to the details. (art: figma window, `[ button ]`, hover `[ ship it ]`)
- Note 3 · **Aviation & aircraft**: Aircraft, engines, flight ops and aviation weather. (art: radar)
- Note 4 · **The intersection**: Aviation meets software. Design meets engineering. (art: venn of `design` + `engineering`)
- Hover status words: testing, shipping, squawking, merged

---

## 04 · The hangar (zone: hangar)

- Label: `[03] the hangar`
- Heading: **Things I've built**
- Strip 1 · **LOOM** · web app · One portfolio from your GitHub, résumé and LinkedIn. · nextjs, postgres, prisma, genai · `LIVE ↗` useloom.vercel.app
- Strip 2 · **FLUX** · web app · An offline task manager that knows what's urgent. · react, node, mongodb · `LIVE ↗` flux-space.vercel.app
- Strip 3 · **MESSIT** · ux redesign · VIT's mess app, from four taps to two. · figma, ux research · `ON APP STORES` (click: `no public link, sorry`)

---

## 05 · Currently (zone: now)

- Label: `[04] currently`
- Departure board header: `DEPARTURES` + clock. Columns: FLIGHT / TO / STATUS

| Flight | To | Status | On hover |
|---|---|---|---|
| AM101 | GO + WEB | IN PROGRESS | ON TIME |
| AM202 | SOFTWARE ENG | BOARDING | GATE OPEN |
| AM303 | NEW PROBLEMS | SEARCHING | ALWAYS |
| AM404 | VINNOVATEIT | LEADING | VICE CHAIR |
| AM505 | THE SKY | LOOKING UP | DAILY |

- NOTAM printout: title `notam a0110/26`
  - Working with Go and web technologies, going deeper into software engineering.
  - Always looking up at passing aircraft.
- Achievement rosette: `2ND`
  - Card front: **Hexathon Designathon 2025** · 2nd place, Google Developer Groups VIT
  - Card back: A graph-based way to settle group expenses in the fewest payments.

---

## 06 · Contact (zone: contact)

- Label: `[05] contact`
- Heading: **Say hi.**
- Sub: Email is the fastest way to reach me.
- Boarding pass: `BOARDING PASS` · `✈ AM 0110`
  - PASSENGER: input, placeholder `YOUR NAME`
  - CLASS: HELLO / COLLAB / HIRE / AVGEEK TALK
  - FROM: WHEREVER YOU ARE · TO: ADITYA'S INBOX · SEAT: from name
  - Button: `SCAN ↵` · after scan stamp: `BOARDED`
- Gate scanner states: `PLACE PASS HERE` · `RELEASE TO SCAN` · `READING PASS` · `BOARDING · WELCOME {NAME}` · `NAME REQUIRED`
- Email it opens: subject `{Class} from {name}`, body `Hi Aditya, … {name} (flight AM 0110, seat {seat})`
- Note: `drag me to the gate →`
- Other ways in:
  - email · adityamadan01@gmail.com (click to copy: `copied to clipboard ✓`)
  - github · github.com/Aditya10801
  - linkedin · in/aditya-madan
  - instagram · @your.avg.engineer
  - resume · resume.pdf
- Footer line: `© 2026 Aditya Madan · IST hh:mm · back to start ↺`

---

## From the original copy.md, not used yet

- When I'm not writing code or thinking about product ideas, there's a good chance I'm down an aviation rabbit hole.
- Technology gives me a way to turn that curiosity into something tangible, from designing interfaces to building applications and exploring the engineering behind them.
- Not everything I try turns into something great, but there's usually something worth learning along the way.
- Software & building (full): I enjoy building applications, exploring backend systems, and understanding what makes software reliable. My work spans web development and Go, with an emphasis on learning how things work under the hood rather than just getting them to run.
- UI/UX (full): I care about the experience behind the interface: the details, the interactions, and the product decisions that make something genuinely useful.
- Aviation (full): Certified airplane enthusiast in spirit, perpetual aviation nerd in practice. From aircraft and engines to flight operations, aviation weather, and the systems that keep air travel running, there's always something new to discover.
- Intersection (full): Some of my favourite ideas happen where interests overlap. Aviation meets software. Design meets engineering. A real-world problem meets a tool that might actually solve it.
- Currently (full): Building, refining, and exploring new ideas.
