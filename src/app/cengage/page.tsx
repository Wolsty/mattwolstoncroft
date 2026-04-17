import type { Metadata } from "next";
import { CaseStudyShell } from "@/components/case-study/CaseStudyShell";
import { Figure } from "@/components/case-study/Figure";
import { DecisionBlock } from "@/components/case-study/DecisionBlock";
import { PrevNext } from "@/components/case-study/PrevNext";

export const metadata: Metadata = {
  title: "Cengage Content Studio",
  description:
    "Embedding generative AI as a core differentiator of a content platform without reducing the experience to a feature shelf.",
};

export default function CengagePage() {
  return (
    <CaseStudyShell
      meta={{
        title: "Cengage Content Studio",
        status: "In Production (Beta)",
        metadata: [
          "2026–Present",
          "Senior UX Manager",
          "Higher-Ed Adaptive Learning",
          "React Magma 3 · GenAI",
          "In Production (Beta)",
        ],
      }}
      hero={
        <Figure
          src="/images/case-studies/cengage/adapt-content.png"
          alt="Cengage Content Studio, Adapt Content side-by-side comparison: Adaptations panel on the left, original chapter in the middle, adapted version on the right tagged with its configuration."
          caption="Adapt Content, side-by-side. Adaptations panel, original chapter, and adapted rendering tagged with the exact configuration that produced it."
          wide
          priority
          width={3000}
          height={1800}
        />
      }
    >
      <h2 className="font-display mt-0">Context</h2>
      <p>
        Cengage is one of the three large higher-education publishers in the
        United States. Explore is the company&apos;s modern learning platform,
        a single teacher-and-student surface wrapped around its catalog of
        courses, textbooks, and assessments. When I joined, the program I was
        asked to lead was Content Studio: an AI-powered layer inside Explore
        that lets an instructor take any Cengage content and adapt it (by
        reading level, by language, and with a set of accommodations) to
        match the students actually in the room.
      </p>
      <p>
        My job was to own the end-to-end UX: problem definition through
        delivery, functional requirements, and implementation with engineering
        on React Magma 3, the Cengage design system. Content Studio is live
        in Beta inside Explore today.
      </p>

      <h2 className="font-display mt-[var(--block-gap)]">Tension</h2>
      <p>
        Every edtech company is adding AI in 2026. The tension isn&apos;t{" "}
        <em>whether</em> to add it. It&apos;s the shape it takes:
      </p>
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
        How do you embed generative AI as a core differentiator of a content
        platform without reducing the experience to &ldquo;here&apos;s a
        button that generates stuff&rdquo;?
      </blockquote>
      <p>
        When AI is bolted on, the UX becomes a feature shelf (
        <em>summarize, simplify, translate, rewrite</em>), each sitting in a
        menu, each producing output the user has to manually review.
        That&apos;s how most of the market ships AI. It treats AI as a stamp
        you press on top of finished content.
      </p>
      <p>
        That framing is wrong for a publisher. Cengage&apos;s content has
        decades of pedagogical structure baked into it: learning objectives,
        scaffolding, assessment alignment, accessibility standards. A
        &ldquo;rewrite for 6th grade&rdquo; button that doesn&apos;t respect
        any of that produces content a professor can&apos;t responsibly put
        in front of students. We had to design for AI that understood the
        source material&apos;s <em>pedagogical intent</em>, and render that
        intent at a different reading level, in a different language, or with
        a different accommodation profile, without losing it.
      </p>

      <h2 className="font-display mt-[var(--block-gap)]">Approach</h2>
      <p>Three bets that shaped the product:</p>

      <h3 className="font-display">1. Treat adaptation as a first-class content state, not a feature.</h3>
      <p>
        A &ldquo;version&rdquo; of a lesson in Content Studio is not a copy.
        It&apos;s a live rendering of the same pedagogical source,
        parameterized by a set of dials: Material Type, Reading Level,
        Language, and a short list of accommodations. The instructor picks
        the treatment; the system produces the rendering. The original stays
        canonical; it&apos;s visible on the left at all times. The adapted
        rendering on the right is tagged with the parameters that produced
        it, so the instructor can always read the version as a{" "}
        <em>product of a configuration</em>, not as free-form AI output to be
        audited line by line.
      </p>
      <Figure
        src="/images/case-studies/cengage/select-content-empty.png"
        alt="Cengage Content Studio: Select Content, empty state with the unit/chapter/lesson tree."
        caption="Select Content: the content-first entry point. Browse into any Cengage course before choosing a treatment."
        width={2800}
        height={1600}
        wide
      />

      <h3 className="font-display">2. Write the responsible-AI principles before writing the requirements.</h3>
      <p>
        Before the first functional spec, I wrote the UX principles for
        responsible AI in an educational context: what the AI is allowed to
        assert, where human review is required, how the instructor verifies
        before publishing, how the product behaves when an adaptation would
        break an alignment. Those principles are what a regulated buyer (the
        provost&apos;s office, the accessibility team, the learning science
        group) asks about before signing off on a tool. Writing them first
        gave us a shared language to push back on feature asks that violated
        them, and it let engineering scope honestly. It&apos;s very
        different to scope &ldquo;AI rewrite&rdquo; versus &ldquo;AI rewrite
        that preserves lesson-level learning objectives.&rdquo;
      </p>

      <h3 className="font-display">3. Use React Magma 3 as a constraint, not an afterthought.</h3>
      <p>
        Explore is built on React Magma 3, the internal design system that
        underpins the rest of Cengage. Rather than treat that as a brand
        constraint, I used it as a product advantage: Content Studio inherits
        the accessibility baseline, interaction patterns, and familiarity of
        every other Cengage surface the instructor already uses. The AI
        behavior is the <em>only</em> novelty in the product. Everything
        else is deliberately boring. That makes the new capability feel like
        a natural extension of existing tools, not a separate product to
        learn, which matters enormously for adoption inside institutions
        that spend years vetting new software.
      </p>

      <h2 className="font-display mt-[var(--block-gap)]">Decisions</h2>

      <DecisionBlock heading="Decision 1: Generative AI is a set of primitives, not a features menu">
        <p>
          The easy version of Content Studio is a sidebar with{" "}
          <em>Summarize / Simplify / Translate / Rewrite</em> buttons. I
          argued hard against that shape and won.
        </p>
        <p>
          Instead, adaptation lives on the content itself as a small set of
          dials: <strong>Material Type</strong>,{" "}
          <strong>Reading Level</strong>, <strong>Language</strong>, and a
          short list of accommodations (<em>
            Chunking, Vocabulary Preview, Highlight Key Concepts
          </em>
          ). The AI runs in the background to realize whatever configuration
          the instructor picks. From the instructor&apos;s perspective,
          they&apos;re not invoking AI; they&apos;re choosing the version of
          the lesson they want their students to see.
        </p>
        <p>
          This reframing is the whole product. It moves the AI from something
          the user has to think about, to infrastructure the user uses
          without labeling it. The program&apos;s positioning inside
          Cengage&apos;s broader catalog depends on that; it&apos;s the
          difference between &ldquo;Content Studio has AI features&rdquo; and
          &ldquo;Content Studio is how AI shows up across Cengage.&rdquo;
          That positioning is what gets the program sustained investment.
        </p>
      </DecisionBlock>

      <DecisionBlock heading="Decision 2: Original and adapted render side-by-side, not sequentially">
        <p>
          The first instinct most teams have is to show the adapted output in
          the main canvas and tuck the original away. I designed the
          opposite: the original is always visible on the left, the
          adaptation is always visible on the right, and a{" "}
          <em>View Original</em> toggle lets the instructor collapse the
          comparison when they&apos;ve finished validating.
        </p>
        <p>
          This does three things at once. It gives the teacher a ground-truth
          reference every time they look at AI output: no context switching,
          no misremembering what the source said. It makes the cost of a bad
          adaptation zero (a wrong rendering is immediately legible as wrong
          against the original, not as plausible output to be scrutinized in
          isolation). And it quietly trains the teacher in what
          &ldquo;good&rdquo; AI adaptation looks like, building the trust
          required for any eventual move toward less manual review.
        </p>
        <p>
          A small interaction detail that does a lot of work: the adapted
          rendering is tagged at the top with the exact configuration that
          produced it (
          <em>Reading · Grade 6 · English · Vocabulary Preview</em>). The
          teacher never has to remember which dials they set; the artifact
          carries its own provenance.
        </p>
      </DecisionBlock>

      <DecisionBlock heading="Decision 3: Save As is a deliberate ceremony">
        <p>
          Generating an adaptation is cheap. Saving one is not. A saved
          adaptation can be assigned to students; it becomes a teaching
          object with its own weight inside the platform.
        </p>
        <p>
          I designed the save step as a deliberate gesture: the{" "}
          <em>Save As</em> button is discrete, requires an explicit teacher
          action, and is styled as the primary commit moment on the screen.
          The live adaptation on the right is <em>always</em> re-generatable;
          the saved version is what the teacher has chosen to stand behind.
          That separation is invisible to a user in their first minute with
          the tool, and it&apos;s the thing that makes the product defensible
          to the instructor after their hundredth.
        </p>
        <p>
          It also matters for the rest of the platform. A saved adaptation is
          a first-class object the rest of Explore can reference: Assignments
          can point to it, Gradebook can track engagement with it, Reports
          can surface which treatments a given student is responding to. None
          of that is possible if adaptations are ephemeral AI outputs.
        </p>
      </DecisionBlock>

      <h2 className="font-display mt-[var(--block-gap)]">Shipped</h2>
      <p>Live in Content Studio Beta inside Explore today:</p>
      <Figure
        src="/images/case-studies/cengage/select-content-populated.png"
        alt="Cengage Content Studio: Select Content with a lesson selected, the preview populated, and the Adapt button active."
        caption="Select Content: the lesson picked, preview populated, Adapt button active. The entry point into the adaptation flow."
        width={2800}
        height={1600}
        wide
      />
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Lesson selector:</strong> browse-and-search over the
          unit/chapter/lesson structure of any Cengage course, with a live
          preview pane before the teacher commits to adapting anything.
        </li>
        <li>
          <strong>Adapt Content:</strong> the side-by-side original/new
          canvas with the Adaptations panel: Material Type, Reading Level,
          Language, and accommodations (Chunking, Vocabulary Preview,
          Highlight Key Concepts).
        </li>
        <li>
          <strong>Configuration tagging:</strong> every adapted rendering is
          annotated with the exact parameters that produced it, so provenance
          is part of the artifact rather than a hidden metadata field.
        </li>
        <li>
          <strong>View Original toggle + Edit:</strong> instructor-facing
          controls for verifying the adaptation and making manual refinements
          before saving.
        </li>
        <li>
          <strong>Save As:</strong> turns a live adaptation into a durable
          lesson object that can be assigned, tracked, and reported on
          alongside the rest of the course.
        </li>
        <li>
          <strong>Explore-native integration:</strong> Content Studio lives
          in the primary Explore sidebar (Home, Assignments, Content,
          Gradebook, Reports, Groups, <em>Content Studio Beta</em>), so the
          AI capability is positioned as a first-class part of the platform
          rather than a detour out of it.
        </li>
      </ul>
      <Figure
        src="/images/case-studies/cengage/explore-home.png"
        alt="Cengage Explore home: the Hi, Janine! landing view with Content Studio Beta listed in the primary sidebar."
        caption="Explore-native integration: Content Studio lives in the primary Explore sidebar, not as a bolt-on."
        width={2800}
        height={1600}
        wide
      />
      <p>
        Content Studio positions Cengage among the first of the major
        higher-ed publishers to treat generative AI as a content-layer
        primitive rather than a feature release.
      </p>

      <h2 className="font-display mt-[var(--block-gap)]">Reflection</h2>
      <p>
        The biggest thing I&apos;d change in retrospect is where I put the
        measurement surface. The Beta instruments which instructors adopt
        which treatments (reading level, language, accommodations), but not
        yet deeply enough to tell whether adaptation actually{" "}
        <em>moves the needle</em> for the students it&apos;s meant to help.
        That should have been in v1, not v2, because that&apos;s the dataset
        that justifies the entire bet. I&apos;m pushing for it in the next
        release.
      </p>
      <p>
        More broadly: the interesting design question in AI-native products
        is rarely &ldquo;what does the AI do.&rdquo; It&apos;s &ldquo;what
        shape does the product take when AI is infrastructure rather than a
        feature.&rdquo; Content Studio is a small, contained answer to that
        question for a specific market, and it&apos;s the answer I want to
        keep refining inside Cengage while I&apos;m there.
      </p>

      <PrevNext
        prev={{ href: "/labnotes", label: "LabNotes.ai" }}
        next={{ href: "/seekwell", label: "SeekWell / HelloEyes" }}
      />
    </CaseStudyShell>
  );
}
