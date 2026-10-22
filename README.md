# mattwolstoncroft

## Atlas photos live in Vercel Blob

Photos under `public/atlas-photos/` are **not committed or deployed**. They are stored once in
Vercel Blob at the same paths, and `next.config.mjs` serves `/atlas-photos/*` from there
(behind the Atlas password, as before). Each deploy used to carry its own ~375 MB copy,
which filled the Hobby plan's 10 GB of deployment storage in a day.

New photos upload **automatically when you push**: `.githooks/pre-push` runs
`scripts/atlas-photos-to-blob.mjs` first. It keeps a local list of what's already
uploaded, so a push with no new photos makes no calls to Blob, and only new photos count
toward Blob's 2,000 included operations a month on Hobby. If an upload fails, the push
stops rather than deploying broken photos.

Photos added through the Atlas's own upload button go straight to Blob and need nothing.

Setting up a new clone (once): `git config core.hooksPath .githooks`, and put
`BLOB_READ_WRITE_TOKEN=...` (Vercel > Storage > mattwolstoncroft-blob > .env.local tab)
in `.env.production.local`.
