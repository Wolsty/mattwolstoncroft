"use client";

import { Command } from "cmdk";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/theme";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { toggle: toggleTheme, theme } = useTheme();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      // Trigger from footer hint via custom event
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("cmdk:open", onOpen as EventListener);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("cmdk:open", onOpen as EventListener);
    };
  }, []);

  const close = useCallback(() => setOpen(false), []);
  const go = useCallback(
    (href: string) => {
      close();
      router.push(href);
    },
    [close, router],
  );

  const copyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText("wolstoncroft.1@gmail.com");
    } catch {
      /* no-op */
    }
    close();
  }, [close]);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command menu"
      className="fixed inset-0 z-50"
    >
      {/* Backdrop */}
      <div
        onClick={close}
        aria-hidden
        className="fixed inset-0"
        style={{ background: "var(--overlay)" }}
      />
      <div
        className="fixed left-1/2 top-[18vh] w-[min(92vw,540px)] -translate-x-1/2 rounded border p-0 shadow-2xl"
        style={{
          background: "var(--bg)",
          borderColor: "var(--rule)",
          animation: "cmdk-in 180ms ease-out both",
        }}
      >
        <Command label="Command menu" className="w-full">
          <Command.Input
            placeholder="Type a command or search…"
            className="w-full bg-transparent px-4 py-4 font-body text-[1.0625rem] outline-none"
            style={{ borderBottom: "1px solid var(--rule)", color: "var(--fg)" }}
          />
          <Command.List className="max-h-[50vh] overflow-auto p-2">
            <Command.Empty className="px-3 py-4 text-sm" style={{ color: "var(--fg-muted)" }}>
              No results.
            </Command.Empty>

            <Command.Group heading="Case studies" className="cmdk-group">
              <Item onSelect={() => go("/labnotes")}>Jump to LabNotes.ai</Item>
              <Item onSelect={() => go("/cengage")}>Jump to Cengage</Item>
              <Item onSelect={() => go("/seekwell")}>Jump to SeekWell</Item>
              <Item onSelect={() => go("/progrexion")}>Jump to Progrexion</Item>
            </Command.Group>

            <Command.Group heading="Site">
              <Item onSelect={() => toggleTheme()}>
                Toggle theme ({theme === "dark" ? "light" : "dark"})
              </Item>
              <Item onSelect={copyEmail}>Copy email address</Item>
              <Item onSelect={() => go("/resume")}>Download resume</Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>

      <style>{`
        @keyframes cmdk-in {
          from { opacity: 0; transform: translate(-50%, calc(18vh - 8px)); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        [cmdk-group-heading] {
          padding: 0.75rem 0.75rem 0.25rem;
          font-size: var(--type-meta);
          font-variant-caps: all-small-caps;
          letter-spacing: 0.08em;
          color: var(--fg-muted);
        }
        [cmdk-item] {
          padding: 0.55rem 0.75rem;
          border-radius: 4px;
          cursor: pointer;
          color: var(--fg);
          font-family: var(--font-body);
          font-size: 1rem;
          line-height: 1.3;
        }
        [cmdk-item][data-selected="true"] {
          background: color-mix(in srgb, var(--accent) 14%, transparent);
          outline: 1px solid var(--accent);
        }
      `}</style>
    </Command.Dialog>
  );
}

function Item({ onSelect, children }: { onSelect: () => void; children: React.ReactNode }) {
  return <Command.Item onSelect={onSelect}>{children}</Command.Item>;
}
