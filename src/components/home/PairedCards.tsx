import Link from "next/link";
import Image from "next/image";

type Card = {
  href: string;
  title: string;
  meta: string;
  tension: string;
  detail: string;
  image?: { src: string; alt: string; width: number; height: number };
};

const CARDS: Card[] = [
  {
    href: "/cengage",
    title: "Cengage Content Studio",
    meta: "2026 — Present · Senior UX Manager · React Magma 3 · GenAI · In Production (Beta)",
    tension:
      "Embedding generative AI as a core differentiator of a content platform without reducing the experience to “here's a button that generates stuff.”",
    detail:
      "Adaptation as a first-class content state: original and adapted render side-by-side, parameterized by dials the instructor picks. The AI becomes infrastructure the instructor uses without thinking about — a reframe I argued hard for and won.",
    image: {
      src: "/images/case-studies/cengage/adapt-content.png",
      alt: "Cengage Content Studio — side-by-side Adapt Content view",
      width: 2400,
      height: 1500,
    },
  },
  {
    href: "/seekwell",
    title: "SeekWell / HelloEyes",
    meta: "2022 — 2024 · Principal Designer · Health-Tech · Four sub-case studies",
    tension:
      "Compressing the typical PM + designer + analyst workflow into a single seat — a mobile-first virtual vision center built to earn clinical trust from a smartphone.",
    detail:
      "Led UX across iOS & Android apps, an AI-powered vision exam with a 30% completion lift, an invisible-qualification Vision Assessment, and a multi-month diary study that reshaped the exam and Lens Scanner roadmap.",
  },
];

export function PairedCards() {
  return (
    <section
      aria-label="Selected work"
      className="rule-top mt-[var(--section-gap)] pt-[var(--block-gap)]"
    >
      <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-10">
        {CARDS.map((c) => (
          <Card key={c.href} {...c} />
        ))}
      </div>
    </section>
  );
}

function Card(c: Card) {
  return (
    <Link
      href={c.href}
      className="group block rounded p-6 transition-colors"
      style={{ border: "1px solid var(--rule)" }}
    >
      {c.image ? (
        <div
          className="relative mb-6 overflow-hidden rounded"
          style={{ border: "1px solid var(--rule)" }}
        >
          <Image
            src={c.image.src}
            alt={c.image.alt}
            width={c.image.width}
            height={c.image.height}
            sizes="(max-width: 768px) 100vw, 560px"
            className="h-auto w-full"
          />
        </div>
      ) : (
        <div
          className="mb-6 flex aspect-[8/5] items-center justify-center rounded"
          style={{ border: "1px solid var(--rule)", color: "var(--fg-muted)" }}
        >
          <span className="meta">Hero image</span>
        </div>
      )}
      <h3 className="font-display" style={{ fontSize: "clamp(1.5rem, 2.6vw, 2rem)" }}>
        {c.title}
      </h3>
      <p className="meta mt-3">{c.meta}</p>
      <p
        className="mt-4 italic font-body"
        style={{ color: "var(--fg-muted)", lineHeight: 1.4 }}
      >
        {c.tension}
      </p>
      <p
        className="mt-3 font-body opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100"
        style={{ color: "var(--fg-muted)" }}
      >
        {c.detail}
      </p>
      <p className="mt-6">
        <span className="link-underline font-body">Read →</span>
      </p>
    </Link>
  );
}
