export type PlaceType =
  | "kimbo"
  | "tent"
  | "hut"
  | "ski"
  | "resort"
  | "climb"
  | "hike"
  | "water"
  | "memory"
  | "someday";

export type Place = {
  id: string;
  name: string;
  type: PlaceType;
  lat: number;
  lng: number;
  date: string; // ISO yyyy-mm-dd, or ""
  dateText: string; // loose date ("July 28"), or ""
  notes: string;
  region: string;
  approx: boolean;
  photos: string[]; // image URLs
};

export type RouteKind = "hike" | "ski" | "bike" | "paddle";

export type Route = {
  id: string;
  name: string;
  kind: RouteKind;
  date: string;
  miles: number;
  gainFt?: number | null;
  coords: [number, number][];
  /** Encoded polyline, used for Strava routes until decoded on the client. */
  polyline?: string;
  source?: "strava";
  url?: string;
  /** Strava only */
  sport?: string;
  startedAt?: string;
  movingSec?: number;
  photoCount?: number;
  photos?: string[];
};

/** Pin colors. Tuned to read on a near-black topo base. */
export const TYPES: { id: PlaceType; plural: string; short: string; one: string; color: string }[] = [
  { id: "kimbo", plural: "Kimbo camps", short: "Kimbo", one: "Kimbo camp", color: "#8B6BD6" },
  { id: "tent", plural: "Tent nights", short: "Tent", one: "Tent camp", color: "#3E9A63" },
  { id: "hut", plural: "Huts & yurts", short: "Huts", one: "Hut or yurt", color: "#A9744F" },
  { id: "resort", plural: "Ski areas", short: "Ski areas", one: "Ski area", color: "#D66A9C" },
  { id: "ski", plural: "Ski tours", short: "Ski tours", one: "Ski tour", color: "#4A97D8" },
  { id: "climb", plural: "Climbing", short: "Climb", one: "Climbing", color: "#D9603F" },
  { id: "hike", plural: "Hikes", short: "Hike", one: "Hike", color: "#8FA23A" },
  { id: "water", plural: "Water", short: "Water", one: "On the water", color: "#2AA5A5" },
  { id: "memory", plural: "Memories", short: "Memory", one: "Memory", color: "#D8B04A" },
  { id: "someday", plural: "Someday", short: "Someday", one: "Someday", color: "#8A8A90" },
];

export const TYPE_BY_ID = Object.fromEntries(TYPES.map((t) => [t.id, t])) as Record<
  PlaceType,
  (typeof TYPES)[number]
>;

export const ROUTE_COLORS: Record<RouteKind, string> = {
  hike: "#8FA23A",
  ski: "#4A97D8",
  bike: "#CC5E98",
  paddle: "#2AA5A5",
};

/** 24×24 stroke icons, path data only so they draw with Path2D. */
export const ICON_PATHS: Record<PlaceType, string> = {
  // Pickup with a camper on the bed: camper shell, cab, body, two wheels.
  kimbo:
    "M3 13V7.5C3 6.7 3.7 6 4.5 6H13v7 M13 9h3.4l3.1 4 M2 13h20v3.5H2z M6 8.8h3.5 M8.6 17.6a1.9 1.9 0 1 1-3.8 0a1.9 1.9 0 1 1 3.8 0 M19.1 17.6a1.9 1.9 0 1 1-3.8 0a1.9 1.9 0 1 1 3.8 0",
  tent: "M12 4 2.5 20h19z M12 4v4 M9 20l3-6 3 6",
  hut: "M3 12c3-4 6-6 9-6s6 2 9 6 M5 11v9h14v-9 M10 20v-5h4v5",
  ski: "M5 20 19 4 M5 4l14 16 M3.5 18.5l3 3 M17.5 18.5l-3 3",
  // A skier mid-turn: head, crouched body, poles, skis on a slope.
  resort:
    "M16.7 4.4a1.8 1.8 0 1 1-3.6 0a1.8 1.8 0 1 1 3.6 0 M14 7.2l-3.6 4.6 3.6 2-1.6 4.2 M13.4 8l3.8 2 M13.4 8l-3.6.8 M17.2 10l2.4 7.6 M3.5 15.6l17.5 4.6",
  climb: "M12 3a5 5 0 0 1 5 5v8a5 5 0 0 1-10 0V8a5 5 0 0 1 5-5z M7 10h5v4",
  hike: "M2 20 9 7l4 6.5 2.5-3.5L22 20z",
  water:
    "M2 9c2.5-2.5 5 2.5 7.5 0S14.5 6.5 17 9s5-2.5 5-2.5 M2 15c2.5-2.5 5 2.5 7.5 0s5-2.5 7.5 0 5-2.5 5-2.5",
  memory: "M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z",
  someday: "M6 21V4 M6 4h11l-2.5 4L17 12H6",
};

export function placeTitle(p: Place): string {
  return p.name || TYPE_BY_ID[p.type]?.one || "Place";
}

export function placeWhen(p: { date: string; dateText?: string }): string {
  if (p.date) {
    return new Date(p.date + "T12:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  return p.dateText || "";
}

export function formatLatLng(lat: number, lng: number): string {
  return `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? "N" : "S"}  ${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? "E" : "W"}`;
}

export const ROUTE_KIND_LABEL: Record<RouteKind, string> = {
  hike: "Hike",
  ski: "Ski tour",
  bike: "Ride",
  paddle: "Paddle",
};

/** Google encoded polyline → [lng, lat][] */
export function decodePolyline(str: string): [number, number][] {
  const coords: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < str.length) {
    for (const which of [0, 1]) {
      let result = 0;
      let shift = 0;
      let b: number;
      do {
        b = str.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const delta = result & 1 ? ~(result >> 1) : result >> 1;
      if (which === 0) lat += delta;
      else lng += delta;
    }
    coords.push([lng / 1e5, lat / 1e5]);
  }
  return coords;
}
