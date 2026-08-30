const SHAPES = [
  { name: "Dependency chain", note: "each step needs the one before it" },
  { name: "Multi-part question", note: "steps graded on their own merits" },
  { name: "Parallel tracks", note: "two steps that are independent" },
];

const CASES_PER_SHAPE = 4;

/* Geometry */
const CELL_W = 44;
const CELL_H = 34;
const RUN_GAP = 18;
const CASE_PITCH = CELL_W * 2 + RUN_GAP + 20;
const COL_X = 200;
const ROW_TOP = [50, 120, 190];

/**
 * The eval harness, drawn: three problem shapes, four cases each, every case
 * run twice. Structural on purpose — the point is the shape of the coverage,
 * not a screenshot of a test runner.
 */
export function EvalMatrix({ caption }: { caption?: string }) {
  return (
    <figure className="my-[var(--block-gap)]">
      <div className="surface-media rounded-lg px-5 py-6 md:px-8 md:py-8">
        <svg
          viewBox="0 0 700 292"
          className="h-auto w-full"
          role="img"
          aria-label="The eval harness: three problem shapes — dependency chain, multi-part question, and parallel tracks — with four cases each, and every case run twice. Twelve cases, twenty-four runs. Two runs that disagree at temperature zero mean determinism has broken."
          style={{ fontFamily: "var(--font-body), serif" }}
        >
          {/* Header */}
          <text x={COL_X + CELL_W / 2} y={32} textAnchor="middle" style={label(11)}>
            RUN 1
          </text>
          <text
            x={COL_X + CELL_W + RUN_GAP + CELL_W / 2}
            y={32}
            textAnchor="middle"
            style={label(11)}
          >
            RUN 2
          </text>
          <text x={700} y={32} textAnchor="end" style={label(11)}>
            12 CASES · 24 RUNS
          </text>

          {SHAPES.map((shape, r) => {
            const top = ROW_TOP[r];
            return (
              <g key={shape.name}>
                <text x={0} y={top + 15} style={{ ...label(13), fill: "var(--fg)" }}>
                  {shape.name.toUpperCase()}
                </text>
                <text x={0} y={top + 32} style={note(13)}>
                  {shape.note}
                </text>

                {Array.from({ length: CASES_PER_SHAPE }).map((_, c) => {
                  const x = COL_X + c * CASE_PITCH;
                  return (
                    <g key={c}>
                      <Cell x={x} y={top} />
                      <Cell x={x + CELL_W + RUN_GAP} y={top} />
                      <text
                        x={x + CELL_W + RUN_GAP / 2}
                        y={top + CELL_H / 2 + 6}
                        textAnchor="middle"
                        style={{ ...note(17), fill: "var(--accent)", fontStyle: "normal" }}
                      >
                        =
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Legend */}
          <line x1={0} y1={242} x2={700} y2={242} stroke="var(--rule)" />
          <text x={0} y={264} style={note(13)}>
            <tspan style={{ fill: "var(--accent)", fontStyle: "normal" }}>=</tspan>
            <tspan dx={8}>the two runs agree — at temperature 0 they must.</tspan>
          </text>
          <text x={0} y={284} style={note(13)}>
            A ≠ is not a flaky test. It means determinism has broken, and that is
            a finding.
          </text>
        </svg>
      </div>
      {caption ? <figcaption className="meta mt-3">{caption}</figcaption> : null}
    </figure>
  );
}

/** One run: a graded response, sketched as a few lines of verdict. */
function Cell({ x, y }: { x: number; y: number }) {
  const ticks = [22, 28, 15];
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={CELL_W}
        height={CELL_H}
        rx={3}
        fill="var(--bg-subtle)"
        stroke="var(--rule-strong)"
      />
      {ticks.map((w, i) => (
        <line
          key={i}
          x1={x + 9}
          x2={x + 9 + w}
          y1={y + 11 + i * 6}
          y2={y + 11 + i * 6}
          stroke="var(--rule-strong)"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      ))}
    </g>
  );
}

function label(size: number) {
  return {
    fontSize: size,
    letterSpacing: "0.08em",
    fill: "var(--fg-muted)",
  } as const;
}

function note(size: number) {
  return {
    fontSize: size,
    fontStyle: "italic",
    fill: "var(--fg-muted)",
  } as const;
}
