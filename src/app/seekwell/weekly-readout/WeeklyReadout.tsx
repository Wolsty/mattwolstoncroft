"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

/**
 * Weekly Experiment Readout — Sample.
 *
 * A standalone, publicly shareable page (excluded from the site-wide
 * password gate in src/middleware.ts). It is intentionally NOT part of the
 * SEEKWELL_CASES index, so it never appears in /seekwell navigation or the
 * case-to-case PrevNext — it's reachable only by direct link.
 *
 * Content mirrors the original self-contained readout artifact, restyled to
 * the site's design system (display/body type, --bg/--fg/--rule/--accent
 * tokens, small-caps meta labels), and theme-aware in light + dark.
 */

type Decision = "ship" | "kill" | "iterate";

const decisionLabel: Record<Decision, string> = {
  ship: "Ship",
  kill: "Kill",
  iterate: "Iterate",
};

function decisionColor(d: Decision): string {
  if (d === "ship") return "var(--accent)";
  if (d === "kill") return "var(--fg-error)";
  return "var(--fg-muted)";
}

function Tag({ kind }: { kind: Decision }) {
  const color = decisionColor(kind);
  return (
    <span
      className="meta inline-block rounded-full px-2.5 py-0.5"
      style={{
        color,
        border: `1px solid ${color}`,
        background: `color-mix(in srgb, ${color} 10%, transparent)`,
      }}
    >
      {decisionLabel[kind]}
    </span>
  );
}

function ScoreCard({
  label,
  value,
  delta,
  dir,
}: {
  label: string;
  value: string;
  delta: string;
  dir: "up" | "down";
}) {
  const color = dir === "up" ? "var(--accent)" : "var(--fg-error)";
  return (
    <div
      className="rounded p-4"
      style={{ border: "1px solid var(--rule)" }}
    >
      <p className="meta">{label}</p>
      <p
        className="font-display mt-2"
        style={{ fontSize: "1.75rem", lineHeight: 1.05, fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </p>
      <p
        className="mt-1"
        style={{ color, fontSize: "var(--type-caption)", fontFamily: "var(--font-body)" }}
      >
        {dir === "up" ? "▲" : "▼"} {delta}
      </p>
    </div>
  );
}

function MiniHeader({ solid }: { solid: boolean }) {
  return (
    <div
      className="fixed left-0 right-0 top-0 z-40 h-10 transition-colors"
      style={{
        background: solid ? "var(--bg)" : "transparent",
        borderBottom: solid ? "1px solid var(--rule)" : "1px solid transparent",
      }}
    >
      <div className="mx-auto flex h-full w-full max-w-content items-center justify-between px-6 md:px-10">
        <Link href="/seekwell" className="link-underline meta" aria-label="Back to SeekWell">
          ← SeekWell
        </Link>
        <div className="meta hidden sm:flex items-center gap-3">
          <span style={{ color: "var(--fg)" }}>Weekly Experiment Readout</span>
          <span>· Sample</span>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="meta" style={{ color: "var(--fg)", marginBottom: "0.75rem" }}>
      {children}
    </h2>
  );
}

const META = [
  "Sample readout",
  "Checkout & Rx Flow squad",
  "Conversion-rate optimization",
  "SeekWell / HelloEyes",
];

export function WeeklyReadout() {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <MiniHeader solid={solid} />
      <main id="main" className="mx-auto w-full max-w-content px-6 md:px-10 pb-24">
        <article>
          {/* Title block */}
          <header className="pt-28 md:pt-36">
            <h1 className="font-display" style={{ fontSize: "var(--type-h1)", lineHeight: 1.05 }}>
              Rx Eyewear Checkout — Weekly Readout
            </h1>
            <div className="mt-6">
              <p className="meta rule-top pt-3 flex flex-wrap gap-x-3 gap-y-1">
                {META.map((item, i) => (
                  <span key={i} className="whitespace-nowrap">
                    {item}
                    {i < META.length - 1 ? (
                      <span aria-hidden className="pl-3">·</span>
                    ) : null}
                  </span>
                ))}
              </p>
              <p
                className="mt-4 italic max-w-prose"
                style={{ color: "var(--fg-muted)", fontSize: "var(--type-caption)", fontFamily: "var(--font-body)" }}
              >
                Sample artifact. Structure mirrors readouts I ran owning the Rx-purchase
                funnel at SeekWell; brand and metrics are illustrative and sanitized for
                confidentiality.
              </p>
            </div>
          </header>

          {/* TL;DR */}
          <section className="mt-[var(--block-gap)]">
            <SectionLabel>TL;DR</SectionLabel>
            <blockquote
              className="pl-6 max-w-prose"
              style={{
                borderLeft: "2px solid var(--accent)",
                color: "var(--fg)",
                fontSize: "var(--type-tension)",
                lineHeight: 1.3,
                fontFamily: "var(--font-body)",
              }}
            >
              Friction at <strong>prescription entry</strong>, not price or shipping, remains
              the dominant drop-off in checkout. Guiding users through Rx input (stepped flow
              + contextual help) is winning; <em>removing</em> the step by deferring it looks
              like a conversion win but leaks downstream. Net checkout conversion up{" "}
              <strong>+0.4pp WoW</strong> on the back of the stepped-Rx ship.
            </blockquote>
          </section>

          {/* Funnel scorecard */}
          <section className="mt-[var(--block-gap)]">
            <SectionLabel>Funnel Scorecard · vs. prior week</SectionLabel>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <ScoreCard label="Checkout conversion" value="3.5%" delta="+0.4pp" dir="up" />
              <ScoreCard label="Rx-step completion" value="67.2%" delta="+6.1pp" dir="up" />
              <ScoreCard label="Cart → Rx start" value="78.4%" delta="+1.2pp" dir="up" />
              <ScoreCard label="Mobile conversion" value="2.7%" delta="+0.3pp" dir="up" />
            </div>
          </section>

          {/* Experiments table */}
          <section className="mt-[var(--block-gap)]">
            <SectionLabel>Experiments This Week</SectionLabel>
            <div className="overflow-x-auto">
              <table
                className="w-full font-body"
                style={{ borderCollapse: "collapse", fontSize: "var(--type-caption)", minWidth: "640px" }}
              >
                <thead>
                  <tr>
                    {["Test & hypothesis", "Primary metric", "Control", "Variant", "Result", "Decision"].map(
                      (h) => (
                        <th
                          key={h}
                          className="meta"
                          style={{
                            textAlign: "left",
                            padding: "10px 10px",
                            borderBottom: "1px solid var(--rule)",
                            verticalAlign: "bottom",
                          }}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  <ExperimentRow
                    test="Stepped Rx entry"
                    hypothesis="Breaking Rx into a guided 3-step wizard (vs. one dense form) lowers abandonment."
                    metric="Rx-step completion"
                    control="61.4%"
                    variant="68.9%"
                    result="+7.5pp"
                    resultNote="95% sig"
                    decision="ship"
                    decisionNote="Rolled to 100%."
                  />
                  <ExperimentRow
                    test={'"Enter Rx later"'}
                    hypothesis="Letting buyers defer Rx to post-purchase lifts checkout completion."
                    metric="Checkout conversion"
                    control="3.1%"
                    variant="3.0%"
                    result="−0.1pp"
                    resultNote="not sig"
                    decision="kill"
                    decisionNote="Lifted step CR but leaked Rx capture & fulfillment downstream."
                  />
                  <ExperimentRow
                    test="Inline Rx help"
                    hypothesis={'A "how to read your prescription" tooltip + sample image reduces confusion-driven drop.'}
                    metric="Rx-field error rate"
                    control="— baseline"
                    variant="−22% errors"
                    result="+3.1pp compl."
                    resultNote="90% sig"
                    decision="iterate"
                    decisionNote="Promising; extend & power up the test."
                  />
                </tbody>
              </table>
            </div>
          </section>

          {/* Learnings + Next up */}
          <section className="mt-[var(--block-gap)] grid md:grid-cols-2 gap-x-12 gap-y-10">
            <div>
              <SectionLabel>Key Learning</SectionLabel>
              <ul className="list-disc pl-5 space-y-2 font-body" style={{ fontSize: "var(--type-caption)" }}>
                <li>
                  The Rx field is the funnel&apos;s true bottleneck. Help users <em>through</em>{" "}
                  it; don&apos;t try to remove it.
                </li>
                <li>
                  Step-level wins can be funnel-level losses. The deferral test &ldquo;won&rdquo;
                  locally and lost globally — measure the whole funnel through fulfillment.
                </li>
                <li>Contextual education (sample Rx image) beats more copy.</li>
              </ul>
            </div>
            <div>
              <SectionLabel>Shipping / Next Up</SectionLabel>
              <ul className="list-disc pl-5 space-y-2 font-body" style={{ fontSize: "var(--type-caption)" }}>
                <li>
                  <strong>Shipped:</strong> stepped Rx entry to 100%.
                </li>
                <li>
                  <strong>Next:</strong> mobile Rx photo-upload with OCR autofill
                  (highest-friction segment).
                </li>
                <li>
                  <strong>Next:</strong> set Rx-requirement expectation earlier, on the PDP.
                </li>
                <li>
                  <strong>Next:</strong> resume-link email to Rx-step abandoners.
                </li>
              </ul>
            </div>
          </section>

          {/* Foot */}
          <footer
            className="meta rule-top mt-[var(--block-gap)] pt-4 flex flex-wrap justify-between gap-2"
          >
            <span>Matthew Wolstoncroft · wolstoncroft.1@gmail.com</span>
            <span>mattwolstoncroft.com</span>
          </footer>
        </article>
      </main>
    </>
  );
}

function ExperimentRow({
  test,
  hypothesis,
  metric,
  control,
  variant,
  result,
  resultNote,
  decision,
  decisionNote,
}: {
  test: string;
  hypothesis: string;
  metric: string;
  control: string;
  variant: string;
  result: string;
  resultNote: string;
  decision: Decision;
  decisionNote: string;
}) {
  const cell: React.CSSProperties = {
    padding: "12px 10px",
    borderBottom: "1px solid var(--rule)",
    verticalAlign: "top",
  };
  const num: React.CSSProperties = { ...cell, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" };
  return (
    <tr>
      <td style={{ ...cell, width: "26%" }}>
        <strong>{test}</strong>
        <br />
        <span style={{ color: "var(--fg-muted)" }}>{hypothesis}</span>
      </td>
      <td style={num}>{metric}</td>
      <td style={num}>{control}</td>
      <td style={num}>{variant}</td>
      <td style={num}>
        <strong>{result}</strong>
        <br />
        <span style={{ color: "var(--fg-muted)" }}>{resultNote}</span>
      </td>
      <td style={{ ...cell, width: "20%" }}>
        <Tag kind={decision} />
        <br />
        <span style={{ color: "var(--fg-muted)" }}>{decisionNote}</span>
      </td>
    </tr>
  );
}
