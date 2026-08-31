import { EB_Garamond } from "next/font/google";
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
 * EB Garamond: the heading face for everything below display size.
 *
 * BL Arctic is a high-contrast display serif — its hairlines are the point at
 * 56px and a liability at 24px, where they optically thin further against a
 * dark ground and start to disappear. EB Garamond is an old-style book face:
 * angled stress, moderate contrast, drawn for reading rather than for impact.
 * It holds at heading sizes and sets the register the site wants — a page
 * from a well-made book, not a masthead.
 *
 * The division is also editorial. A display face used on every heading stops
 * reading as one; BL Arctic now appears only on the name, case-study titles,
 * and the fact numerals.
 */
export const headingFont = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-heading",
  display: "swap",
  fallback: ["Garamond", "Georgia", "Times New Roman", "serif"],
});
