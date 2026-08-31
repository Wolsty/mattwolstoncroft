import { Newsreader } from "next/font/google";
import localFont from "next/font/local";

/**
 * BL Arctic: display face. One weight (400 regular) shipped as .otf.
 * No italic face available; italic usage falls back to serif synthesis.
 */
export const displayFont = localFont({
  src: [
    {
      path: "../../public/fonts/BL Arctic X.otf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-display",
  display: "swap",
  fallback: ["Times New Roman", "Times", "serif"],
});

/**
 * Newsreader: the heading face for everything below display size.
 *
 * BL Arctic is a high-contrast display serif — its hairlines are the point at
 * 56px and a liability at 24px, where they optically thin further against a
 * dark ground and start to disappear. Newsreader is an optical-size serif
 * built for exactly that range: same serif genus, far lower stroke contrast,
 * so card titles and case-study subheads hold up.
 *
 * The division is also editorial. A display face used on every heading stops
 * reading as one; BL Arctic now appears only on the name, case-study titles,
 * and the fact numerals.
 */
export const headingFont = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-heading",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
});
