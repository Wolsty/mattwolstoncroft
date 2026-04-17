# mattwolstoncroft — start here

## 1. Drop in your assets

- **BL Arctic font files** → `public/fonts/` (`.woff2` for 400 regular + italic if you have it)
- **LabNotes screenshots** → `public/images/case-studies/labnotes/`
  - `ai-insights-integrity.png` (hero — 246 flags)
  - `chat-with-labnotes.png`
  - `course-dashboard.png`
  - `ai-insights-struggles.png`
  - `assignments.png`
  - `ai-insights-overview.png`
  - `tutor-interaction.png` (student view — optional; the LiveArtifact component covers this if missing)
- **Cengage screenshots** → `public/images/case-studies/cengage/`
  - `adapt-content.png` (hero — side-by-side)
  - `select-content-populated.png`
  - `select-content-empty.png`
  - `explore-home.png`

## 2. Launch Claude Code

From this folder:

```bash
claude --model claude-opus-4-7
```

Then paste the prompt from `docs/claude-code-prompt.md` (everything from `You are building...` down to `Ship it.`).

Claude Code will pause and ask for:
- `ANTHROPIC_API_KEY`
- `RESEND_API_KEY`

…when it reaches those steps. You don't need them upfront.

If you don't have Claude Code installed:

```bash
npm install -g @anthropic-ai/claude-code
```
