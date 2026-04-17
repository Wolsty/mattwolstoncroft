# LabNotes.ai — Case Study Draft

**Flagship case study.** Richest of the three. Written in the voice the brief asks for: decisions, tensions, trade-offs — not deliverables. Designed to fit the template in the redesign brief: Context → Tension → Approach → Decisions → Shipped → Reflection.

---

## Metadata row

```
2025 — PRESENT  ·  CO-FOUNDER  ·  HIGHER-ED STEM  ·  NEXT.JS · ANTHROPIC · POSTGRES · VERCEL  ·  SHIPPED
```

## Hero image

Live artifact (the scripted AI tutor walkthrough described in the brief's "three tech moments").
If a static hero is needed as a fallback, use the **AI Insights → Integrity** flag view — it's the single most differentiated screen in the product, and it frames the whole tension up front.

---

## Context

LabNotes is an AI-powered tutoring and homework platform for higher-ed STEM. I co-founded it with a chemistry professor who has run a course at a large public university for the better part of a decade — big sections, hundreds of students per semester, and a growing gap between the support those students need and what any human faculty member can deliver.

We started from a single observation: generative AI had made homework trivially easy to outsource, and most of the tools built in response were either pure proctoring systems that treated every student as a suspect, or pure tutoring layers that handed answers over the moment a student got frustrated. Neither served the actual pedagogical goal. Both made the professor's job harder.

LabNotes is the platform we built instead. Students work through problems inside a tutor that escalates support in graduated steps instead of handing over solutions. Faculty get a read on where the class is actually struggling, which students need outreach, and — critically — which students are working with the tutor honestly versus trying to extract answers from it.

## Tension

The entire product lives inside one unresolvable-looking problem:

> **An AI tutor that is maximally helpful to a single student is often actively harmful to that student's learning.**

The more fluently the model answers, the less the student has to think. The more friction we add to protect pedagogical integrity, the more the tutor feels like an obstacle — and the more students bounce to ChatGPT in another tab.

This isn't a UX polish problem. It's the central design question of AI in education, and every surface of LabNotes had to take a position on it. *"Solving the fundamental tension between helpfulness and pedagogical integrity"* became the line I used internally for every scope decision — if a feature didn't move us along that axis, it got cut.

## Approach

I architected the AI experience layer as a system of **trust boundaries** rather than a single "tutor" persona. Three things compose together:

**1. Graduated assistance, not graduated difficulty.**
The tutor does not get harder as the student advances. It gets *less directive*. Early in a problem, the AI confirms the student's understanding of what the question is actually asking. Midway through, it asks targeted probes. Near the end, it reveals working only if the student has demonstrated enough of the structure on their own. Students feel a tutor that trusts them more over time — not one that gives up on them.

**2. Escalation logic that reads behavior, not sentiment.**
Most "adaptive AI" tutors adjust tone based on frustration. That's the wrong signal — a frustrated student who is thinking hard should be encouraged to keep going, not bailed out. Our escalation logic reads *pattern of engagement* instead: how long the student has spent, whether their questions are getting more specific or more evasive, whether they've re-read the material, whether they're asking the tutor to do the work versus asking it to help them check their work. The model's behavior shifts on those signals, not on "seems upset."

**3. A faculty layer that makes the tutor accountable to the course.**
The tutor is not a black box between the student and the platform. Everything it does is visible to the instructor through a structured Insights layer: which problems the class is struggling on, which students are quietly falling behind, and — the screen I'm proudest of — an Integrity view that flags interactions that look like the tutor is being used to extract answers rather than understand them. The integrity flags aren't punitive. They're designed to surface exactly the kind of student conversation a professor would want to have in office hours.

## Decisions

Three hard calls that most "AI tutor" products don't make:

### Decision 1 — We don't give the student the answer, ever

Not on the third try. Not on the tenth. Not when they say "I give up." This is the most-debated product decision we've made, and it comes up in every user interview.

The easy version of this product gives answers when frustration crosses a threshold. We deliberately built the opposite: when a student is truly stuck, the tutor offers to decompose the problem into smaller pieces or route the student to the relevant section of the course material — but the final reasoning step always belongs to the student. Faculty can see when that's happening and intervene if a student is stuck for genuinely structural reasons.

What I gave up: short-term student satisfaction, some conversion. What I gained: the only thing that makes the product defensible to a professor. Without this call, LabNotes is a slightly more polished ChatGPT, and professors would correctly refuse to put it in their syllabus.

### Decision 2 — Integrity is a teaching tool, not a surveillance tool

There is a version of this product that leans hard on proctoring: session recording, keystroke telemetry, plagiarism matching. It probably converts well to administrators.

I built the opposite. Integrity in LabNotes is two signals exposed to the *instructor*, not the student: **Minimal Engagement** (the student is prompting the tutor without doing the reading) and **Score-Time Mismatch** (the student's time-on-problem is inconsistent with their answer quality — a telltale pattern for outsourced answers being pasted in). Both roll up into a flag list the professor can scan in a few seconds before lecture.

That framing matters. The flags say "this student might need a conversation," not "this student cheated." Professors have used them for exactly that — and students, after the first week, have modulated their own behavior once they understood that the platform is watching the shape of their work, not the content of their keystrokes.

### Decision 3 — The professor's "Chat with LabNotes" is its own product, not a settings panel

Faculty-facing AI in most edtech is buried: a query box inside an analytics dashboard. I lifted ours into its own first-class surface. "Chat with LabNotes" answers the questions a professor actually has on a Sunday night: *Which students need outreach this week? What problems should I re-cover Monday? Draft a message to the students who haven't submitted.*

This meant building a second RAG-backed agent over the course data — different retrieval, different prompt chain, different trust model than the student-facing tutor. It's the fastest way an instructor gets value out of the platform in their first fifteen minutes. It's also the decision that makes LabNotes feel like a product built *for* teaching, not one that treats teaching as an afterthought to the LMS integration.

## Shipped

What's in production today, with student and faculty use on a live course:

- **Student tutor** — graduated-assistance conversations over real course problem sets, with the escalation logic above running against course-specific context and the professor's own solutions.
- **Course Dashboard** — per-course view of problem performance (e.g., *Electron Configuration* sitting at 72% vs. *Quantum Numbers* at 92%) and per-student engagement, used by the instructor to prep each class.
- **AI Insights** — three views over live class behavior:
  - *Struggles* — the hardest problems by struggle score, time-to-solve, and completion rate
  - *Integrity* — flagged interactions (246 detected across the first semester cohort) with Minimal Engagement and Score-Time Mismatch as the two signals I shipped first
  - *Growth* — improvement trajectories over the term
- **Chat with LabNotes (faculty)** — agent for professors, with quick-prompt chips for the recurring questions (*Create Problems, Student Check-in, Analyze Performance, Draft Message, Plan Next Class*).
- **Assignments** — drafting, publishing, grading, and submission tracking; currently running five assignments on the flagship course at an 86% class average across 37 submissions.

I built the AI experience layer end-to-end: prompt chains, retrieval, escalation logic, and the full front-end surface. My co-founder built the backend data model and the pedagogy of the problem sets. We shipped a production deployment in the first semester of the company.

## Reflection

If I were starting this tomorrow, I would push harder on two things earlier.

**Instrument the tutor for research from day one.** The escalation logic is the most valuable asset in the product, and we're already sitting on the data to tune it with real learning outcomes. I under-invested in the research pipeline because we were in build mode. It should have gone in with the first tutor surface.

**Give the student their own reflection view.** Right now the Integrity signal is faculty-facing. There's a version of it that is a student-facing progress surface — *here's how your thinking has changed across the last six problems* — that would be as differentiating as the faculty view, and would shift the product from "AI tutor with oversight" to "AI tutor that helps you see yourself learn." That's the next thing I'm building.

The meta-lesson of LabNotes is that the good AI product decisions in 2026 mostly look like restraint. The market rewards over-helpful models. The actual users — in this domain, professors and serious students — reward an AI that knows when not to answer. That asymmetry is where I think most of the remaining opportunity in AI UX sits.

---

## Screens / figures to place in this case study

In rough order of signal strength:

1. **AI Insights → Integrity tab** — 246 flags, Ethan Kim's 18 flagged problems, Minimal Engagement + Score-Time Mismatch. *Use as hero image or as the Decision 2 inline figure.*
2. **Student tutor interaction (live artifact)** — the scripted walkthrough. Chemistry problem, three escalation steps, no final answer given. *Use as the tension-setting moment between Context and Tension.*
3. **Chat with LabNotes (faculty)** — quick-prompt chips and a sample response. *Use inside Decision 3.*
4. **Course Dashboard** — per-problem performance + per-student engagement. *Use inside Shipped.*
5. **AI Insights → Struggles tab** — hardest problems table. *Use inside Approach point 3.*
6. **Assignments list** — 5 assignments, 86% avg, 37 submissions. *Use inside Shipped.*
7. **AI Insights Overview** — class-level metrics (13 avg messages/problem, 1.6 avg hints/problem, 15 min avg time, 85% class score). *Use as the metadata-anchored Shipped summary.*

All seven were captured from the live teacher-interface during this session.
