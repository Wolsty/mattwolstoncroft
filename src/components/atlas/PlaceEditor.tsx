"use client";

import { useRef, useState } from "react";
import styles from "./atlas.module.css";
import { ICON_PATHS, TYPES, formatLatLng, type Place } from "./types";

type Props = {
  draft: Place;
  isNew: boolean;
  onChange: (p: Place) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onMovePin: () => void;
  moving: boolean;
  saving: boolean;
  error: string;
};

const LONG_EDGE = 2000;

/** Shrink a photo in the browser before upload: faster, and keeps storage small. */
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

export function PlaceEditor({ draft, isNew, onChange, onSave, onCancel, onDelete, onMovePin, moving, saving, error }: Props) {
  const [uploading, setUploading] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<Place>) => onChange({ ...draft, ...patch });

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    setUploadError("");
    const list = Array.from(files);
    setUploading(list.length);
    const urls: string[] = [];
    let failed = 0;
    for (const f of list) {
      try {
        const body = new FormData();
        body.append("file", await shrink(f), "photo.jpg");
        body.append("placeId", draft.id);
        const res = await fetch("/api/atlas/upload", { method: "POST", body });
        const json = (await res.json()) as { url?: string; error?: string };
        if (!res.ok || !json.url) throw new Error(json.error || "upload");
        urls.push(json.url);
      } catch {
        failed++;
      }
      setUploading((n) => n - 1);
    }
    if (urls.length) onChange({ ...draft, photos: [...draft.photos, ...urls] });
    if (failed) setUploadError(`${failed} photo${failed > 1 ? "s" : ""} didn't upload. JPEG and PNG work best.`);
    if (fileRef.current) fileRef.current.value = "";
  }

  const move = (i: number, to: number) => {
    const p = [...draft.photos];
    const [x] = p.splice(i, 1);
    p.splice(to, 0, x);
    set({ photos: p });
  };

  return (
    <form
      className={styles.editor}
      onSubmit={(e) => {
        e.preventDefault();
        if (!saving && !uploading) onSave();
      }}
    >
      <span className={styles.tag} style={{ color: "var(--a-muted)" }}>
        {isNew ? "New place" : "Editing"}
      </span>

      <label className={styles.field}>
        <span>Name</span>
        <input
          id="edit-name"
          value={draft.name}
          placeholder={TYPES.find((t) => t.id === draft.type)?.one}
          onChange={(e) => set({ name: e.target.value })}
          autoFocus={isNew}
        />
      </label>

      <fieldset className={styles.field}>
        <span>Type</span>
        <div className={styles.typePick}>
          {TYPES.map((t) => (
            <label key={t.id} data-on={draft.type === t.id ? "" : undefined}>
              <input type="radio" name="edit-type" value={t.id} checked={draft.type === t.id} onChange={() => set({ type: t.id })} />
              <i style={{ background: t.color }}>
                <svg viewBox="0 0 24 24" width={11} height={11} aria-hidden="true" className={styles.icon}>
                  <path d={ICON_PATHS[t.id]} />
                </svg>
              </i>
              {t.one}
            </label>
          ))}
        </div>
      </fieldset>

      <div className={styles.row2}>
        <label className={styles.field}>
          <span>Date</span>
          <input id="edit-date" type="date" value={draft.date} onChange={(e) => set({ date: e.target.value })} />
        </label>
        <label className={styles.field}>
          <span>Or roughly</span>
          <input id="edit-datetext" value={draft.dateText} placeholder="Summer 2019" onChange={(e) => set({ dateText: e.target.value })} />
        </label>
      </div>

      <label className={styles.field}>
        <span>Story</span>
        <textarea
          id="edit-notes"
          rows={7}
          value={draft.notes}
          placeholder="Who was there, what happened, what you'd tell a friend."
          onChange={(e) => set({ notes: e.target.value })}
        />
      </label>

      <div className={styles.field}>
        <span>Photos</span>
        <div className={styles.photoGrid}>
          {draft.photos.map((src, i) => (
            <div key={src} className={styles.photoTile}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" />
              {i === 0 ? (
                <em>Cover</em>
              ) : (
                <button type="button" className={styles.coverBtn} onClick={() => move(i, 0)} aria-label="Make this the cover photo">
                  Cover
                </button>
              )}
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => set({ photos: draft.photos.filter((u) => u !== src) })}
                aria-label="Remove photo"
              >
                <svg viewBox="0 0 24 24" width={12} height={12} aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
          ))}
          <label className={styles.addPhoto} data-busy={uploading ? "" : undefined}>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={(e) => addPhotos(e.target.files)} />
            {uploading ? `Uploading ${uploading}…` : "+ Add photos"}
          </label>
        </div>
        {uploadError && <p className={styles.formError}>{uploadError}</p>}
      </div>

      <div className={styles.field}>
        <span>Location</span>
        <div className={styles.locRow}>
          <span className={styles.mono}>{formatLatLng(draft.lat, draft.lng)}</span>
          <button type="button" className={styles.ghostBtn} onClick={onMovePin} aria-pressed={moving}>
            {moving ? "Click the map…" : "Move pin"}
          </button>
        </div>
        {draft.region && <p className={styles.hintText}>{draft.region}</p>}
      </div>

      {error && <p className={styles.formError}>{error}</p>}

      <div className={styles.actionsRow}>
        <button type="submit" className={styles.primaryBtn} disabled={saving || uploading > 0}>
          {saving ? "Saving…" : isNew ? "Add place" : "Save"}
        </button>
        <button type="button" className={styles.ghostBtn} onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        {!isNew && (
          <button type="button" className={styles.dangerBtn} onClick={() => setConfirmDelete(true)} disabled={saving}>
            Delete
          </button>
        )}
      </div>

      {confirmDelete && (
        <div className={styles.confirm} role="alert">
          <p>Delete this place and its story? This can&rsquo;t be undone from here.</p>
          <div className={styles.actionsRow}>
            <button type="button" className={styles.dangerSolid} onClick={onDelete} disabled={saving}>
              Delete place
            </button>
            <button type="button" className={styles.ghostBtn} onClick={() => setConfirmDelete(false)}>
              Keep it
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
