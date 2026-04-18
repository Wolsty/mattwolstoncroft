"use client";

import { useTheme } from "@/lib/theme";

const EMAIL = "wolstoncroft.1@gmail.com";

export function Footer() {
  const { theme, toggle } = useTheme();

  const openCmdK = () => {
    window.dispatchEvent(new Event("cmdk:open"));
  };

  const openContact = () => {
    window.dispatchEvent(new Event("contact:open"));
  };

  return (
    <footer
      className="rule-top mt-[var(--section-gap)]"
      style={{ background: "var(--bg)" }}
    >
      <div className="mx-auto grid w-full max-w-content grid-cols-1 gap-12 px-6 py-16 md:grid-cols-3 md:px-10">
        {/* Contact */}
        <section aria-labelledby="footer-contact">
          <h2 id="footer-contact" className="meta mb-4">Contact</h2>
          <p className="font-body">
            <button
              type="button"
              onClick={openContact}
              className="link-underline"
              style={{
                background: "transparent",
                border: 0,
                padding: 0,
                cursor: "pointer",
                font: "inherit",
                color: "inherit",
                textAlign: "left",
              }}
            >
              {EMAIL}
            </button>
          </p>
        </section>

        {/* Links */}
        <section aria-labelledby="footer-links">
          <h2 id="footer-links" className="meta mb-4">Elsewhere</h2>
          <ul className="space-y-2 font-body">
            <li>
              <a className="link-underline" href="/Matthew-Wolstoncroft-Resume.pdf" target="_blank" rel="noopener noreferrer">
                Resume (PDF)
              </a>
            </li>
            <li>
              <a className="link-underline" href="https://www.linkedin.com/in/matthewwolstoncroft/" target="_blank" rel="noopener noreferrer">
                LinkedIn
              </a>
            </li>
          </ul>
        </section>

        {/* Chrome */}
        <section aria-labelledby="footer-meta" className="space-y-4">
          <h2 id="footer-meta" className="meta mb-4">Site</h2>
          <button
            type="button"
            onClick={openCmdK}
            className="link-underline font-body text-[1rem]"
            aria-label="Open command palette"
          >
            <kbd style={{ fontFamily: "inherit" }}>⌘K</kbd>, command palette
          </button>
          <div>
            <button
              type="button"
              onClick={toggle}
              className="link-underline font-body text-[1rem]"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            >
              {theme === "dark" ? "Light theme" : "Dark theme"}
            </button>
          </div>
          <p className="meta pt-8">
            © {new Date().getFullYear()} Matthew Wolstoncroft
          </p>
        </section>
      </div>
    </footer>
  );
}

