#!/usr/bin/env bash
# deploy-llm-judge.sh — ship the LLM-as-judge engineering case study.
#
# What this does:
#   1. Clears any stale .git/index.lock (safe if no git process is running)
#   2. Runs typecheck to make sure nothing is broken
#   3. Stages and commits the new /llm-judge route, its three new
#      case-study components, the homepage featured slot, and the two
#      nav wire-ups (command palette + LabNotes prev/next)
#   4. Pushes main to origin, which triggers a Vercel deploy
#
# Run from the repo root:  bash scripts/deploy-llm-judge.sh

set -euo pipefail

# Move to repo root, regardless of where the script was invoked from.
cd "$(dirname "$0")/.."

echo ""
echo "▸ Repo:    $(git remote get-url origin 2>/dev/null || echo '(no origin)')"
echo "▸ Branch:  $(git branch --show-current)"
echo ""

# ---------- Guards ----------
BRANCH="$(git branch --show-current)"
if [ "$BRANCH" != "main" ]; then
  echo "✖ You are on '$BRANCH', not 'main'. Switch to main before running this script." >&2
  exit 1
fi

# ---------- Clear stale index lock ----------
# A stale .git/index.lock silently blocks every git write. One is expected
# here: the Claude session's sandboxed shell creates it on `git status` and
# is not permitted to unlink it. If no git process is running, remove it.
if [ -f .git/index.lock ]; then
  if pgrep -f "git " >/dev/null 2>&1; then
    echo "✖ Another git process appears to be running. Finish or kill it, then re-run." >&2
    exit 1
  fi
  echo "! Found stale .git/index.lock — removing."
  rm -f .git/index.lock
fi
rm -f .git/objects/maintenance.lock 2>/dev/null || true

# ---------- Step 1: typecheck ----------
echo "▸ Running typecheck (npx tsc --noEmit)…"
npx tsc --noEmit
echo "  ✓ Typecheck clean."
echo ""

# ---------- Step 2: stage + commit ----------
echo "▸ Staging changes…"
# No error suppression: if a path is missing or git fails, fail loudly
# rather than 'succeeding' with nothing staged.
git add \
  src/app/llm-judge/page.tsx \
  src/components/case-study/CodeExhibit.tsx \
  src/components/case-study/EvalMatrix.tsx \
  src/components/case-study/FactStrip.tsx \
  src/components/home/FeaturedNote.tsx \
  src/components/home/Home.tsx \
  src/components/cmdk/CommandPalette.tsx \
  src/app/labnotes/page.tsx \
  scripts/deploy-llm-judge.sh

echo ""
echo "▸ Staged changes:"
git diff --cached --stat
echo ""

if git diff --cached --quiet; then
  echo "  · Nothing new to commit."
else
  git commit -m 'add LLM-as-judge engineering case study at /llm-judge

Teaching a machine to grade fairly: building the LLM-as-judge that grades
LabNotes students on demonstrated understanding, and the eval harness that
caught it being wrong.

This project has no screens to show, so it gets an engineering-note
treatment rather than a design showcase: no hero screenshot, hard numbers
up top, and two visuals that carry the substance instead of decorating it.

New route:
  - src/app/llm-judge/page.tsx — sections follow the argument (the problem,
    what went wrong, what I should have done first, what I built instead of
    more prompt tuning, the finding that generalised, where it ended up)

New case-study components:
  - CodeExhibit — labelled monospace bands for showing a bug as a string.
    Used for the prefill ending in a colon, the continuation opening with
    another, the joined result failing JSON.parse, and the silent zero that
    reached the screen.
  - EvalMatrix — inline SVG of the harness: three problem shapes, four cases
    each, every case run twice. Theme-aware, no chart library.
  - FactStrip — a row of hard numbers for case studies with no screenshot to
    lead with. dt is ordered after dd so the number reads first and the
    markup stays valid.

Homepage:
  - FeaturedNote — a full-width, image-free featured slot between About and
    the project grid, so the work reads as a different kind of artifact
    before it is clicked
  - Home.tsx — Hero, About, FeaturedNote, ProjectCards

Nav:
  - CommandPalette — jump-to entry for the new route
  - labnotes/page.tsx — spliced into the prev/next chain between LabNotes
    and Cengage

Verified with tsc --noEmit and by rendering both themes against a running
dev server.'
  echo "  ✓ Committed:"
  git log -1 --oneline
fi
echo ""

# ---------- Step 3: push ----------
echo "▸ Pushing main to origin…"
BEFORE="$(git rev-parse origin/main 2>/dev/null || echo 'unknown')"
git push origin main
AFTER="$(git rev-parse origin/main)"
echo "  origin/main: $BEFORE → $AFTER"
if [ "$BEFORE" = "$AFTER" ]; then
  echo "  · Remote unchanged (nothing new to push)."
else
  echo "  ✓ Pushed. Vercel will pick up the deploy."
fi
echo ""

echo "Done. New page will be live at https://www.mattwolstoncroft.com/llm-judge"
