"use client";

import { useEffect, useRef, useState } from "react";
import { LINE_NAME, useFamily, type PhotoItem } from "./context";
import { Avatar } from "./PersonCard";
import { confidence, firstName, initials, years } from "@/lib/family/format";
import { familyOf, relationshipPath } from "@/lib/family/kinship";
import type { Contribution } from "@/lib/family/types";
import styles from "./family.module.css";

const month = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });

/** Everything known about the selected person. Sticky beside the tree on wide screens, a sheet elsewhere. */
export function PersonPanel({ onClose }: { onClose: () => void }) {
  const f = useFamily();
  const { people, selected: id, viewer, data } = f;
  const p = people[id];
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!p) return null;

  const rel = f.relLabel(id);
  const conf = confidence(p);
  const items = f.itemsFor(id);
  const sent = f.sentFor(id);
  const fam = familyOf(people, id);
  const viewerId = viewer ?? data.meta.home;
  const path = relationshipPath(people, viewerId, id);
  const questions = data.questions.filter((q) => q.people.includes(id) && !f.resolved.has(q.id));
  const sources = data.sources.filter((s) => s.people?.includes(id));
  const name = firstName(p);

  const allPhotos: PhotoItem[] = items.flatMap((c) =>
    c.photos.map((url) => ({ url, caption: c.text, by: byline(c), personId: id })),
  );
  const portrait = f.portraitOf(id) ?? allPhotos[0]?.url;

  return (
    <div className={styles.panel} data-line={p.line}>
      <div className={styles.panelScroll} ref={scroller}>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className={styles.portrait}>
          {portrait ? (
            <button
              type="button"
              className={styles.portraitImg}
              onClick={() => f.openPhotos(allPhotos.length ? allPhotos : [{ url: portrait, personId: id }], Math.max(0, allPhotos.findIndex((x) => x.url === portrait)))}
              aria-label={`See photos of ${p.n}`}
            >
              <img src={portrait} alt={p.n} />
              {allPhotos.length > 1 && <span className={styles.photoCount}>{allPhotos.length} photos</span>}
            </button>
          ) : (
            <div className={styles.portraitEmpty}>
              <span className={styles.monogram} aria-hidden>
                {initials(p)}
              </span>
              <button type="button" className={styles.textButton} onClick={() => f.openContribute({ kind: "photo", personId: id })}>
                Have a photo of {name}?
              </button>
            </div>
          )}
        </div>
        {portrait && (
          <button type="button" className={`${styles.textButton} ${styles.addPhoto}`} onClick={() => f.openContribute({ kind: "photo", personId: id })}>
            Add a photo
          </button>
        )}

        <p className={styles.eyebrow}>
          <span className={styles.dot} aria-hidden />
          {LINE_NAME[p.line]} line{rel ? ` · ${rel}` : ""}
        </p>
        <h2 className={styles.panelName}>{p.n}</h2>
        {p.maiden && <p className={styles.panelMaiden}>née {p.maiden}</p>}
        <p className={styles.panelYears}>{years(p)}</p>

        <p className={styles.confidence} data-tone={conf.tone}>
          {conf.text}
        </p>

        {!p.living && (p.b || p.bp || p.d || p.dp) && (
          <dl className={styles.vitals}>
            {(p.b || p.bp) && (
              <div>
                <dt className="meta">Born</dt>
                <dd>{[p.b, p.bp].filter(Boolean).join(" · ")}</dd>
              </div>
            )}
            {(p.d || p.dp) && (
              <div>
                <dt className="meta">Died</dt>
                <dd>{[p.d, p.dp].filter(Boolean).join(" · ")}</dd>
              </div>
            )}
          </dl>
        )}

        {path && path.length > 1 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{viewer === null ? "How they connect to Matthew" : "How you’re related"}</h3>
            <ol className={styles.path}>
              {path.map((s, i) => (
                <li key={s.id}>
                  {i === 0 ? (
                    <span className={styles.pathYou}>{viewer === null ? "Matthew" : "You"}</span>
                  ) : (
                    <button type="button" className={styles.pathStep} onClick={() => f.select(s.id, { scroll: true })} data-current={s.id === id || undefined}>
                      <span className={styles.pathName}>{firstName(people[s.id])}</span>
                      <span className={styles.pathLabel}>{s.label}</span>
                    </button>
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}

        {p.facts && p.facts.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>What we know</h3>
            <ul className={styles.facts}>
              {p.facts.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>
          </section>
        )}

        {(items.length > 0 || sent.length > 0 || !p.living) && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Memories from family</h3>
            {items.length === 0 && sent.length === 0 && (
              <p className={styles.emptyNote}>
                Nothing shared yet. A story, a saying, a photo, the smell of the kitchen: it all helps.
              </p>
            )}
            <ul className={styles.memories}>
              {sent.map((s) => (
                <li key={s.id} className={`${styles.memory} ${styles.memoryPending}`}>
                  <p className="meta">Waiting for Matthew to review</p>
                  {s.text && <p className={styles.memoryText}>{s.text}</p>}
                  {s.photos.length > 0 && <Thumbs urls={s.photos} />}
                </li>
              ))}
              {items.map((c) => (
                <Memory key={c.id} c={c} onPhoto={(url) => f.openPhotos(allPhotos, allPhotos.findIndex((x) => x.url === url))} />
              ))}
            </ul>
          </section>
        )}

        {questions.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Still a mystery</h3>
            <ul className={styles.panelQuestions}>
              {questions.map((q) => (
                <li key={q.id}>
                  <p>{q.q}</p>
                  <button type="button" className={styles.textButton} onClick={() => f.openContribute({ kind: "answer", questionId: q.id, personId: id })}>
                    I know something →
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Family</h3>
          <FamilyGroup title="Parents" ids={fam.parents} />
          <FamilyGroup title={p.sex === "m" ? "Wife" : "Husband"} ids={fam.spouse ? [fam.spouse] : []} />
          <FamilyGroup title="Siblings" ids={fam.siblings} />
          <FamilyGroup title="Children" ids={fam.children} />
          <FamilyGroup title="Also connected" ids={fam.other} />
          {fam.parents.length === 0 && (
            <button type="button" className={styles.textButton} onClick={() => f.openContribute({ kind: "person", personId: id })}>
              Know {name}&rsquo;s parents?
            </button>
          )}
        </section>

        {sources.length > 0 && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Records</h3>
            <ul className={styles.panelSources}>
              {sources.map((s) => (
                <li key={s.url}>
                  <a className="link-underline" href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <CopyLink id={id} name={name} />
      </div>

      <div className={styles.panelActions}>
        {!p.living && (
          <button type="button" className={styles.primary} onClick={() => f.openContribute({ kind: "memory", personId: id })}>
            Add a memory<span className={styles.wideOnly}>&nbsp;or photo</span>
          </button>
        )}
        <button type="button" className={`${styles.textButton} ${styles.fixLink}`} onClick={() => f.openContribute({ kind: "correction", personId: id })}>
          Something wrong?
        </button>
      </div>
    </div>
  );
}

function byline(c: Contribution) {
  return `${c.by}${c.byRelation ? `, ${c.byRelation.toLowerCase()}` : ""}`;
}

function Memory({ c, onPhoto }: { c: Contribution; onPhoto: (url: string) => void }) {
  return (
    <li className={styles.memory}>
      {c.kind === "correction" && <p className="meta">Correction</p>}
      {c.text && <p className={styles.memoryText}>{c.text}</p>}
      {c.photos.length > 0 && <Thumbs urls={c.photos} onOpen={onPhoto} />}
      <p className={styles.memoryBy}>
        {byline(c)} · {month(c.createdAt)}
      </p>
    </li>
  );
}

function Thumbs({ urls, onOpen }: { urls: string[]; onOpen?: (url: string) => void }) {
  return (
    <div className={styles.thumbs}>
      {urls.map((u) =>
        onOpen ? (
          <button key={u} type="button" className={styles.thumb} onClick={() => onOpen(u)} aria-label="Open photo">
            <img src={u} alt="" loading="lazy" />
          </button>
        ) : (
          <span key={u} className={styles.thumb}>
            <img src={u} alt="" loading="lazy" />
          </span>
        ),
      )}
    </div>
  );
}

function FamilyGroup({ title, ids }: { title: string; ids: string[] }) {
  const { people, select, relLabel } = useFamily();
  if (!ids.length) return null;
  return (
    <div className={styles.famGroup}>
      <p className="meta">{title}</p>
      <ul className={styles.chips}>
        {ids.map((id) => (
          <li key={id}>
            <button type="button" className={styles.chip} data-line={people[id].line} onClick={() => select(id, { scroll: true })}>
              <Avatar id={id} size={24} />
              <span>
                <span className={styles.chipName}>{people[id].n}</span>
                <span className={styles.chipMeta}>
                  {years(people[id])}
                  {relLabel(id) ? ` · ${relLabel(id)}` : ""}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Family share people by texting a link: make that one tap. */
function CopyLink({ id, name }: { id: string; name: string }) {
  const [done, setDone] = useState(false);
  useEffect(() => setDone(false), [id]);
  const copy = async () => {
    const url = `${window.location.origin}/family#${id}`;
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title: `${name} · family tree`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setDone(true);
    } catch {
      /* share sheet dismissed */
    }
  };
  return (
    <p className={styles.copyLink}>
      <button type="button" className={`${styles.textButton} link-underline`} onClick={copy}>
        {done ? "Link copied" : `Share a link to ${name}`}
      </button>
    </p>
  );
}
