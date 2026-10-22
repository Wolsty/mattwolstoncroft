# mattwolstoncroft

## Atlas photos live in Vercel Blob

Photos under `public/atlas-photos/` are **not committed or deployed**. They are stored once in
Vercel Blob at the same paths, and `next.config.mjs` serves `/atlas-photos/*` from there
(behind the Atlas password, as before). Each deploy used to carry its own ~375 MB copy,
which filled the Hobby plan's 10 GB of deployment storage in a day.

After importing new photos into `public/atlas-photos/`, upload them **before pushing**:

```bash
node scripts/atlas-photos-to-blob.mjs
```

It skips photos already in Blob, so only the new ones are uploaded. Each upload counts toward
Blob's 2,000 included operations a month on Hobby.
