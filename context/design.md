# Design direction v2

Feedback on v1: "content feels empty" and "design is 5/10". The v1 zones had 1 to 3 small grey boxes floating in a dark void, one-line projects, no real visuals and timid scale. v2 fixes that without bringing clutter back.

## The idea

A designer's desk seen from above. The board is a light paper surface. Every section is a cluster of real, finished-looking objects: printouts, cards, photos, tickets, a logbook, a departure board. The camera flies between clusters. It should feel physical, crafted and full of real substance, but calm.

## Rules

**Materials**
- Objects are physical: `bg-paper` plus `shadow-obj` (the hover lift uses `shadow-lift`).
- Use a 1px hairline border only where paper would have an edge (`border-ink/[0.06]`).
- Each object is made of ONE material: paper, card stock, printout, photo, ticket, or the dark board (the FIDS stays dark).

**Composition**
- A zone is 1200 × 680. Content fills about 60 to 75% of it.
- Align to an invisible 12-column grid (100px columns, 24px gutters).
- Allow at most one deliberate overlap per zone and rotations of 2° or less.

**Zone header** (same in every zone, top-left):
- mono `[0n] code`
- a 32px title (font-medium, tracking-tight)
- one intro line (15px, mute, max 60ch)

**Type scale**
- Mono labels: 11px
- Small text: 13px
- Body: 15px (leading 1.6)
- Lead: 17px
- Card title: 22px
- Zone title: 32px
- Hero name: 48px
- Nothing bigger. Geist for text, Geist Mono for data and labels.

**Colour**
- ink, mute and paper carry the page.
- Orange (accent) is used for ONE focal element per zone.
- Blue (sel) is only for Figma-style selection chrome.

**Density**
- Rich content, quiet decoration.
- Real numbers, dates, stacks and outcomes beat adjectives.
- No filler copy, and nothing invented.

**Interactions**
- Every interactive thing gets its own micro-interaction.
- Hover lifts an INNER element, never the hover target.
- Nothing animates while its zone is inactive (`useZoneActive`).
- No backdrop-filter, and no position:fixed inside the board (portal to body instead).

**Copy rules**
- No em dashes or en dashes.
- Casual, first person.
- Never mention XINO.
- Hexathon is an achievement, not a project, and only gets a quiet mention (one logbook row).
- Portray him as an engineering student who builds things. Don't hype awards or leadership.

## Content facts (the only source of truth besides context/copy.md)

**Aditya Madan**
- Developer and designer, AvGeek.
- From Delhi. Studies at VIT Vellore.

**Education**
- B.Tech Computer Science, VIT Vellore, 2024 to 2028 (3rd year).
- School: Delhi Public School Rohini.

**Club:** Vice Chair, VinnovateIT (a student tech club at VIT Vellore), Jan 2026 to present. NOT tech lead (owner correction). Don't claim team sizes, roadmaps, mentoring or launch numbers for this role.

**Achievement:** 2nd place, Hexathon Designathon 2025, Google Developer Groups VIT. He designed a graph-based expense-settling system that minimizes multi-party settlement transactions through optimal debt consolidation.

**Loom** · AI-powered portfolio generation · Next.js, TypeScript, PostgreSQL, Prisma, Google GenAI · live: https://loom.buildspace.cv · screenshot: public/work/loom.jpg
- Imports GitHub, résumés and LinkedIn into a single structured profile.
- Uses Google GenAI to extract structured fields from unstructured résumé and LinkedIn PDFs. All parsed output is validated against Zod schemas before it's saved.
- Dynamic portfolio rendering with selectable themes, GitHub project sync, and a dedicated Recruiter Mode.
- Privacy-conscious ingestion: raw source files are discarded after extraction.
- The live landing page says: "One address for everything you've built. Loom reads your GitHub, the PDF LinkedIn exports and your résumé, and sets them as one portfolio. Every night it checks GitHub again, so the page keeps up without you."

**Flux** · task management · React, Node.js, Express, MongoDB · live: https://flux-space.vercel.app · screenshot: public/work/flux.jpg (its login screen, "flux." in neon yellow)
- Stateless token-based auth, with per-user namespaced MongoDB collections for data isolation.
- A time-decay algorithm scores task urgency. Batched writes (updateMany) cut update latency from 500ms to under 100ms on 1,000+ task datasets.
- Offline-first with IndexedDB, optimistic UI and conflict resolution.
- REST API (GET/POST/PATCH/DELETE) with cursor-based pagination.

**MessIT** · campus app redesign · System design, Figma prototyping · shipped on the App Store and Play Store for VIT · no public link
- Led a redesign of a high-traffic campus utility app. Restructured the information architecture, cutting navigation depth from 4 taps to 2 for key actions.
- Designed the state-management model for multi-screen flows.
- Validated the prototypes through usability testing with 100+ students.

**Skills**
- Languages: JavaScript (ES6+), TypeScript, Go, Python, C, HTML/CSS.
- Frameworks: Next.js, React, Node.js, Express, Tailwind CSS, Framer Motion.
- Databases: PostgreSQL (Prisma), MongoDB.
- Tools: Git, GitHub, Vercel, Figma.
- Concepts: REST API design, system design, auth, database optimization, offline-first, AI-assisted data extraction, UI/UX.

**Links**
- github.com/Aditya10801
- linkedin.com/in/aditya-madan-90b49526b
- instagram @your.avg.engineer
- adityamadan01@gmail.com
