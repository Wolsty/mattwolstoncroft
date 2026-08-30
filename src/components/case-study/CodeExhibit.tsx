type Band = {
  /** Small-caps label above the lines, e.g. "SENT — the prefill". */
  label: string;
  lines: string[];
  /** Small italic aside under the lines, pointing at what matters. */
  note?: string;
  /** "error" tints the lines with the error color; "muted" recedes them. */
  tone?: "default" | "error" | "muted";
};

type CodeExhibitProps = {
  bands: Band[];
  caption?: string;
};

const MONO =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';

/**
 * A typographic exhibit for engineering case studies: stacked, labelled bands
 * of monospace text. Used where the artifact is a string, not a screen.
 */
export function CodeExhibit({ bands, caption }: CodeExhibitProps) {
  return (
    <figure className="my-[var(--block-gap)]">
      <div className="surface-media overflow-hidden rounded-lg">
        {bands.map((band, i) => (
          <div
            key={i}
            className="px-5 py-4 md:px-7 md:py-5"
            style={{
              borderTop: i === 0 ? undefined : "1px solid var(--rule)",
              background:
                band.tone === "muted" ? "var(--bg-subtle)" : undefined,
            }}
          >
            <p className="meta mb-2">{band.label}</p>
            <pre
              className="overflow-x-auto"
              style={{
                fontFamily: MONO,
                fontSize: "0.8125rem",
                lineHeight: 1.6,
                whiteSpace: "pre",
                color:
                  band.tone === "error"
                    ? "var(--fg-error)"
                    : band.tone === "muted"
                      ? "var(--fg-muted)"
                      : "var(--fg)",
              }}
            >
              {band.lines.join("\n")}
            </pre>
            {band.note ? (
              <p
                className="mt-2 italic font-body"
                style={{ fontSize: "var(--type-caption)", color: "var(--fg-muted)" }}
              >
                {band.note}
              </p>
            ) : null}
          </div>
        ))}
      </div>
      {caption ? <figcaption className="meta mt-3">{caption}</figcaption> : null}
    </figure>
  );
}
