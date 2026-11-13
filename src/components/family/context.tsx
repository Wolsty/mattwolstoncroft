"use client";

import { createContext, useContext } from "react";
import type { Contribution, ContributionKind, FamilyData, Person } from "@/lib/family/types";

export type ContributeOpts = {
  kind: ContributionKind;
  personId?: string;
  questionId?: string;
};

/** A contribution this browser sent, kept locally so the sender sees it while it waits for review. */
export type Sent = {
  id: string;
  kind: ContributionKind;
  personId?: string;
  questionId?: string;
  text: string;
  photos: string[];
  createdAt: string;
};

export type PhotoItem = { url: string; caption?: string; by?: string; personId?: string };

export type FamilyCtx = {
  data: FamilyData;
  people: Record<string, Person>;
  /** Who is looking. null = hasn't said, or isn't on the tree: relationships are then shown to Matthew. */
  viewer: string | null;
  setViewer: (id: string | null) => void;
  selected: string;
  select: (id: string, opts?: { scroll?: boolean; quiet?: boolean }) => void;
  /** People on the line from the viewer to the selected person, for highlighting. */
  pathIds: Set<string>;
  relLabel: (id: string) => string | null;
  portraitOf: (id: string) => string | undefined;
  itemsFor: (id: string) => Contribution[];
  answersFor: (questionId: string) => Contribution[];
  sentFor: (id: string) => Sent[];
  resolved: Set<string>;
  owner: boolean;
  openContribute: (opts: ContributeOpts) => void;
  openPhotos: (items: PhotoItem[], index: number) => void;
  setPortrait: (personId: string, url: string | null) => Promise<void>;
};

export const Ctx = createContext<FamilyCtx | null>(null);

export function useFamily() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useFamily outside FamilyTree");
  return v;
}

export const LINE_NAME: Record<string, string> = {
  wol: "Wolstoncroft",
  nag: "Nagy",
  spe: "Specht",
  mor: "Mortelette",
};

/** Local storage that never throws (private browsing, old Safari). */
export const store = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* not available: the session still works, it just won't be remembered */
    }
  },
};
