import { HeroShader } from "@/components/hero/HeroShader";

export function Hero() {
  return (
    <section className="relative isolate pt-24 md:pt-36">
      <HeroShader />
      <div className="relative" style={{ zIndex: 1 }}>
        <h1 className="display" style={{ lineHeight: 0.95 }}>
          <span className="block">Matthew</span>
          <span className="block">Wolstoncroft</span>
        </h1>
        <p
          className="mt-8 max-w-prose italic font-body"
          style={{ fontSize: "var(--type-tension)", color: "var(--fg-muted)", lineHeight: 1.35 }}
        >
          Strategic product leader building AI-powered products from 0-to-1,
          shipping across design and code.
        </p>
      </div>
    </section>
  );
}
