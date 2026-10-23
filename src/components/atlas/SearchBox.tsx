"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./atlas.module.css";
import { ICON_PATHS, TYPE_BY_ID, placeTitle, type Place } from "./types";

export type SearchHit = {
  key: string;
  name: string;
  detail: string;
  lat: number;
  lng: number;
  /** Zoom to land at; ignored when bbox is set. */
  zoom: number;
  bbox?: [number, number, number, number];
  /** Set when the hit is one of Matthew's own pins. */
  placeId?: string;
};

type Props = {
  token: string;
  places: Place[];
  /** Map center, so nearby results rank first. */
  near: () => [number, number] | null;
  onPick: (hit: SearchHit) => void;
};

// How far to zoom in for each kind of Mapbox result.
const ZOOM: Record<string, number> = {
  country: 4,
  region: 6.5,
  postcode: 11,
  district: 8,
  place: 11,
  locality: 12,
  neighborhood: 13,
  street: 15,
  address: 16,
  poi: 14,
};

/** "46.59, -112.04" or "46.59 -112.04" → a coordinate hit. */
function parseCoords(q: string): SearchHit | null {
  const m = q.trim().match(/^(-?\d{1,2}(?:\.\d+)?)\s*[, ]\s*(-?\d{1,3}(?:\.\d+)?)$/);
  if (!m) return null;
  const lat = +m[1];
  const lng = +m[2];
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { key: `ll:${lat},${lng}`, name: `${lat}, ${lng}`, detail: "Coordinates", lat, lng, zoom: 14 };
}

/**
 * Location search in the top bar, like Google Maps: type a town, peak, lake, trailhead,
 * address or coordinates and the map flies there. Your own pins match first.
 */
export function SearchBox({ token, places, near, onPick }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  // "/" opens search from anywhere on the map, like most map apps.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !open && !/input|textarea|select/i.test(t.tagName)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) input.current?.focus();
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [open]);

  // Results: coordinates, then your own pins, then Mapbox places. Debounced as you type.
  useEffect(() => {
    const text = q.trim();
    if (text.length < 2) {
      setHits([]);
      return;
    }
    const lower = text.toLowerCase();
    const mine: SearchHit[] = places
      .filter((p) => placeTitle(p).toLowerCase().includes(lower))
      .slice(0, 4)
      .map((p) => ({
        key: `p:${p.id}`,
        name: placeTitle(p),
        detail: [TYPE_BY_ID[p.type]?.one, p.region].filter(Boolean).join(" · "),
        lat: p.lat,
        lng: p.lng,
        zoom: 13,
        placeId: p.id,
      }));
    const coords = parseCoords(text);
    setHits([...(coords ? [coords] : []), ...mine]);
    setActive(0);
    if (coords) return;

    const ctrl = new AbortController();
    const t = window.setTimeout(async () => {
      setBusy(true);
      try {
        const c = near();
        const url =
          "https://api.mapbox.com/search/searchbox/v1/forward?" +
          new URLSearchParams({
            q: text,
            limit: "6",
            language: "en",
            ...(c ? { proximity: `${c[0]},${c[1]}` } : {}),
            access_token: token,
          });
        const res = await fetch(url, { signal: ctrl.signal });
        const json = (await res.json()) as {
          features?: {
            geometry: { coordinates: [number, number] };
            properties: {
              mapbox_id: string;
              name: string;
              place_formatted?: string;
              full_address?: string;
              feature_type: string;
              bbox?: [number, number, number, number];
            };
          }[];
        };
        const found: SearchHit[] = (json.features ?? []).map((f) => ({
          key: f.properties.mapbox_id,
          name: f.properties.name,
          detail: f.properties.place_formatted ?? f.properties.full_address ?? "",
          lng: f.geometry.coordinates[0],
          lat: f.geometry.coordinates[1],
          zoom: ZOOM[f.properties.feature_type] ?? 13,
          bbox: f.properties.feature_type === "poi" ? undefined : f.properties.bbox,
        }));
        setHits([...mine, ...found]);
      } catch {
        // Typing again cancels the last request; a network hiccup just leaves your pins.
      } finally {
        setBusy(false);
      }
    }, 250);
    return () => {
      window.clearTimeout(t);
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, places, token]);

  function pick(hit: SearchHit | undefined) {
    if (!hit) return;
    onPick(hit);
    setOpen(false);
  }

  return (
    <div className={styles.search} ref={wrap}>
      <button
        type="button"
        className={styles.moreBtn}
        aria-expanded={open}
        aria-label="Search for a place"
        title="Search (press /)"
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true">
          <path d="M10.5 4a6.5 6.5 0 1 1 0 13a6.5 6.5 0 1 1 0-13z M15.5 15.5 20 20" />
        </svg>
      </button>
      {open && (
        <div className={styles.searchPanel} role="search">
          <div className={styles.searchField}>
            <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden="true">
              <path d="M10.5 4a6.5 6.5 0 1 1 0 13a6.5 6.5 0 1 1 0-13z M15.5 15.5 20 20" />
            </svg>
            <input
              ref={input}
              type="search"
              value={q}
              placeholder="Town, peak, lake, trailhead, address…"
              aria-label="Search for a place"
              aria-controls="atlas-search-results"
              aria-activedescendant={hits[active] ? `sr-${active}` : undefined}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActive((i) => Math.min(hits.length - 1, i + 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((i) => Math.max(0, i - 1));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  pick(hits[active]);
                } else if (e.key === "Escape") {
                  setOpen(false);
                }
              }}
            />
            {busy && <span className={styles.searchSpin} aria-hidden="true" />}
          </div>
          {hits.length > 0 ? (
            <ul id="atlas-search-results" className={styles.searchResults} role="listbox">
              {hits.map((h, i) => {
                const own = h.placeId ? places.find((p) => p.id === h.placeId) : undefined;
                return (
                  <li key={h.key} id={`sr-${i}`} role="option" aria-selected={i === active}>
                    <button type="button" onMouseEnter={() => setActive(i)} onClick={() => pick(h)}>
                      <i style={own ? { background: TYPE_BY_ID[own.type]?.color } : undefined} data-own={own ? "" : undefined}>
                        <svg viewBox="0 0 24 24" width={12} height={12} aria-hidden="true">
                          <path d={own ? ICON_PATHS[own.type] : "M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z M12 7.5a2.5 2.5 0 1 1 0 5a2.5 2.5 0 1 1 0-5z"} />
                        </svg>
                      </i>
                      <span>
                        {h.name}
                        {h.detail && <small>{h.detail}</small>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            q.trim().length >= 2 && !busy && <p className={styles.searchEmpty}>No matches.</p>
          )}
        </div>
      )}
    </div>
  );
}
