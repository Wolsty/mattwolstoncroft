"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Progrexion hero. Prefers /images/case-studies/progrexion/progrexion-hero.png
 * if present; otherwise gracefully renders the umbrella intro copy in a
 * bordered text block so the page stays presentable until the asset lands.
 */
export function ProgrexionHero({ intro }: { intro: string }) {
  const [failed, setFailed] = useState(false);
  const src = "/images/case-studies/progrexion/progrexion-hero.png";

  if (failed) {
    return (
      <div
        className="rounded p-8 md:p-12"
        style={{ border: "1px solid var(--rule)" }}
      >
        <p className="meta mb-4">Progrexion: Four product surfaces</p>
        <p
          className="max-w-prose font-body"
          style={{ color: "var(--fg-muted)", lineHeight: 1.55 }}
        >
          {intro}
        </p>
      </div>
    );
  }

  return (
    <figure className="my-[var(--block-gap)] mx-0">
      <div
        className="relative overflow-hidden rounded"
        style={{ border: "1px solid var(--rule)", background: "var(--bg)" }}
      >
        <Image
          src={src}
          alt="Progrexion: consumer fintech product surfaces for credit repair and monitoring."
          width={2800}
          height={1600}
          priority
          sizes="(max-width: 1120px) 100vw, 1120px"
          className="h-auto w-full"
          onError={() => setFailed(true)}
        />
      </div>
    </figure>
  );
}
