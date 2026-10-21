"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import styles from "./atlas.module.css";
import {
  ICON_PATHS,
  ROUTE_COLORS,
  TYPES,
  TYPE_BY_ID,
  formatLatLng,
  placeTitle,
  placeWhen,
  type Place,
  type PlaceType,
  type Route,
} from "./types";
import { BASE_STYLES, addDataLayers, addTopoLayers, placesGeoJSON, type BaseStyle } from "./mapLayers";


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
  const [showRoutes, setShowRoutes] = useState(true);
  const [base, setBase] = useState<BaseStyle>("topo");
  const [selected, setSelected] = useState<Selection>(null);
  const [photo, setPhoto] = useState(0);
  const [loadError, setLoadError] = useState(false);

  // Latest values for map event handlers, which are bound once.
  const latest = useRef({ places, routes, hidden, showRoutes, selected });
  latest.current = { places, routes, hidden, showRoutes, selected };

  const visible = useMemo(() => places.filter((p) => !hidden.has(p.type)), [places, hidden]);
  const selectedPlace = selected?.kind === "place" ? places.find((p) => p.id === selected.id) ?? null : null;
  const selectedRoute = selected?.kind === "route" ? routes.find((r) => r.id === selected.id) ?? null : null;

  // ---- data ----
  useEffect(() => {
    Promise.all([
      fetch("/atlas-data/places.json").then((r) => r.json() as Promise<Place[]>),
      fetch("/atlas-data/routes.json").then((r) => r.json() as Promise<Route[]>),
    ])
      .then(([p, r]) => {
        setPlaces(p);
        setRoutes(r);
        const id = decodeURIComponent(window.location.hash.slice(1));
        if (id && p.some((x) => x.id === id)) setSelected({ kind: "place", id });
      })
      .catch(() => setLoadError(true));
  }, []);

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
      const { places: ps, routes: rs, hidden: hd, selected: sel } = latest.current;
      const styleName: BaseStyle = map.getStyle()?.name?.toLowerCase().includes("satellite") ? "satellite" : "topo";
      addTopoLayers(map, styleName);
      const selPlace = sel?.kind === "place" ? ps.find((p) => p.id === sel.id) ?? null : null;
      addDataLayers(map, ps.filter((p) => !hd.has(p.type)), rs, selPlace);
      syncRoutes(map);
      if (firstLoad) {
        firstLoad = false;
        if (selPlace) flyToPlace(map, selPlace);
        else fitTo(map, ps.map((p) => [p.lng, p.lat]));
      }
    });

    const pointer = () => (map.getCanvas().style.cursor = "pointer");
    const unpointer = () => (map.getCanvas().style.cursor = "");
    const hover = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 16, className: styles.hover });
    for (const layer of ["atlas-pins", "atlas-clusters", "atlas-routes-hit"]) {
      map.on("mouseenter", layer, pointer);
      map.on("mouseleave", layer, () => {
        unpointer();
        hover.remove();
      });
    }
    map.on("mousemove", "atlas-pins", (e) => {
      const f = e.features?.[0];
      if (!f) return;
      const p = latest.current.places.find((x) => x.id === f.properties?.id);
      if (p) hover.setLngLat(e.lngLat).setText(placeTitle(p)).addTo(map);
    });
    map.on("mousemove", "atlas-routes-hit", (e) => {
      const name = e.features?.[0]?.properties?.name;
      if (name) hover.setLngLat(e.lngLat).setText(name).addTo(map);
    });
    map.on("click", "atlas-pins", (e) => {
      const id = e.features?.[0]?.properties?.id as string | undefined;
      if (id) setSelected({ kind: "place", id });
    });
    map.on("click", "atlas-routes-hit", (e) => {
      if (map.queryRenderedFeatures(e.point, { layers: ["atlas-pins", "atlas-clusters"] }).length) return;
      const id = e.features?.[0]?.properties?.id as string | undefined;
      if (id) setSelected({ kind: "route", id });
    });
    map.on("click", "atlas-clusters", (e) => {
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
    const src = map?.getSource("atlas-places") as mapboxgl.GeoJSONSource | undefined;
    src?.setData(placesGeoJSON(visible));
  }, [visible]);

  const syncRoutes = useCallback((map: mapboxgl.Map) => {
    const { showRoutes: show, selected: sel, routes: rs } = latest.current;
    for (const id of ["atlas-routes-casing", "atlas-routes", "atlas-routes-hit"]) {
      if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", show ? "visible" : "none");
    }
    if (!map.getSource("atlas-routes")) return;
    rs.forEach((r) =>
      map.setFeatureState(
        { source: "atlas-routes", id: Number(r.id.replace(/\D/g, "")) },
        { selected: sel?.kind === "route" && sel.id === r.id },
      ),
    );
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (map?.isStyleLoaded()) syncRoutes(map);
  }, [showRoutes, selected, syncRoutes]);

  useEffect(() => {
    const map = mapRef.current;
    const src = map?.getSource("atlas-selected") as mapboxgl.GeoJSONSource | undefined;
    src?.setData(placesGeoJSON(selectedPlace ? [selectedPlace] : []));
    setPhoto(0);
    if (!latest.current.places.length) return; // keep a deep-link hash until the data arrives
    try {
      const url = window.location.pathname + window.location.search + (selectedPlace ? "#" + selectedPlace.id : "");
      window.history.replaceState(null, "", url);
    } catch {}
    if (map && selectedPlace) flyToPlace(map, selectedPlace);
    if (map && selectedRoute) fitTo(map, selectedRoute.coords);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.kind, selected?.id]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(BASE_STYLES[base]);
  }, [base]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ---- stats ----
  const stats = useMemo(() => {
    const n = (t: PlaceType) => places.filter((p) => p.type === t).length;
    const regions = new Set(places.filter((p) => p.type !== "someday").map((p) => p.region).filter(Boolean));
    const miles = routes.reduce((s, r) => s + (r.miles || 0), 0);
    return { kimbo: n("kimbo"), nights: n("tent") + n("hut"), regions: regions.size, miles: Math.round(miles) };
  }, [places, routes]);

  const counts = useMemo(() => {
    const c: Partial<Record<PlaceType, number>> = {};
    places.forEach((p) => (c[p.type] = (c[p.type] || 0) + 1));
    return c;
  }, [places]);

  const toggleType = (t: PlaceType) =>
    setHidden((h) => {
      const next = new Set(h);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });

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
        <div className={styles.baseToggle} role="group" aria-label="Base map">
          {(["topo", "satellite"] as BaseStyle[]).map((b) => (
            <button key={b} type="button" aria-pressed={base === b} onClick={() => setBase(b)}>
              {b === "topo" ? "Topo" : "Satellite"}
            </button>
          ))}
        </div>
      </header>
      {loadError && <p className={styles.error}>The places could not load. Reload to try again.</p>}

      {/* Legend dock: the filters, centered along the bottom edge. */}
      <nav className={styles.legend} aria-label="Show place types">
        <div className={styles.legendRow}>
          {TYPES.filter((t) => counts[t.id]).map((t) => (
            <button
              key={t.id}
              type="button"
              className={styles.key}
              aria-pressed={!hidden.has(t.id)}
              aria-label={`${t.plural}, ${counts[t.id]}`}
              title={t.plural}
              onClick={() => toggleType(t.id)}
            >
              <i style={{ background: hidden.has(t.id) ? undefined : t.color, borderColor: t.color }}>
                <Icon type={t.id} size={11} />
              </i>
              <span>{t.short}</span>
              <em>{counts[t.id]}</em>
            </button>
          ))}
          <span className={styles.sep} aria-hidden="true" />
          <button type="button" className={styles.key} aria-pressed={showRoutes} onClick={() => setShowRoutes((s) => !s)}>
            <i style={{ background: showRoutes ? ROUTE_COLORS.bike : undefined, borderColor: ROUTE_COLORS.bike }}>
              <svg viewBox="0 0 24 24" width={11} height={11} className={styles.icon} aria-hidden="true">
                <path d="M3 18c4 0 4-6 8-6s4-6 10-6" />
              </svg>
            </i>
            <span>Routes</span>
            <em>{routes.length}</em>
          </button>
        </div>
      </nav>

      {(selectedPlace || selectedRoute) && (
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
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedPlace.photos[photo]} alt={`${placeTitle(selectedPlace)}, photo ${photo + 1}`} />
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
                </div>
              </>
            )}
            {selectedRoute && (
              <div className={styles.body} style={{ paddingTop: 28 }}>
                <span className={styles.tag} style={{ color: ROUTE_COLORS[selectedRoute.kind] }}>
                  {{ hike: "Hike", ski: "Ski tour", bike: "Ride" }[selectedRoute.kind]}
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
                  {selectedRoute.gainFt ? (
                    <>
                      <dt>Climb</dt>
                      <dd className={styles.mono}>{selectedRoute.gainFt.toLocaleString()} ft</dd>
                    </>
                  ) : null}
                </dl>
              </div>
            )}
          </div>
        </aside>
      )}
    </main>
  );
}

function fitTo(map: mapboxgl.Map, coords: [number, number][]) {
  if (!coords.length) return;
  const b = new mapboxgl.LngLatBounds(coords[0], coords[0]);
  coords.forEach((c) => b.extend(c));
  const wide = window.innerWidth > 760;
  map.fitBounds(b, {
    padding: wide ? { top: 120, bottom: 110, left: 70, right: 70 } : { top: 150, bottom: 110, left: 30, right: 30 },
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
