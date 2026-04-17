import Link from "next/link";
import { FigureWithFallback } from "@/components/case-study/FigureWithFallback";

export function LabNotesFeature() {
  return (
    <section
      aria-labelledby="home-labnotes"
      className="rule-top mt-[var(--section-gap)] pt-[var(--block-gap)]"
    >
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        <div>
          <p className="meta mb-4">Flagship · 2025 — Present</p>
          <h2
            id="home-labnotes"
            className="font-display"
            style={{ fontSize: "clamp(2.25rem, 5vw, 3.5rem)", lineHeight: 1.05 }}
          >
            LabNotes.ai
          </h2>
          <p className="meta mt-4">
            2025 — Present · Co-founder · Next.js · Anthropic · Postgres · Vercel · Shipped
          </p>
          <p
            className="mt-8 max-w-prose italic font-body"
            style={{ fontSize: "var(--type-tension)", lineHeight: 1.35, color: "var(--fg-muted)" }}
          >
            An AI tutor maximally helpful to a single student is often actively
            harmful to their learning. LabNotes is the platform I built to
            resolve that.
          </p>
          <p className="mt-8">
            <Link href="/labnotes" className="link-underline font-body">
              Read the case study →
            </Link>
          </p>
        </div>
        <div>
          <FigureWithFallback
            src="/images/case-studies/labnotes/labnotes-product-mock.png"
            fallbackSrc="/images/case-studies/labnotes/ai-insights-integrity.png"
            alt="LabNotes product overview — AI tutor and faculty insights in a live chemistry course."
            width={2800}
            height={1600}
            wide
          />
        </div>
      </div>
    </section>
  );
}
