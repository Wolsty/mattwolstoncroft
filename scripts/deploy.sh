#!/usr/bin/env bash
# deploy.sh — ship the JAMS + iPR case studies and the SeekWell date fix.
#
# What this does:
#   1. Clears any stale .git/index.lock (safe if no git process is running)
#   2. Runs typecheck to make sure nothing is broken
#   3. Stages and commits all three changes together
#   4. Pushes main to origin, which triggers a Vercel deploy
#
# Run from the repo root:  bash scripts/deploy.sh

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
# A stale .git/index.lock silently blocks every git write. If no git process
# is running, the lock is safe to remove.
if [ -f .git/index.lock ]; then
  if pgrep -f "git " >/dev/null 2>&1; then
    echo "✖ Another git process appears to be running. Finish or kill it, then re-run." >&2
    exit 1
  fi
  echo "! Found stale .git/index.lock — removing."
  rm -f .git/index.lock
fi
# Same story for the maintenance lock, which git gc can leave behind.
rm -f .git/objects/maintenance.lock 2>/dev/null || true

# ---------- Step 1: typecheck ----------
echo "▸ Running typecheck (npx tsc --noEmit)…"
npx tsc --noEmit
echo "  ✓ Typecheck clean."
echo ""

# ---------- Step 2: stage + commit ----------
echo "▸ Staging changes…"
# NOTE: no error suppression here — if a path is missing or git fails,
# we want to see it loudly, not "succeed" with nothing staged.
git add \
  src/app/jams/page.tsx \
  src/app/ipr/page.tsx \
  public/images/case-studies/jams \
  public/images/case-studies/ipr \
  src/app/progrexion/page.tsx \
  src/app/seekwell/page.tsx \
  src/components/cmdk/CommandPalette.tsx \
  src/components/home/ProjectCards.tsx \
  scripts/deploy.sh

echo ""
echo "▸ Staged changes:"
git diff --cached --stat
echo ""

if git diff --cached --quiet; then
  echo "  · Nothing new to commit."
else
  git commit -m "add JAMS + iPR case studies; fix SeekWell date to 2022–2025

JAMS Access (/jams):
  - New case study page built on CaseStudyShell
  - Context → Tension → Approach → 3 Decisions → Shipped → Reflection
  - Persona boards, portal site map, file-management whiteboard flows
  - Hero is the shipped Case List; Documents and Submit a Case wizard
    shown inside decisions

iPR Software (/ipr):
  - New case study page framed around the two-job tension:
    enterprise brand newsroom integrator + platform product designer
  - Covers client newsrooms for Target, Toyota, Xerox, NVIDIA,
    Forever 21, Dunkin, American Heart Association
  - Hero is the multi-client iPad composition;
    Forever 21 newsroom used inside approach

Wiring:
  - ProjectCards: JAMS + iPR appended after Progrexion
  - Progrexion PrevNext → /jams
  - JAMS PrevNext → /ipr
  - iPR PrevNext → /
  - CommandPalette: Jump to JAMS, Jump to iPR

Fix:
  - SeekWell date: 2022–2024 → 2022–2025 (homepage + seekwell index)"
  echo "  ✓ Committed:"
  git log -1 --oneline
fi
echo ""

# ---------- Step 3: push ----------
echo "▸ Pushing main to origin…"
# Show the before/after of the remote ref so there's no ambiguity about
# whether anything actually got pushed.
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

echo "Done. Check the deploy at https://vercel.com/ (dashboard)."
