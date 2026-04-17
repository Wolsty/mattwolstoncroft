import type { Metadata } from "next";
import Link from "next/link";
import { CaseStudyShell } from "@/components/case-study/CaseStudyShell";

export const metadata: Metadata = {
  title: "Archive",
  description: "Older work — line items and the Progrexion umbrella.",
};

type Entry = {
  year: string;
  label: string;
  href?: string;
  note?: string;
};

const ENTRIES: Entry[] = [
  {
    year: "2017 — 2022",
    label: "Progrexion",
    href: "/archive/progrexion",
    note:
      "Four projects across Lexington Law, CreditRepair.com, CreditRepair GO, and Credit.com / ExtraCredit.",
  },
  {
    year: "2016 — 2017",
    label: "JAMS",
    note: "Design for the dispute resolution provider's product surfaces.",
  },
  {
    year: "2015 — 2016",
    label: "iPR",
    note: "Consumer-facing personal reputation and identity platform.",
  },
];

export default function ArchivePage() {
  return (
    <CaseStudyShell
      meta={{
        title: "Archive",
        metadata: ["Older work", "Quiet list"],
      }}
      hero={
        <div
          className="rounded p-8 md:p-12"
          style={{ border: "1px solid var(--rule)" }}
        >
          <p
            className="italic max-w-prose font-body"
            style={{ fontSize: "var(--type-tension)", color: "var(--fg-muted)", lineHeight: 1.4 }}
          >
            A short, honest list of older work. Progrexion has its own
            umbrella page; the rest live as line items.
          </p>
        </div>
      }
    >
      <ul className="divide-y" style={{ borderColor: "var(--rule)" }}>
        {ENTRIES.map((e, i) => (
          <li
            key={e.label}
            className="py-6"
            style={{ borderTopWidth: i === 0 ? 1 : 0, borderColor: "var(--rule)" }}
          >
            <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_3fr] md:gap-8">
              <div className="meta">{e.year}</div>
              <div>
                {e.href ? (
                  <Link href={e.href} className="link-underline font-display text-[1.25rem]">
                    {e.label}
                  </Link>
                ) : (
                  <span className="font-display text-[1.25rem]">{e.label}</span>
                )}
                {e.note ? (
                  <p className="font-body mt-1" style={{ color: "var(--fg-muted)" }}>
                    {e.note}
                  </p>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </CaseStudyShell>
  );
}
