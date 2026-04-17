import type { Metadata } from "next";
import { CaseStudyShell } from "@/components/case-study/CaseStudyShell";
import { Figure } from "@/components/case-study/Figure";
import { ProgrexionHero } from "@/components/case-study/ProgrexionHero";
import { PrevNext } from "@/components/case-study/PrevNext";
import {
  PROGREXION_ENTRIES,
  PROGREXION_UMBRELLA_INTRO,
} from "@/content/progrexion";

export const metadata: Metadata = {
  title: "Progrexion",
  description:
    "Four Progrexion-era projects condensed into a single umbrella: Lexington Law iOS & Android, CreditRepair.com, CreditRepair GO, and Credit.com / ExtraCredit.",
};

export default function ProgrexionPage() {
  return (
    <CaseStudyShell
      meta={{
        title: "Progrexion",
        status: "Shipped",
        metadata: [
          "2018–2021",
          "Senior Product Designer",
          "Fintech / Credit",
          "4 product surfaces",
          "Shipped",
        ],
      }}
      hero={<ProgrexionHero intro={PROGREXION_UMBRELLA_INTRO} />}
    >
      {PROGREXION_ENTRIES.map((e) => (
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
                {h.term ? <strong>{h.term}:</strong> : null}
                {h.term ? " " : null}
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
          {e.images && e.images.length > 0
            ? e.images.map((img) => (
                <Figure
                  key={img.src}
                  src={img.src}
                  alt={img.alt}
                  caption={img.caption}
                  width={img.width}
                  height={img.height}
                  wide={img.wide}
                />
              ))
            : null}
        </section>
      ))}

      <PrevNext
        prev={{ href: "/seekwell", label: "SeekWell / HelloEyes" }}
        next={{ href: "/", label: "Home" }}
      />
    </CaseStudyShell>
  );
}
