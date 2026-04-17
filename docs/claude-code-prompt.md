# Claude Code — Build Prompt for mattwolstoncroft.com

Paste this into Claude Code in an empty project directory. Before you start it, place these four companion files into `/docs/` at the project root so the agent can read them:

```
/docs/portfolio-redesign-brief.md
/docs/labnotes-case-study.md
/docs/cengage-case-study.md
/docs/case-studies-content.md
```

Everything below is the prompt itself.

---

## Prompt

You are building the full v1 of my personal portfolio, **mattwolstoncroft.com**. I design products — strategic product leader who ships across design and code. The site itself must be evidence of that, not a claim. Restrained, editorial, quietly tech-forward. No decoration for decoration's sake.

### Step 0 — Read before you build

Before writing a single line of code, read these four files in `/docs/` in full:

1. `portfolio-redesign-brief.md` — the design brief. Authoritative for structure, type, color, motion, site map, homepage layout, case study template, the three tech moments, and the live-artifact script. **Every decision in there is already made. Do not re-open them.**
2. `labnotes-case-study.md` — final copy for the LabNotes case study page. Use verbatim.
3. `cengage-case-study.md` — final copy for the Cengage case study page. Use verbatim.
4. `case-studies-content.md` — source copy for the SeekWell (sections 1–4) and Progrexion archive (sections 5–8) pages. Reuse directly; do not rewrite.

If anything in this prompt conflicts with the brief, the brief wins. If anything is under-specified, prefer restraint over invention.

### Stack

- **Next.js 15** (App Router, TypeScript, RSC by default, client components only where interactivity requires it)
- **Tailwind** + a small `design-tokens.css` file for custom properties
- **MDX** for case-study content (`@next/mdx`, with a set of custom components: `<LiveArtifact/>`, `<Figure/>`, `<Metadata/>`, `<DecisionBlock/>`, `<PrevNext/>`)
- **next/font** for self-hosted type — BL Arctic (display) and Times New Roman (body). If BL Arctic web-license files are not in `/public/fonts/`, stop and ask me before substituting.
- **Anthropic** (Claude Haiku) for the homepage AI chat — simple edge route handler with case-study MDX stuffed into the system prompt at build time. Rate-limited per IP.
- **Resend** for the contact form — one edge route, Zod-validated, IP-rate-limited.
- **cmdk** (`cmdk` on npm) for the command palette. Don't roll your own.
- **Vercel Analytics** — drop-in, privacy-respecting.
- **Host**: Vercel. Deploy on push to `main`.

### Design system — build this first, use it everywhere

Implement these tokens in `/src/styles/design-tokens.css` as CSS custom properties, and expose them to Tailwind via `tailwind.config.ts`. **No hex values in components.** All color / spacing / type sizes pull from tokens.

**Type**
- Display: BL Arctic (self-hosted via `next/font/local`, 400 weight), used for `<h1>`, hero, case-study titles, section headings.
- Body: Times New Roman (self-hosted, 400 + italic), used for prose, captions, nav.
- **No monospace.** Metadata rows use Times New Roman small-caps via `font-variant-caps: all-small-caps` + letter-spacing `0.08em`.
- Fluid display scale via `clamp()` — hero headline roughly `clamp(3.5rem, 8vw, 7rem)`, leading tight (1.02).

**Color**
- Light theme (default): `--bg: #FAFAF7; --fg: #111111; --fg-muted: #555555; --rule: #E5E3DB;`
- Dark theme: `--bg: #0E0E0E; --fg: #EFECE4; --fg-muted: #9A9A94; --rule: #1E1E1E;`
- Accent (both themes): `--accent: #22C55E;` — used only for link hover states, focus rings, the live-artifact cursor, and Cmd-K chrome. Never a fill color on large surfaces.
- Dark mode honors `prefers-color-scheme` on first visit, persists a `theme` cookie thereafter. Toggle lives in the Cmd-K palette and as a tiny text switch in the footer.

**Motion**
- Type fades in on scroll, ~200ms, `ease-out`, triggered once with `IntersectionObserver`. Use `prefers-reduced-motion` to disable.
- Link underline slides in from left on hover (`::after` pseudo-element, `transform: scaleX()`, 150ms).
- Cmd-K slide + fade, 180ms.
- Case study route transitions are instant. No parallax. No scroll-jacking.

**Grid & spacing**
- Max content width `1120px`. Prose column `640px`. Generous vertical rhythm — section spacing ~`clamp(6rem, 12vh, 10rem)`.

### Site map

```
/                       Home
/labnotes               LabNotes flagship case study
/cengage                Cengage Content Studio case study
/seekwell               SeekWell umbrella
  /seekwell/ios-android-apps
  /seekwell/vision-assessment
  /seekwell/ai-vision-exam
  /seekwell/diary-study
/archive                Archive index (quiet list)
  /archive/progrexion   Progrexion umbrella (4 sub-entries, modals or sub-pages — your call, but keep them terse)
  /archive/jams         Line item only
  /archive/ipr          Line item only
/resume                 Redirects to /Matthew-Wolstoncroft-Resume.pdf in /public/
```

Cmd-K is available from every page.

### Homepage

Follow the brief's homepage layout exactly. The important elevation: **LabNotes is the visual centerpiece.** It gets its own full-width block, not a card in a row. SeekWell and Cengage share the row below it.

Structure top to bottom:

1. **Hero** — full-width BL Arctic display name. Positioning line beneath in Times italic (from the resume: *"Strategic product leader building AI-powered products from 0-to-1 — shipping across design and code."*). Small metadata row in the top-right corner in Times small caps: `AVAILABLE · NEW YORK`.

2. **AI chat input** — single line under the hero: `Ask about my work →`. Placeholder cycles every 4s through these four questions:
   - *How did LabNotes balance helpfulness and pedagogical integrity?*
   - *What are the LabNotes integrity flags?*
   - *What did you ship at Cengage?*
   - *How do you approach AI UX design?*

   Submit → streamed response in a small results panel that unfurls under the input. See the "AI chat" section below for the backend.

3. **LabNotes feature block** — full-width, the visual centerpiece. Left column: BL Arctic title "LabNotes.ai", metadata row in Times small caps (`2025 — PRESENT · CO-FOUNDER · NEXT.JS · ANTHROPIC · POSTGRES · VERCEL · SHIPPED`), the tension line (*"An AI tutor maximally helpful to a single student is often actively harmful to their learning. LabNotes is the platform I built to resolve that."*), a single text link "Read the case study →" pointing to `/labnotes`. Right column: `<LiveArtifact />` embedded at ~700px wide, playing on scroll-into-view and replayable. See "Live artifact" below.

4. **Paired case-study cards** — two cards in one row, SeekWell and Cengage, equal weight. Each card: BL Arctic title, Times small-caps metadata, one hero image, one-sentence tension, hover reveals a short paragraph. Click anywhere on the card → case study.

5. **About** — two short paragraphs pulled from the resume opener (the "Strategic product leader..." paragraph). Keep the bike/mountains line if the user adds it — it's humanizing.

6. **Footer** — three blocks side-by-side:
   - Contact form (name, email, message) — posts to `/api/contact`.
   - Links: Resume PDF, GitHub, LinkedIn, email (copy-to-clipboard on click).
   - Tiny `⌘K` hint and theme text-switch.

### Case study template

One shared template at `/src/components/case-study/CaseStudyShell.tsx`. Each case study is an MDX file that exports `meta` and uses the shell.

Shell renders, in order:
1. **Sticky mini-header** — project name + status tag + `← back`. 40px tall, transparent → solid on scroll.
2. **Hero** — one strong image or `<LiveArtifact />`. Full-width inside the content max.
3. **Metadata row** — Times small caps.
4. **Context** — prose column, single paragraph.
5. **Tension** — prose column, set one size larger than body, italic pulls allowed. This is the voice.
6. **Approach** — prose with inline `<Figure />` components.
7. **Decisions** — 2–3 `<DecisionBlock />` components: each with a heading ("Decision 1 — ..."), body, optional figure.
8. **Shipped** — prose + figures.
9. **Reflection** — optional prose column.
10. **`<PrevNext />`** — next/prev case study navigation.

The LabNotes and Cengage MDX files should be near-verbatim transcriptions of `/docs/labnotes-case-study.md` and `/docs/cengage-case-study.md`. Figure placement is specified at the bottom of each source file — follow it.

### The three tech moments

#### 1. Homepage AI chat (`/api/chat`)

Edge route, streams Anthropic Claude Haiku responses. At build time, read every case-study MDX plus `/docs/case-studies-content.md`, concat them into a single string, and inject that as the system prompt. Keep it under ~20k tokens — if it exceeds, summarize the Progrexion archive sections first.

System prompt shape:
> You answer questions about Matthew Wolstoncroft's portfolio work. Use only the case-study content provided below. Be concise and specific — pull real numbers, project names, decisions, and outcomes directly from the material. If the question is off-topic (not about Matthew, his work, or product/design/AI), redirect gracefully in one sentence. Never invent details that aren't in the material. Speak in Matthew's voice: direct, unrhetorical, opinionated.
>
> [… case-study content …]

Rate limit: 10 requests per IP per hour, using Vercel KV or Upstash. Off-topic responses use a standard graceful redirect line. Log nothing beyond what's required for rate limiting.

#### 2. Live artifact (LabNotes)

`<LiveArtifact />` is a self-contained client component, **no backend**. It renders the scripted chemistry dialogue from the brief's "three tech moments §2" section. Exact script is there — do not edit the script content.

Implementation:
- `useState` for each turn's visible text.
- Student lines type character-by-character at ~55ms per char with a blinking terminal-green cursor.
- Tutor responses fade in on line completion over ~220ms with a short pre-roll pause (~500ms).
- Total runtime 28–32s. Use `setTimeout` chains in a `useEffect`, cleaned up on unmount.
- Start playing when the component enters the viewport (`IntersectionObserver`, once).
- After the final line holds for 4s, show a small "Replay" text link in the accent color.
- Student lines: near-black (`--fg`). Tutor lines: `--fg-muted`. No chat bubbles. Labels `[Student]` and `[Tutor]` in Times small caps.
- Respect `prefers-reduced-motion`: if set, skip the typing animation, render the whole dialogue immediately with a single "Replay" affordance.
- Mobile: shrink to viewport width, do not change timing.

Place the component in `/src/components/live-artifact/LiveArtifact.tsx`. Used on the homepage feature block and as the LabNotes case-study hero.

#### 3. Command palette (Cmd-K)

Use `cmdk`. Keyboard: `⌘K` (Mac) / `Ctrl+K` (Windows). Also opens from the footer hint.

Default result order (LabNotes first, always):
1. Jump to LabNotes case study
2. Jump to Cengage case study
3. Jump to SeekWell
4. Jump to Archive
5. Toggle light/dark theme
6. Copy email address
7. Download resume
8. Ask the AI (focuses the homepage chat input)
9. View source (opens the repo on GitHub, new tab)

Fuzzy search over result labels. Keyboard navigation (↑↓ + enter). Focus ring in accent color. Close on `Esc` or background click. Slide + fade in, 180ms. Overlay dim `rgba(0,0,0,0.3)` in light mode, `rgba(0,0,0,0.6)` in dark.

### Accessibility (non-negotiable)

- Every interactive element keyboard-accessible. Visible focus rings on all focusables.
- Contrast ratios ≥ WCAG AA in both themes. Verify the accent green on both backgrounds.
- Motion respects `prefers-reduced-motion`.
- All images have alt text. Decorative images use `alt=""`.
- The live artifact is not the only way to consume the LabNotes tension — the case study copy carries it in text.
- Every page has a single, correct `<h1>`. Heading hierarchy is clean.

### Performance

- Lighthouse performance ≥ 95 on desktop, ≥ 90 on mobile (measured on Vercel preview).
- Self-hosted fonts with `font-display: optional` for body, `swap` for display.
- Images: `next/image` everywhere. Case-study hero images served in AVIF/WebP. Explicit width/height to prevent CLS.
- No third-party scripts other than Vercel Analytics.
- Zero unused Tailwind at build (the default JIT handles this; just don't paste in a dependency that ships its own CSS).

### Project structure

```
/src
  /app
    /(site)
      page.tsx                       # home
      /labnotes/page.tsx             # MDX-driven
      /cengage/page.tsx              # MDX-driven
      /seekwell/page.tsx             # umbrella index
      /seekwell/[slug]/page.tsx      # dynamic sub-case studies
      /archive/page.tsx
      /archive/[slug]/page.tsx
      layout.tsx                     # fonts, theme provider, Cmd-K mount, footer
    /api
      /chat/route.ts                 # Anthropic edge route
      /contact/route.ts              # Resend edge route
  /components
    /case-study/…                    # shell, DecisionBlock, Figure, Metadata, PrevNext
    /live-artifact/LiveArtifact.tsx
    /cmdk/CommandPalette.tsx
    /chat/HomepageChat.tsx
    /contact/ContactForm.tsx
    /hero/Hero.tsx
    /nav/Footer.tsx
  /content
    /case-studies/*.mdx
  /lib
    /chat/system-prompt.ts           # build-time concatenation
    /rate-limit.ts
    /theme.tsx
  /styles
    design-tokens.css
    globals.css
/public
  /fonts/…                           # BL Arctic + any Times fallbacks
  /images/case-studies/…
  Matthew-Wolstoncroft-Resume.pdf
/docs
  # the four files above
tailwind.config.ts
next.config.mjs
```

### Content reuse rules

- LabNotes and Cengage MDX are transcriptions of the `/docs/*.md` drafts. The prose, the decisions, the tension — copy it exactly. You can adjust heading levels to fit the shell; do not rewrite sentences.
- SeekWell and Progrexion pages pull copy directly from `/docs/case-studies-content.md`. The sections map 1:1:
  - `/seekwell/ios-android-apps` ← section 1
  - `/seekwell/diary-study` ← section 2
  - `/seekwell/vision-assessment` ← section 3
  - `/seekwell/ai-vision-exam` ← section 4
  - `/archive/progrexion` umbrella ← sections 5–8, each rendered as a condensed sub-entry on the umbrella page (no separate sub-route needed unless the sub-entry runs long)

### What to ask me before shipping

Only ask if one of these is missing or blocked:
1. BL Arctic web-license files. Check `/public/fonts/` — if absent, stop and ask.
2. LabNotes screen captures (7 images). Check `/public/images/case-studies/labnotes/` — if absent, stop and ask.
3. Cengage product screens (4 images). Check `/public/images/case-studies/cengage/` — if absent, stop and ask.
4. Anthropic API key in `.env.local` as `ANTHROPIC_API_KEY`. If absent on first chat-feature run, stop and ask.
5. Resend API key in `.env.local` as `RESEND_API_KEY`. If absent on first contact-form run, stop and ask.

Everything else: decide yourself and move on. Bias toward restraint and the brief.

### Build order

Work in this sequence. At the end of each step, commit with a short conventional message.

1. Scaffold Next.js 15 + TypeScript + Tailwind + MDX. Get `/` rendering an empty page.
2. Design system — tokens, fonts, theme provider, dark/light toggle, global styles.
3. Layout chrome — nav-less header, footer with contact form placeholder, Cmd-K palette.
4. Homepage — hero, AI chat input (stubbed with a static response), LabNotes feature block (with `<LiveArtifact />` placeholder), paired cards, about, footer.
5. Live artifact — full implementation with the chemistry script.
6. Case-study shell and MDX pipeline — render `/labnotes` and `/cengage` from their MDX drafts.
7. SeekWell umbrella and four sub-case studies.
8. Archive + Progrexion umbrella.
9. AI chat backend — edge route, system prompt concat, rate limiting, streaming.
10. Contact form backend — edge route, Resend integration, rate limiting.
11. Responsive pass — mobile nav behavior, mobile live-artifact sizing, tap-friendly Cmd-K launcher.
12. Accessibility audit — axe-core locally, fix any violations.
13. Lighthouse pass — optimize until both desktop and mobile hit the targets above.
14. Vercel deploy + domain cutover.

### Definition of done

- All routes render with real content, no lorem ipsum.
- The homepage live artifact plays the full chemistry dialogue end-to-end, ends on the tutor's "never gave you the answer" line, and shows a working Replay.
- Cmd-K opens from any page, navigates to every case study, toggles theme, and returns focus correctly on close.
- Homepage AI chat returns a grounded answer to *"What are the LabNotes integrity flags?"* that mentions 246 flags and Minimal Engagement / Score-Time Mismatch — pulled from the case study copy, not invented.
- Contact form submits successfully to a test email, and rate-limits after 3 submissions from one IP in 10 minutes.
- Dark mode is fully styled, honors system preference on first visit, persists.
- Lighthouse: desktop ≥ 95 performance, ≥ 95 accessibility. Mobile ≥ 90 performance, ≥ 95 accessibility.
- No console errors in production. No layout shift on initial load.

Ship it.
