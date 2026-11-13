# Family tree (/family)

A private family tree for the Wolstoncroft–Specht family, shared with family only.

## Access

- `/family` has its own password, separate from the portfolio and the Atlas. Set `FAMILY_PASSWORD` in Vercel. Capital letters and spaces don't matter when family type it.
- Reviewing what family send in needs `FAMILY_EDIT_PASSWORD` (falls back to `ATLAS_EDIT_PASSWORD`). Sign in at `/family/review`.
- Links to one person survive sign-in: `/family#ed`.

## Updating the tree

All people, lines, groups, open questions and sources live in `src/content/family.json`. Edit only that file.

- `parents` and `spouse` drive relationships, the "How you're related" path and the Family section. Add them for anyone new.
- `rel` is the relationship to Matthew, used as written when viewing as Matthew. For anyone else, relationships are computed.
- `living: true` people show name and relationship only. Keep their facts minimal: no cities, employers or dates.
- `questions[].people` puts a question on those people's pages.

## What family send in

Memories, photos, corrections, answers and new relatives go to Vercel Blob (same store as the Atlas) under `family/`. Nothing appears until approved at `/family/review`. Each submission emails `FAMILY_NOTIFY_TO` (or `CONTACT_EMAIL_TO`) through Resend.

Approved memories and photos show on the person's page. Corrections and new relatives need a data change: use "Copy as a data update" in the review queue and paste it to Claude.

Photos are served only through `/family-photos/`, behind the family password.
