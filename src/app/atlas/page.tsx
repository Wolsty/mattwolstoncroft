import type { Metadata } from "next";
import { AtlasMap } from "@/components/atlas/AtlasMap";

export const metadata: Metadata = {
  title: "Atlas",
  description: "Places I've slept, skied, climbed and wandered: Kimbo camps, tent nights and backcountry routes.",
};

export default function AtlasPage() {
  // Read on the server at build time, so the token never needs a NEXT_PUBLIC_ name.
  return <AtlasMap token={process.env.MAPBOX_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_TOKEN} />;
}
