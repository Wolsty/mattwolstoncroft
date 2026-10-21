import type mapboxgl from "mapbox-gl";
import { ICON_PATHS, ROUTE_COLORS, TYPES, type Place, type Route } from "./types";

export const BASE_STYLES = {
  topo: "mapbox://styles/mapbox/dark-v11",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  hybrid: "mapbox://styles/mapbox/satellite-v9",
  outdoors: "mapbox://styles/mapbox/outdoors-v12",
  night: "mapbox://styles/mapbox/standard",
} as const;
export type BaseStyle = keyof typeof BASE_STYLES;

export const BASE_LABELS: Record<BaseStyle, string> = {
  topo: "Topo",
  satellite: "Satellite",
  hybrid: "Hybrid",
  outdoors: "Outdoors",
  night: "3D Night",
};
export const BASE_NOTES: Record<BaseStyle, string> = {
  topo: "Dark topo with contours and trails",
  satellite: "Imagery with roads and places",
  hybrid: "Imagery with contours and trails",
  outdoors: "Mapbox's daytime topo, most labels",
  night: "3D terrain and buildings, lit at night",
};

const M_TO_FT = 3.28084;
const LABEL_FONT = ["DIN Pro Regular", "Arial Unicode MS Regular"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyLayer = any;

/**
 * Per base map: 3D terrain everywhere; our own hillshade, contours (feet), trails and
 * public land where the base style doesn't already carry them.
 *   topo      Mapbox Dark + everything, recolored for a dark ground
 *   hybrid    plain imagery + contours, trails, public land edges in white
 *   satellite imagery with Mapbox's roads/labels + contours
 *   outdoors  Mapbox Outdoors already has contours and hillshade: terrain only
 *   night     Mapbox Standard with the night light preset: terrain only
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

  if (base === "night") {
    try {
      map.setConfigProperty("basemap", "lightPreset", "night");
    } catch {}
    return;
  }

  map.setFog(
    base === "outdoors"
      ? { color: "#dfe5e1", "high-color": "#9fb7d1", "horizon-blend": 0.06, "space-color": "#0b0b0c", "star-intensity": 0.1 }
      : { color: "#0b0b0c", "high-color": "#161618", "horizon-blend": 0.08, "space-color": "#050506", "star-intensity": 0.12 },
  );
  if (base === "outdoors") return;

  const overlay = base === "topo" || base === "hybrid";

  if (base === "topo") {
    // Mapbox Dark is near-black; lift the ground so hillshade and contours have room to read.
    const style = map.getStyle();
    for (const l of style?.layers ?? []) {
      if (l.id === "land" && l.type === "background") map.setPaintProperty(l.id, "background-color", "#1f1f23");
      if (l.id.startsWith("landcover") && l.type === "fill") map.setPaintProperty(l.id, "fill-color", "#26262b");
      if (l.id === "water" && l.type === "fill") map.setPaintProperty(l.id, "fill-color", "#0e0e11");
    }
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
          "hillshade-highlight-color": "#9a9aa3",
          "hillshade-accent-color": "#2a2a2e",
          "hillshade-exaggeration": 0.8,
          "hillshade-illumination-direction": 315,
        },
      } as AnyLayer,
      firstSymbol,
    );

  }

  if (overlay) {
    map.addSource("atlas-streets", { type: "vector", url: "mapbox://mapbox.mapbox-streets-v8" });
    // Public land: national parks and forests, wilderness
    if (base === "topo") map.addLayer(
      {
        id: "atlas-public-land",
        type: "fill",
        source: "atlas-streets",
        "source-layer": "landuse_overlay",
        filter: ["==", ["get", "class"], "national_park"],
        paint: { "fill-color": "#34343a", "fill-opacity": ["interpolate", ["linear"], ["zoom"], 4, 0.35, 10, 0.18] },
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
        paint: {
          "line-color": base === "topo" ? "#5c5c64" : "#f2f2f4",
          "line-opacity": base === "topo" ? 1 : 0.7,
          "line-width": 0.9,
          "line-dasharray": [3, 2],
        },
      } as AnyLayer,
      firstSymbol,
    );
  }

  map.addSource("atlas-contours", { type: "vector", url: "mapbox://mapbox.mapbox-terrain-v2" });
  const major = ["in", ["get", "index"], ["literal", [5, 10]]];
  const line = base === "topo" ? "#a4a4ad" : "#e8e8ea";
  map.addLayer(
    {
      id: "atlas-contour-minor",
      type: "line",
      source: "atlas-contours",
      "source-layer": "contour",
      minzoom: 10,
      filter: ["!", major],
      paint: { "line-color": line, "line-opacity": base === "topo" ? 0.45 : 0.35, "line-width": 0.7 },
    } as AnyLayer,
    firstSymbol,
  );
  map.addLayer(
    {
      id: "atlas-contour-major",
      type: "line",
      source: "atlas-contours",
      "source-layer": "contour",
      minzoom: 8,
      filter: major,
      paint: { "line-color": line, "line-opacity": base === "topo" ? 0.75 : 0.6, "line-width": 1.2 },
    } as AnyLayer,
    firstSymbol,
  );
  map.addLayer({
    id: "atlas-contour-label",
    type: "symbol",
    source: "atlas-contours",
    "source-layer": "contour",
    minzoom: 11,
    filter: major,
    layout: {
      "symbol-placement": "line",
      "text-field": ["concat", ["to-string", ["round", ["*", ["get", "ele"], M_TO_FT]]], " ft"],
      "text-font": LABEL_FONT,
      "text-size": 10,
      "text-max-angle": 25,
    },
    paint: { "text-color": "#c4c4cb", "text-halo-color": "#0b0b0c", "text-halo-width": 1.4 },
  } as AnyLayer);

  if (overlay) {
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
        minzoom: 9,
        filter: trail,
        paint: {
          "line-color": base === "topo" ? "#dcdce1" : "#ffffff",
          "line-opacity": 0.9,
          "line-width": ["interpolate", ["linear"], ["zoom"], 9, 0.7, 15, 1.8],
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
      minzoom: 12,
      filter: trail,
      layout: {
        "symbol-placement": "line",
        "text-field": ["get", "name"],
        "text-font": LABEL_FONT,
        "text-size": 11,
      },
      paint: { "text-color": base === "topo" ? "#c8c8cd" : "#ffffff", "text-halo-color": "#0b0b0c", "text-halo-width": 1.4 },
    } as AnyLayer);
  }
}

export const STRAVA_ORANGE = "#FC5200";
/** The one color reserved for the selected route. */
export const SELECTED_COLOR = "#3DE0FF";

export function routesGeoJSON(routes: Route[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: routes.map((r, i) => ({
      type: "Feature",
      id: i, // feature-state key; matches the route's index in the array
      properties: { id: r.id, kind: r.kind, name: r.name, source: r.source ?? "saved" },
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
      "line-color": [
        "match",
        ["get", "kind"],
        "ski", ROUTE_COLORS.ski,
        "bike", ROUTE_COLORS.bike,
        "paddle", ROUTE_COLORS.paddle,
        ROUTE_COLORS.hike,
      ],
      // Mapbox only allows zoom as the outermost expression, so the selected check sits inside each stop.
      "line-width": [
        "interpolate",
        ["linear"],
        ["zoom"],
        4, ["case", ["boolean", ["feature-state", "selected"], false], 3, 1.6],
        14, ["case", ["boolean", ["feature-state", "selected"], false], 6, 3.5],
      ],
    },
  } as AnyLayer);
  // Strava activities: a solid orange line so a ride done once reads clearly, plus a faint
  // warm-white core and glow that stack where rides overlap, so repeated routes run hot.
  const isSelected = ["boolean", ["feature-state", "selected"], false];
  map.addLayer({
    id: "atlas-strava-glow",
    type: "line",
    source: "atlas-routes",
    filter: ["==", ["get", "source"], "strava"],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": STRAVA_ORANGE,
      "line-opacity": 0.13,
      "line-blur": ["interpolate", ["linear"], ["zoom"], 5, 3, 14, 6],
      "line-width": ["interpolate", ["linear"], ["zoom"], 5, 5, 14, 12],
    },
  } as AnyLayer);
  map.addLayer({
    id: "atlas-strava",
    type: "line",
    source: "atlas-routes",
    filter: ["==", ["get", "source"], "strava"],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": STRAVA_ORANGE,
      "line-opacity": ["case", isSelected, 1, 0.9],
      "line-width": ["interpolate", ["linear"], ["zoom"], 4, ["case", isSelected, 3, 1.6], 14, ["case", isSelected, 6, 3]],
    },
  } as AnyLayer);
  map.addLayer({
    id: "atlas-strava-hot",
    type: "line",
    source: "atlas-routes",
    filter: ["==", ["get", "source"], "strava"],
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": "#fff0d9",
      "line-opacity": 0.16,
      "line-width": ["interpolate", ["linear"], ["zoom"], 5, 0.7, 14, 1.5],
    },
  } as AnyLayer);

  // Selected route: its own color (cyan, used nowhere else on the map), on a dark casing with a
  // soft glow, drawn above every other route. Other routes dim while one is selected (see AtlasMap).
  const selFilter = ["==", ["get", "id"], ""];
  map.addLayer({
    id: "atlas-route-selected-glow",
    type: "line",
    source: "atlas-routes",
    filter: selFilter,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": SELECTED_COLOR,
      "line-opacity": 0.35,
      "line-blur": 6,
      "line-width": ["interpolate", ["linear"], ["zoom"], 4, 10, 14, 18],
    },
  } as AnyLayer);
  map.addLayer({
    id: "atlas-route-selected-casing",
    type: "line",
    source: "atlas-routes",
    filter: selFilter,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": "#050506",
      "line-opacity": 0.9,
      "line-width": ["interpolate", ["linear"], ["zoom"], 4, 6, 14, 9],
    },
  } as AnyLayer);
  map.addLayer({
    id: "atlas-route-selected",
    type: "line",
    source: "atlas-routes",
    filter: selFilter,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": SELECTED_COLOR,
      "line-width": ["interpolate", ["linear"], ["zoom"], 4, 3.5, 14, 5.5],
    },
  } as AnyLayer);

  map.addLayer({
    id: "atlas-routes-hit",
    type: "line",
    source: "atlas-routes",
    paint: { "line-color": "#000", "line-opacity": 0, "line-width": 16 },
  } as AnyLayer);

  // Heatmap view: same places, unclustered; shown instead of pins when the viewer asks.
  map.addSource("atlas-heat", { type: "geojson", data: placesGeoJSON(places) });
  map.addLayer({
    id: "atlas-heatmap",
    type: "heatmap",
    source: "atlas-heat",
    layout: { visibility: "none" },
    paint: {
      "heatmap-weight": 1,
      "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 3, 0.6, 12, 2.2],
      "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 3, 14, 8, 30, 13, 50],
      "heatmap-opacity": 0.85,
      "heatmap-color": [
        "interpolate",
        ["linear"],
        ["heatmap-density"],
        0, "rgba(0,0,0,0)",
        0.15, "rgba(120,72,20,0.55)",
        0.4, "#b8701c",
        0.7, "#e0952b",
        1, "#fff1d6",
      ],
    },
  } as AnyLayer);

  map.addSource("atlas-places", {
    type: "geojson",
    data: placesGeoJSON(places.filter((p) => p.type !== "kimbo")),
    cluster: true,
    clusterRadius: 10,
    clusterMaxZoom: 4,
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
  // Kimbo camps are never grouped: every night in the camper shows, at every zoom.
  map.addSource("atlas-kimbo", { type: "geojson", data: placesGeoJSON(places.filter((p) => p.type === "kimbo")) });
  map.addLayer({
    id: "atlas-pins-kimbo",
    type: "symbol",
    source: "atlas-kimbo",
    layout: {
      "icon-image": ["concat", "pin-", ["get", "type"]],
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
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
