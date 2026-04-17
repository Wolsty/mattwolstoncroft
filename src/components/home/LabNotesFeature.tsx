import Link from "next/link";
import { LiveArtifact } from "@/components/live-artifact/LiveArtifact";

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
          <LiveArtifact />
        </div>
      </div>
    </section>
  );
}
