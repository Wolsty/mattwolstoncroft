# mattwolstoncroft.com — Revisions, Round 1

You built v1 of this site. I've reviewed it and there's a set of changes I want in one pass. Every item below is decided — don't re-open. Work in the order listed, commit between each step, and keep the restrained editorial character of the site intact.

If you're unsure about any decision after reading this file, prefer **subtraction** over invention.

---

## Changes

### 1. Remove the homepage AI chat entirely

Scrap it. Every trace:

- Delete `src/components/chat/HomepageChat.tsx` (and any other files under `src/components/chat/`).
- Delete `src/app/api/chat/route.ts`.
- Delete `src/lib/chat/system-prompt.ts` and anything else under `src/lib/chat/`.
- Remove the chat mount from the homepage.
- Remove **"Ask the AI"** from the Cmd-K palette (it's item 8 in the original order — the palette now has 8 items instead of 9 after item 5 below).
- Remove `@anthropic-ai/sdk` from `package.json` and run `npm install` so the lockfile updates.
- Remove `ANTHROPIC_API_KEY` from `.env.example`. **Do not touch my `.env.local`.**
- Remove any rate-limit code that was specific to the chat route; keep the contact-form rate limit.

When done, `rg -i "anthropic|chat"` over the repo should return zero hits outside of the `/docs/` markdown files and a single passing mention in the LabNotes case-study prose (which is about the tech stack, not the homepage chat — leave that).

### 2. Restructure the homepage

New order, top to bottom:

1. **Hero** — name in BL Arctic + the Times-italic positioning line beneath it. Nothing else.
2. **About** — the two short paragraphs from the resume opener. Prose column width.
3. **Projects** — **four** cards in one consistent grid: **LabNotes**, **Cengage**, **SeekWell**, **Progrexion**. Equal weight, equal dimensions, equal treatment. No LabNotes-feature-block elevation. All four are peers. Layout: prefer 2×2 at desktop (reads with rhythm); collapse to a single column on mobile. One row of four is also acceptable at wider breakpoints if the card aspect ratio holds up — your call based on what actually looks right.
4. **Footer** — contact form, links, Cmd-K hint, theme switch.

No chat. No live artifact. No hero metadata row (see item 4). **Progrexion is no longer in an archive** — see item 7 for the full treatment. If you kept a separate `/archive` section in v1, it's going away in this pass.

Because the homepage is now simpler, give it room — generous section spacing between About and Projects, and between Projects and Footer. Don't let it collapse into one short scroll.

### 3. Remove the LabNotes LiveArtifact

The scripted chemistry walkthrough was a nice idea but it's not working. Kill it.

- Delete `src/components/live-artifact/LiveArtifact.tsx` and any supporting script / data file.
- Remove every import/usage.
- Homepage: per item 2, LabNotes is now a normal card alongside Cengage, SeekWell, and Progrexion.
- Case study hero for `/labnotes`: replace the `<LiveArtifact />` with a single static image.

**Image behavior for the `/labnotes` hero:**
- Primary: use `/public/images/case-studies/labnotes/labnotes-product-mock.png` if it exists. I'll add this file myself — it's the product mock that sits just below the fold on **labnotes.ai** (the marketing homepage), not the teacher app.
- Fallback (if the file is missing at build time): use `/public/images/case-studies/labnotes/ai-insights-integrity.png`. That's the strongest existing screen and the case-study doc already flags it as the fallback hero. The build should not fail if the primary file is absent — just fall through.

Also remove any copy that framed the live walkthrough as part of the case study ("three tech moments," "live artifact," etc.). The written case study carries its own weight; don't rewrite the prose.

### 4. Remove "AVAILABLE · NEW YORK"

Delete the small metadata row in the top-right corner of the hero. No replacement, no substitution. The hero is just the name and the positioning line now.

### 5. Remove the GitHub link

- Footer: remove the GitHub link from the links block.
- Cmd-K: remove **"View source"** from the palette.

### 6. Email address replacement

Replace every reference to any email address with `wolstoncroft.1@gmail.com`. Check:

- Footer links block (copy-to-clipboard action).
- Contact form target address.
- `.env.example`: `CONTACT_EMAIL_TO=wolstoncroft.1@gmail.com`. Leave my `.env.local` untouched.
- Any email string in case-study metadata, about copy, or alt text.
- Any hardcoded placeholder in components.

Search `rg -i "mattwolstoncroft\.com|@mattwolstoncroft"` to confirm there are no stragglers (the domain itself is fine where it refers to the site URL, but no email should be at that domain anymore).

### 7. Elevate Progrexion from archive to core

Progrexion is a core portfolio project, not an archive item. Move it up.

**Route change**
- `/archive/progrexion` → `/progrexion`
- The four sub-entries (creditrepair.com, creditrepair go, lexington law iOS & Android, credit.com) continue to render as condensed sub-entries on the `/progrexion` umbrella page. No separate sub-routes needed unless the sub-entries grow long enough to warrant them — which they shouldn't in this pass.
- Update every internal link that pointed at `/archive/progrexion` (Cmd-K, footer, any inline references).

**Cmd-K palette**
- Add an entry **"Jump to Progrexion"** between SeekWell and the theme toggle. The palette now has 8 items total: LabNotes, Cengage, SeekWell, Progrexion, theme toggle, copy email, download resume, archive (if the archive still exists — see below).
- Remove "Jump to Archive" from the palette if the archive is being removed.

**The archive itself**
- With Progrexion gone, the archive only contained Jams and IPR (both line items).
- **Preferred:** remove `/archive` entirely. Render Jams and IPR as two small text line items under a quiet "Earlier" heading at the bottom of the Projects section — project name, one-line description, no link, no image. They exist for completeness, not for browsing.
- Alternative only if that reads badly: keep a trimmed `/archive` with those two line items. Do NOT keep a full archive section just to avoid the removal — the site is cleaner without it.

**Homepage card treatment for Progrexion**
- Per item 2, it's one of four peer cards.
- Metadata row (Times small caps): `2018 — 2021 · SENIOR PRODUCT DESIGNER · FINTECH / CREDIT · 4 PRODUCT SURFACES · SHIPPED`
- One-sentence tension line on the card — you can draw it from the Progrexion section of `/docs/case-studies-content.md`. If nothing there reads as a crisp tension line, use:
  > *"Four consumer credit products, one design system, and a team learning to ship at Progrexion's scale."*
  as a placeholder and flag it to me at the end so I can rewrite.

**Hero image for the Progrexion card + umbrella page**
- Primary: `/public/images/case-studies/progrexion/progrexion-hero.png` — I'll add this file. If missing at build time, use a tasteful placeholder (subtle grey block matching card dimensions, "Progrexion" in BL Arctic, same accent-green focus ring behavior as the other cards). Do NOT fail the build. Matthew will drop the real image in before ship.
- The four sub-entries inside `/progrexion` should each render with whatever imagery exists in `/public/images/case-studies/progrexion/` — if none exist yet, render text-only sub-entry blocks (metadata + one-paragraph summary). Again, don't fail the build on missing images; degrade gracefully.

**Case-study copy**
- Use `/docs/case-studies-content.md` sections 5–8 verbatim as source copy for the four sub-entries. Do not rewrite.
- Apply the standard case-study shell (Metadata → Context → Tension → Approach → Decisions → Shipped → Reflection) at the umbrella-page level where the source copy supports it. Where source copy is light for a given section, render what's there and skip the empty section. Do not invent content to fill gaps.

**Flag back to me at the end of the pass**
Does the Progrexion content feel thinner than LabNotes/Cengage/SeekWell? If so, name specifically which sections are weakest (e.g. "Tension is one sentence — needs expansion") and I'll do a content-depth pass in the next round. This is important: I'd rather ship with a shorter, honest Progrexion page than pad it with filler.

### 8. SeekWell / HelloEyes imagery

Images for this work are already in `/public/images/case-studies/seekwell/`. Find them there and use them across the SeekWell / HelloEyes case study and its sub-pages.

- Use `hero_HelloEyes.webp` as the umbrella hero for `/seekwell`.
- The rest have hash-name filenames — open them, sort them across the four sub-cases (ios-android-apps, diary-study, vision-assessment, ai-vision-exam) based on what's in each image, and reference them as-is. Don't rename.
- SeekWell = company, HelloEyes = product. The copy says "HelloEyes" — don't rewrite.
- Write real alt text for each image based on what's actually in it.

### 9. Design polish — this is the step that makes or breaks it

With chat + live artifact + hero-metadata-row + LabNotes-featured-block all gone, the homepage is substantially simpler. The risk now is **visual anemia**: a page that reads as empty rather than restrained.

Walk the page top-to-bottom and ask:

- Does the hero still anchor the page? If the name feels too small now that the metadata row is gone, let it breathe — increase vertical padding, don't touch the type scale.
- Are the four project cards actually equal-weight? Image dimensions, aspect ratios, metadata length, hover behavior — all the same across all four. If LabNotes's hero image is more information-dense than the others, that's fine, but the card frame must be identical.
- Does the 2×2 project grid breathe at desktop? Enough gutter between cards, enough vertical space above and below the grid.
- Is the About section comfortable at its current width? Prose column (~640px), Times body, generous line-height.
- Do the section gaps feel deliberate? Use `clamp(6rem, 12vh, 10rem)` as the default, and don't be afraid to push larger between hero and About.
- Dark mode: does the page still have the quiet-confident character, or has the removal of the chat input + live artifact made it feel sparse? The accent green should still appear — link hovers, focus rings, Cmd-K chrome. If it's entirely absent now, that's a signal the page has gone too grey.
- Case studies: all four (LabNotes, Cengage, SeekWell, Progrexion) still render end-to-end with no broken images, empty sections, or 404s.

Verify in **both themes** at **375, 768, 1280** widths. Cmd-K opens/closes cleanly. Contact form submits. No console errors.

---

## Workflow

Commit between each step — short conventional-commit messages are fine.

1. Remove AI chat (code + routes + palette entry + dep + env)
2. Remove LiveArtifact (component + usages)
3. Restructure homepage (sections reordered; four peer cards once item 7 lands)
4. Remove "AVAILABLE · NEW YORK"
5. Remove GitHub link (footer + palette)
6. Email address replacement
7. Elevate Progrexion (route move, archive removal, 4th card, Cmd-K update)
8. Design polish pass (walk every page, both themes, three widths)
9. Lighthouse — verify the desktop/mobile targets still hold

## Definition of done

- Homepage: `Name → About → Four equal project cards → (optional "Earlier" line for Jams + IPR) → Footer`. No chat. No live artifact. No hero metadata row. No GitHub link.
- `/labnotes`: hero is a static image; written case study unchanged in voice or structure.
- `/progrexion`: exists as a top-level route, renders all four sub-entries, no longer lives under `/archive/`.
- `/archive` is either gone entirely or trimmed to the two remaining line items. No dead route.
- Cmd-K: 8 items (9 if you kept the archive). No "Ask the AI", no "View source". Includes "Jump to Progrexion".
- `.env.example` reflects the new state. `.env.local` untouched.
- Every email on the site is `wolstoncroft.1@gmail.com`.
- No dead code (`@anthropic-ai/sdk`, LiveArtifact, chat lib, old archive routes), no unused imports, no console errors in production.
- Lighthouse: desktop ≥ 95 performance / ≥ 95 accessibility. Mobile ≥ 90 / ≥ 95.
- The site still reads as editorial, restrained, and quietly tech-forward after the cuts — not anemic.

Ship it.
