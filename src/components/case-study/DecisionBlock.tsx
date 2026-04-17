import type { ReactNode } from "react";

type DecisionBlockProps = {
  /** e.g. "Decision 1 — We don't give the student the answer, ever" */
  heading: string;
  children: ReactNode;
};

export function DecisionBlock({ heading, children }: DecisionBlockProps) {
  return (
    <section className="my-[var(--block-gap)] rule-top pt-6">
      <h3 className="mb-4">{heading}</h3>
      <div className="prose-body max-w-prose space-y-4 font-body">
        {children}
      </div>
    </section>
  );
}
