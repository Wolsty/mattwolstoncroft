import fs from "node:fs";
import path from "node:path";

/**
 * Build-time (server cold start) concatenation of the case-study source
 * material. The Anthropic system prompt stuffs this in so the model can
 * answer grounded questions about Matthew's work without hallucinating.
 *
 * The brief sets a soft ceiling of ~20k tokens for the concatenated
 * corpus. If these three files ever exceed that, trim the Progrexion
 * archive sections first (sections 5-8 of case-studies-content.md).
 */

const CORPUS_FILES = [
  "labnotes-case-study.md",
  "cengage-case-study.md",
  "case-studies-content.md",
];

let cachedCorpus: string | null = null;

function loadCorpus(): string {
  if (cachedCorpus !== null) return cachedCorpus;
  const docsDir = path.join(process.cwd(), "docs");
  const parts: string[] = [];
  for (const file of CORPUS_FILES) {
    const fullPath = path.join(docsDir, file);
    try {
      const content = fs.readFileSync(fullPath, "utf-8");
      parts.push(`# Source: ${file}\n\n${content.trim()}`);
    } catch (err) {
      // Fail loudly in logs but keep serving — better to answer with
      // partial corpus than to 500 on every request.
      console.error(`[chat/system-prompt] failed to read ${fullPath}`, err);
    }
  }
  cachedCorpus = parts.join("\n\n---\n\n");
  return cachedCorpus;
}

export const SYSTEM_PROMPT_PREAMBLE = `You answer questions about Matthew Wolstoncroft's portfolio work. Use only the case-study content provided below. Be concise and specific — pull real numbers, project names, decisions, and outcomes directly from the material. If the question is off-topic (not about Matthew, his work, or product / design / AI), redirect gracefully in one sentence ("I mostly answer questions about Matthew's product and design work — happy to dig into LabNotes, Cengage, SeekWell, or the archive."). Never invent details that aren't in the material. If a specific fact isn't in the material, say so. Speak in Matthew's voice: direct, unrhetorical, opinionated, no exclamation points, no filler.

Formatting: plain prose, no headings, no markdown lists unless the answer is naturally a short enumeration.`;

export function buildSystemPrompt(): string {
  return `${SYSTEM_PROMPT_PREAMBLE}\n\n---\n\nPORTFOLIO MATERIAL:\n\n${loadCorpus()}`;
}
