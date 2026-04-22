"use client";

import Image from "next/image";
import clsx from "clsx";
import { useEffect, useState } from "react";

type ExpandableFigureProps = {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  /** when true, stretches to the content max width (outside the prose column) */
  wide?: boolean;
  priority?: boolean;
};

/**
 * Figure variant that opens a full-viewport lightbox when clicked,
 * so users can inspect details on large or dense images.
 * Close with ESC, overlay click, or the close button.
 */
export function ExpandableFigure({
  src,
  alt,
  caption,
  width = 2400,
  height = 1500,
  wide = false,
  priority = false,
}: ExpandableFigureProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <figure
        className={clsx(
          "my-[var(--block-gap)]",
          wide ? "mx-0" : "mx-auto max-w-prose",
        )}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Enlarge: ${alt}`}
          className="group relative block w-full cursor-zoom-in overflow-hidden rounded p-0 text-left"
          style={{ border: "1px solid var(--rule)", background: "var(--bg)" }}
        >
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            priority={priority}
            sizes={
              wide
                ? "(max-width: 1120px) 100vw, 1120px"
                : "(max-width: 640px) 100vw, 640px"
            }
            className="h-auto w-full transition-opacity group-hover:opacity-90"
          />
          <span
            aria-hidden
            className="meta pointer-events-none absolute right-3 top-3 rounded px-2 py-1 opacity-0 transition-opacity group-hover:opacity-100"
            style={{
              background: "var(--bg)",
              border: "1px solid var(--rule)",
              color: "var(--fg)",
            }}
          >
            Click to enlarge
          </span>
        </button>
        {caption ? (
          <figcaption className="meta mt-3">{caption}</figcaption>
        ) : null}
      </figure>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8"
          style={{ background: "rgba(0,0,0,0.85)" }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
            aria-label="Close"
            className="meta absolute right-4 top-4 rounded px-3 py-1"
            style={{
              background: "var(--bg)",
              border: "1px solid var(--rule)",
              color: "var(--fg)",
            }}
          >
            Close ✕
          </button>
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-full max-w-[95vw] overflow-auto"
          >
            {/* Use a plain <img> inside the lightbox so the user sees the full
                natural resolution without Next's responsive sizing capping it. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              className="block h-auto max-w-none"
              style={{ maxHeight: "90vh" }}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
