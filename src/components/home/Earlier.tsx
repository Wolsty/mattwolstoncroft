type Item = { year: string; label: string; note: string };

const ITEMS: Item[] = [
  {
    year: "2016–2017",
    label: "JAMS",
    note: "Design for the dispute resolution provider's product surfaces.",
  },
  {
    year: "2015–2016",
    label: "iPR",
    note: "Consumer-facing personal reputation and identity platform.",
  },
];

export function Earlier() {
  return (
    <section
      aria-labelledby="home-earlier"
      className="rule-top mt-[var(--section-gap)] pt-[var(--block-gap)]"
    >
      <h2 id="home-earlier" className="meta mb-6">Earlier</h2>
      <ul className="divide-y" style={{ borderColor: "var(--rule)" }}>
        {ITEMS.map((e, i) => (
          <li
            key={e.label}
            className="py-5"
            style={{
              borderTopWidth: i === 0 ? 1 : 0,
              borderColor: "var(--rule)",
            }}
          >
            <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_3fr] md:gap-8">
              <div className="meta">{e.year}</div>
              <div>
                <span className="font-display text-[1.125rem]">{e.label}</span>
                <p className="font-body mt-1" style={{ color: "var(--fg-muted)" }}>
                  {e.note}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
