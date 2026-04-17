"use client";

import Image from "next/image";
import { useState } from "react";
import clsx from "clsx";

type FigureWithFallbackProps = {
  src: string;
  fallbackSrc: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  wide?: boolean;
  priority?: boolean;
};

/**
 * Figure variant that swaps to `fallbackSrc` if `src` fails to load.
 * Use when the preferred asset may not be present in /public yet.
 */
export function FigureWithFallback({
  src,
  fallbackSrc,
  alt,
  caption,
  width = 2400,
  height = 1500,
  wide = false,
  priority = false,
}: FigureWithFallbackProps) {
  const [currentSrc, setCurrentSrc] = useState(src);

  return (
    <figure
      className={clsx(
        "my-[var(--block-gap)]",
        wide ? "mx-0" : "mx-auto max-w-prose",
      )}
    >
      <div
        className="relative overflow-hidden rounded"
        style={{ border: "1px solid var(--rule)", background: "var(--bg)" }}
      >
        <Image
          src={currentSrc}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          onError={() => {
            if (currentSrc !== fallbackSrc) setCurrentSrc(fallbackSrc);
          }}
          sizes={wide ? "(max-width: 1120px) 100vw, 1120px" : "(max-width: 640px) 100vw, 640px"}
          className="h-auto w-full"
        />
      </div>
      {caption ? (
        <figcaption className="meta mt-3">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
