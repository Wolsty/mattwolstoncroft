"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import styles from "./atlas.module.css";
import { PlaceEditor } from "./PlaceEditor";
import {
  ICON_PATHS,
  ROUTE_COLORS,
  ROUTE_KIND_LABEL,
  TYPES,
  decodePolyline,
  TYPE_BY_ID,
  formatLatLng,
  placeTitle,
  placeWhen,
  type Place,
  type PlaceType,
  type Route,
} from "./types";
import {
  BASE_LABELS,
  BASE_NOTES,
  BASE_STYLES,
  addDataLayers,
  addTopoLayers,
  UNGROUPED,
  placesGeoJSON,
  routesGeoJSON,
  type BaseStyle,
} from "./mapLayers";

const MORE_BASES: BaseStyle[] = ["hybrid", "outdoors", "dark", "night"];
const PIN_LAYERS = ["atlas-fresh-ring", "atlas-clusters", "atlas-cluster-count", "atlas-pins", "atlas-pins-kimbo", "atlas-pin-selected"];

// ---- timeline helpers: dates as whole days since 1970 ----
const DAY = 86_400_000;
const dayOf = (iso: string) => Math.floor(Date.parse(iso.slice(0, 10)) / DAY);
const isoOf = (d: number) => new Date(d * DAY).toISOString().slice(0, 10);
const monthLabel = (d: number) =>
  new Date(d * DAY).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
const PLAY_SECONDS = 30; // the whole history plays in about this long
const TICK_MS = 80;
const FRESH_DAYS = 120; // how long a newly reached place keeps its ring
const FRESH_ROUTE_DAYS = 30;


type Selection = { kind: "place" | "route"; id: string } | null;

function Icon({ type, size = 12 }: { type: PlaceType; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className={styles.icon}>
      <path d={ICON_PATHS[type]} />
    </svg>
  );
}

export function AtlasMap({ token }: { token?: string }) {
  const TOKEN = token;
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [hidden, setHidden] = useState<Set<PlaceType>>(new Set());
  const [showRoutes, setShowRoutes] = useState(true); // saved GPS tracks
  const [showStrava, setShowStrava] = useState(true); // live Strava activities
  const [base, setBase] = useState<BaseStyle>("topo");
  const [heat, setHeat] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [stravaOpen, setStravaOpen] = useState(false);
  const [stravaShown, setStravaShown] = useState(40);
  const menuRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<Selection>(null);
  const [photo, setPhoto] = useState(0);
  const [viewer, setViewer] = useState<{ photos: string[]; title: string } | null>(null);
  const [loadError, setLoadError] = useState(false);
  // Editing (only for Matthew, behind the edit password)
  const [canEdit, setCanEdit] = useState(false);
  const [storeReady, setStoreReady] = useState(false);
  const [draft, setDraft] = useState<Place | null>(null);
  const [draftIsNew, setDraftIsNew] = useState(false);
  const [placing, setPlacing] = useState<"new" | "move" | null>(null);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [editLoginOpen, setEditLoginOpen] = useState(false);
  const [editPw, setEditPw] = useState("");
  const [editPwError, setEditPwError] = useState("");
  const [editRequested, setEditRequested] = useState(false);
  const pickRef = useRef<(lat: number, lng: number) => void>(() => {});
  // Timeline: the map as it was on `cutoff` (a day number)
  const [timeline, setTimeline] = useState(false);
  const [cutoff, setCutoff] = useState(0);
  const [playing, setPlaying] = useState(false);

  // Latest values for map event handlers, which are bound once.
  const latest = useRef({ places, routes, hidden, showRoutes, showStrava, selected, base, heat, placing, timeline, cutoff });
  latest.current = { places, routes, hidden, showRoutes, showStrava, selected, base, heat, placing, timeline, cutoff };

  // First and last day the timeline covers: the earliest dated place or route, through today.
  const span = useMemo(() => {
    const days = [...places.map((p) => p.date), ...routes.map((r) => r.date)].filter(Boolean).map((d) => dayOf(d!));
    const end = Math.floor(Date.now() / DAY);
    return { start: days.length ? Math.min(...days) - 15 : end - 365, end };
  }, [places, routes]);
  const cutIso = isoOf(cutoff);
  const reached = useCallback((date?: string) => Boolean(date) && date!.slice(0, 10) <= cutIso, [cutIso]);
  const timedPlaces = useMemo(() => (timeline ? places.filter((p) => reached(p.date)) : places), [timeline, places, reached]);
  const timedRoutes = useMemo(() => (timeline ? routes.filter((r) => reached(r.date)) : routes), [timeline, routes, reached]);

  const visible = useMemo(() => timedPlaces.filter((p) => !hidden.has(p.type)), [timedPlaces, hidden]);
  const selectedPlace = selected?.kind === "place" ? places.find((p) => p.id === selected.id) ?? null : null;
  const selectedRoute = selected?.kind === "route" ? routes.find((r) => r.id === selected.id) ?? null : null;

  // ---- data ----
  useEffect(() => {
    Promise.all([
      loadPlaces(),
      fetch("/atlas-data/routes.json").then((r) => r.json() as Promise<Route[]>),
    ])
      .then(([p, r]) => {
        setPlaces(p);
        setRoutes(r);
        loadStrava(r);
        const id = decodeURIComponent(window.location.hash.slice(1));
        if (id && p.some((x) => x.id === id)) setSelected({ kind: "place", id });
      })
      .catch(() => setLoadError(true));
  }, []);

  // Places come from the API (shipped places + edits made on the site). If that fails, the
  // shipped file alone still draws the map.
  async function loadPlaces(): Promise<Place[]> {
    setEditRequested(new URLSearchParams(window.location.search).has("edit"));
    try {
      const res = await fetch("/api/atlas/places", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const json = (await res.json()) as { places: Place[]; canEdit: boolean; storeReady: boolean };
      setCanEdit(json.canEdit);
      setStoreReady(json.storeReady);
      return json.places;
    } catch {
      return fetch("/atlas-data/places.json").then((r) => r.json() as Promise<Place[]>);
    }
  }

  // Strava activities arrive separately so the map never waits on them.
  function loadStrava(saved: Route[]) {
    fetch("/api/strava/routes")
      .then((res) => (res.ok ? (res.json() as Promise<{ routes: Route[] }>) : { routes: [] }))
      .then(({ routes: live }) => {
        if (!live.length) return;
        const decoded = live.map((x) => ({ ...x, coords: x.polyline ? decodePolyline(x.polyline) : x.coords }));
        // A saved GPS track that is also on Strava (same day, starts nearby) is shown once, from Strava.
        const near = (a: [number, number], b: [number, number]) =>
          Math.abs(a[0] - b[0]) < 0.03 && Math.abs(a[1] - b[1]) < 0.02;
        const keep = saved.filter(
          (s) => !(s.date && decoded.some((d) => d.date === s.date && d.coords[0] && s.coords[0] && near(d.coords[0], s.coords[0]))),
        );
        setRoutes([...keep, ...decoded]);
      })
      .catch(() => {});
  }

  // ---- map setup (once data is in) ----
  useEffect(() => {
    if (!TOKEN || !container.current || !places.length || mapRef.current) return;
    mapboxgl.accessToken = TOKEN;
    const map = new mapboxgl.Map({
      container: container.current,
      style: BASE_STYLES.topo,
      center: [-111, 43],
      zoom: 3.6,
      projection: "globe",
      attributionControl: true,
      cooperativeGestures: false,
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "bottom-right");
    map.addControl(new mapboxgl.ScaleControl({ unit: "imperial", maxWidth: 110 }), "bottom-left");

    let firstLoad = true;
    map.on("style.load", () => {
      const { places: ps, routes: rs, hidden: hd, selected: sel, base: bs } = latest.current;
      addTopoLayers(map, bs);
      const selPlace = sel?.kind === "place" ? ps.find((p) => p.id === sel.id) ?? null : null;
      addDataLayers(map, ps.filter((p) => !hd.has(p.type)), rs, selPlace);
      syncRoutes(map);
      syncHeat(map);
      if (firstLoad) {
        firstLoad = false;
        if (selPlace) flyToPlace(map, selPlace);
        else fitTo(map, ps.map((p) => [p.lng, p.lat]));
      }
    });

    const pointer = () => (map.getCanvas().style.cursor = "pointer");
    const unpointer = () => (map.getCanvas().style.cursor = "");
    const hover = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 16, className: styles.hover });
    for (const layer of ["atlas-pins", "atlas-pins-kimbo", "atlas-clusters", "atlas-routes-hit"]) {
      map.on("mouseenter", layer, pointer);
      map.on("mouseleave", layer, () => {
        unpointer();
        hover.remove();
      });
    }
    map.on("mousemove", ["atlas-pins", "atlas-pins-kimbo"], (e) => {
      const f = e.features?.[0];
      if (!f) return;
      const p = latest.current.places.find((x) => x.id === f.properties?.id);
      if (p) hover.setLngLat(e.lngLat).setText(placeTitle(p)).addTo(map);
    });
    map.on("mousemove", "atlas-routes-hit", (e) => {
      const name = e.features?.[0]?.properties?.name;
      if (name) hover.setLngLat(e.lngLat).setText(name).addTo(map);
    });
    map.on("click", (e) => {
      if (latest.current.placing) pickRef.current(e.lngLat.lat, e.lngLat.lng);
    });
    map.on("click", ["atlas-pins", "atlas-pins-kimbo"], (e) => {
      if (latest.current.placing) return;
      const id = e.features?.[0]?.properties?.id as string | undefined;
      if (id) setSelected({ kind: "place", id });
    });
    map.on("click", "atlas-routes-hit", (e) => {
      if (latest.current.placing) return;
      if (map.queryRenderedFeatures(e.point, { layers: ["atlas-pins", "atlas-pins-kimbo", "atlas-clusters"] }).length) return;
      const id = e.features?.[0]?.properties?.id as string | undefined;
      if (id) setSelected({ kind: "route", id });
    });
    map.on("click", "atlas-clusters", (e) => {
      if (latest.current.placing) return;
      const f = e.features?.[0];
      if (!f) return;
      const src = map.getSource("atlas-places") as mapboxgl.GeoJSONSource;
      src.getClusterExpansionZoom(f.properties?.cluster_id, (err, zoom) => {
        if (err || zoom == null) return;
        map.easeTo({ center: (f.geometry as GeoJSON.Point).coordinates as [number, number], zoom: zoom + 0.3, duration: 600 });
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places.length]);

  // ---- keep map in sync with React state ----
  useEffect(() => {
    const map = mapRef.current;
    const src = (id: string) => map?.getSource(id) as mapboxgl.GeoJSONSource | undefined;
    src("atlas-heat")?.setData(placesGeoJSON(visible));
    src("atlas-places")?.setData(placesGeoJSON(visible.filter((p) => !UNGROUPED.has(p.type))));
    src("atlas-kimbo")?.setData(placesGeoJSON(visible.filter((p) => UNGROUPED.has(p.type))));
  }, [visible]);

  // Heatmap replaces the pins while it's on.
  const syncHeat = useCallback((map: mapboxgl.Map) => {
    const on = latest.current.heat;
    if (map.getLayer("atlas-heatmap")) map.setLayoutProperty("atlas-heatmap", "visibility", on ? "visible" : "none");
    for (const id of PIN_LAYERS) if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", on ? "none" : "visible");
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    // Not gated on isStyleLoaded(): that stays false while tiles load (e.g. mid-flight),
    // which silently skipped the update. The sync functions check each layer exists.
    if (map) syncHeat(map);
    if (heat) setSelected(null);
  }, [heat, syncHeat]);

  // Full-size photo viewer: arrows step through, Escape closes.
  useEffect(() => {
    if (!viewer) return;
    const n = viewer.photos.length;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setViewer(null);
      else if (e.key === "ArrowRight") setPhoto((i) => (i + 1) % n);
      else if (e.key === "ArrowLeft") setPhoto((i) => (i - 1 + n) % n);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer]);
  useEffect(() => setViewer(null), [selected?.kind, selected?.id]);

  // Close the map menu on outside click.
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [menuOpen]);

  const syncRoutes = useCallback((map: mapboxgl.Map) => {
    const { showRoutes: saved, showStrava: live, selected: sel, routes: rs, timeline: tl, cutoff: cut } = latest.current;
    // In the timeline, only routes on or before the playhead.
    const cutIso = isoOf(cut);
    const inTime = tl ? ["all", ["!=", ["get", "date"], ""], ["<=", ["get", "date"], cutIso]] : ["literal", true];
    const savedF = ["all", ["literal", saved], ["!=", ["get", "source"], "strava"], inTime];
    const liveF = ["all", ["literal", live], ["==", ["get", "source"], "strava"], inTime];
    const filters: Record<string, unknown[]> = {
      "atlas-routes-casing": savedF,
      "atlas-routes": savedF,
      "atlas-strava-glow": liveF,
      "atlas-strava": liveF,
      "atlas-strava-hot": liveF,
      "atlas-routes-hit": ["any", savedF, liveF],
      "atlas-route-fresh": tl
        ? ["all", ["any", savedF, liveF], [">", ["get", "date"], isoOf(cut - FRESH_ROUTE_DAYS)]]
        : ["literal", false],
    };
    const selId = sel?.kind === "route" ? sel.id : "";
    for (const id of ["atlas-route-selected-glow", "atlas-route-selected-casing", "atlas-route-selected"]) {
      filters[id] = ["==", ["get", "id"], selId];
    }
    // While a route is selected, the rest step back so it reads at a glance.
    const dim = Boolean(selId);
    const opacity: Record<string, number> = {
      "atlas-strava": dim ? 0.3 : 0.9,
      "atlas-strava-glow": dim ? 0.04 : 0.13,
      "atlas-strava-hot": dim ? 0.05 : 0.16,
      "atlas-routes": dim ? 0.35 : 1,
      "atlas-routes-casing": dim ? 0.3 : 0.7,
    };
    for (const [id, o] of Object.entries(opacity)) {
      if (map.getLayer(id)) map.setPaintProperty(id, "line-opacity", o);
    }
    for (const [id, f] of Object.entries(filters)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (map.getLayer(id)) map.setFilter(id, f as any);
    }
    if (!map.getSource("atlas-routes")) return;
    rs.forEach((r, i) =>
      map.setFeatureState(
        { source: "atlas-routes", id: i },
        { selected: sel?.kind === "route" && sel.id === r.id },
      ),
    );
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const src = map?.getSource("atlas-routes") as mapboxgl.GeoJSONSource | undefined;
    src?.setData(routesGeoJSON(routes));
    if (map) syncRoutes(map);
  }, [routes, showRoutes, showStrava, selected, syncRoutes]);

  // ---- timeline ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    syncRoutes(map);
    // Rings spread and fade around places reached in the last few months.
    const fresh = timeline
      ? visible
          .map((p) => ({ p, age: cutoff - dayOf(p.date!) }))
          .filter(({ age }) => age >= 0 && age < FRESH_DAYS)
          .map(({ p, age }) => ({
            type: "Feature" as const,
            properties: { r: 15 + (age / FRESH_DAYS) * 22, o: 0.9 * (1 - age / FRESH_DAYS), color: TYPE_BY_ID[p.type]?.color ?? "#fff" },
            geometry: { type: "Point" as const, coordinates: [p.lng, p.lat] },
          }))
      : [];
    (map.getSource("atlas-fresh") as mapboxgl.GeoJSONSource | undefined)?.setData({ type: "FeatureCollection", features: fresh });
  }, [timeline, cutoff, visible, syncRoutes]);

  useEffect(() => {
    if (!playing) return;
    const step = Math.max(1, (span.end - span.start) / ((PLAY_SECONDS * 1000) / TICK_MS));
    const t = window.setInterval(() => {
      setCutoff((c) => {
        const next = Math.min(span.end, c + step);
        if (next >= span.end) setPlaying(false);
        return next;
      });
    }, TICK_MS);
    return () => window.clearInterval(t);
  }, [playing, span]);

  function openTimeline() {
    setSelected(null);
    setStravaOpen(false);
    setMenuOpen(false);
    setHeat(false);
    setCutoff(span.start);
    setTimeline(true);
    setPlaying(true);
    const map = mapRef.current;
    if (map) fitTo(map, places.map((p) => [p.lng, p.lat]));
  }

  function closeTimeline() {
    setPlaying(false);
    setTimeline(false);
  }

  function togglePlay() {
    if (!playing && cutoff >= span.end) setCutoff(span.start);
    setPlaying((p) => !p);
  }

  // Activity per month, for the strip above the slider.
  const density = useMemo(() => {
    if (!timeline) return [] as { d: number; n: number }[];
    const months = new Map<string, number>();
    for (const x of [...places, ...routes]) if (x.date) months.set(x.date.slice(0, 7), (months.get(x.date.slice(0, 7)) ?? 0) + 1);
    const out: { d: number; n: number }[] = [];
    const s = new Date(span.start * DAY);
    for (let y = s.getUTCFullYear(), m = s.getUTCMonth(); ; m++) {
      if (m === 12) (m = 0), y++;
      const d = Date.UTC(y, m, 1) / DAY;
      if (d > span.end) break;
      out.push({ d, n: months.get(`${y}-${String(m + 1).padStart(2, "0")}`) ?? 0 });
    }
    return out;
  }, [timeline, places, routes, span]);
  const densityMax = Math.max(1, ...density.map((x) => Math.sqrt(x.n)));
  const years = useMemo(() => {
    const out: number[] = [];
    for (let y = new Date(span.start * DAY).getUTCFullYear() + 1; Date.UTC(y, 0, 1) / DAY <= span.end; y++) out.push(y);
    return out;
  }, [span]);

  useEffect(() => {
    const map = mapRef.current;
    const src = map?.getSource("atlas-selected") as mapboxgl.GeoJSONSource | undefined;
    src?.setData(placesGeoJSON(draft ? [draft] : selectedPlace ? [selectedPlace] : []));
    setPhoto(0);
    if (!latest.current.places.length) return; // keep a deep-link hash until the data arrives
    try {
      const url = window.location.pathname + window.location.search + (selectedPlace ? "#" + selectedPlace.id : "");
      window.history.replaceState(null, "", url);
    } catch {}
    if (map && selectedPlace) flyToPlace(map, selectedPlace);
    if (map && selectedRoute) fitTo(map, selectedRoute.coords, { left: stravaOpen ? 400 : 70, right: 440 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.kind, selected?.id]);

  // ---- editing ----
  useEffect(() => {
    const map = mapRef.current;
    const src = map?.getSource("atlas-selected") as mapboxgl.GeoJSONSource | undefined;
    src?.setData(placesGeoJSON(draft ? [draft] : selectedPlace ? [selectedPlace] : []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  useEffect(() => {
    const map = mapRef.current;
    if (map) map.getCanvas().style.cursor = placing ? "crosshair" : "";
  }, [placing]);

  async function regionAt(lat: number, lng: number): Promise<string> {
    try {
      const res = await fetch(
        `https://api.mapbox.com/search/geocode/v6/reverse?longitude=${lng}&latitude=${lat}&types=region&access_token=${TOKEN}`,
      );
      const json = (await res.json()) as { features?: { properties?: { name?: string } }[] };
      return json.features?.[0]?.properties?.name ?? "";
    } catch {
      return "";
    }
  }

  // Runs when the map is clicked while placing a new pin or moving one.
  pickRef.current = (lat: number, lng: number) => {
    const at = { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 };
    if (placing === "new") {
      setDraft({ id: "new", name: "", type: "kimbo", ...at, date: "", dateText: "", notes: "", region: "", approx: false, photos: [] });
      setDraftIsNew(true);
      setSelected(null);
    } else if (placing === "move" && draft) {
      setDraft({ ...draft, ...at, approx: false });
    }
    setPlacing(null);
    regionAt(at.lat, at.lng).then((region) => region && setDraft((d) => (d ? { ...d, region } : d)));
  };

  function startEdit(p: Place) {
    setDraft({ ...p, photos: [...p.photos] });
    setDraftIsNew(false);
    setEditError("");
  }

  function stopEdit() {
    setDraft(null);
    setPlacing(null);
    setEditError("");
  }

  async function sendChange(payload: unknown): Promise<{ places: Place[]; id: string | null } | null> {
    setSaving(true);
    setEditError("");
    try {
      const res = await fetch("/api/atlas/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { places?: Place[]; id?: string | null; error?: string };
      if (!res.ok || !json.places) throw new Error(json.error || "Save failed. Try again.");
      setPlaces(json.places);
      return { places: json.places, id: json.id ?? null };
    } catch (e) {
      setEditError(e instanceof Error ? e.message : "Save failed. Try again.");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function saveDraft() {
    if (!draft) return;
    const fields = {
      name: draft.name.trim(),
      type: draft.type,
      lat: draft.lat,
      lng: draft.lng,
      date: draft.date,
      dateText: draft.dateText.trim(),
      notes: draft.notes,
      region: draft.region,
      photos: draft.photos,
    };
    const done = await sendChange(draftIsNew ? { action: "add", place: fields } : { action: "update", id: draft.id, edit: fields });
    if (!done) return;
    const id = draftIsNew ? done.id : draft.id;
    setDraft(null);
    if (id) setSelected({ kind: "place", id });
  }

  async function deleteDraft() {
    if (!draft || draftIsNew) return;
    const done = await sendChange({ action: "delete", id: draft.id });
    if (!done) return;
    setDraft(null);
    setSelected(null);
  }

  async function editSignIn(e: React.FormEvent) {
    e.preventDefault();
    setEditPwError("");
    const res = await fetch("/api/atlas/edit-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: editPw }),
    });
    if (!res.ok) {
      setEditPwError(res.status === 401 ? "Wrong password." : "Editing isn't set up yet.");
      return;
    }
    setEditPw("");
    setEditLoginOpen(false);
    const places = await loadPlaces();
    setPlaces(places);
  }

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(BASE_STYLES[base]);
  }, [base]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMenuOpen(false);
      if (latest.current.placing) return setPlacing(null);
      setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ---- stats ----
  const stats = useMemo(() => {
    const n = (t: PlaceType) => timedPlaces.filter((p) => p.type === t).length;
    const regions = new Set(timedPlaces.filter((p) => p.type !== "someday").map((p) => p.region).filter(Boolean));
    const miles = timedRoutes.reduce((s, r) => s + (r.miles || 0), 0);
    return { kimbo: n("kimbo"), nights: n("tent") + n("hut"), regions: regions.size, miles: Math.round(miles) };
  }, [timedPlaces, timedRoutes]);

  const stravaList = useMemo(
    () =>
      routes
        .filter((r) => r.source === "strava")
        .sort((a, b) => (b.startedAt ?? b.date).localeCompare(a.startedAt ?? a.date)),
    [routes],
  );
  const stravaYear = useMemo(() => {
    const year = new Date().getFullYear().toString();
    const these = stravaList.filter((r) => r.date.startsWith(year));
    return { year, count: these.length, miles: Math.round(these.reduce((s, r) => s + r.miles, 0)) };
  }, [stravaList]);

  const routeCounts = useMemo(() => {
    const strava = routes.filter((r) => r.source === "strava").length;
    return { strava, saved: routes.length - strava };
  }, [routes]);

  if (!TOKEN) {
    return (
      <main className={styles.page}>
        <div className={styles.notice}>
          <h1 className={styles.title}>Atlas</h1>
          <p>
            The map needs a Mapbox token. Add <code>MAPBOX_TOKEN</code> to <code>.env.local</code> and to the
            Vercel project settings, then restart.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div ref={container} className={styles.map} aria-label="Map of places" />

      {/* Top bar: identity left, the numbers in the middle, base map right. */}
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <h1 className={styles.title}>Atlas</h1>
          <a href="/" className={styles.home}>
            Matthew Wolstoncroft
          </a>
        </div>
        <dl className={styles.stats}>
          <div>
            <dd>{stats.kimbo}</dd>
            <dt>Kimbo camps</dt>
          </div>
          <div>
            <dd>{stats.nights}</dd>
            <dt>Backcountry nights</dt>
          </div>
          <div>
            <dd>{stats.regions}</dd>
            <dt>States &amp; provinces</dt>
          </div>
          <div>
            <dd>{stats.miles.toLocaleString()}</dd>
            <dt>Route miles</dt>
          </div>
        </dl>
        <div className={styles.mapControls} ref={menuRef}>
          {canEdit && storeReady && (
            <button
              type="button"
              className={styles.moreBtn}
              data-active={placing === "new" ? "" : undefined}
              onClick={() => {
                stopEdit();
                setSelected(null);
                setPlacing(placing === "new" ? null : "new");
              }}
              aria-label="Add a place"
              title="Add a place"
            >
              <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span>Add</span>
            </button>
          )}
          {!canEdit && editRequested && (
            <button type="button" className={styles.moreBtn} onClick={() => setEditLoginOpen((o) => !o)} aria-label="Sign in to edit">
              <svg viewBox="0 0 24 24" width={17} height={17} aria-hidden="true">
                <path d="M4 20h4L19 9l-4-4L4 16z" />
              </svg>
              <span>Edit</span>
            </button>
          )}
          {editLoginOpen && (
            <form className={styles.menu} onSubmit={editSignIn} style={{ padding: 14 }}>
              <label className={styles.field}>
                <span>Edit password</span>
                <input id="atlas-edit-password" type="password" autoFocus value={editPw} onChange={(e) => setEditPw(e.target.value)} />
              </label>
              {editPwError && <p className={styles.formError}>{editPwError}</p>}
              <div className={styles.actionsRow} style={{ marginTop: 10 }}>
                <button type="submit" className={styles.primaryBtn} disabled={!editPw}>
                  Sign in
                </button>
              </div>
            </form>
          )}
          <div className={styles.baseToggle} role="group" aria-label="Base map">
            {(["topo", "satellite"] as BaseStyle[]).map((b) => (
              <button key={b} type="button" aria-pressed={base === b} onClick={() => setBase(b)}>
                {BASE_LABELS[b]}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={styles.moreBtn}
            aria-pressed={timeline}
            data-active={timeline ? "" : undefined}
            onClick={() => (timeline ? closeTimeline() : openTimeline())}
            aria-label="Timeline"
            title="Play the map through time"
          >
            <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true">
              <path d="M12 3a9 9 0 1 1 0 18a9 9 0 1 1 0-18z M12 7v5l3.5 2" />
            </svg>
          </button>
          {routeCounts.strava > 0 && (
            <button
              type="button"
              className={styles.moreBtn}
              aria-pressed={stravaOpen}
              data-active={stravaOpen ? "" : undefined}
              onClick={() => {
                setStravaOpen((o) => !o);
                setMenuOpen(false);
              }}
              aria-label="Recent Strava activities"
              title="Recent Strava activities"
            >
              <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true" className={styles.stravaMark}>
                <path d="M10 3 4 15h4l2-4 2 4h4z M14 15l2 4 2-4" />
              </svg>
            </button>
          )}
          <button
            type="button"
            className={styles.moreBtn}
            aria-expanded={menuOpen}
            aria-haspopup="true"
            data-active={MORE_BASES.includes(base) || heat ? "" : undefined}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="More map views"
          >
            {MORE_BASES.includes(base) && <span>{BASE_LABELS[base]}</span>}
            <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true">
              <path d="M12 3 2 8l10 5 10-5z M2 13l10 5 10-5 M2 18l10 5 10-5" />
            </svg>
          </button>
          {menuOpen && (
            <div className={styles.menu} role="menu">
              <p className={styles.menuHead}>Map</p>
              {(Object.keys(BASE_LABELS) as BaseStyle[]).map((b) => (
                <button
                  key={b}
                  type="button"
                  role="menuitemradio"
                  aria-checked={base === b}
                  className={styles.menuItem}
                  onClick={() => {
                    setBase(b);
                    setMenuOpen(false);
                  }}
                >
                  <span className={styles.radio} aria-hidden="true" />
                  <span>
                    {BASE_LABELS[b]}
                    <small>{BASE_NOTES[b]}</small>
                  </span>
                </button>
              ))}
              <p className={styles.menuHead}>Show</p>
              <button
                type="button"
                role="menuitemcheckbox"
                aria-checked={showRoutes}
                className={styles.menuItem}
                onClick={() => setShowRoutes((v) => !v)}
              >
                <span className={styles.check} aria-hidden="true" />
                <span>
                  Saved routes
                  <small>GPS tracks from your old maps ({routeCounts.saved})</small>
                </span>
              </button>
              {routeCounts.strava > 0 && (
                <button
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={showStrava}
                  className={styles.menuItem}
                  onClick={() => setShowStrava((v) => !v)}
                >
                  <span className={styles.check} aria-hidden="true" />
                  <span>
                    Strava activities
                    <small>Every activity from Strava ({routeCounts.strava})</small>
                  </span>
                </button>
              )}
              <button
                type="button"
                role="menuitemcheckbox"
                aria-checked={heat}
                className={styles.menuItem}
                onClick={() => setHeat((h) => !h)}
              >
                <span className={styles.check} aria-hidden="true" />
                <span>
                  Heatmap
                  <small>Where the most nights and days add up</small>
                </span>
              </button>
            </div>
          )}
        </div>
      </header>
      {loadError && <p className={styles.error}>The places could not load. Reload to try again.</p>}


      {stravaOpen && (
        <aside className={styles.drawer} aria-label="Recent Strava activities">
          <header className={styles.drawerHead}>
            <div>
              <h2>Strava</h2>
              <p>
                {stravaYear.count} activities · {stravaYear.miles.toLocaleString()} mi in {stravaYear.year}
              </p>
            </div>
            <button type="button" className={styles.close} onClick={() => setStravaOpen(false)} aria-label="Close Strava">
              <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </header>
          <ol className={styles.activities}>
            {stravaList.slice(0, stravaShown).map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className={styles.activity}
                  aria-current={selected?.kind === "route" && selected.id === r.id ? "true" : undefined}
                  onClick={() => {
                    setSelected({ kind: "route", id: r.id });
                    if (window.innerWidth <= 760) setStravaOpen(false);
                  }}
                >
                  <span className={styles.actThumb} data-empty={r.photos?.[0] ? undefined : ""}>
                    {r.photos?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.photos[0]} alt="" loading="lazy" />
                    ) : (
                      <svg viewBox="0 0 24 24" width={30} height={30} aria-hidden="true">
                        <path d="M3 18c4 0 4-6 8-6s4-6 10-6" />
                      </svg>
                    )}
                    {r.photos && r.photos.length > 1 && <em>{r.photos.length}</em>}
                  </span>
                  <span className={styles.actText}>
                    <time className={styles.actDate} dateTime={r.date}>
                      {new Date(r.date + "T12:00:00").toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: r.date.slice(0, 4) === stravaYear.year ? undefined : "numeric",
                      })}
                    </time>
                    <span className={styles.actName}>{r.name}</span>
                    <span className={styles.actMeta}>
                      {r.sport} · {r.miles} mi{r.gainFt ? ` · ${r.gainFt.toLocaleString()} ft` : ""}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
          {stravaShown < stravaList.length && (
            <button type="button" className={styles.more} onClick={() => setStravaShown((n) => n + 40)}>
              Show older activities
            </button>
          )}
          <p className={styles.powered}>Powered by Strava</p>
        </aside>
      )}

      {placing && (
        <div className={styles.placingBanner} role="status">
          <span>{placing === "new" ? "Click the map where this place is." : "Click the map to move the pin."}</span>
          <button type="button" onClick={() => setPlacing(null)}>
            Cancel
          </button>
        </div>
      )}

      {draft && (
        <aside className={styles.panel} aria-label={draftIsNew ? "New place" : "Edit place"}>
          <div className={styles.scroll}>
            <PlaceEditor
              draft={draft}
              isNew={draftIsNew}
              onChange={setDraft}
              onSave={saveDraft}
              onCancel={stopEdit}
              onDelete={deleteDraft}
              onMovePin={() => setPlacing(placing === "move" ? null : "move")}
              moving={placing === "move"}
              saving={saving}
              error={editError}
            />
          </div>
        </aside>
      )}

      {!draft && (selectedPlace || selectedRoute) && (
        <aside className={styles.panel} aria-live="polite">
          <button type="button" className={styles.close} onClick={() => setSelected(null)} aria-label="Close">
            <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
          <div className={styles.scroll}>
            {selectedPlace && (
              <>
                <div className={styles.hero}>
                  {selectedPlace.photos.length ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedPlace.photos[photo]}
                        alt={`${placeTitle(selectedPlace)}, photo ${photo + 1}`}
                        className={styles.zoomable}
                        onClick={() => setViewer({ photos: selectedPlace.photos, title: placeTitle(selectedPlace) })}
                      />
                  <button
                    type="button"
                    className={styles.expand}
                    onClick={() => setViewer({ photos: selectedPlace.photos, title: placeTitle(selectedPlace) })}
                    aria-label="View photos full size"
                    title="View full size"
                  >
                    <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden="true">
                      <path d="M14 4h6v6 M20 4l-7 7 M10 20H4v-6 M4 20l7-7" />
                    </svg>
                  </button>
                    </>
                  ) : (
                    <span className={styles.badge} style={{ background: TYPE_BY_ID[selectedPlace.type].color }}>
                      <Icon type={selectedPlace.type} size={26} />
                    </span>
                  )}
                </div>
                {selectedPlace.photos.length > 1 && (
                  <div className={styles.thumbs}>
                    {selectedPlace.photos.map((src, i) => (
                      <button key={src} type="button" aria-pressed={i === photo} onClick={() => setPhoto(i)} aria-label={`Photo ${i + 1}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" />
                      </button>
                    ))}
                  </div>
                )}
                <div className={styles.body}>
                  <span className={styles.tag} style={{ color: TYPE_BY_ID[selectedPlace.type].color }}>
                    {TYPE_BY_ID[selectedPlace.type].one}
                  </span>
                  <h2>{placeTitle(selectedPlace)}</h2>
                  <dl className={styles.meta}>
                    {placeWhen(selectedPlace) && (
                      <>
                        <dt>When</dt>
                        <dd>{placeWhen(selectedPlace)}</dd>
                      </>
                    )}
                    {selectedPlace.region && (
                      <>
                        <dt>Where</dt>
                        <dd>{selectedPlace.region}</dd>
                      </>
                    )}
                    <dt>Lat / long</dt>
                    <dd className={styles.mono}>{formatLatLng(selectedPlace.lat, selectedPlace.lng)}</dd>
                  </dl>
                  {selectedPlace.notes && <p className={styles.notes}>{selectedPlace.notes}</p>}
                  {canEdit && storeReady && (
                    <div className={styles.actionsRow}>
                      <button type="button" className={styles.primaryBtn} onClick={() => startEdit(selectedPlace)}>
                        <svg viewBox="0 0 24 24" width={15} height={15} aria-hidden="true">
                          <path d="M4 20h4L19 9l-4-4L4 16z" />
                        </svg>
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
            {selectedRoute?.photos?.length ? (
              <>
                <div className={styles.hero}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedRoute.photos[photo] ?? selectedRoute.photos[0]}
                    alt={`${selectedRoute.name}, photo ${photo + 1}`}
                    className={styles.zoomable}
                    onClick={() => setViewer({ photos: selectedRoute.photos!, title: selectedRoute.name })}
                  />
                  <button
                    type="button"
                    className={styles.expand}
                    onClick={() => setViewer({ photos: selectedRoute.photos!, title: selectedRoute.name })}
                    aria-label="View photos full size"
                    title="View full size"
                  >
                    <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden="true">
                      <path d="M14 4h6v6 M20 4l-7 7 M10 20H4v-6 M4 20l7-7" />
                    </svg>
                  </button>
                </div>
                {selectedRoute.photos.length > 1 && (
                  <div className={styles.thumbs}>
                    {selectedRoute.photos.map((src, i) => (
                      <button key={src} type="button" aria-pressed={i === photo} onClick={() => setPhoto(i)} aria-label={`Photo ${i + 1}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : null}
            {selectedRoute && (
              <div className={styles.body} style={{ paddingTop: selectedRoute.photos?.length ? undefined : 28 }}>
                <span className={styles.tag} style={{ color: selectedRoute.source === "strava" ? "#FC5200" : ROUTE_COLORS[selectedRoute.kind] }}>
                  {selectedRoute.source === "strava"
                    ? `Strava · ${selectedRoute.sport ?? ROUTE_KIND_LABEL[selectedRoute.kind]}`
                    : ROUTE_KIND_LABEL[selectedRoute.kind]}
                </span>
                <h2>{selectedRoute.name}</h2>
                <dl className={styles.meta}>
                  {selectedRoute.date && (
                    <>
                      <dt>When</dt>
                      <dd>{placeWhen({ date: selectedRoute.date })}</dd>
                    </>
                  )}
                  <dt>Distance</dt>
                  <dd className={styles.mono}>{selectedRoute.miles} mi</dd>
                  {selectedRoute.movingSec ? (
                    <>
                      <dt>Moving</dt>
                      <dd className={styles.mono}>{formatDuration(selectedRoute.movingSec)}</dd>
                    </>
                  ) : null}
                  {selectedRoute.gainFt ? (
                    <>
                      <dt>Climb</dt>
                      <dd className={styles.mono}>{selectedRoute.gainFt.toLocaleString()} ft</dd>
                    </>
                  ) : null}
                </dl>
                {selectedRoute.url && (
                  <a className={styles.strava} href={selectedRoute.url} target="_blank" rel="noopener noreferrer">
                    View on Strava
                  </a>
                )}
              </div>
            )}
          </div>
        </aside>
      )}
      {timeline && (
        <div className={styles.timeline} role="region" aria-label="Timeline">
          <button type="button" className={styles.tlPlay} onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}>
            <svg viewBox="0 0 24 24" width={16} height={16} aria-hidden="true">
              {playing ? <path d="M7 5h3v14H7z M14 5h3v14h-3z" /> : <path d="M8 5v14l11-7z" />}
            </svg>
          </button>
          <div className={styles.tlNow} aria-live="off">
            <strong>{monthLabel(cutoff)}</strong>
            <small>
              {timedPlaces.length} places · {stats.miles.toLocaleString()} mi
            </small>
          </div>
          <div className={styles.tlTrack}>
            <div className={styles.tlDensity} aria-hidden="true">
              {density.map((x) => (
                <i
                  key={x.d}
                  style={{ height: `${x.n ? 12 + (Math.sqrt(x.n) / densityMax) * 88 : 0}%` }}
                  data-on={x.d <= cutoff ? "" : undefined}
                />
              ))}
            </div>
            <input
              type="range"
              min={span.start}
              max={span.end}
              step={1}
              value={Math.round(cutoff)}
              onChange={(e) => {
                setPlaying(false);
                setCutoff(Number(e.target.value));
              }}
              aria-label="Date"
              aria-valuetext={monthLabel(cutoff)}
            />
            <div className={styles.tlYears} aria-hidden="true">
              {years.map((y) => (
                <span key={y} style={{ left: `${((Date.UTC(y, 0, 1) / DAY - span.start) / (span.end - span.start)) * 100}%` }}>
                  {String(y).slice(2)}
                </span>
              ))}
            </div>
          </div>
          <button type="button" className={`${styles.close} ${styles.tlClose}`} onClick={closeTimeline} aria-label="Close timeline">
            <svg viewBox="0 0 24 24" width={14} height={14} aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
      )}
      {viewer && (
        <PhotoViewer
          photos={viewer.photos}
          title={viewer.title}
          index={Math.min(photo, viewer.photos.length - 1)}
          onIndex={setPhoto}
          onClose={() => setViewer(null)}
        />
      )}
    </main>
  );
}

function fitTo(map: mapboxgl.Map, coords: [number, number][], side: { left?: number; right?: number } = {}) {
  if (!coords.length) return;
  const b = new mapboxgl.LngLatBounds(coords[0], coords[0]);
  coords.forEach((c) => b.extend(c));
  const wide = window.innerWidth > 760;
  map.fitBounds(b, {
    padding: wide
      ? { top: 120, bottom: 110, left: side.left ?? 70, right: side.right ?? 70 }
      : { top: 150, bottom: window.innerHeight * 0.45, left: 30, right: 30 },
    maxZoom: 13,
    duration: 900,
  });
}

function flyToPlace(map: mapboxgl.Map, p: Place) {
  const wide = window.innerWidth > 760;
  map.flyTo({
    center: [p.lng, p.lat],
    zoom: Math.max(map.getZoom(), 12.5),
    duration: 1600,
    padding: wide ? { top: 80, bottom: 80, left: 0, right: 420 } : { top: 90, bottom: window.innerHeight * 0.5, left: 0, right: 0 },
  });
}

function formatDuration(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return h ? `${h}h ${m.toString().padStart(2, "0")}m` : `${m}m`;
}

/** Full-screen photo viewer. Arrows or swipe to step through; Escape, ✕ or a click outside closes. */
function PhotoViewer({
  photos,
  title,
  index,
  onIndex,
  onClose,
}: {
  photos: string[];
  title: string;
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const n = photos.length;
  const step = (d: number) => onIndex((index + d + n) % n);
  const startX = useRef<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => closeRef.current?.focus(), []);
  return (
    <div
      className={styles.viewer}
      role="dialog"
      aria-modal="true"
      aria-label={`${title}, photo ${index + 1} of ${n}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onPointerDown={(e) => (startX.current = e.clientX)}
      onPointerUp={(e) => {
        if (startX.current === null) return;
        const dx = e.clientX - startX.current;
        startX.current = null;
        if (n > 1 && Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img key={photos[index]} src={photos[index]} alt={`${title}, photo ${index + 1}`} draggable={false} />
      <div className={styles.viewerBar}>
        <span>{title}</span>
        {n > 1 && (
          <span className={styles.mono}>
            {index + 1} / {n}
          </span>
        )}
      </div>
      <button ref={closeRef} type="button" className={styles.viewerClose} onClick={onClose} aria-label="Close">
        <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
      {n > 1 && (
        <>
          <button type="button" className={styles.viewerPrev} onClick={() => step(-1)} aria-label="Previous photo">
            <svg viewBox="0 0 24 24" width={22} height={22} aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <button type="button" className={styles.viewerNext} onClick={() => step(1)} aria-label="Next photo">
            <svg viewBox="0 0 24 24" width={22} height={22} aria-hidden="true">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
