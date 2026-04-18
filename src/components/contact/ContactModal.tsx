"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const EMAIL = "wolstoncroft.1@gmail.com";

export function ContactModal() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onOpen = () => {
      setCopied(false);
      setOpen(true);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("contact:open", onOpen);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("contact:open", onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (open) {
      // Focus the copy button so Enter copies immediately.
      const t = setTimeout(() => copyBtnRef.current?.focus(), 20);
      return () => clearTimeout(t);
    }
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable; no-op */
    }
  }, []);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-modal-heading"
      className="fixed inset-0 z-50"
    >
      {/* Backdrop */}
      <div
        onClick={close}
        aria-hidden
        className="fixed inset-0"
        style={{ background: "var(--overlay)" }}
      />
      {/* Card */}
      <div
        className="fixed left-1/2 top-[22vh] w-[min(92vw,520px)] -translate-x-1/2 rounded border shadow-2xl"
        style={{
          background: "var(--bg)",
          borderColor: "var(--rule)",
          animation: "contact-in 180ms ease-out both",
        }}
      >
        <div className="flex items-start justify-between px-6 pt-5">
          <h2
            id="contact-modal-heading"
            className="meta"
            style={{ color: "var(--fg-muted)" }}
          >
            Contact
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="meta"
            style={{
              color: "var(--fg-muted)",
              background: "transparent",
              border: 0,
              padding: "0 0 0 1rem",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Close
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 px-6 pb-6 pt-4">
          <p
            className="font-body"
            style={{
              fontSize: "1.125rem",
              color: "var(--fg)",
              lineHeight: 1.3,
              wordBreak: "break-all",
            }}
          >
            {EMAIL}
          </p>
          <button
            ref={copyBtnRef}
            type="button"
            onClick={copy}
            aria-label={copied ? "Email copied" : "Copy email to clipboard"}
            className="link-underline font-body shrink-0"
            style={{
              fontSize: "var(--type-tension)",
              color: copied ? "var(--accent)" : "var(--fg)",
              background: "transparent",
              border: 0,
              padding: "0.35rem 0.5rem",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              whiteSpace: "nowrap",
            }}
          >
            {copied ? (
              "Copied"
            ) : (
              <>
                <CopyIcon />
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes contact-in {
          from { opacity: 0; transform: translate(-50%, calc(22vh - 8px)); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}
