import createMDX from "@next/mdx";
import { existsSync, readFileSync } from "node:fs";

const withMDX = createMDX({
  extension: /\.mdx?$/,
});

/**
 * Atlas photos live in Vercel Blob, not in the deploy (each deploy used to carry
 * its own ~375 MB copy, which filled the Hobby plan's deployment storage).
 * The site keeps serving them at /atlas-photos/..., so places.json, edits saved
 * on the site and the Atlas password are unchanged: the middleware checks the
 * password first, then this rewrite fetches the file from Blob.
 * atlas-photos.config.json is written by scripts/atlas-photos-to-blob.mjs.
 * Rewrites run after public files, so a local public/atlas-photos still wins in dev.
 */
const atlasPhotos = existsSync("./atlas-photos.config.json")
  ? JSON.parse(readFileSync("./atlas-photos.config.json", "utf8"))
  : null;

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  async rewrites() {
    return atlasPhotos
      ? [{ source: "/atlas-photos/:path*", destination: `${atlasPhotos.base}/atlas-photos/:path*` }]
      : [];
  },
  experimental: {
    mdxRs: false,
  },
};

export default withMDX(nextConfig);
