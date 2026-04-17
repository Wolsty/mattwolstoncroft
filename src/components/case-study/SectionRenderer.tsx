import type { SeekwellSection } from "@/content/seekwell";

/**
 * Renders the structured section blocks used by SeekWell and Progrexion
 * archive pages. Keeps the prose column narrow; lists render with terms
 * bolded inline so it reads as editorial copy, not a datasheet.
 */
export function SectionRenderer({ sections }: { sections: SeekwellSection[] }) {
  return (
    <>
      {sections.map((s, i) => {
        if (s.kind === "heading") {
          return (
            <h2
              key={i}
              className="font-display mt-[var(--block-gap)] first:mt-0"
              style={{ fontSize: "var(--type-h2)", lineHeight: 1.2 }}
            >
              {s.text}
            </h2>
          );
        }
        if (s.kind === "paragraph") {
          return (
            <p key={i} className="mt-4">
              {s.text}
            </p>
          );
        }
        // list
        return (
          <ul key={i} className="list-disc pl-6 mt-4 space-y-3">
            {s.items.map((item, j) => (
              <li key={j}>
                {item.term ? <strong>{item.term}</strong> : null}
                {item.term ? " — " : null}
                {item.body}
              </li>
            ))}
          </ul>
        );
      })}
    </>
  );
}
