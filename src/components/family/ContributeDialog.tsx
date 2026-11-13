"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { store, useFamily, type ContributeOpts, type Sent } from "./context";
import { firstName } from "@/lib/family/format";
import { relationship } from "@/lib/family/kinship";
import styles from "./family.module.css";

const ME_KEY = "family-me";
const LONG_EDGE = 2000;

/** Shrink a photo in the browser before upload: faster on phones, and keeps storage small. */
async function shrink(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
  const s = Math.min(1, LONG_EDGE / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * s);
  canvas.height = Math.round(bmp.height * s);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), "image/jpeg", 0.85),
  );
}

type Upload = { key: string; preview: string; url?: string; error?: string };

export function ContributeDialog({
  opts,
  onClose,
  onSent,
}: {
  opts: ContributeOpts;
  onClose: () => void;
  onSent: (s: Sent, approved: boolean) => void;
}) {
  const { people, data, viewer, owner } = useFamily();
  const person = opts.personId ? people[opts.personId] : undefined;
  const question = opts.questionId ? data.questions.find((q) => q.id === opts.questionId) : undefined;
  const name = person ? firstName(person) : "";

  const me = useRef(store.get<{ by?: string; contact?: string }>(ME_KEY, {}));
  const viewerName = viewer && people[viewer] ? people[viewer].n : "";
  const guessedRelation = viewer && opts.personId && !question ? relationship(people, opts.personId, viewer) : null;

  const [text, setText] = useState("");
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [by, setBy] = useState(me.current.by || viewerName);
  const [relation, setRelation] = useState(guessedRelation && guessedRelation !== "You" ? guessedRelation : "");
  const [contact, setContact] = useState(me.current.contact ?? "");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<null | { approved: boolean }>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const firstField = useRef<HTMLTextAreaElement>(null);

  const kind = opts.kind;
  const title =
    kind === "answer" && question
      ? "What do you know?"
      : kind === "correction"
        ? `Something wrong about ${name || "this"}?`
        : kind === "person"
          ? person && opts.personId !== data.meta.home
            ? `Know ${name}’s family?`
            : "Add someone to the tree"
          : kind === "photo"
            ? `Photos of ${name}`
            : `Add to ${name}’s story`;

  const prompt =
    kind === "answer"
      ? "Whatever you remember, even a guess or a “Dad once said…”"
      : kind === "correction"
        ? "What should change? A date, a place, a spelling…"
        : kind === "person"
          ? "Who are they and how do they fit in? Names, dates, places, whatever you know."
          : kind === "photo"
            ? "Who’s in the photo, and roughly when and where was it taken?"
            : `A story, a habit, a saying, where ${name || "they"} worked, what holidays were like…`;

  const uploading = uploads.some((u) => !u.url && !u.error);
  const dirty = Boolean(text.trim() || uploads.length);

  useEffect(() => {
    if (kind === "photo") fileRef.current?.click();
    else firstField.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !dirty) onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty]);

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    const list = Array.from(files).slice(0, 12 - uploads.length);
    const added: Upload[] = list.map((f) => ({ key: `${f.name}-${f.size}-${Math.random()}`, preview: URL.createObjectURL(f) }));
    setUploads((u) => [...u, ...added]);
    for (let i = 0; i < list.length; i++) {
      const key = added[i].key;
      try {
        const blob = await shrink(list[i]);
        const form = new FormData();
        form.append("file", blob, "photo.jpg");
        const res = await fetch("/api/family/upload", { method: "POST", body: form });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j.error || "Upload failed.");
        setUploads((u) => u.map((x) => (x.key === key ? { ...x, url: j.url } : x)));
      } catch (e) {
        const msg = e instanceof Error && e.message !== "encode" ? e.message : "Couldn’t read this photo. Try a JPEG.";
        setUploads((u) => u.map((x) => (x.key === key ? { ...x, error: msg } : x)));
      }
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (sending || uploading) return;
    const photos = uploads.filter((u) => u.url).map((u) => u.url!);
    if (!text.trim() && !photos.length) return setError("Add a few words or a photo.");
    if (!by.trim()) return setError("Please add your name so Matthew knows who it’s from.");
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/family/contribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          personId: opts.personId,
          questionId: opts.questionId,
          text: text.trim(),
          photos,
          by: by.trim(),
          byRelation: relation.trim() || undefined,
          byPersonId: viewer ?? undefined,
          contact: contact.trim() || undefined,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Couldn’t send. Try again.");
      store.set(ME_KEY, { by: by.trim(), contact: contact.trim() });
      onSent(
        { id: j.id, kind, personId: opts.personId, questionId: opts.questionId, text: text.trim(), photos, createdAt: new Date().toISOString() },
        Boolean(j.approved),
      );
      setDone({ approved: Boolean(j.approved) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn’t send. Try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.dialogBackdrop} role="presentation">
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="contribute-title">
        {done ? (
          <div className={styles.thanks}>
            <h2 id="contribute-title" className={styles.dialogTitle}>
              Thank you{by ? `, ${by.split(" ")[0]}` : ""}.
            </h2>
            <p>
              {done.approved
                ? "It’s on the tree now."
                : "Matthew will take a look and add it to the tree. Until then you’ll see it marked as waiting."}
            </p>
            <div className={styles.dialogActions}>
              <button
                type="button"
                className={styles.secondary}
                onClick={() => {
                  setDone(null);
                  setText("");
                  setUploads([]);
                }}
              >
                Add something else
              </button>
              <button type="button" className={styles.primary} onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <p className="meta">{question ? "Open question" : person ? person.n : "Family tree"}</p>
            <h2 id="contribute-title" className={styles.dialogTitle}>
              {title}
            </h2>
            {question && <p className={styles.dialogQuestion}>{question.q}</p>}

            <label htmlFor="c-text" className={styles.label}>
              {kind === "photo" ? "About these photos" : "Your words"}
            </label>
            <textarea
              id="c-text"
              ref={firstField}
              className={`field ${styles.textarea}`}
              rows={kind === "photo" ? 3 : 6}
              placeholder={prompt}
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={8000}
            />

            <div className={styles.photoField}>
              {uploads.length > 0 && (
                <ul className={styles.uploadList}>
                  {uploads.map((u) => (
                    <li key={u.key} className={styles.upload} data-state={u.error ? "error" : u.url ? "done" : "busy"}>
                      <img src={u.preview} alt="" />
                      {u.error && <span className={styles.uploadError}>{u.error}</span>}
                      <button
                        type="button"
                        aria-label="Remove photo"
                        className={styles.uploadRemove}
                        onClick={() => setUploads((x) => x.filter((y) => y.key !== u.key))}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                multiple
                hidden
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <button type="button" className={styles.secondary} onClick={() => fileRef.current?.click()} disabled={uploads.length >= 12}>
                {uploads.length ? "Add more photos" : "Add photos"}
              </button>
              {uploading && <span className="meta"> Uploading…</span>}
            </div>

            <fieldset className={styles.fromFields}>
              <legend className={styles.label}>From</legend>
              <div className={styles.twoUp}>
                <label>
                  <span className="meta">Your name</span>
                  <input className="field" value={by} onChange={(e) => setBy(e.target.value)} autoComplete="name" maxLength={80} />
                </label>
                <label>
                  <span className="meta">{name && !question ? `How you’re related to ${name}` : "How you’re related"}</span>
                  <input
                    className="field"
                    value={relation}
                    onChange={(e) => setRelation(e.target.value)}
                    placeholder="Granddaughter, neighbor, friend…"
                    maxLength={80}
                  />
                </label>
              </div>
              <label>
                <span className="meta">Email or phone, if Matthew can follow up (optional, only he sees it)</span>
                <input className="field" value={contact} onChange={(e) => setContact(e.target.value)} autoComplete="email" maxLength={200} />
              </label>
            </fieldset>

            {error && (
              <p role="alert" className={styles.formError}>
                {error}
              </p>
            )}
            <div className={styles.dialogActions}>
              <p className={styles.dialogNote}>{owner ? "You’re signed in as Matthew: this goes live right away." : "Matthew reviews everything before it appears on the tree."}</p>
              <button type="button" className={styles.secondary} onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className={styles.primary} disabled={sending || uploading}>
                {sending ? "Sending…" : owner ? "Add to the tree" : "Send to Matthew"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
