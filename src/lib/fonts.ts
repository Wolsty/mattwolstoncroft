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
