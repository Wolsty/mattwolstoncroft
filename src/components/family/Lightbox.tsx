"use client";

import { useEffect, useState } from "react";
import { useFamily, type PhotoItem } from "./context";
import styles from "./family.module.css";

export function Lightbox({ items, index, onClose }: { items: PhotoItem[]; index: number; onClose: () => void }) {
  const { owner, setPortrait, portraitOf, people } = useFamily();
  const [i, setI] = useState(Math.max(0, index));
  const item = items[i];
  const n = items.length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setI((x) => (x + 1) % n);
      if (e.key === "ArrowLeft") setI((x) => (x - 1 + n) % n);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [n, onClose]);

  if (!item) return null;
  const isPortrait = item.personId && portraitOf(item.personId) === item.url;

  return (
    <div className={styles.lightbox} role="dialog" aria-modal="true" aria-label="Photo" onClick={onClose}>
      <figure className={styles.lightboxFigure} onClick={(e) => e.stopPropagation()}>
        <img src={item.url} alt={item.caption ?? ""} />
        <figcaption>
          {item.caption && <p>{item.caption}</p>}
          {item.by && <p className="meta">Shared by {item.by}</p>}
          <div className={styles.lightboxBar}>
            {n > 1 && (
              <span className={styles.lightboxNav}>
                <button type="button" onClick={() => setI((i - 1 + n) % n)} aria-label="Previous photo">
                  ←
                </button>
                <span className="meta">
                  {i + 1} of {n}
                </span>
                <button type="button" onClick={() => setI((i + 1) % n)} aria-label="Next photo">
                  →
                </button>
              </span>
            )}
            {owner && item.personId && (
              <button
                type="button"
                className={`${styles.textButton} link-underline`}
                onClick={() => setPortrait(item.personId!, isPortrait ? null : item.url)}
              >
                {isPortrait ? "Remove as portrait" : `Use as ${people[item.personId]?.n.split(" ")[0]}'s portrait`}
              </button>
            )}
            <button type="button" className={`${styles.textButton} link-underline`} onClick={onClose}>
              Close
            </button>
          </div>
        </figcaption>
      </figure>
    </div>
  );
}
