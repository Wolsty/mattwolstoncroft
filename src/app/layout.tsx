import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import "@/styles/globals.css";
import { displayFont } from "@/lib/fonts";
import { ThemeProvider } from "@/lib/theme";
import { CommandPalette } from "@/components/cmdk/CommandPalette";
import { Footer } from "@/components/nav/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://mattwolstoncroft.com"),
  title: {
    default: "Matthew Wolstoncroft — AI-native product design",
    template: "%s · Matthew Wolstoncroft",
  },
  description:
    "Strategic product leader building AI-powered products from 0-to-1 — shipping across design and code.",
  openGraph: {
    type: "website",
    url: "/",
    title: "Matthew Wolstoncroft",
    description:
      "Strategic product leader building AI-powered products from 0-to-1 — shipping across design and code.",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAF7" },
    { media: "(prefers-color-scheme: dark)", color: "#0E0E0E" },
  ],
};

// Inline script — runs before React hydrates to set data-theme from cookie
// or system preference. Prevents FOUC / theme flash.
const themeInitScript = `
(function(){try{
  var m = document.cookie.match(/(?:^|; )theme=([^;]*)/);
  var t = m ? decodeURIComponent(m[1]) : null;
  if (t !== 'dark' && t !== 'light') {
    t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', t);
  document.documentElement.style.colorScheme = t;
}catch(e){}})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={displayFont.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <Footer />
          <CommandPalette />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
