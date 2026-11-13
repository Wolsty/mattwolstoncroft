"use client";

import { useTheme } from "@/lib/theme";
import { useFamily } from "./context";
import styles from "./family.module.css";

export function FamilyFooter() {
  const { theme, toggle } = useTheme();
  const { openContribute, data } = useFamily();
  return (
    <footer className={styles.footer}>
      <p>
        Put together by Matthew for the family. Know someone who&rsquo;s missing?{" "}
        <button type="button" className={`${styles.textButton} link-underline`} onClick={() => openContribute({ kind: "person", personId: data.meta.home })}>
          Add them
        </button>
        .
      </p>
      <button type="button" className={`${styles.textButton} link-underline`} onClick={toggle}>
        {theme === "dark" ? "Light theme" : "Dark theme"}
      </button>
    </footer>
  );
}
