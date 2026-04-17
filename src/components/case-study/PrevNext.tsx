import Link from "next/link";

type Entry = { href: string; label: string };

type PrevNextProps = {
  prev?: Entry;
  next?: Entry;
};

export function PrevNext({ prev, next }: PrevNextProps) {
  return (
    <nav
      aria-label="Case study navigation"
      className="rule-top mt-[var(--section-gap)] grid grid-cols-2 gap-6 pt-8"
    >
      <div className="text-left">
        {prev ? (
          <Link href={prev.href} className="link-underline">
            <span className="meta block mb-1">Previous</span>
            <span className="font-display text-[1.25rem]">{prev.label}</span>
          </Link>
        ) : null}
      </div>
      <div className="text-right">
        {next ? (
          <Link href={next.href} className="link-underline">
            <span className="meta block mb-1">Next</span>
            <span className="font-display text-[1.25rem]">{next.label}</span>
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
