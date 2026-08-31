import type { Metadata } from "next";
import { CaseStudyShell } from "@/components/case-study/CaseStudyShell";
import { CodeExhibit } from "@/components/case-study/CodeExhibit";
import { EvalMatrix } from "@/components/case-study/EvalMatrix";
import { RoleLedger } from "@/components/case-study/RoleLedger";
import { FactStrip } from "@/components/case-study/FactStrip";
import { PrevNext } from "@/components/case-study/PrevNext";

export const metadata: Metadata = {
  title: "Teaching a machine to grade fairly",
  description:
    "Building an LLM-as-judge for an AI chemistry tutor — and the eval harness that caught it being wrong.",
};

export default function LlmJudgePage() {
  return (
    <CaseStudyShell
      meta={{
        title: "Teaching a machine to grade fairly",
        status: "In production",
        metadata: [
          "2026",
          "LabNotes.ai",
          "LLM-as-judge · Eval harness",
          "TypeScript · Anthropic API",
          "Open-sourced",
        ],
      }}
      backLabel="Back"
      hero={
        <div className="surface-media rounded-lg px-6 py-10 md:px-12 md:py-14">
          <p className="meta">Engineering case study</p>
          <p
            className="mt-5 max-w-prose italic font-body"
            style={{
              fontSize: "var(--type-tension)",
              lineHeight: 1.3,
              color: "var(--fg)",
            }}
          >
            Building an LLM-as-judge for an AI chemistry tutor — and the eval
            harness that caught it being wrong.
          </p>
          <FactStrip
            facts={[
              { value: "4", label: "rewrites of the judge prompt" },
              { value: "2 days", label: "spent on the wrong variable" },
              { value: "12 → 15", label: "eval cases, three problem shapes" },
              { value: "1 cycle", label: "to find it, once instrumented" },
            ]}
          />
        </div>
      }
    >
      <h2 className="font-heading mt-0">The problem</h2>
      <p>
        LabNotes grades students on demonstrated understanding, not final
        answers. A model reads a tutoring conversation and decides which steps
        the student has actually shown. Get it wrong in one direction and
        students are refused credit for correct work. Get it wrong in the other
        and the tutor congratulates them on a misconception.
      </p>

      <h2 className="font-heading mt-[var(--block-gap)]">
        How the grade gets made
      </h2>
      <p>
        The obvious build is one model that tutors and scores in the same
        breath. It is also the wrong one: a model that has just written an
        encouraging reply has every reason to say the student earned it. So the
        work is split along the lines where the requirements actually differ.
      </p>

      <RoleLedger
        caption="Four responsibilities, three model calls. The row that isn't a model call is the one doing the most work."
        roles={[
          {
            name: "Author",
            body:
              "Generates problems and their milestones, or parses a professor\u2019s existing set into the same structure.",
            spec: "Sonnet",
          },
          {
            name: "Tutor",
            body:
              "Talks to the student. Socratic, warm, never gives the answer away.",
            spec: "Sonnet \u00b7 temperature 0.7",
          },
          {
            name: "Judge",
            body:
              "Reads the student\u2019s latest message against the professor\u2019s answer key and reports, per milestone, what the student wrote and whether it matches.",
            spec: "Haiku \u00b7 temperature 0",
          },
          {
            name: "The score",
            body:
              "Arithmetic. Milestones reached \u00d7 points, computed in code. No model produces a number.",
            spec: "",
            emphasis: true,
          },
        ]}
      />

      <p>
        Three things fall out of that split, and they are the design.
      </p>
      <p>
        <strong>The judge runs before the tutor.</strong> Grading happens first,
        on a short slice of the conversation, with no knowledge of what the
        tutor is about to say. The tutor is then handed the verdict as final and
        has to write a reply consistent with it. Reverse the order and the tutor
        congratulates a wrong answer while the milestone stays dark — the
        student reads praise and sees no credit, which is worse than either
        outcome on its own.
      </p>
      <p>
        <strong>Temperature 0 for the judge, 0.7 for the tutor.</strong> The same
        work submitted on Tuesday and on Thursday has to score the same. A
        teaching voice must not. Same product, opposite requirements, one line of
        config each.
      </p>
      <p>
        <strong>The judge never returns a count.</strong> Asking a model &ldquo;how
        many milestones did they earn?&rdquo; invites it to reason about a total.
        Asking it to fill in a form, one entry per milestone, and counting the
        entries in code leaves it nothing to round off.
      </p>

      <CodeExhibit
        caption="One entry of the judge’s reply. The first three fields are filled before it is allowed to answer the fourth — the order is enforced by the response shape, and it is the single change that fixed the most failures."
        bands={[
          {
            label: "The form the judge fills in, per milestone",
            lines: [
              '"milestone":     "Convert the dimensions to centimetres"',
              '"student_quote": "so 25.0 mm is 2.50 cm and 40.0 mm is 4.00 cm"',
              '"key_value":     "2.50 cm \u00d7 4.00 cm \u00d7 1.50 cm"',
              '"reached":       true',
            ],
            note: "The answer key is loaded server-side. It reaches the judge without ever passing through the student\u2019s browser.",
          },
        ]}
      />

      <h2 className="font-heading mt-[var(--block-gap)]">What went wrong</h2>
      <p>
        Grading looked too strict, then too lenient, then too strict again. I
        rewrote the judge&apos;s prompt four times across two days.
      </p>
      <blockquote
        className="pl-6 italic"
        style={{
          borderLeft: "2px solid var(--accent)",
          color: "var(--fg)",
          fontSize: "var(--type-tension)",
          lineHeight: 1.3,
          margin: "2rem 0",
        }}
      >
        None of it was the model&apos;s judgement.
      </blockquote>
      <p>
        The JSON prefill forcing the response shape ended in a colon, and the
        model sometimes opened its reply with another one — invalid JSON, a
        failed parse, and a fallback that silently scored zero. On screen, zero
        is indistinguishable from a strict grader.
      </p>

      <CodeExhibit
        caption="The whole bug. The fallback is the part that hid it — a parse failure and a genuinely harsh grade render identically."
        bands={[
          {
            label: "Sent — the prefill that forces the response shape",
            lines: ["…Return your grading as JSON:"],
            note: "The last character is a colon.",
          },
          {
            label: "Returned — sometimes",
            lines: [': {"steps":[{"id":"s1","credited":true, …'],
            note: "The first character is another one.",
            tone: "error",
          },
          {
            label: "Joined",
            lines: [
              ':: {"steps":[{"id":"s1","credited":true, …',
              "JSON.parse  →  SyntaxError  →  catch  →  score: 0",
            ],
            tone: "error",
          },
          {
            label: "And on the screen",
            lines: ["Step 1  not demonstrated", "Step 2  not demonstrated", "Step 3  not demonstrated"],
            tone: "muted",
          },
        ]}
      />

      <p>
        And no temperature had been set on either call, so both ran at the API
        default of 1.0. That made the first bug intermittent, which is exactly
        why it read as the model drifting rather than as a broken string join.
      </p>

      <h2 className="font-heading mt-[var(--block-gap)]">
        What I should have done first
      </h2>
      <p>
        Instrumented. The moment I logged what the judge was actually
        returning, I found it in one cycle. I had spent two days adjusting a
        number I couldn&apos;t see the inputs to.
      </p>

      <h2 className="font-heading mt-[var(--block-gap)]">
        What I built instead of more prompt tuning
      </h2>
      <p>
        An eval harness: twelve cases across three problem shapes — a
        dependency chain, a multi-part question, and parallel tracks where two
        steps are independent. Each runs twice, because at temperature 0 a
        disagreement means determinism has broken, and that&apos;s a finding
        rather than a flaky test.
      </p>

      <EvalMatrix caption="The harness. Coverage is organised by the structure of the problem being graded, not by the number of cases." />

      <p>
        Every new shape found a new bug, and never where the previous
        shape&apos;s bugs had been. Variety of structure beat volume of cases
        every time.
      </p>

      <h2 className="font-heading mt-[var(--block-gap)]">
        The finding that generalised
      </h2>
      <p>
        When a rule keeps failing, the output form is usually missing a field.{" "}
        <em>&ldquo;Judge only what the student wrote&rdquo;</em> sat in the
        prompt for two days and never held — the judge kept crediting students
        with corrections the tutor had supplied.
      </p>
      <p>
        Adding a required field for the student&apos;s own quoted words fixed
        it immediately, and fixed two unrelated failures at the same time. All
        three were the model having nowhere to record what it was actually
        looking at.
      </p>

      <h2 className="font-heading mt-[var(--block-gap)]">Where it ended up</h2>
      <p>
        Fifteen cases passing, deterministic, in production with a chemistry
        cohort at Carroll College. The pattern is open-sourced at{" "}
        <a
          className="link-underline"
          href="https://github.com/Wolsty/llm-judge-harness"
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com/Wolsty/llm-judge-harness
        </a>{" "}
        — twelve cases, no dependencies, and a README that&apos;s mostly a list
        of ways I got it wrong.
      </p>

      <PrevNext
        prev={{ href: "/labnotes", label: "LabNotes.ai" }}
        next={{ href: "/cengage", label: "Cengage Content Studio" }}
      />
    </CaseStudyShell>
  );
}
