"use client";

import { useFamily } from "./context";
import { firstName } from "@/lib/family/format";
import styles from "./family.module.css";

/** Open questions for family. Each one takes an answer in place. */
export function Gaps() {
  const f = useFamily();
  const { data, people } = f;
  const open = data.questions.filter((q) => !f.resolved.has(q.id));
  const done = data.questions.filter((q) => f.resolved.has(q.id));
  return (
    <section className={styles.block} aria-labelledby="gaps-title">
      <h2 id="gaps-title" className={styles.blockTitle}>
        Can you help fill the gaps?
      </h2>
      <p className={styles.blockLede}>
        Some of this lives only in someone&rsquo;s memory. Even a guess or a &ldquo;Dad once said&hellip;&rdquo; helps.
      </p>
      <ol className={styles.gaps}>
        {[...open, ...done].map((q, i) => {
          const answers = f.answersFor(q.id);
          const resolved = f.resolved.has(q.id);
          return (
            <li key={q.id} className={styles.gap} data-resolved={resolved || undefined}>
              <span className={styles.gapNum} aria-hidden>
                {i + 1}
              </span>
              <div className={styles.gapBody}>
                <p className={styles.gapQ}>
                  {q.q}
                  {resolved && <span className={styles.tag}> Answered</span>}
                </p>
                <ul className={styles.gapPeople}>
                  {q.people.map((id) => (
                    <li key={id}>
                      <button type="button" className={`${styles.textButton} link-underline`} onClick={() => f.select(id, { scroll: true })}>
                        {people[id] ? firstName(people[id]) : id}
                      </button>
                    </li>
                  ))}
                </ul>
                {answers.map((a) => (
                  <blockquote key={a.id} className={styles.answer}>
                    <p>{a.text}</p>
                    <footer>
                      {a.by}
                      {a.byRelation ? `, ${a.byRelation.toLowerCase()}` : ""}
                    </footer>
                  </blockquote>
                ))}
                {!resolved && (
                  <button
                    type="button"
                    className={styles.secondary}
                    onClick={() => f.openContribute({ kind: "answer", questionId: q.id, personId: q.people[0] })}
                  >
                    I know something
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
