type Role = {
  /** e.g. "Judge" */
  name: string;
  /** What this part of the system is responsible for. */
  body: string;
  /** Monospace spec — model and sampling, or a note that no model runs here. */
  spec: string;
  /**
   * Marks the row that is deliberately not a model call. It reads in the
   * accent color because it is the point of the exhibit, not a footnote.
   */
  emphasis?: boolean;
};

type RoleLedgerProps = {
  roles: Role[];
  caption?: string;
};

const MONO =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';

/**
 * A ledger of the responsibilities a system has been split into. Used where
 * the argument is the division of labour itself — which decisions get their
 * own model call, and which get no model at all.
 */
export function RoleLedger({ roles, caption }: RoleLedgerProps) {
  return (
    <figure className="my-[var(--block-gap)]">
      <dl className="rule-top">
        {roles.map((role) => (
          <div
            key={role.name}
            className="grid gap-1 py-5 md:grid-cols-[9rem_1fr] md:gap-x-8"
            style={{ borderBottom: "1px solid var(--rule)" }}
          >
            <dt
              className="font-heading"
              style={{
                fontSize: "var(--type-body)",
                color: role.emphasis ? "var(--accent)" : "var(--fg)",
              }}
            >
              {role.name}
            </dt>
            <dd className="m-0 font-body" style={{ color: "var(--fg-muted)", lineHeight: 1.5 }}>
              {role.body}{" "}
              <span style={{ fontFamily: MONO, fontSize: "0.8125rem", color: "var(--fg)" }}>
                {role.spec}
              </span>
            </dd>
          </div>
        ))}
      </dl>
      {caption ? <figcaption className="meta mt-3">{caption}</figcaption> : null}
    </figure>
  );
}
