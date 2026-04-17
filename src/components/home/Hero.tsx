export function Hero() {
  return (
    <section className="relative pt-24 md:pt-36">
      <div className="flex items-start justify-between gap-6">
        <h1 className="display max-w-[18ch]">
          Matthew Wolstoncroft
        </h1>
        <p className="meta pt-3 whitespace-nowrap">
          Available · New York
        </p>
      </div>
      <p
        className="mt-8 max-w-prose italic font-body"
        style={{ fontSize: "var(--type-tension)", color: "var(--fg-muted)", lineHeight: 1.35 }}
      >
        Strategic product leader building AI-powered products from 0-to-1 —
        shipping across design and code.
      </p>
    </section>
  );
}
