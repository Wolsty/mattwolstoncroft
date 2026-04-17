"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

export type CaseStudyMeta = {
  title: string;
  metadata: string[];
  status?: string; // e.g., "Shipped", "In Production (Beta)"
};

export type CaseStudyShellProps = {
  meta: CaseStudyMeta;
  /** Pre-metadata hero element; typically a Figure. */
  hero: ReactNode;
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
};

export function CaseStudyShell({
  meta,
  hero,
  children,
  backHref = "/",
  backLabel = "Back",
}: CaseStudyShellProps) {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <MiniHeader title={meta.title} status={meta.status} solid={solid} backHref={backHref} backLabel={backLabel} />
      <main
        id="main"
        className="mx-auto w-full max-w-content px-6 md:px-10 pb-24"
      >
        <article>
          {/* Title block */}
          <header className="pt-28 md:pt-36">
            <h1
              className="font-display"
              style={{ fontSize: "var(--type-h1)", lineHeight: 1.05 }}
            >
              {meta.title}
            </h1>
            <div className="mt-6">
              <p className="meta rule-top pt-3 flex flex-wrap gap-x-3 gap-y-1">
                {meta.metadata.map((item, i) => (
                  <span key={i} className="whitespace-nowrap">
                    {item}
                    {i < meta.metadata.length - 1 ? (
                      <span aria-hidden className="pl-3">·</span>
                    ) : null}
                  </span>
                ))}
              </p>
            </div>
          </header>

          {/* Hero */}
          <section className="my-[var(--block-gap)]">{hero}</section>

          {/* Body */}
          <div className="max-w-prose font-body" style={{ lineHeight: 1.55 }}>
            {children}
          </div>
        </article>
      </main>
    </>
  );
}

function MiniHeader({
  title,
  status,
  solid,
  backHref,
  backLabel,
}: {
  title: string;
  status?: string;
  solid: boolean;
  backHref: string;
  backLabel: string;
}) {
  return (
    <div
      className="fixed left-0 right-0 top-0 z-40 h-10 transition-colors"
      style={{
        background: solid ? "var(--bg)" : "transparent",
        borderBottom: solid ? "1px solid var(--rule)" : "1px solid transparent",
      }}
    >
      <div className="mx-auto flex h-full w-full max-w-content items-center justify-between px-6 md:px-10">
        <Link href={backHref} className="link-underline meta" aria-label={`Back to ${backLabel}`}>
          ← {backLabel}
        </Link>
        <div className="meta hidden sm:flex items-center gap-3">
          <span style={{ color: "var(--fg)" }}>{title}</span>
          {status ? <span>· {status}</span> : null}
        </div>
      </div>
    </div>
  );
}
