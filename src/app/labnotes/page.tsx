import type { Metadata } from "next";
import { CaseStudyShell } from "@/components/case-study/CaseStudyShell";
import { LiveArtifact } from "@/components/live-artifact/LiveArtifact";
import { Figure } from "@/components/case-study/Figure";
import { DecisionBlock } from "@/components/case-study/DecisionBlock";
import { PrevNext } from "@/components/case-study/PrevNext";

export const metadata: Metadata = {
  title: "LabNotes.ai",
  description:
    "An AI tutor maximally helpful to a single student is often actively harmful to their learning. LabNotes is the platform I built to resolve that.",
};

export default function LabNotesPage() {
  return (
    <CaseStudyShell
      meta={{
        title: "LabNotes.ai",
        status: "Shipped",
        metadata: [
          "2025 — Present",
          "Co-founder",
          "Higher-Ed STEM",
          "Next.js · Anthropic · Postgres · Vercel",
          "Shipped",
        ],
      }}
      hero={<LiveArtifact />}
    >
      <h2 className="font-display mt-0">Context</h2>
      <p>
        LabNotes is an AI-powered tutoring and homework platform for higher-ed
        STEM. I co-founded it with a chemistry professor who has run a course
        at a large public university for the better part of a decade — big
        sections, hundreds of students per semester, and a growing gap between
        the support those students need and what any human faculty member can
        deliver.
      </p>
      <p>
        We started from a single observation: generative AI had made homework
        trivially easy to outsource, and most of the tools built in response
        were either pure proctoring systems that treated every student as a
        suspect, or pure tutoring layers that handed answers over the moment a
        student got frustrated. Neither served the actual pedagogical goal.
        Both made the professor&apos;s job harder.
      </p>
      <p>
        LabNotes is the platform we built instead. Students work through
        problems inside a tutor that escalates support in graduated steps
        instead of handing over solutions. Faculty get a read on where the
        class is actually struggling, which students need outreach, and —
        critically — which students are working with the tutor honestly versus
        trying to extract answers from it.
      </p>

      <h2 className="font-display mt-[var(--block-gap)]">Tension</h2>
      <p>The entire product lives inside one unresolvable-looking problem:</p>
      <blockquote
        className="pl-6 italic"
        style={{
          borderLeft: "2px solid var(--accent)",
          color: "var(--fg)",
          fontSize: "var(--type-tension)",
          lineHeight: 1.35,
          margin: "2rem 0",
        }}
      >
        An AI tutor that is maximally helpful to a single student is often
        actively harmful to that student&apos;s learning.
      </blockquote>
      <p>
        The more fluently the model answers, the less the student has to
        think. The more friction we add to protect pedagogical integrity, the
        more the tutor feels like an obstacle — and the more students bounce
        to ChatGPT in another tab.
      </p>
      <p>
        This isn&apos;t a UX polish problem. It&apos;s the central design
        question of AI in education, and every surface of LabNotes had to take
        a position on it.{" "}
        <em>
          &ldquo;Solving the fundamental tension between helpfulness and
          pedagogical integrity&rdquo;
        </em>{" "}
        became the line I used internally for every scope decision — if a
        feature didn&apos;t move us along that axis, it got cut.
      </p>

      <h2 className="font-display mt-[var(--block-gap)]">Approach</h2>
      <p>
        I architected the AI experience layer as a system of{" "}
        <strong>trust boundaries</strong> rather than a single &ldquo;tutor&rdquo;
        persona. Three things compose together:
      </p>

      <h3 className="font-display">1. Graduated assistance, not graduated difficulty.</h3>
      <p>
        The tutor does not get harder as the student advances. It gets{" "}
        <em>less directive</em>. Early in a problem, the AI confirms the
        student&apos;s understanding of what the question is actually asking.
        Midway through, it asks targeted probes. Near the end, it reveals
        working only if the student has demonstrated enough of the structure
        on their own. Students feel a tutor that trusts them more over time —
        not one that gives up on them.
      </p>

      <h3 className="font-display">2. Escalation logic that reads behavior, not sentiment.</h3>
      <p>
        Most &ldquo;adaptive AI&rdquo; tutors adjust tone based on frustration.
        That&apos;s the wrong signal — a frustrated student who is thinking
        hard should be encouraged to keep going, not bailed out. Our
        escalation logic reads <em>pattern of engagement</em> instead: how
        long the student has spent, whether their questions are getting more
        specific or more evasive, whether they&apos;ve re-read the material,
        whether they&apos;re asking the tutor to do the work versus asking it
        to help them check their work. The model&apos;s behavior shifts on
        those signals, not on &ldquo;seems upset.&rdquo;
      </p>

      <h3 className="font-display">3. A faculty layer that makes the tutor accountable to the course.</h3>
      <p>
        The tutor is not a black box between the student and the platform.
        Everything it does is visible to the instructor through a structured
        Insights layer: which problems the class is struggling on, which
        students are quietly falling behind, and — the screen I&apos;m proudest
        of — an Integrity view that flags interactions that look like the
        tutor is being used to extract answers rather than understand them.
        The integrity flags aren&apos;t punitive. They&apos;re designed to
        surface exactly the kind of student conversation a professor would
        want to have in office hours.
      </p>

      <Figure
        src="/images/case-studies/labnotes/ai-insights-struggles.png"
        alt="LabNotes AI Insights — Struggles tab ranking problems by struggle score, time-to-solve, and completion rate."
        caption="AI Insights — Struggles: the hardest problems by struggle score, time-to-solve, and completion rate."
        width={2800}
        height={1600}
        wide
      />

      <h2 className="font-display mt-[var(--block-gap)]">Decisions</h2>
      <p>
        Three hard calls that most &ldquo;AI tutor&rdquo; products don&apos;t
        make:
      </p>

      <DecisionBlock heading="Decision 1 — We don't give the student the answer, ever">
        <p>
          Not on the third try. Not on the tenth. Not when they say &ldquo;I
          give up.&rdquo; This is the most-debated product decision we&apos;ve
          made, and it comes up in every user interview.
        </p>
        <p>
          The easy version of this product gives answers when frustration
          crosses a threshold. We deliberately built the opposite: when a
          student is truly stuck, the tutor offers to decompose the problem
          into smaller pieces or route the student to the relevant section of
          the course material — but the final reasoning step always belongs
          to the student. Faculty can see when that&apos;s happening and
          intervene if a student is stuck for genuinely structural reasons.
        </p>
        <p>
          What I gave up: short-term student satisfaction, some conversion.
          What I gained: the only thing that makes the product defensible to
          a professor. Without this call, LabNotes is a slightly more
          polished ChatGPT, and professors would correctly refuse to put it
          in their syllabus.
        </p>
      </DecisionBlock>

      <DecisionBlock heading="Decision 2 — Integrity is a teaching tool, not a surveillance tool">
        <p>
          There is a version of this product that leans hard on proctoring:
          session recording, keystroke telemetry, plagiarism matching. It
          probably converts well to administrators.
        </p>
        <p>
          I built the opposite. Integrity in LabNotes is two signals exposed
          to the <em>instructor</em>, not the student:{" "}
          <strong>Minimal Engagement</strong> (the student is prompting the
          tutor without doing the reading) and{" "}
          <strong>Score-Time Mismatch</strong> (the student&apos;s
          time-on-problem is inconsistent with their answer quality — a
          telltale pattern for outsourced answers being pasted in). Both roll
          up into a flag list the professor can scan in a few seconds before
          lecture.
        </p>
        <p>
          That framing matters. The flags say &ldquo;this student might need
          a conversation,&rdquo; not &ldquo;this student cheated.&rdquo;
          Professors have used them for exactly that — and students, after
          the first week, have modulated their own behavior once they
          understood that the platform is watching the shape of their work,
          not the content of their keystrokes.
        </p>
        <Figure
          src="/images/case-studies/labnotes/ai-insights-integrity.png"
          alt="LabNotes AI Insights — Integrity tab showing 246 flagged interactions across the first semester cohort, with Minimal Engagement and Score-Time Mismatch as the two primary signals."
          caption="AI Insights — Integrity: 246 flags across the first semester cohort. Minimal Engagement and Score-Time Mismatch are the two signals I shipped first."
          width={2800}
          height={1600}
          wide
        />
      </DecisionBlock>

      <DecisionBlock heading="Decision 3 — The professor's “Chat with LabNotes” is its own product, not a settings panel">
        <p>
          Faculty-facing AI in most edtech is buried: a query box inside an
          analytics dashboard. I lifted ours into its own first-class surface.
          &ldquo;Chat with LabNotes&rdquo; answers the questions a professor
          actually has on a Sunday night:{" "}
          <em>
            Which students need outreach this week? What problems should I
            re-cover Monday? Draft a message to the students who haven&apos;t
            submitted.
          </em>
        </p>
        <p>
          This meant building a second RAG-backed agent over the course data
          — different retrieval, different prompt chain, different trust
          model than the student-facing tutor. It&apos;s the fastest way an
          instructor gets value out of the platform in their first fifteen
          minutes. It&apos;s also the decision that makes LabNotes feel like
          a product built <em>for</em> teaching, not one that treats teaching
          as an afterthought to the LMS integration.
        </p>
        <Figure
          src="/images/case-studies/labnotes/chat-with-labnotes.png"
          alt="LabNotes — Chat with LabNotes surface for faculty, with quick-prompt chips for recurring questions and a sample response."
          caption="Chat with LabNotes — the faculty-facing surface, with quick-prompt chips for recurring questions."
          width={2800}
          height={1600}
          wide
        />
      </DecisionBlock>

      <h2 className="font-display mt-[var(--block-gap)]">Shipped</h2>
      <p>
        What&apos;s in production today, with student and faculty use on a
        live course:
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Student tutor</strong> — graduated-assistance conversations
          over real course problem sets, with the escalation logic above
          running against course-specific context and the professor&apos;s own
          solutions.
        </li>
        <li>
          <strong>Course Dashboard</strong> — per-course view of problem
          performance (e.g., <em>Electron Configuration</em> sitting at 72%
          vs. <em>Quantum Numbers</em> at 92%) and per-student engagement,
          used by the instructor to prep each class.
        </li>
        <li>
          <strong>AI Insights</strong> — three views over live class behavior:
          <ul className="list-[circle] pl-6 mt-2 space-y-1">
            <li>
              <em>Struggles</em> — the hardest problems by struggle score,
              time-to-solve, and completion rate
            </li>
            <li>
              <em>Integrity</em> — flagged interactions (246 detected across
              the first semester cohort) with Minimal Engagement and
              Score-Time Mismatch as the two signals I shipped first
            </li>
            <li>
              <em>Growth</em> — improvement trajectories over the term
            </li>
          </ul>
        </li>
        <li>
          <strong>Chat with LabNotes (faculty)</strong> — agent for
          professors, with quick-prompt chips for the recurring questions (
          <em>Create Problems, Student Check-in, Analyze Performance, Draft Message, Plan Next Class</em>
          ).
        </li>
        <li>
          <strong>Assignments</strong> — drafting, publishing, grading, and
          submission tracking; currently running five assignments on the
          flagship course at an 86% class average across 37 submissions.
        </li>
      </ul>

      <Figure
        src="/images/case-studies/labnotes/course-dashboard.png"
        alt="LabNotes Course Dashboard — per-problem performance and per-student engagement for a live chemistry course."
        caption="Course Dashboard — per-problem performance and per-student engagement, used to prep each class."
        width={2800}
        height={1600}
        wide
      />
      <Figure
        src="/images/case-studies/labnotes/assignments.png"
        alt="LabNotes Assignments — five assignments on the flagship course at an 86% class average across 37 submissions."
        caption="Assignments — drafting, publishing, grading, and submission tracking."
        width={2800}
        height={1600}
        wide
      />
      <Figure
        src="/images/case-studies/labnotes/ai-insights-overview.png"
        alt="LabNotes AI Insights Overview — class-level metrics: 13 avg messages/problem, 1.6 avg hints/problem, 15 min avg time, 85% class score."
        caption="AI Insights — Overview: 13 avg messages/problem, 1.6 avg hints/problem, 15 min avg time, 85% class score."
        width={2800}
        height={1600}
        wide
      />

      <p>
        I built the AI experience layer end-to-end: prompt chains, retrieval,
        escalation logic, and the full front-end surface. My co-founder built
        the backend data model and the pedagogy of the problem sets. We
        shipped a production deployment in the first semester of the company.
      </p>

      <h2 className="font-display mt-[var(--block-gap)]">Reflection</h2>
      <p>
        If I were starting this tomorrow, I would push harder on two things
        earlier.
      </p>
      <p>
        <strong>Instrument the tutor for research from day one.</strong> The
        escalation logic is the most valuable asset in the product, and
        we&apos;re already sitting on the data to tune it with real learning
        outcomes. I under-invested in the research pipeline because we were
        in build mode. It should have gone in with the first tutor surface.
      </p>
      <p>
        <strong>Give the student their own reflection view.</strong> Right now
        the Integrity signal is faculty-facing. There&apos;s a version of it
        that is a student-facing progress surface —{" "}
        <em>
          here&apos;s how your thinking has changed across the last six
          problems
        </em>{" "}
        — that would be as differentiating as the faculty view, and would
        shift the product from &ldquo;AI tutor with oversight&rdquo; to
        &ldquo;AI tutor that helps you see yourself learn.&rdquo; That&apos;s
        the next thing I&apos;m building.
      </p>
      <p>
        The meta-lesson of LabNotes is that the good AI product decisions in
        2026 mostly look like restraint. The market rewards over-helpful
        models. The actual users — in this domain, professors and serious
        students — reward an AI that knows when not to answer. That asymmetry
        is where I think most of the remaining opportunity in AI UX sits.
      </p>

      <PrevNext
        prev={{ href: "/", label: "Home" }}
        next={{ href: "/cengage", label: "Cengage Content Studio" }}
      />
    </CaseStudyShell>
  );
}
