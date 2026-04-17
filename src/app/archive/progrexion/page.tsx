import type { Metadata } from "next";
import { CaseStudyShell } from "@/components/case-study/CaseStudyShell";
import { PrevNext } from "@/components/case-study/PrevNext";
import {
  PROGREXION_ENTRIES,
  PROGREXION_UMBRELLA_INTRO,
} from "@/content/progrexion";

export const metadata: Metadata = {
  title: "Progrexion — Archive",
  description:
    "Four Progrexion-era projects condensed into a single umbrella: Lexington Law iOS & Android, CreditRepair.com, CreditRepair GO, and Credit.com / ExtraCredit.",
};

export default function ProgrexionArchivePage() {
  return (
    <CaseStudyShell
      meta={{
        title: "Progrexion",
        status: "Archive",
        metadata: [
          "2017 — 2022",
          "Lead Product Designer",
          "Lexington Law · CreditRepair.com · Credit.com",
          "iOS · Android · Web",
        ],
      }}
      backHref="/archive"
      backLabel="Archive"
      hero={
        <div
          className="rounded p-8 md:p-12"
          style={{ border: "1px solid var(--rule)" }}
        >
          <p className="meta mb-4">Progrexion — Four projects</p>
          <p
            className="max-w-prose font-body"
            style={{ color: "var(--fg-muted)", lineHeight: 1.55 }}
          >
            {PROGREXION_UMBRELLA_INTRO}
          </p>
        </div>
      }
    >
      <p>
        Four sub-entries below. Condensed to the framing, the design
        decisions that carried weight, and the outcomes that landed — each
        draws on the original modal copy from the earlier site.
      </p>

      {PROGREXION_ENTRIES.map((e, i) => (
        <section
          key={e.slug}
          className="mt-[var(--block-gap)] rule-top pt-6"
          aria-labelledby={`prog-${e.slug}`}
        >
          <p className="meta mb-2">{e.thumbnailLabel}</p>
          <h2
            id={`prog-${e.slug}`}
            className="font-display"
            style={{ fontSize: "var(--type-h2)", lineHeight: 1.2 }}
          >
            {e.title}
          </h2>
          <p className="mt-4">{e.overview}</p>
          <ul className="list-disc pl-6 mt-4 space-y-3">
            {e.highlights.map((h, j) => (
              <li key={j}>
                {h.term ? <strong>{h.term}</strong> : null}
                {h.term ? " — " : null}
                {h.body}
              </li>
            ))}
          </ul>
          {e.outcomes && e.outcomes.length > 0 ? (
            <>
              <p className="meta mt-6 mb-2">Outcomes</p>
              <ul className="list-disc pl-6 space-y-2">
                {e.outcomes.map((o, j) => (
                  <li key={j}>{o}</li>
                ))}
              </ul>
            </>
          ) : null}
        </section>
      ))}

      <PrevNext
        prev={{ href: "/archive", label: "Archive" }}
        next={{ href: "/", label: "Home" }}
      />
    </CaseStudyShell>
  );
}
