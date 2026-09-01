import Link from "next/link";
import { FactStrip } from "@/components/case-study/FactStrip";

/**
 * A featured slot for work with no screenshot to show. Deliberately unlike
 * the project cards below it: no hero image, hard numbers instead, so it
 * reads as an engineering note before it is clicked.
 */
export function FeaturedNote() {
  return (
    <section
      aria-labelledby="home-featured"
      className="rule-top mt-[var(--section-gap)] pt-[var(--block-gap)]"
    >
      <h2 id="home-featured" className="meta mb-6">
        Featured — engineering
      </h2>
      <Link
        href="/llm-judge"
        className="surface-card group block rounded-lg px-6 py-8 md:px-12 md:py-12"
      >
        <p className="meta">
          LabNotes.ai · LLM-as-judge · Eval harness · Open-sourced
        </p>
        <h3
          className="font-heading mt-4"
          style={{ fontSize: "clamp(1.75rem, 3.4vw, 2.75rem)", lineHeight: 1.05 }}
        >
          Teaching a machine to grade fairly
        </h3>
        <p
          className="mt-5 max-w-prose italic font-body"
          style={{
            fontSize: "var(--type-tension)",
            color: "var(--fg-muted)",
            lineHeight: 1.3,
          }}
        >
          Building an LLM-as-judge for an AI chemistry tutor — and the eval
          harness that caught it being wrong.
        </p>
        <p className="mt-4 max-w-prose font-body" style={{ color: "var(--fg-muted)" }}>
          Two days of prompt rewrites that were never a prompt problem: a JSON
          prefill ending in a colon, an unset temperature that made the failure
          intermittent, and a fallback that silently scored zero. What replaced
          the tuning was an eval harness organised by problem shape rather than
          case count — now in production with a chemistry cohort, and
          open-sourced.
        </p>
        <FactStrip
          facts={[
            { value: "4", label: "rewrites of the judge prompt" },
            { value: "2 days", label: "spent on the wrong variable" },
            { value: "12 → 15", label: "eval cases, three problem shapes" },
            { value: "1 cycle", label: "to find it, once instrumented" },
          ]}
        />
        <p className="mt-8">
          <span className="link-underline font-body">Read the case study →</span>
        </p>
      </Link>
    </section>
  );
}
