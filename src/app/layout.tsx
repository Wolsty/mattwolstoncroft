import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import "@/styles/globals.css";
import { displayFont } from "@/lib/fonts";
import { ThemeProvider } from "@/lib/theme";
import { CommandPalette } from "@/components/cmdk/CommandPalette";
import { ContactModal } from "@/components/contact/ContactModal";
import { Footer } from "@/components/nav/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://mattwolstoncroft.com"),
  title: {
    default: "Matthew Wolstoncroft, AI-native product design",
    template: "%s · Matthew Wolstoncroft",
  },
  description:
    "Strategic product leader building AI-powered products from 0-to-1, shipping across design and code.",
  openGraph: {
    type: "website",
    url: "/",
    title: "Matthew Wolstoncroft",
    description:
      "Strategic product leader building AI-powered products from 0-to-1, shipping across design and code.",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  // Site defaults to light; browser chrome matches the light background.
  themeColor: "#FAFAF7",
};

// Inline script: runs before React hydrates to set data-theme from the saved
// cookie, otherwise defaults to light. Prevents FOUC / theme flash.
const themeInitScript = `
(function(){try{
  var m = document.cookie.match(/(?:^|; )theme=([^;]*)/);
  var t = m ? decodeURIComponent(m[1]) : null;
  // Default to light; dark is opt-in via the theme toggle (persisted in a cookie).
  if (t !== 'dark' && t !== 'light') {
    t = 'light';
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
          <ContactModal />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
