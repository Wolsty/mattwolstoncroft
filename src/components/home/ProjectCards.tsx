"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

type Card = {
  href: string;
  title: string;
  meta: string;
  tension: string;
  detail: string;
  image?: {
    src: string;
    fallbackSrc?: string;
    alt: string;
    width: number;
    height: number;
  };
};

const CARDS: Card[] = [
  {
    href: "/labnotes",
    title: "LabNotes.ai",
    meta: "2025–Present · Co-founder · Higher-Ed STEM · Shipped",
    tension:
      "An AI tutor maximally helpful to a single student is often actively harmful to their learning. LabNotes.ai is the platform I built to resolve that.",
    detail:
      "Architected the AI experience layer end-to-end: graduated-assistance tutor, behavior-based escalation, and a faculty Integrity view that turns oversight into a teaching tool. Shipped to a live university course in the first semester.",
    image: {
      src: "/images/case-studies/labnotes/chat-with-labnotes.png",
      fallbackSrc: "/images/case-studies/labnotes/ai-insights-integrity.png",
      alt: "LabNotes.ai: Chat with LabNotes, the faculty-facing surface with quick-prompt chips for recurring questions.",
      width: 2800,
      height: 1600,
    },
  },
  {
    href: "/cengage",
    title: "Cengage Content Studio",
    meta: "2026–Present · Senior UX Manager · React Magma 3 · GenAI · In Production (Beta)",
    tension:
      "Embedding generative AI as a core differentiator of a content platform without reducing the experience to “here's a button that generates stuff.”",
    detail:
      "Adaptation as a first-class content state: original and adapted render side-by-side, parameterized by dials the instructor picks. The AI becomes infrastructure the instructor uses without thinking about. A reframe I argued hard for and won.",
    image: {
      src: "/images/case-studies/cengage/adapt-content.png",
      alt: "Cengage Content Studio: side-by-side Adapt Content view.",
      width: 2400,
      height: 1500,
    },
  },
  {
    href: "/seekwell",
    title: "SeekWell / HelloEyes",
    meta: "2022–2024 · Principal Designer · Health-Tech · Four sub-case studies",
    tension:
      "Compressing the typical PM + designer + analyst workflow into a single seat, a mobile-first virtual vision center built to earn clinical trust from a smartphone.",
    detail:
      "Led UX across iOS & Android apps, an AI-powered vision exam with a 30% completion lift, an invisible-qualification Vision Assessment, and a multi-month diary study that reshaped the exam and Lens Scanner roadmap.",
    image: {
      src: "/images/case-studies/seekwell/hero_HelloEyes.webp",
      alt: "SeekWell / HelloEyes: mobile-first virtual vision platform.",
      width: 2400,
      height: 1500,
    },
  },
  {
    href: "/progrexion",
    title: "Progrexion",
    meta: "2018–2021 · SENIOR PRODUCT DESIGNER · FINTECH / CREDIT · 4 PRODUCT SURFACES · SHIPPED",
    tension:
      "Translating opaque, legalistic credit-repair processes into mobile-first experiences users could trust, track, and act on.",
    detail:
      "Led product design across Lexington Law iOS/Android, CreditRepair.com, CreditRepair GO, and Credit.com / ExtraCredit: score tracking, self-service dispute engines, Focus Tracks, biometric login, and the consolidated bureau intake that cut three steps to one.",
    image: {
      src: "/images/case-studies/progrexion/lexington-law-screens.avif",
      alt: "Progrexion: Lexington Law iOS screens showing FICO score, dispute case details, case overview, and score factors.",
      width: 1702,
      height: 845,
    },
  },
];

export function ProjectCards() {
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
  const [src, setSrc] = useState(c.image?.src);
  const [failed, setFailed] = useState(false);

  return (
    <Link
      href={c.href}
      className="group block rounded p-6 transition-colors"
      style={{ border: "1px solid var(--rule)" }}
    >
      {c.image && src && !failed ? (
        <div
          className="relative mb-6 overflow-hidden rounded"
          style={{ border: "1px solid var(--rule)" }}
        >
          <Image
            src={src}
            alt={c.image.alt}
            width={c.image.width}
            height={c.image.height}
            sizes="(max-width: 768px) 100vw, 560px"
            className="h-auto w-full"
            onError={() => {
              if (c.image?.fallbackSrc && src !== c.image.fallbackSrc) {
                setSrc(c.image.fallbackSrc);
              } else {
                setFailed(true);
              }
            }}
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
        className="mt-3 font-body"
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
