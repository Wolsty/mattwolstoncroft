import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx,md,mdx}",
    "./mdx-components.tsx",
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        fg: "var(--fg)",
        "fg-muted": "var(--fg-muted)",
        rule: "var(--rule)",
        accent: "var(--accent)",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "Times New Roman", "Times", "serif"],
      },
      maxWidth: {
        content: "1120px",
        prose: "640px",
      },
      letterSpacing: {
        caps: "0.08em",
      },
      transitionTimingFunction: {
        "ease-out-soft": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
