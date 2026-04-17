import type { Metadata } from "next";
import Link from "next/link";
import { CaseStudyShell } from "@/components/case-study/CaseStudyShell";
import { SEEKWELL_CASES } from "@/content/seekwell";

export const metadata: Metadata = {
  title: "SeekWell / HelloEyes",
  description:
    "Four sub-case studies across a mobile-first virtual vision platform — apps, assessment, AI exam, and a large-scale diary study.",
};

export default function SeekwellIndexPage() {
  return (
    <CaseStudyShell
      meta={{
        title: "SeekWell / HelloEyes",
        status: "Shipped",
        metadata: [
          "2022 — 2024",
          "Principal Designer",
          "Virtual Vision Platform",
          "Four sub-case studies",
        ],
      }}
      hero={
        <div
          className="rounded p-8 md:p-12"
          style={{ border: "1px solid var(--rule)" }}
        >
          <p className="meta mb-4">SeekWell / HelloEyes</p>
          <p
            className="italic max-w-prose font-body"
            style={{ fontSize: "var(--type-tension)", color: "var(--fg-muted)", lineHeight: 1.4 }}
          >
            A first-of-its-kind mobile vision platform — compressing the
            typical PM + designer + analyst workflow into a single seat
            across iOS, Android, an AI-powered vision exam, and the research
            that re-shaped the roadmap.
          </p>
        </div>
      }
    >
      <p>
        The four sub-case studies below capture the core of the SeekWell /
        HelloEyes work. Each lives as its own page — pick any entry point;
        the order reflects how the work compounded, from the shipping
        surfaces through the research that reshaped the roadmap.
      </p>

      <nav aria-label="SeekWell sub-case studies" className="mt-[var(--block-gap)]">
        <ul className="divide-y" style={{ borderColor: "var(--rule)" }}>
          {SEEKWELL_CASES.map((c, i) => (
            <li
              key={c.slug}
              className="py-6"
              style={{ borderColor: "var(--rule)", borderTopWidth: i === 0 ? 1 : 0, borderBottomWidth: 0 }}
            >
              <Link
                href={`/seekwell/${c.slug}`}
                className="group grid grid-cols-1 gap-2 md:grid-cols-[1fr_2fr] md:gap-8"
              >
                <div className="meta">{c.thumbnailLabel}</div>
                <div>
                  <p className="font-display text-[1.25rem] group-hover:text-[var(--accent)] transition-colors">
                    {c.title}
                  </p>
                  <p className="font-body mt-1" style={{ color: "var(--fg-muted)" }}>
                    {c.blurb}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </CaseStudyShell>
  );
}
