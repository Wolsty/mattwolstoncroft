export type Fact = {
  /** The number or short value, set in the display face. */
  value: string;
  /** What it counts. */
  label: string;
};

/**
 * A row of hard numbers. Used where a case study has no screenshot to lead
 * with and the evidence is quantitative. The label is a <dt> rendered after
 * its <dd> via flex order, so the markup stays valid while the number reads
 * first.
 */
export function FactStrip({ facts }: { facts: Fact[] }) {
  return (
    <dl className="rule-top mt-8 grid grid-cols-2 gap-x-6 gap-y-7 pt-6 md:grid-cols-4">
      {facts.map((f) => (
        <div key={f.label} className="flex flex-col">
          <dt className="meta order-2 mt-2" style={{ lineHeight: 1.35 }}>
            {f.label}
          </dt>
          <dd
            className="font-display order-1 m-0"
            style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", lineHeight: 1 }}
          >
            {f.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
