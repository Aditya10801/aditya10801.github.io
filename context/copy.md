# Aditya Madan | Personal Website Copy

## Creative Direction

This is a personal website, not a web résumé.

The site should feel like entering Aditya's little corner of the internet. It should reveal his interests, habits, work, photographs, sense of humour, and the small details that make him who he is.

He is a computer science student, developer, designer, AvGeek, perfectionist, Punjabi music listener, traveller, and professional overthinker. These are different parts of his life, not a hierarchy of credentials.

The aviation-inspired interface is the visual language of the site, not a requirement to turn every sentence into an aviation pun.

### The voice

- Witty, conversational, occasionally sarcastic.
- Comfortable switching between a joke and a sincere observation.
- Self-deprecating without making the entire site a joke about being incompetent.
- Thoughtful when discussing things that genuinely interest him.
- Specific rather than grandiose.
- Detail-conscious without repeatedly announcing that he cares about details.

### The feeling

Visitors should come away thinking:

- This person has a distinct personality.
- He cares about how things look and feel, sometimes probably too much.
- He is curious about the world beyond his immediate interests.
- He has things he enjoys that have nothing to do with his career.
- Someone put real thought into this website.

### Important constraints

- Do not turn this into a résumé with an aviation skin.
- Do not make every personal interest sound like a professional advantage.
- Do not invent stories, achievements, technical metrics, or personal details.
- Do not imply Aditya built software he only contributed to through design.
- No em dashes or en dashes.
- Preserve the existing layouts, typography, animations, terminal, interactions, and aviation-themed visual assets.
- The copy below should replace the existing copy in the implementation. Keep functional commands and interactions working.

---

# 00. Global Navigation

## Terminal prompt

`aditya@board:~/hangar $`

Idle hint:

`type help, or press /`

### Terminal welcome

```text
Welcome aboard.

This is Aditya's corner of the internet.
Look around. There are a few things to find.

Type help to see what you can do.
```

Keep the welcome compact. It should not behave like a full-screen onboarding modal.

### Commands

| Command | Behaviour |
|---|---|
| `help` | List available commands |
| `whoami` | Open the short personal introduction |
| `ls` | List available destinations |
| `cd about` | Navigate to About |
| `cd hangar` | Navigate to software projects |
| `cd interests` | Navigate to personal interests |
| `cd logbook` | Navigate to personal history |
| `cd contact` | Navigate to Contact |
| `pwd` | Show the current section |
| `date` | Display the current local date and time |
| `clear` | Clear terminal output |
| `theme` | Toggle the supported theme |
| `music` | Open music-related content or its existing interaction |
| `open japan` | Reveal the Japan Polaroid or its story |
| `open easter-eggs` | Reveal a subtle hint about hidden details |

Keep all existing supported commands and aliases. These are content labels, not permission to remove existing functionality.

### `whoami`

```text
aditya madan

student at VIT Vellore, originally from Delhi.
developer, designer, AvGeek.

usually learning something, looking something up,
or wondering why I haven't learned enough already.
```

### `help`

```text
Available commands:

  whoami          a short introduction
  ls              see what's around
  cd <section>    go somewhere
  open <thing>    look a little closer
  music           a small detour
  theme           change the atmosphere
  clear           pretend nothing happened

Tip: not everything here is immediately obvious.
```

### Terminal responses

- `sudo`

  `Nice try. You have not been granted administrative privileges over my life.`

- `exit`

  `No exits on this flight. The closest one is contact.`

- Unknown command

  `Command not found. Could be a typo. Could be a skill issue.`

- `whoami` with repeated execution

  `Still Aditya. Identity crisis pending.`

- `help` with repeated execution

  `The commands have not changed. Your commitment to exploring them is appreciated.`

- `clear`

  `Terminal cleared. Your browser tabs remain your responsibility.`

Keep the responses short. Do not flood the terminal with jokes every time a command is entered.

---

# 01. Hero

### Metadata

`N 28.61° E 77.21° · DELHI ⇄ VELLORE · IST HH:MM`

Keep the coordinates and time functional if they are already dynamically generated. Do not display a live clock if the implementation does not support it.

### Headline

# Hi, I'm Aditya.

### Subheadline

**Software, design, aircraft, and an unreasonable number of open tabs.**

### Body

I'm a student at VIT Vellore, originally from Delhi. I like figuring things out, making things look right, travelling somewhere new, and occasionally spending an embarrassing amount of time researching something that started as a passing thought.

Some days that means building something on my laptop. Other days it means sitting around with friends, going nowhere in particular, and somehow making an entire evening out of it.

Either way, I'm probably thinking about something.

### Primary actions

- `say hi`
- `github`
- `resume.pdf`

The résumé remains available, but it should not dominate the hero.

### Portrait printout

**Caption:** `SUBJECT: ADITYA`

**Stamp:** `GENERALLY OPERATIONAL`

**Handwritten note:** `photogenic under controlled conditions`

### Name sticker

`HELLO! my name is aditya`

### Scroll prompt

`look around ↓`

### Small metadata labels

- `currently: figuring it out`
- `operating status: mostly functional`
- `open tabs: classified`

The open-tabs joke is a visual detail, not a repeated punchline across every section.

---

# 02. About

### Section label

`[01] about`

### File label

`about.txt`

### Heading

# Curious by default. AvGeek by choice.

### Lead

I have a habit of getting interested in things and then wanting to know everything about them. The original question is usually innocent. The next forty-seven browser tabs are not.

### Body

I'm from Delhi and currently studying Computer Science at VIT Vellore.

When I'm not in class, I'm usually out with friends, wandering around, or sitting somewhere talking about absolutely anything. If I'm at my laptop, there's a reasonable chance I'm trying to learn something new, looking up something random, or convincing myself that everyone else has figured life out except me.

That last activity is particularly unproductive.

I like software and design, but I'm not interested in spending my entire life staring at a screen. I like travelling, listening to music, discovering places, and understanding how things work outside my immediate bubble.

Japan was one of those experiences that stayed with me. Beyond the places themselves, I was fascinated by the culture, the technology, and the thought put into everyday systems. So many little things seemed considered. It made me want to look closer rather than simply tick places off a list.

I notice details. Sometimes that's useful. Sometimes I'm still adjusting something that nobody else would have noticed in the first place.

### Personal tag

`student · delhi → vellore · avgeek · perpetual browser of things`

### Portrait / Polaroid

Keep the existing Japan Polaroid from Amanohashidate.

**Front caption:**

`Amanohashidate, Japan`

`a very good place to stand around and think`

**Back caption:**

Amanohashidate is famous for its sandbar, which can look like a bridge reaching into the sky when viewed upside down through the traditional *matanozoki* pose.

I liked the place, but I also liked everything around it: the details, the atmosphere, and seeing a different way of doing things.

Japan made me want to pay attention.

Flip the card to discover the story. Preserve the existing flip interaction.

Do not add a motivational conclusion about how this changed my approach to software. Let the memory exist on its own.

---

# 03. Things I'm Into

### Section label

`[02] interests`

### Heading

# Things that occupy my brain rent-free.

### Introduction

Some are serious interests. Some are hobbies. Some started with one question and have since become a minor research project.

No particular order. My brain does not have a very good filing system.

## Card 01. Software and building things

### Heading

`making things work`

I like learning how things work by getting my hands dirty. Sometimes I build something useful. Sometimes I spend an unreasonable amount of time figuring out why something that should work absolutely refuses to cooperate.

I'm interested in the details behind the result, not just getting something to run once and declaring victory.

**Terminal illustration:**

```text
$ go test ./...

tests running...
expectations high...
```

**Hover reveal:**

`it passed. I checked twice.`

Keep Go as a genuine current interest. By launch, mention what I'm actually building or learning with it if the relevant project is ready. Do not invent a finished project or claim expertise I do not have.

## Card 02. Design and the little things

### Heading

`one pixel off`

I care about how things look, but also about how they feel to use. A beautiful interface that makes a simple task unnecessarily difficult is still a bad experience.

I can spend far too long thinking about spacing, interactions, or whether something feels right. The difference between "good enough" and "exactly right" is sometimes a few pixels and sometimes a complete lack of perspective.

I am still working on knowing when to stop.

**Illustration:**

`[ button ]`

**Hover reveal:**

`moved it 2px. you're welcome.`

The joke should appear only on interaction. Do not make the card itself look like a design résumé.

## Card 03. Aviation

### Heading

`look up`

I'm an AvGeek. Aircraft overhead have a habit of interrupting whatever I'm doing.

One minute I'm going about my day. The next I'm trying to work out what is flying past, where it might be going, or what else I can find out about it.

I'm interested in the aircraft themselves, but also the wider world behind a flight: weather, operations, systems, and the coordination that makes it all happen.

There is a perfectly reasonable explanation for this. I just don't always have time to give it.

**Illustration:**

Use the existing radar or aircraft-tracking artwork.

**Hover reveal:**

`yes, I looked up again.`

## Card 04. Travelling and looking closer

### Heading

`somewhere else`

I like travelling because it lets me experience a place rather than just read about it.

Japan made a particularly strong impression on me. I loved seeing another culture up close and noticing how technology, everyday life, and public systems fit together.

I like coming back from somewhere with more than photographs. New observations, new questions, and a camera roll that will eventually need organising.

Eventually.

**Illustration:**

Use the existing travel-inspired visual language. Do not invent a list of destinations or travel statistics.

**Hover reveal:**

`camera roll: a future problem.`

## Small interstitial

`Other recurring interests include Punjabi music, particularly Karan Aujla, and conversations that were supposed to take ten minutes.`

Optional small link:

`a little music detour ♪` (reveals the line below in place, no external link)

Do not create a full music player unless one already exists or is intentionally being implemented.

---

# 04. The Hangar

### Section label

`[03] hangar`

### Heading

# Things I've built.

### Introduction

A few things that made it beyond an idea in my notes.

Some are software projects. Some are experiments. They don't all have the same story, and they don't all need to pretend they're changing the world.

Keep this section specifically for software projects that I actually built or contributed to as an engineer.

## Project 01. LOOM

### Type

`WEB APP`

### Description

Your work lives in a dozen different places. GitHub over here, your résumé over there, LinkedIn somewhere else, and the actual story of what you can do scattered across all of them.

LOOM explores bringing those pieces together into a single portfolio, using AI to help connect the dots.

### Stack

`Next.js · PostgreSQL · Prisma · GenAI`

### Link

`loom.buildspace.cv`

### Under the hood

Use the existing technical implementation details, where verified:

- Extract relevant information from supplied professional materials.
- Validate structured AI output before saving it.
- Keep the portfolio presentation flexible with themes and recruiter-oriented views.
- Handle uploaded source material carefully, including its disposal after extraction if that is how the current implementation works.

Do not expose implementation claims that are no longer accurate.

### Small caption

`trying to make the internet tell a more coherent story`

## Project 02. FLUX

### Type

`WEB APP`

### Description

Most task managers are excellent at helping you collect tasks. The actual challenge is deciding what deserves your attention.

FLUX explores a different approach: a task manager that helps bring urgency into the picture instead of leaving you with an endless list and an increasingly guilty conscience.

### Stack

`React · Node.js · MongoDB`

### Link

`flux-space.vercel.app`

### Under the hood

Retain verified implementation details from the current project:

- Offline-first task handling.
- Efficient updates and batching, if the measured performance improvement remains accurate.
- Per-user data isolation.
- The existing storage and synchronisation approach.

Do not include unverified performance numbers.

### Small caption

`because apparently making the list longer wasn't helping`

## Project cards

Each card should expose:

- Project name and category.
- A short description.
- Stack labels.
- Live project link where available.
- An optional under-the-hood expansion.

Keep the writing compact. The cards should not become long case studies.

### Section footer

`More things will appear here when they are ready. I would rather show fewer things properly than pad out the hangar.`

---

# 05. Design Work

### Section label

`[04] design desk`

### Heading

# Things I've helped make better.

### Introduction

Not everything I work on starts with a code editor.

Sometimes the problem is the experience itself: what a person sees, where they get stuck, and how much unnecessary effort a simple task demands.

This is where design work belongs.

## MESSIT

### Category

`UI/UX DESIGN CONTRIBUTION`

### Description

MessIT is a campus mess app at VIT. My contribution was to its UI/UX design, focusing on making routine interactions simpler and more intuitive.

The goal was to reduce unnecessary steps between opening the app and getting something done.

For a key action, the redesign reduced the interaction from four taps to two.

### Contribution

`UI/UX · Interaction design · Interface design`

### Link

`No public case-study link available`

App listing (added): `MessIT on the App Store ↗` → https://apps.apple.com/in/app/messit/id6748703795

### Case-study note

If the existing project materials substantiate the design process, show the relevant screens, the original friction point, and the redesigned interaction.

Do not imply that I built the application, owned its backend, or implemented the engineering.

Do not invent research findings, user-testing numbers, or product outcomes.

### Small caption

`less tapping. more getting on with your day.`

### Section footer

`Design is not decoration. And good design should not need a paragraph explaining why a button is where it is.`

This is a design contribution, not another engineering project card. Preserve that distinction in headings, filters, metadata, and any project navigation.

---

# 06. Logbook

### Section label

`[05] logbook`

### Heading

# A few coordinates.

### Introduction

A very brief record of where I've been and what currently occupies my time.

No dramatic origin story. I was simply a person before I made a website about being a person.

## Entry 01. Delhi

`ORIGIN`

Originally from Delhi.

## Entry 02. VIT Vellore

`2024 → 2028`

B.Tech in Computer Science and Engineering.

Currently making my way through university, with all the learning, experimenting, overthinking, and figuring things out that comes with it.

## Entry 03. VinnovateIT

`VIT VELLORE`

Vice Chairperson of VinnovateIT.

A significant part of my university life, alongside the people, events, and work that come with being involved in a student technology club.

Keep the role factual and concise. The website should not turn into an event résumé or a list of administrative responsibilities.

## Quiet entry. Hexathon

`GDG VIT · DESIGNATHON · 2025`

Second place.

Keep this as a compact logbook entry. No oversized trophy, award badge, or celebratory achievement card.

The award can be found by someone who looks closely. It does not need to become the story of the website.

---

# 07. Currently

### Section label

`[06] currently`

### Heading

# Current conditions.

### Introduction

A snapshot of what's occupying my time lately. Subject to change without notice, occasionally without my knowledge.

Use the existing departure board.

## Departure board

| Flight | Destination | Status |
|---|---|---|
| AM101 | GO + SOFTWARE | IN PROGRESS |
| AM202 | NEW THINGS TO LEARN | BOARDING |
| AM303 | INTERESTING PROBLEMS | ALWAYS |
| AM404 | VINNOVATEIT | VICE CHAIR |
| AM505 | THE SKY | LOOKING UP |

### Hover details

**AM101**

`learning, building, breaking, repeating`

**AM202**

`the list of things I don't know remains ambitious`

**AM303**

`the interesting part is usually figuring out the actual problem`

**AM404**

`one of the many things happening at VIT`

**AM505**

`aircraft overhead remain a valid interruption`

Keep this section grounded in my actual current activities. Update the entries before launch if my current focus has changed. Do not present an aspiration as a completed project.

## NOTAM card

### Identifier

`NOTAM A0110/26`

### Heading

`A note from the cockpit`

### Body

Currently learning, building, exploring, and trying to convince myself that I am making enough progress.

Some days feel productive. Other days I open my laptop, discover twelve things I don't know, and somehow make the list longer.

Progress continues. Confidence is operating under intermittent conditions.

Keep the tone self-aware rather than bleak. This is a small glimpse of the person behind the site, not a public account of private worries.

---

# 08. Contact

### Section label

`[07] contact`

### Heading

# Say hi. Don't overthink it.

### Body

Have an interesting idea, a good recommendation, a question about something I've made, or a plane you've been trying to identify?

I'm happy to hear from you.

We can talk about software, design, aviation, travel, music, or absolutely nothing important.

You don't need a perfectly written message. I spend enough time trying to make things perfect already.

### Boarding pass

**PASSENGER**

`ADITYA / ADI`

**CLASS**

`HELLO · COLLAB · AVGEEK TALK · OTHER`

**FROM**

`WHEREVER YOU ARE`

**TO**

`ADITYA'S INBOX`

**SEAT**

`YOUR CHOICE`

**BUTTON**

`REQUEST CLEARANCE`

### Interaction states

- Default: `ready when you are`
- Hover: `this is less complicated than airport security`
- Sending: `transmitting...`
- Success: `message received. thanks for stopping by.`
- Error: `transmission failed. try the direct email route.`

Ensure the success state appears only after the message has actually been sent.

### Other links

- Email: `adityamadan01@gmail.com`
- GitHub: `github.com/Aditya10801`
- LinkedIn: `linkedin.com/in/aditya-madan`
- Instagram: `@your.avg.engineer`
- Résumé: `resume.pdf`

Keep the résumé link accessible without making it the primary call to action.

---

# 09. Footer

### Primary line

`made with an unreasonable amount of attention to detail.`

### Secondary line

`and probably one more adjustment after this.`

### Metadata

`© 2026 ADITYA MADAN`

`DELHI ⇄ VELLORE`

### Back to top

`return to departure`

### Small hidden footer detail

On hover over the copyright year:

`yes, I checked the alignment.`

Keep the footer understated. Do not add a large skills list, contact pitch, or résumé summary here.

---

# 10. Hidden Details and Easter Eggs

These should reward exploration without making the website difficult to navigate.

Use the existing terminal, hover interactions, stickers, Polaroid, and departure board. Do not add elaborate new UI just to accommodate every joke.

## Easter egg 01. The open-tabs counter

If a browser-tab visual already exists, hovering it reveals:

`no, I don't remember opening all of these either.`

Do not display a fabricated count of real browser tabs.

## Easter egg 02. The perfectionist

Hover over a small decorative alignment mark or a subtle detail in the interface:

`this was moved 2px. twice.`

Use sparingly.

## Easter egg 03. The AvGeek

Hover over the aircraft or radar:

`conversation paused. aircraft overhead.`

## Easter egg 04. The terminal

Entering `sudo` returns:

`Nice try.`

Entering `exit` returns:

`No exits on this flight. The closest one is contact.`

## Easter egg 05. The music detour

The music link can reveal:

`currently accepting Punjabi music recommendations, despite having Karan Aujla on repeat.`

Do not invent a currently playing track or claim that music is playing unless the site implements actual audio playback.

## Easter egg 06. The Japan Polaroid

The back of the Polaroid contains the Amanohashidate story from the About section.

Keep the discovery satisfying but do not make essential information accessible only through the flip interaction.

## Easter egg 07. The unknown command

Entering a random terminal command returns one of several short responses:

- `That command is not in the flight plan.`
- `Nope. Try help.`
- `Interesting theory. Incorrect command.`

Keep responses varied but restrained. Do not turn the terminal into a chatbot.

---

# 11. Copy and Implementation Checklist

Before considering the copy complete, verify the following.

## Personality

- [ ] The site feels like a person, not a professional profile.
- [ ] Everyday life and personal interests are represented alongside work.
- [ ] The writing includes wit and self-deprecating humour without making every section a joke.
- [ ] The Japan story feels like a genuine memory, not a forced professional metaphor.
- [ ] Punjabi music and Karan Aujla appear as small, natural personal details.
- [ ] The copy acknowledges perfectionism without repeating the same joke everywhere.

## Accuracy

- [ ] LOOM and FLUX appear as software projects.
- [ ] MESSIT appears explicitly as a UI/UX design contribution.
- [ ] No copy implies that Aditya built the MessIT application.
- [ ] No unsupported technical metrics or achievements have been added.
- [ ] Go is described according to the actual state of the work at launch.
- [ ] VinnovateIT and Hexathon remain contextual details, not the focus of the website.

## Design and interaction

- [ ] Existing terminal commands continue to work.
- [ ] The departure board, Polaroid flip, stickers, and hover interactions remain functional.
- [ ] Hidden details are discoverable but nonessential.
- [ ] No important content exists only in hover states.
- [ ] The copy fits the existing layout without unnecessary new sections.
- [ ] The site remains responsive and readable on mobile.

## Final test

Read the entire website from top to bottom.

If it sounds like a recruiter wrote it, rewrite it.

If every sentence contains an aviation pun, remove most of them.

If a personal detail is included only because it makes Aditya sound employable, question whether it belongs.

If a sentence is trying too hard to be witty, simplify it.

The goal is not to convince everyone that Aditya is impressive. The goal is to let people discover someone interesting, curious, occasionally ridiculous, particular about the details, and very much still figuring things out.

**The website should feel finished. The person it represents does not have to be.**
