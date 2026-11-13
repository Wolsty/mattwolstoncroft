"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FamilyData, PublicContributions } from "@/lib/family/types";
import { relationship, relationshipPath } from "@/lib/family/kinship";
import { shortName } from "@/lib/family/format";
import { Ctx, store, type ContributeOpts, type FamilyCtx, type PhotoItem, type Sent } from "./context";
import { Header } from "./Header";
import { TreeGrid } from "./TreeGrid";
import { PersonPanel } from "./PersonPanel";
import { Relatives } from "./Relatives";
import { Gaps } from "./Gaps";
import { Sources } from "./Sources";
import { ContributeDialog } from "./ContributeDialog";
import { Lightbox } from "./Lightbox";
import { FamilyFooter } from "./FamilyFooter";
import styles from "./family.module.css";

const VIEWER_KEY = "family-viewer"; // person id, or "guest"
const SENT_KEY = "family-sent";
const WIDE = "(min-width: 1200px)";

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export function FamilyTree({ data, initial }: { data: FamilyData; initial: PublicContributions }) {
  const people = data.people;
  const home = data.meta.home;

  const [selected, setSelected] = useState(home);
  const [viewer, setViewerState] = useState<string | null>(null);
  const [viewerKnown, setViewerKnown] = useState(true); // false until we know they haven't chosen
  const [contrib, setContrib] = useState(initial);
  const [owner, setOwner] = useState(false);
  const [sent, setSent] = useState<Sent[]>([]);
  const [contribute, setContribute] = useState<ContributeOpts | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [photos, setPhotos] = useState<{ items: PhotoItem[]; index: number } | null>(null);
  const wide = useRef(true);

  // First load: who's looking, what they've sent, and which person the link points at.
  useEffect(() => {
    const mq = window.matchMedia(WIDE);
    wide.current = mq.matches;
    const onMq = () => (wide.current = mq.matches);
    mq.addEventListener("change", onMq);

    const saved = store.get<string | null>(VIEWER_KEY, null);
    if (saved === "guest") setViewerState(null);
    else if (saved && people[saved]) setViewerState(saved);
    setViewerKnown(Boolean(saved));
    setSent(store.get<Sent[]>(SENT_KEY, []));

    const fromHash = decodeURIComponent(window.location.hash.slice(1));
    if (fromHash && people[fromHash]) {
      setSelected(fromHash);
      if (!mq.matches) setSheetOpen(true);
      requestAnimationFrame(() => document.getElementById(`card-${fromHash}`)?.scrollIntoView({ block: "center" }));
    } else if (saved && saved !== "guest" && people[saved]) {
      setSelected(saved);
    }

    const onHash = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (id && people[id]) setSelected(id);
    };
    window.addEventListener("hashchange", onHash);

    // Fresh contributions (the page copy can be up to an hour old), and whether this is Matthew.
    fetch("/api/family/contributions", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!j) return;
        setOwner(Boolean(j.owner));
        const items = j.owner ? j.items.filter((c: { status: string }) => c.status === "approved") : j.items;
        setContrib({ items, portraits: j.portraits ?? {}, resolved: j.resolved ?? [] });
      })
      .catch(() => {});

    return () => {
      mq.removeEventListener("change", onMq);
      window.removeEventListener("hashchange", onHash);
    };
  }, [people]);

  // Once something the sender sent is approved, it shows up for real: drop the local copy.
  useEffect(() => {
    const live = new Set(contrib.items.map((c) => c.id));
    setSent((s) => {
      const next = s.filter((x) => !live.has(x.id));
      if (next.length !== s.length) store.set(SENT_KEY, next);
      return next;
    });
  }, [contrib.items]);

  // While the sheet is open on a phone or tablet, the page behind it shouldn't scroll.
  useEffect(() => {
    if (!sheetOpen || wide.current) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sheetOpen]);

  const select = useCallback<FamilyCtx["select"]>((id, opts) => {
    if (!people[id]) return;
    setSelected(id);
    if (decodeURIComponent(window.location.hash.slice(1)) !== id) history.pushState(null, "", `#${id}`);
    if (!wide.current) {
      if (!opts?.quiet) setSheetOpen(true);
    } else if (opts?.scroll) document.getElementById(`card-${id}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [people]);

  const setViewer = useCallback((id: string | null) => {
    setViewerState(id);
    setViewerKnown(true);
    store.set(VIEWER_KEY, id ?? "guest");
  }, []);

  const relLabel = useCallback(
    (id: string): string | null => {
      const p = people[id];
      if (!p) return null;
      if (viewer === home) return p.rel;
      if (viewer === null) return id === home ? null : `Matthew's ${lowerFirst(p.rel)}`;
      const blood = relationship(people, viewer, id);
      if (blood) return blood;
      // Not related by blood: say who connects them, from the far side of the marriage ("Rod's father").
      const path = relationshipPath(people, viewer, id);
      if (!path) return null;
      const isBlood = (r: string | null) => Boolean(r) && !/marriage|in-law|step|husband|wife/i.test(r!);
      for (const step of path.slice(1, -1)) {
        const r = relationship(people, step.id, id);
        if (isBlood(r)) return `${shortName(people[step.id])}\u2019s ${lowerFirst(r!)}`;
      }
      return "Related by marriage";
    },
    [people, viewer, home],
  );

  const pathIds = useMemo(() => {
    const path = relationshipPath(people, viewer ?? home, selected);
    return new Set(path?.map((s) => s.id) ?? []);
  }, [people, viewer, home, selected]);

  const ctx: FamilyCtx = useMemo(
    () => ({
      data,
      people,
      viewer,
      setViewer,
      selected,
      select,
      pathIds,
      relLabel,
      portraitOf: (id) => contrib.portraits[id] ?? people[id]?.photo,
      itemsFor: (id) => contrib.items.filter((c) => c.personId === id && !c.questionId),
      answersFor: (qid) => contrib.items.filter((c) => c.questionId === qid),
      sentFor: (id) => sent.filter((s) => s.personId === id),
      resolved: new Set(contrib.resolved),
      owner,
      openContribute: setContribute,
      openPhotos: (items, index) => setPhotos({ items, index }),
      setPortrait: async (personId, url) => {
        const res = await fetch("/api/family/contributions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "portrait", personId, url }),
        });
        if (!res.ok) return;
        setContrib((c) => {
          const portraits = { ...c.portraits };
          if (url) portraits[personId] = url;
          else delete portraits[personId];
          return { ...c, portraits };
        });
      },
    }),
    [data, people, viewer, setViewer, selected, select, pathIds, relLabel, contrib, sent, owner],
  );

  const onSent = (s: Sent, approved: boolean) => {
    if (approved) {
      // Matthew's own additions go live at once: refetch.
      fetch("/api/family/contributions", { cache: "no-store" })
        .then((r) => r.json())
        .then((j) => setContrib({ items: j.items.filter((c: { status: string }) => c.status === "approved"), portraits: j.portraits, resolved: j.resolved }))
        .catch(() => {});
      return;
    }
    setSent((prev) => {
      const next = [s, ...prev];
      store.set(SENT_KEY, next);
      return next;
    });
  };

  return (
    <Ctx.Provider value={ctx}>
      <div className={styles.page}>
        <Header viewerKnown={viewerKnown} />
        <div className={styles.workspace}>
          <section className={styles.treeCol} aria-label="Family tree">
            <TreeGrid />
            <Relatives />
            <Gaps />
            <Sources />
          </section>
          <aside
            className={`${styles.panelCol} ${sheetOpen ? styles.sheetOpen : ""}`}
            aria-label="Person details"
          >
            <div className={styles.sheetBackdrop} onClick={() => setSheetOpen(false)} aria-hidden />
            <PersonPanel onClose={() => setSheetOpen(false)} />
          </aside>
        </div>
        <FamilyFooter />
      </div>
      {contribute && <ContributeDialog opts={contribute} onClose={() => setContribute(null)} onSent={onSent} />}
      {photos && <Lightbox items={photos.items} index={photos.index} onClose={() => setPhotos(null)} />}
    </Ctx.Provider>
  );
}
