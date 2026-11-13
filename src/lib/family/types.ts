/** Shape of src/content/family.json. Edit that file to change the tree. */
export type LineKey = "wol" | "nag" | "spe" | "mor";

export type Person = {
  n: string;
  maiden?: string;
  sex: "m" | "f";
  line: LineKey;
  /** Relationship to Matthew, as curated. Used when viewing as Matthew. */
  rel: string;
  b?: string;
  bp?: string;
  d?: string;
  dp?: string;
  living?: boolean;
  imm?: boolean;
  likely?: boolean;
  parents?: string[];
  spouse?: string;
  facts?: string[];
  links?: string[];
};

export type Line = { key: LineKey; title: string; sub: string; gens: string[][][] };
export type Group = { t: string; note?: string; ids: string[] };
export type Question = { id: string; q: string; people: string[] };
export type Source = { label: string; url: string; people?: string[] };

export type FamilyData = {
  meta: { title: string; intro: string; home: string; compiled: string };
  origins: { place: string; detail: string; line: LineKey; person: string }[];
  story: Record<LineKey | "meet", string>;
  people: Record<string, Person>;
  lines: Line[];
  groups: Group[];
  questions: Question[];
  sources: Source[];
};

/** Something a family member sent in. Shown on the tree once Matthew approves it. */
export type ContributionKind = "memory" | "photo" | "correction" | "answer" | "person";

export type Contribution = {
  id: string;
  kind: ContributionKind;
  personId?: string;
  questionId?: string;
  text: string;
  photos: string[];
  /** Who sent it, and how they said they're related. */
  by: string;
  byRelation?: string;
  byPersonId?: string;
  contact?: string;
  createdAt: string;
};

export type Status = "pending" | "approved" | "hidden";

export type Moderation = {
  version: 1;
  updatedAt: string;
  status: Record<string, Status>;
  /** Approved photo chosen as a person's portrait. */
  portraits: Record<string, string>;
  /** Open questions Matthew has marked answered. */
  resolved: string[];
};

/** What the page receives: approved contributions only, plus portraits and resolved questions. */
export type PublicContributions = {
  items: Contribution[];
  portraits: Record<string, string>;
  resolved: string[];
};
