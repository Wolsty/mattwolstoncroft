export function Hero() {
  return (
    <section className="relative pt-24 md:pt-36">
      <h1 className="display max-w-[18ch]">
        Matthew Wolstoncroft
      </h1>
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
