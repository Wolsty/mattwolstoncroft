# Portfolio Redesign Brief

**Owner**: Matthew Wolstoncroft
**URL**: mattwolstoncroft.com
**Date**: April 2026
**Status**: Planning

---

## Positioning

**AI-native product builder.** Strategic product leader who ships across design and code. The site needs to be legible to three audiences without specializing into any one: Staff/Principal Design Engineers, Senior Product/UX Leaders, and Founder/Co-founder roles.

**Hero line** (from resume): *"Strategic product leader building AI-powered products from 0-to-1 — shipping across design and code."*

**What the site needs to prove that the current one doesn't:**

1. You design *and* ship — the site itself must be evidence of that, not a claim.
2. You think in systems — case studies expose decisions, tensions, and trade-offs, not just deliverables.
3. You're already doing AI-native work in production — LabNotes and Cengage are the proof.

---

## Site map

- `/` — Index: hero, AI chat, selected work, about, contact
- `/labnotes` — Flagship case study with live artifact
- `/cengage` — Content Studio case study
- `/seekwell` — Umbrella SeekWell/HelloEyes case study (see sub-pages below)
  - `/seekwell/ios-android-apps` — HelloEyes iOS & Android apps (6 flows)
  - `/seekwell/vision-assessment` — Online Vision Assessment (invisible qualification logic)
  - `/seekwell/ai-vision-exam` — AI-Powered Vision Exam (30% completion lift)
  - `/seekwell/diary-study` — Large-scale usability diary study
- `/archive` — Older work as a quiet list
  - `/archive/progrexion` — Umbrella page for 4 Progrexion-era projects (CreditRepair.com App, CreditRepair GO, Lexington Law iOS & Android, Credit.com / ExtraCredit). Full modal copy already exists on the current `/progrexion` page — reuse directly.
  - JAMS, iPR — line-item only
- `/resume` — Links to the PDF (use the existing one — it's already strong)

Cmd-K is available everywhere for navigation.

**Note**: SeekWell holds 4 dense sub-case-studies (all pulled from the existing site's modal content). The `/seekwell` index page is a mini-portfolio within the portfolio — think of it as a chapter containing four stories.

---

## Visual system

### Type

Match the resume exactly. Two families, not three.

- **Display**: **BL Arctic** — the headline face on the resume. Use for hero, section headings, case study titles, and any large-type moments.
- **Body**: **Times New Roman** — the body face on the resume. Use for prose, captions, metadata, nav. Ubiquitous, stable, free — and carries a quiet editorial confidence that reads as considered rather than decorative.
- **Optional third face (mono)**: only introduce a monospace (e.g. JetBrains Mono) if a specific spot truly needs it (code snippets in the LabNotes live artifact, keyboard shortcuts in the Cmd-K overlay). Otherwise stay on the two-family system.

Pairing rule: BL Arctic for display, Times New Roman for everything else. The tech-forward feel comes from layout, motion, and the live AI moments — not from type.

**Note on BL Arctic**: this is a licensed face. Confirm the license covers web embedding (or host via a foundry's web CSS) before the Claude Code build. If the web license is unavailable, swap to a close display alternative and flag it; do not substitute quietly.

### Color

- Light default, dark toggle (Cmd-K or small footer switch, honors system preference on first visit)
- **Light**: warm off-white background (#FAFAF7), near-black text (#111)
- **Dark**: near-black background (#0E0E0E), warm bone text (#EFECE4)
- **Accent**: terminal-green `#22C55E` — used only for link states, focus rings, Cmd-K chrome, and the cursor/caret moments inside the LabNotes live artifact. One accent, used with restraint.
- No gradients, no shadows beyond subtle elevation on hover

### Metadata treatment

Without a mono, the metadata row leans on Times New Roman set small, tracked out, and set in small caps (or all-caps) to read as "data" rather than prose:

```
2025 — PRESENT  ·  CO-FOUNDER  ·  NEXT.JS  ·  OPENAI  ·  SHIPPED
```

Tight letter-spacing at small sizes, a hairline divider above. Keeps the whole system on two faces while still visually separating metadata from narrative.

### Motion

- Minimal and functional
- Type fades in on scroll (short, ~200ms)
- Subtle link underline transitions
- Cursor state changes on interactive artifacts
- Cmd-K slides in, case study transitions are instant
- No parallax, no scroll-jacking

---

## Homepage layout

LabNotes is the strongest and most visual work and should carry the site. The homepage elevates it to its own block rather than a third card in a row.

1. **Hero** — Full-width BL Arctic display ("Matthew Wolstoncroft"). Positioning line beneath in Times italic. Small status metadata row in the corner (Times small caps): `AVAILABLE · NEW YORK` or similar.
2. **AI chat input** — Single line beneath the hero: *"Ask about my work →"*. Placeholder cycles through real questions, weighted toward LabNotes: ("How did LabNotes balance helpfulness and pedagogical integrity?", "What are the LabNotes integrity flags?", "What did you ship at Cengage?", "How do you approach AI UX design?"). Grounded in case study content.
3. **LabNotes feature block** — Full-width. The live artifact (scripted tutor walkthrough — script in `tech moments §2` below) embedded in-page, with the LabNotes title, metadata row in Times small caps, and a one-sentence tension beneath: *"An AI tutor maximally helpful to a single student is often actively harmful to their learning. LabNotes is the platform I built to resolve that."* Click-through to the full `/labnotes` case study. Treat this as the visual centerpiece of the homepage.
4. **SeekWell + Cengage — paired cards** — Two cards in a row, same weight as each other, visibly below LabNotes. Each: BL Arctic title, Times small-caps metadata row (year · role · stack), one hero image, one-sentence tension. Hover reveals a touch more detail. The pairing signals range (health-tech product design + edtech AI leadership) without competing with LabNotes for attention.
5. **About** — Two short paragraphs. Pull from resume opener. Keep the bike/mountains line — it's humanizing.
6. **Archive link + contact** — quiet footer. Small contact form (name, email, message) rather than a mailto link — matches the tech-forward feel and captures leads. Link to resume PDF next to it.

---

## Case study template

Same shell for all three, different content.

- Sticky mini-header: project name + status tag + back-to-index
- **Hero**: one strong image or live embed
- **Metadata row**: year, role, team size, stack, outcome metrics — in mono
- **Context** — one paragraph, what was the problem
- **Tension** — the real design/product problem in plain language (this is your voice at its sharpest)
- **Approach** — 3-6 process artifacts: screens, flows, prompt diagrams
- **Decisions** — 2-3 hard calls you made and why (most portfolios skip this; yours won't)
- **Shipped** — outcomes and screenshots of the real product
- **Reflection** — optional paragraph on what you'd do differently
- Next/prev case study navigation

---

## The three tech moments

### 1. Inline AI chat (homepage)

Small text input under the hero. Backend: Anthropic or OpenAI API with your case studies embedded as context (stuffed into system prompt or retrieved via simple vector search). Rate-limited per IP. Off-topic questions get a graceful redirect.

### 2. Live artifact (LabNotes — featured on homepage AND in case study)

Read-only animated walkthrough of the AI tutor's core interaction. Scripted, zero backend cost, maximum signal. Appears twice: embedded in the LabNotes homepage feature block (playing in a contained frame, ~700px wide) and again as the hero of the `/labnotes` case study.

**The script** — chemistry, electron configuration (the lowest-performing problem in the real class data: *Electron Configuration at 72% average*, which is why this problem matters pedagogically). Timed so the whole sequence plays in ~28–32 seconds.

Student messages are typed in character-by-character with a subtle cursor. Tutor responses fade in on completion. A small "Replay" affordance appears after the final line.

```
[Student]
What's the electron configuration of Iron (Fe)?

[Tutor]
Before I help you get there — what's iron's atomic number?

[Student]
26

[Tutor]
Good. So we need to place 26 electrons in the right order.
Want to work it out using the Aufbau order, or would noble gas
shorthand be easier from here?

[Student]
Aufbau

[Tutor]
Great. What's the first orbital you'd fill, and how many
electrons go in it?

[Student]
1s²

[Tutor]
Perfect — 2 down, 24 to go. What comes next?

[Student]
2s² 2p⁶

[Tutor]
Nice. You're at 10 electrons. Keep going.

[Student]
3s² 3p⁶ 4s² 3d⁶

[Tutor]
That's it — you built the full configuration yourself:
1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d⁶

One thing worth noticing: I never gave you the answer.
You reasoned through it. That's the point.
```

**Design notes for the artifact:**
- Monospace or Times small caps for `[Student]` / `[Tutor]` labels, serif for the dialogue itself
- Subtle color distinction between the two roles (student in near-black, tutor in a softer warm grey) — no chat bubbles
- Terminal-green cursor blink on the input line, matching the site accent
- The final line — *"I never gave you the answer. You reasoned through it. That's the point."* — should hold on screen for ~4s before the Replay affordance appears. It's the proof point.
- On mobile, shrink to viewport width; text stays the same, animation speed stays the same.

### 3. Command palette (Cmd-K)

Opens a nav/search overlay. Actions:
- Jump to case studies
- Toggle light/dark theme
- Copy email
- Download resume
- View source (link to GitHub repo)
- Ask the AI (routes to homepage chat)

Small `⌘K` hint in the footer.

---

## Content transplants from resume

Your resume writes sharper than typical portfolio copy. Reuse directly:

- *"solving the fundamental tension between helpfulness and pedagogical integrity"* → LabNotes tension paragraph
- *"embedding generative AI capabilities as core product differentiators rather than bolt-on features"* → Cengage tension paragraph
- *"compressing the typical PM + designer + analyst workflow into a single seat"* → SeekWell tension paragraph
- The strategic-product-leader opener → homepage hero line

---

## Tech stack

- **Framework**: Next.js 15 (App Router)
- **Content**: MDX for case studies (Markdown with inline React components for live artifacts, diagrams, etc.)
- **Styling**: Tailwind + a tiny design-token file for type/color
- **AI chat backend**: Next.js edge function calling Anthropic API (Claude Haiku for cost) or OpenAI
- **Retrieval**: simple in-memory vector search (embeddings generated at build time from case study MDX)
- **Host**: Vercel
- **Analytics**: Vercel Analytics or Plausible (privacy-respecting)
- **Fonts**: self-hosted via next/font

---

## Scope for v1

Full build in one pass:
- Design system (tokens, type, components)
- Homepage with AI chat
- Three case study pages (LabNotes, Cengage, SeekWell)
- Archive page
- Cmd-K command palette
- Light/dark toggle
- Mobile responsive throughout

---

## Case study content status

- **LabNotes.ai** — **Draft complete.** See `labnotes-case-study.md`. Flagship — elevated on homepage with dedicated feature block, and gets the live artifact as hero. 7 teacher-interface screens captured during the research session: Overview, Course Dashboard, AI Insights (Overview / Struggles / Integrity), Chat with LabNotes, Assignments. The Integrity tab (246 flags, Minimal Engagement + Score-Time Mismatch) is the hero image candidate if the live artifact doesn't lead.
- **Cengage Content Studio** — **Draft complete.** See `cengage-case-study.md`. 4 product screens received from Matthew: Adapt Content side-by-side, Select Content (empty + populated states), Explore home with Content Studio in sidebar. No additional imagery needed.
- **SeekWell / HelloEyes** — Full content captured from the current site's 4 modals. See `case-studies-content.md` (sections 1-4). Copy is strong, reuse directly. Existing SeekWell imagery on the current site can be reused.
- **Progrexion archive (4 projects)** — Full modal copy already captured in `case-studies-content.md` (sections 5-8). Treat as an umbrella `/archive/progrexion` page with 4 condensed sub-entries, mirroring how SeekWell nests 4 sub-cases. Copy is strong, reuse directly.
- **JAMS, iPR** — No case study needed; quiet line items only.

---

## Open items

All resolved. The Claude Code prompt is a one-shot write.

1. ~~**Serif font**~~ → **Resolved.** **BL Arctic** (display) + **Times New Roman** (body), matching the resume. Confirm BL Arctic web-license availability before the build; if unavailable, swap to a close display alternative and flag it — do not substitute quietly.
2. ~~**Case study imagery**~~ → **Resolved.** LabNotes has 7 captured teacher-interface screens. Cengage has 4 product screens from Matthew. SeekWell reuses existing site imagery. Progrexion archive is text-led with thumbnails from the current `/progrexion` page.
3. ~~**Current hosting**~~ → **Resolved.** Framer. Migration is a clean rebuild on Next.js 15 + Vercel, not a content port.
4. ~~**Contact method**~~ → **Resolved.** Simple contact form in the footer — name, email, message. Three fields, no dropdowns. Submit goes to a minimal Next.js route handler that emails Matthew (Resend or equivalent) and rate-limits per IP. Resume PDF link sits next to the form.
5. ~~**Writing/essays section**~~ → **Resolved.** Deferred to v2. Keeps v1 scope tight and keeps the site's center of gravity on the work, not the writer. If essays ship later, the section lives at `/writing` with the same editorial type treatment.
6. ~~**LabNotes live-artifact script**~~ → **Resolved.** Full script in *The three tech moments §2* above. Chemistry, electron configuration of Iron, six exchanges, ends with the tutor explicitly naming that it never gave the answer. ~28–32s total runtime.
7. ~~**Accent color**~~ → **Resolved.** Terminal-green `#22C55E`. Used sparingly — link states, focus rings, Cmd-K chrome, the live-artifact cursor. Signals AI-native without tipping into cliché.
8. ~~**5th project?**~~ → **Resolved.** 8 projects total exist on the current site: 4 SeekWell/HelloEyes on the homepage + 4 Progrexion archive modals.
9. ~~**LabNotes emphasis**~~ → **Resolved.** LabNotes moves out of the three-card row into its own full-width homepage feature block, with the live artifact embedded. SeekWell and Cengage share the row below. Selected-work hierarchy, Cmd-K default order, and AI-chat placeholder questions are all weighted toward LabNotes.

---

## Ready-to-build checklist

Before kicking off the Claude Code build, Matthew should have on hand:
- BL Arctic web-license files (or a confirmed fallback)
- The 7 LabNotes screen captures (already captured during this session — export from Chrome's download folder)
- The 4 Cengage Content Studio screens (already provided in-conversation)
- The existing `/progrexion` thumbnails from the current Framer site
- A production email destination for the contact-form webhook (Resend API key or equivalent)
- Anthropic or OpenAI API key for the homepage AI chat
- Domain/DNS access for Vercel cutover from Framer
