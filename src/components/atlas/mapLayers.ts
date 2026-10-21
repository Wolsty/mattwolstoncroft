import type mapboxgl from "mapbox-gl";
import { ICON_PATHS, ROUTE_COLORS, TYPES, type Place, type Route } from "./types";

export const BASE_STYLES = {
  topo: "mapbox://styles/mapbox/dark-v11",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
} as const;
export type BaseStyle = keyof typeof BASE_STYLES;

const M_TO_FT = 3.28084;
const LABEL_FONT = ["DIN Pro Regular", "Arial Unicode MS Regular"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyLayer = any;

/**
 * Dark topo on top of Mapbox Dark: 3D terrain, hillshade, contours (feet),
 * trails and public land. Satellite gets terrain and contours only.
 */
export function addTopoLayers(map: mapboxgl.Map, base: BaseStyle) {
  const firstSymbol = map.getStyle()?.layers?.find((l) => l.type === "symbol")?.id;

  map.addSource("dem-terrain", {
    type: "raster-dem",
    url: "mapbox://mapbox.mapbox-terrain-dem-v1",
    tileSize: 512,
    maxzoom: 14,
  });
  map.setTerrain({ source: "dem-terrain", exaggeration: 1.3 });

  map.setFog({
    color: "#0b0b0c",
    "high-color": "#161618",
    "horizon-blend": 0.08,
    "space-color": "#050506",
    "star-intensity": 0.12,
  });

  if (base === "topo") {
    map.addSource("dem-shade", {
      type: "raster-dem",
      url: "mapbox://mapbox.mapbox-terrain-dem-v1",
      tileSize: 512,
      maxzoom: 14,
    });
    map.addLayer(
      {
        id: "atlas-hillshade",
        type: "hillshade",
        source: "dem-shade",
        paint: {
          "hillshade-shadow-color": "#000000",
          "hillshade-highlight-color": "#55555c",
          "hillshade-accent-color": "#111113",
          "hillshade-exaggeration": 0.6,
          "hillshade-illumination-direction": 315,
        },
      } as AnyLayer,
      firstSymbol,
    );

    map.addSource("atlas-streets", { type: "vector", url: "mapbox://mapbox.mapbox-streets-v8" });
    // Public land: national parks and forests, wilderness
    map.addLayer(
      {
        id: "atlas-public-land",
        type: "fill",
        source: "atlas-streets",
        "source-layer": "landuse_overlay",
        filter: ["==", ["get", "class"], "national_park"],
        paint: { "fill-color": "#2a2a2e", "fill-opacity": ["interpolate", ["linear"], ["zoom"], 4, 0.35, 10, 0.18] },
      } as AnyLayer,
      firstSymbol,
    );
    map.addLayer(
      {
        id: "atlas-public-land-edge",
        type: "line",
        source: "atlas-streets",
        "source-layer": "landuse_overlay",
        minzoom: 6,
        filter: ["==", ["get", "class"], "national_park"],
        paint: { "line-color": "#46464c", "line-width": 0.8, "line-dasharray": [3, 2] },
      } as AnyLayer,
      firstSymbol,
    );
  }

  map.addSource("atlas-contours", { type: "vector", url: "mapbox://mapbox.mapbox-terrain-v2" });
  const major = ["in", ["get", "index"], ["literal", [5, 10]]];
  const line = base === "topo" ? "#6a6a72" : "#e8e8ea";
  map.addLayer(
    {
      id: "atlas-contour-minor",
      type: "line",
      source: "atlas-contours",
      "source-layer": "contour",
      minzoom: 11,
      filter: ["!", major],
      paint: { "line-color": line, "line-opacity": base === "topo" ? 0.28 : 0.22, "line-width": 0.6 },
    } as AnyLayer,
    firstSymbol,
  );
  map.addLayer(
    {
      id: "atlas-contour-major",
      type: "line",
      source: "atlas-contours",
      "source-layer": "contour",
      minzoom: 9,
      filter: major,
      paint: { "line-color": line, "line-opacity": base === "topo" ? 0.5 : 0.4, "line-width": 1.1 },
    } as AnyLayer,
    firstSymbol,
  );
  map.addLayer({
    id: "atlas-contour-label",
    type: "symbol",
    source: "atlas-contours",
    "source-layer": "contour",
    minzoom: 12,
    filter: major,
    layout: {
      "symbol-placement": "line",
      "text-field": ["concat", ["to-string", ["round", ["*", ["get", "ele"], M_TO_FT]]], " ft"],
      "text-font": LABEL_FONT,
      "text-size": 10,
      "text-max-angle": 25,
    },
    paint: { "text-color": "#9a9aa1", "text-halo-color": "#0b0b0c", "text-halo-width": 1.4 },
  } as AnyLayer);

  if (base === "topo") {
    const trail = [
      "all",
      ["==", ["get", "class"], "path"],
      ["match", ["get", "type"], ["hiking", "path", "bridleway", "mountain_bike", "cycleway", "piste", "trail"], true, false],
    ];
    map.addLayer(
      {
        id: "atlas-trails",
        type: "line",
        source: "atlas-streets",
        "source-layer": "road",
        minzoom: 10,
        filter: trail,
        paint: {
          "line-color": "#b4b4ba",
          "line-opacity": 0.75,
          "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.6, 15, 1.6],
          "line-dasharray": [2.5, 1.6],
        },
      } as AnyLayer,
      firstSymbol,
    );
    map.addLayer({
      id: "atlas-trail-names",
      type: "symbol",
      source: "atlas-streets",
      "source-layer": "road",
      minzoom: 13,
      filter: trail,
      layout: {
        "symbol-placement": "line",
        "text-field": ["get", "name"],
        "text-font": LABEL_FONT,
        "text-size": 11,
      },
      paint: { "text-color": "#c8c8cd", "text-halo-color": "#0b0b0c", "text-halo-width": 1.4 },
    } as AnyLayer);
  }
}

export function routesGeoJSON(routes: Route[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: routes.map((r) => ({
      type: "Feature",
      id: Number(r.id.replace(/\D/g, "")),
      properties: { id: r.id, kind: r.kind, name: r.name },
      geometry: { type: "LineString", coordinates: r.coords },
    })),
  };
}

export function placesGeoJSON(places: Place[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: places.map((p) => ({
      type: "Feature",
      properties: { id: p.id, type: p.type, name: p.name },
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
    })),
  };
}

/** Draws each pin badge to a canvas so the symbol layer can use it. */
function pinImage(type: (typeof TYPES)[number]): ImageData {
  const ratio = 2;
  const size = 30;
  const c = document.createElement("canvas");
  c.width = c.height = size * ratio;
  const ctx = c.getContext("2d")!;
  ctx.scale(ratio, ratio);
  const someday = type.id === "someday";
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, 13, 0, Math.PI * 2);
  ctx.fillStyle = someday ? "#141416" : type.color;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = someday ? type.color : "#0b0b0c";
  if (someday) ctx.setLineDash([3, 2.4]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.save();
  const s = 15 / 24;
  ctx.translate(size / 2 - 12 * s, size / 2 - 12 * s);
  ctx.scale(s, s);
  ctx.strokeStyle = someday ? type.color : "#ffffff";
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke(new Path2D(ICON_PATHS[type.id]));
  ctx.restore();
  return ctx.getImageData(0, 0, c.width, c.height);
}

export function addDataLayers(map: mapboxgl.Map, places: Place[], routes: Route[], selected: Place | null) {
  for (const t of TYPES) {
    const id = `pin-${t.id}`;
    if (!map.hasImage(id)) map.addImage(id, pinImage(t), { pixelRatio: 2 });
  }

  map.addSource("atlas-routes", { type: "geojson", data: routesGeoJSON(routes) });
  map.addLayer({
    id: "atlas-routes-casing",
    type: "line",
    source: "atlas-routes",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#050506", "line-opacity": 0.7, "line-width": ["interpolate", ["linear"], ["zoom"], 4, 2.5, 14, 6] },
  } as AnyLayer);
  map.addLayer({
    id: "atlas-routes",
    type: "line",
    source: "atlas-routes",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": ["match", ["get", "kind"], "ski", ROUTE_COLORS.ski, "bike", ROUTE_COLORS.bike, ROUTE_COLORS.hike],
      "line-width": [
        "case",
        ["boolean", ["feature-state", "selected"], false],
        ["interpolate", ["linear"], ["zoom"], 4, 3, 14, 6],
        ["interpolate", ["linear"], ["zoom"], 4, 1.4, 14, 3.5],
      ],
    },
  } as AnyLayer);
  map.addLayer({
    id: "atlas-routes-hit",
    type: "line",
    source: "atlas-routes",
    paint: { "line-color": "#000", "line-opacity": 0, "line-width": 16 },
  } as AnyLayer);

  map.addSource("atlas-places", {
    type: "geojson",
    data: placesGeoJSON(places),
    cluster: true,
    clusterRadius: 40,
    clusterMaxZoom: 12,
  });
  map.addLayer({
    id: "atlas-clusters",
    type: "circle",
    source: "atlas-places",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": "#141416",
      "circle-stroke-color": "#e6e6e8",
      "circle-stroke-width": 1.5,
      "circle-radius": ["step", ["get", "point_count"], 15, 5, 18, 15, 22, 40, 27],
    },
  } as AnyLayer);
  map.addLayer({
    id: "atlas-cluster-count",
    type: "symbol",
    source: "atlas-places",
    filter: ["has", "point_count"],
    layout: {
      "text-field": ["get", "point_count_abbreviated"],
      "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
      "text-size": 12,
      "text-allow-overlap": true,
    },
    paint: { "text-color": "#ececee" },
  } as AnyLayer);
  map.addLayer({
    id: "atlas-pins",
    type: "symbol",
    source: "atlas-places",
    filter: ["!", ["has", "point_count"]],
    layout: {
      "icon-image": ["concat", "pin-", ["get", "type"]],
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
      "symbol-sort-key": ["match", ["get", "type"], "kimbo", 2, "tent", 1, 3],
    },
  } as AnyLayer);
  // The selected pin lives in its own unclustered source so it stays visible inside a cluster.
  map.addSource("atlas-selected", { type: "geojson", data: placesGeoJSON(selected ? [selected] : []) });
  map.addLayer({
    id: "atlas-pin-selected",
    type: "symbol",
    source: "atlas-selected",
    layout: {
      "icon-image": ["concat", "pin-", ["get", "type"]],
      "icon-size": 1.4,
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
    },
  } as AnyLayer);
}
