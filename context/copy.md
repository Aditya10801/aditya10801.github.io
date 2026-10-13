# Site Copy v2

## Global

### Navigation (terminal at the bottom of the screen)

- Prompt: `aditya@board:~/hangar $` (path follows the current zone)
- Idle hint: `type help, or press /`
- Right side: `03/07 · hh:mm`
- Chips: `cd <next>` · `cd <previous>` · `ls` · `zoom out` · `music on` · `theme night` · `help`
- `help` output:
  - `cd <place>      fly somewhere: about, into, hangar, log, now, contact, ~`
  - `ls              list everything on the board`
  - `open <thing>    resume, github, linkedin, instagram, loom, flux`
  - `zoom out | in   see the whole board`
  - `music on | off  lo-fi, generated live in your browser`
  - `theme day | night`
  - `whoami · date · pwd · clear`
- Replies: `flying to ~/hangar` · `opening resume` · `zoomed out. click any frame to fly there` · `♪ lo-fi on` / `muted` · `lights off` / `lights on`
- `whoami`: `aditya madan` / `engineering student at VIT Vellore, from Delhi` / `developer, designer, avgeek`
- Errors: `command not found: x. try help` · `cd: no such place: x. try ls` · `sudo` → `nice try.` · `exit` → `no exits on this flight. the closest one is contact`

Keep all navigation tooltips, flight HUD values, animation states, and board controls as they are. They are functional interface copy, not storytelling copy.

---

## 01. Hero

**Meta line**

`N 28.61° E 77.21°` · `delhi ⇄ vellore` · `IST hh:mm`

**Headline**

Hi, I'm Aditya.

**Subheadline**

Software, design, aircraft, and an unreasonable number of open tabs.

**Description**

I'm a developer and designer who likes making things work, making them look good, and occasionally disappearing into an aviation rabbit hole. I build products, obsess over the details, and tend to learn best when I can get my hands on something and break it a little.

**Buttons**

- `say hi`
- `resume.pdf`
- `github ↗`

**Onboarding note**

`scroll to fly →`

**Portrait printout**

`PORTRAIT.TXT · 111 COLS · IST hh:mm`

**Charset chip**

`charset: ascii (1/4)`

**Portrait hover hint**

`click: charset · hold: the real me`

**Sticker**

`HELLO! my name is aditya`

---

## 02. About

**Label**

`[01] about`

**Paper title**

`about.txt`

**Heading**

Curious by default. AvGeek by choice.

**Lead**

I can spend an afternoon thinking about how an application should work, then lose the next hour reading about an aircraft I've spotted in the sky. Both feel like time well spent.

**Paragraph 1**

I'm Aditya, a computer science student at VIT Vellore, originally from Delhi. I like understanding the machinery behind things, whether that's the code running an application, the decisions behind a well-designed interface, or the systems that keep an aircraft moving safely through the sky.

**Paragraph 2**

I got into building software because I wanted to make things, not just learn how they work in theory. One of my favourite examples is Altos, an aviation weather application. I designed the interface in Figma, built the frontend and backend, and got it deployed in about five hours. It was messy in places, but it existed. I could use it, test it, and make it better. That feeling is a big part of why I build.

**Paragraph 3**

I'm equally drawn to the details people notice and the systems they never see. A button that feels exactly right. An API that behaves predictably. A complicated idea made simple enough that someone doesn't have to think twice about using it.

I don't have everything figured out. I'd rather keep learning, ship things, and get a little better with every attempt.

**Typed tag**

`developer + designer · vit '28 · delhi → vellore`

**Polaroid front**

`amanohashidate.jpg`

Caption: `japan`

Handwritten note: `flip it, trust me`

**Polaroid back**

**Matanozoki.**

At Amanohashidate, there's a tradition of bending over and looking at the view between your legs. The sandbar appears upside down, almost like a bridge stretching into the sky.

A reminder that sometimes you don't need a new view. You just need to look at things differently.

---

## 03. Things I'm Into

**Label**

`[02] things i'm into`

**Heading**

A few things that have my attention.

**Intro**

Some interests turn into projects. Some stay rabbit holes. Some somehow become both.

### 01. Software and building

I like the moment when something that existed only in my head finally runs on my machine. These days, that means working across web technologies and Go, getting deeper into backend engineering, and understanding what happens beyond the happy path.

I care about more than getting something to work once. I want to know why it works, what happens when it doesn't, and how to make it dependable.

**Terminal artwork**

`$ go run ./cmd/api`

`listening on :8080`

`GET /health 200 0.8ms`

Hover: `go test ./...`

### 02. UI/UX and product

A product can be technically impressive and still be frustrating to use. That gap interests me.

I enjoy working through flows, questioning unnecessary steps, and getting the little details right. Good design isn't decoration added after the engineering. It's part of how the thing works.

**Figma artwork**

`[ button ]`

Hover: `[ ship it ]`

### 03. Aviation and aircraft

I'm an AvGeek. The kind who notices aircraft overhead, wants to know what's flying, and can end up reading about engines, flight operations, or aviation weather long after intending to do something else.

I love that aviation combines engineering, precision, weather, human judgement, and an enormous amount of coordination. There's so much happening behind a flight that most passengers never have to think about.

Naturally, I ended up building software around it.

**Radar artwork**

Use realistic radar sweeps, aircraft symbols, and flight labels. Keep the interaction playful rather than pretending this is a live operational radar.

### 04. Where things overlap

My favourite problems tend to sit between disciplines. Design meets engineering. Software meets the real world. An interest turns into an idea, and an idea turns into a project.

I'm interested in the space where understanding a problem matters just as much as knowing how to implement the solution.

**Venn artwork**

`design` + `engineering` = `something useful`

**Hover status words**

`testing` · `shipping` · `squawking` · `merged`

---

## 04. The Hangar

**Label**

`[03] the hangar`

**Heading**

Things I've put into the world.

**Intro**

A few experiments, products, and ideas that made it past the notes app. Some are polished, some are still evolving, but each one taught me something worth keeping.

### LOOM

**Type:** `web app`

**Description**

Your professional presence is scattered across GitHub, your résumé, and LinkedIn. LOOM explores bringing those pieces together into one portfolio, with AI helping connect the dots.

**Stack**

`nextjs` · `postgres` · `prisma` · `genai`

**Link**

`LIVE ↗` · `useloom.vercel.app`

### FLUX

**Type:** `web app`

**Description**

A task manager built around a simple question: what actually needs your attention right now?

FLUX explores an offline-first approach to managing tasks, with urgency helping you decide what deserves your time instead of leaving you with another endless list.

**Stack**

`react` · `node` · `mongodb`

**Link**

`LIVE ↗` · `flux-space.vercel.app`

### MESSIT

**Type:** `ux redesign`

**Description**

VIT's mess app is part of everyday campus life. The idea here was simple: make a routine interaction less of a chore.

I explored how the experience could go from four taps to two, cutting unnecessary steps and making the interface more direct.

**Stack**

`figma` · `ux research`

**Link**

`ON APP STORES`

Click note: `no public link, sorry`

**Hangar footer**

Every project starts with a question. The interesting part is finding out whether the answer works.

---

## 05. Currently

**Label**

`[04] currently`

**Departure board**

`DEPARTURES`

Columns: `FLIGHT / TO / STATUS`

| Flight | Destination | Status | Hover |
|---|---|---|---|
| AM101 | GO + WEB | BUILDING | SHIPPED CODE |
| AM202 | SOFTWARE ENG | DEEP DIVING | UNDER THE HOOD |
| AM303 | NEW PROBLEMS | BOARDING | ALWAYS |
| AM404 | VINNOVATEIT | LEADING | VICE CHAIR |
| AM505 | THE SKY | LOOKING UP | DAILY |

**NOTAM printout**

Title: `notam a0110/26`

I've been getting deeper into software engineering, building with Go and web technologies, and trying to understand the systems behind the interfaces.

Outside the code editor, I'm still the same AvGeek who looks up when an aircraft passes overhead.

**Achievement rosette**

`2ND`

**Card front**

**Hexathon Designathon 2025**

Second place, Google Developer Groups VIT.

**Card back**

A graph-based approach to splitting group expenses using the fewest possible payments. A little graph theory, a practical problem, and a design challenge rolled into one.

---

## 06. Contact

**Label**

`[05] contact`

**Heading**

Say hi. Don't overthink it.

**Subheading**

Got an interesting idea, a problem worth solving, or a plane you'd like to talk about? My inbox is open.

**Boarding pass**

`BOARDING PASS` · `✈ AM 0110`

- Passenger: `YOUR NAME`
- Class: `HELLO / COLLAB / HIRE / AVGEEK TALK`
- From: `WHEREVER YOU ARE`
- To: `ADITYA'S INBOX`
- Seat: `{name}`

**Button**

`SCAN ↵`

**Scanner states**

- `PLACE PASS HERE`
- `RELEASE TO SCAN`
- `READING PASS`
- `BOARDING · WELCOME {NAME}`
- `NAME REQUIRED`

**Email template**

Subject: `{Class} from {name}`

Body:

Hi Aditya,

{message}

{name}  
Flight AM 0110 · Seat {seat}

**Interaction note**

`drag me to the gate →`

**Other ways in**

- Email: `adityamadan01@gmail.com`
- GitHub: `github.com/Aditya10801`
- LinkedIn: `in/aditya-madan`
- Instagram: `@your.avg.engineer`
- Résumé: `resume.pdf`

**Footer**

`© 2026 Aditya Madan · IST hh:mm · back to start ↺`

---

## Writing Principles

- This is a personal website, not a résumé with an aviation theme.
- Let the writing sound like someone talking about things they genuinely enjoy.
- Be specific wherever possible. Real projects and actual experiences beat abstract claims about curiosity.
- Keep the AvGeek identity visible throughout the experience, but don't force aviation metaphors into every sentence.
- Go is part of the toolkit by launch. Do not describe it as something I'm only beginning to explore.
- Avoid generic phrases such as "passionate about technology", "turning ideas into reality", and "leveraging cutting-edge technologies".
- No em dashes or en dashes.
- Avoid long blocks of text. Use short paragraphs, small details, interactive notes, and visual storytelling.
- Do not invent features, project outcomes, personal anecdotes, or achievements.
- Keep the existing board interactions, animations, and typography intact. Update the copy without making every section longer just for the sake of it.
- The final site should feel like spending a few minutes inside my world, not reading a list of qualifications.

---

## Added during the v2 design pass (draft, not in Copy v2 yet)

These came from the "feels empty" feedback and use only résumé facts. Review, rewrite, or cut.

**Hero: quick facts card**

- STUDYING · B.Tech Computer Science, VIT Vellore (3rd year, '28)
- BASED · Vellore, from Delhi
- BUILDING · Loom, Flux, MessIT
- ALSO · VinnovateIT, vice chair

**About: spec sheet**

Languages, frameworks, data, tools and concepts from the résumé (see context/design.md).

**Hangar: "under the hood" strip per project (2 to 3 real facts each)**

- Loom: GenAI extraction validated with Zod before saving · themes + recruiter mode · raw files discarded after extraction
- Flux: batched writes cut updates from 500ms to under 100ms on 1,000+ tasks · offline-first with IndexedDB · per-user isolated data
- MessIT: 4 taps to 2 for key actions · tested with 100+ students · shipped on VIT's app stores

**New zone: Logbook (sits between the hangar and currently, label `[04] logbook`; currently becomes `[05]`, contact `[06]`)**

| Date | Aircraft | Role | Remarks |
|---|---|---|---|
| Jan 2026 → now | VinnovateIT, VIT Vellore | Vice Chair | student tech club at VIT |
| 2025 | GDG VIT, Hexathon Designathon | designer | 2nd place, graph-based expense settling |
| 2024 → 2028 | VIT Vellore | B.Tech Computer Science | 3rd year |
| before | Delhi Public School Rohini | school | Delhi |

Totals: 3rd year · 3 projects shipped · 1 student club

Hexathon stays a single quiet row (owner: portray me as an engineering student, not an awards list). The rosette and achievement card were removed from Currently.
