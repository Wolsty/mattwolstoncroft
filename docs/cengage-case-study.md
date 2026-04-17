# Cengage Content Studio — Case Study Draft

Second case study (after LabNotes). Grounded in the actual product surfaces — Explore platform, Content Studio Beta — using the four screens you provided. Same shell as LabNotes: Context → Tension → Approach → Decisions → Shipped → Reflection.

---

## Metadata row

```
2026 — PRESENT  ·  SENIOR UX MANAGER  ·  HIGHER-ED ADAPTIVE LEARNING  ·  REACT MAGMA 3 · GENAI  ·  IN PRODUCTION (BETA)
```

## Hero image

**Adapt Content — side-by-side comparison view** (screenshot 1). Left: the Adaptations panel with Material Type, Reading Level, Language, and accommodation checkboxes. Middle: the original chapter. Right: the adapted "New" version, tagged with the parameters that produced it (*Reading · Grade 6 · English · Vocabulary Preview*). This one screen carries the whole thesis of the case study.

---

## Context

Cengage is one of the three large higher-education publishers in the United States. Explore is the company's modern learning platform — a single teacher-and-student surface wrapped around its catalog of courses, textbooks, and assessments. When I joined, the program I was asked to lead was Content Studio: an AI-powered layer inside Explore that lets an instructor take any Cengage content and adapt it — by reading level, by language, and with a set of accommodations — to match the students actually in the room.

My job was to own the end-to-end UX: problem definition through delivery, functional requirements, and implementation with engineering on React Magma 3, the Cengage design system. Content Studio is live in Beta inside Explore today.

## Tension

Every edtech company is adding AI in 2026. The tension isn't *whether* to add it — it's the shape it takes:

> **How do you embed generative AI as a core differentiator of a content platform without reducing the experience to "here's a button that generates stuff"?**

When AI is bolted on, the UX becomes a feature shelf — *summarize, simplify, translate, rewrite* — each sitting in a menu, each producing output the user has to manually review. That's how most of the market ships AI. It treats AI as a stamp you press on top of finished content.

That framing is wrong for a publisher. Cengage's content has decades of pedagogical structure baked into it: learning objectives, scaffolding, assessment alignment, accessibility standards. A "rewrite for 6th grade" button that doesn't respect any of that produces content a professor can't responsibly put in front of students. We had to design for AI that understood the source material's *pedagogical intent* — and render that intent at a different reading level, in a different language, or with a different accommodation profile, without losing it.

## Approach

Three bets that shaped the product:

**1. Treat adaptation as a first-class content state, not a feature.**
A "version" of a lesson in Content Studio is not a copy. It's a live rendering of the same pedagogical source, parameterized by a set of dials: Material Type, Reading Level, Language, and a short list of accommodations. The instructor picks the treatment; the system produces the rendering. The original stays canonical — it's visible on the left at all times. The adapted rendering on the right is tagged with the parameters that produced it, so the instructor can always read the version as a *product of a configuration*, not as free-form AI output to be audited line by line.

**2. Write the responsible-AI principles before writing the requirements.**
Before the first functional spec, I wrote the UX principles for responsible AI in an educational context: what the AI is allowed to assert, where human review is required, how the instructor verifies before publishing, how the product behaves when an adaptation would break an alignment. Those principles are what a regulated buyer (the provost's office, the accessibility team, the learning science group) asks about before signing off on a tool. Writing them first gave us a shared language to push back on feature asks that violated them, and it let engineering scope honestly — it's very different to scope "AI rewrite" versus "AI rewrite that preserves lesson-level learning objectives."

**3. Use React Magma 3 as a constraint, not an afterthought.**
Explore is built on React Magma 3, the internal design system that underpins the rest of Cengage. Rather than treat that as a brand constraint, I used it as a product advantage: Content Studio inherits the accessibility baseline, interaction patterns, and familiarity of every other Cengage surface the instructor already uses. The AI behavior is the *only* novelty in the product. Everything else is deliberately boring. That makes the new capability feel like a natural extension of existing tools, not a separate product to learn — which matters enormously for adoption inside institutions that spend years vetting new software.

## Decisions

### Decision 1 — Generative AI is a set of primitives, not a features menu

The easy version of Content Studio is a sidebar with *Summarize / Simplify / Translate / Rewrite* buttons. I argued hard against that shape and won.

Instead, adaptation lives on the content itself as a small set of dials: **Material Type**, **Reading Level**, **Language**, and a short list of accommodations (*Chunking, Vocabulary Preview, Highlight Key Concepts*). The AI runs in the background to realize whatever configuration the instructor picks. From the instructor's perspective, they're not invoking AI — they're choosing the version of the lesson they want their students to see.

This reframing is the whole product. It moves the AI from something the user has to think about, to infrastructure the user uses without labeling it. The program's positioning inside Cengage's broader catalog depends on that — it's the difference between "Content Studio has AI features" and "Content Studio is how AI shows up across Cengage." That positioning is what gets the program sustained investment.

### Decision 2 — Original and adapted render side-by-side, not sequentially

The first instinct most teams have is to show the adapted output in the main canvas and tuck the original away. I designed the opposite: the original is always visible on the left, the adaptation is always visible on the right, and a *View Original* toggle lets the instructor collapse the comparison when they've finished validating.

This does three things at once. It gives the teacher a ground-truth reference every time they look at AI output — no context switching, no misremembering what the source said. It makes the cost of a bad adaptation zero (a wrong rendering is immediately legible as wrong against the original, not as plausible output to be scrutinized in isolation). And it quietly trains the teacher in what "good" AI adaptation looks like, building the trust required for any eventual move toward less manual review.

A small interaction detail that does a lot of work: the adapted rendering is tagged at the top with the exact configuration that produced it (*Reading · Grade 6 · English · Vocabulary Preview*). The teacher never has to remember which dials they set; the artifact carries its own provenance.

### Decision 3 — Save As is a deliberate ceremony

Generating an adaptation is cheap. Saving one is not. A saved adaptation can be assigned to students — it becomes a teaching object with its own weight inside the platform.

I designed the save step as a deliberate gesture: the *Save As* button is discrete, requires an explicit teacher action, and is styled as the primary commit moment on the screen. The live adaptation on the right is *always* re-generatable; the saved version is what the teacher has chosen to stand behind. That separation is invisible to a user in their first minute with the tool, and it's the thing that makes the product defensible to the instructor after their hundredth.

It also matters for the rest of the platform. A saved adaptation is a first-class object the rest of Explore can reference: Assignments can point to it, Gradebook can track engagement with it, Reports can surface which treatments a given student is responding to. None of that is possible if adaptations are ephemeral AI outputs.

## Shipped

Live in Content Studio Beta inside Explore today:

- **Lesson selector** — browse-and-search over the unit/chapter/lesson structure of any Cengage course, with a live preview pane before the teacher commits to adapting anything.
- **Adapt Content** — the side-by-side original/new canvas with the Adaptations panel: Material Type, Reading Level, Language, and accommodations (Chunking, Vocabulary Preview, Highlight Key Concepts).
- **Configuration tagging** — every adapted rendering is annotated with the exact parameters that produced it, so provenance is part of the artifact rather than a hidden metadata field.
- **View Original toggle + Edit** — instructor-facing controls for verifying the adaptation and making manual refinements before saving.
- **Save As** — turns a live adaptation into a durable lesson object that can be assigned, tracked, and reported on alongside the rest of the course.
- **Explore-native integration** — Content Studio lives in the primary Explore sidebar (Home, Assignments, Content, Gradebook, Reports, Groups, *Content Studio Beta*), so the AI capability is positioned as a first-class part of the platform rather than a detour out of it.

Content Studio positions Cengage among the first of the major higher-ed publishers to treat generative AI as a content-layer primitive rather than a feature release.

## Reflection

The biggest thing I'd change in retrospect is where I put the measurement surface. The Beta instruments which instructors adopt which treatments — reading level, language, accommodations — but not yet deeply enough to tell whether adaptation actually *moves the needle* for the students it's meant to help. That should have been in v1, not v2, because that's the dataset that justifies the entire bet. I'm pushing for it in the next release.

More broadly: the interesting design question in AI-native products is rarely "what does the AI do." It's "what shape does the product take when AI is infrastructure rather than a feature." Content Studio is a small, contained answer to that question for a specific market — and it's the answer I want to keep refining inside Cengage while I'm there.

---

## Screens & how to use them

Four screens received from you, ranked by where they go in the case study:

1. **Adapt Content — side-by-side comparison with Adaptations panel** → **Hero image** at the top of the case study. Also use as the inline figure for *Decision 2* (side-by-side).
2. **Content Studio — Select Content, lesson selected, preview populated, Adapt button active** → Inline figure for the start of *Shipped*, showing how the instructor enters the flow.
3. **Content Studio — Select Content, empty state with lesson tree** → Optional secondary figure inside *Approach point 1*, illustrating the content-first entry point.
4. **Explore home (Hi, Janine!) with Content Studio Beta in the sidebar** → Inline figure for the last bullet of *Shipped* ("Explore-native integration") — proves Content Studio is positioned inside the main platform, not as a bolt-on.

All four are clean marketing-quality screens and can be published as-is. No further imagery needed from you for this case study.
