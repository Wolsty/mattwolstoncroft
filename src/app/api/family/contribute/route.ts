import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import data from "@/content/family.json";
import type { Contribution, FamilyData } from "@/lib/family/types";
import { isFamily, isFamilyOwner } from "@/lib/familyAuth";
import { readModeration, saveContribution, storeConfigured, writeModeration } from "@/lib/familyStore";
import { getClientIp, takeToken } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const family = data as unknown as FamilyData;

const Schema = z.object({
  kind: z.enum(["memory", "photo", "correction", "answer", "person"]),
  personId: z.string().max(60).optional(),
  questionId: z.string().max(60).optional(),
  text: z.string().trim().max(8000).default(""),
  photos: z
    .array(z.string().regex(/^\/family-photos\/[0-9a-f-]{36}\.(jpg|png|webp)$/))
    .max(12)
    .default([]),
  by: z.string().trim().min(1, "Please add your name.").max(80),
  byRelation: z.string().trim().max(80).optional(),
  byPersonId: z.string().max(60).optional(),
  contact: z.string().trim().max(200).optional(),
});

const KIND_WORDS: Record<Contribution["kind"], string> = {
  memory: "a memory",
  photo: "photos",
  correction: "a correction",
  answer: "an answer",
  person: "a new relative",
};

/** A family member sends something in. It waits for Matthew unless Matthew sent it. */
export async function POST(req: Request) {
  const owner = await isFamilyOwner(req);
  if (!owner && !(await isFamily(req))) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!storeConfigured()) return NextResponse.json({ error: "Saving isn't set up yet. Tell Matthew directly for now." }, { status: 503 });
  if (!owner && !takeToken(`family-contrib:${getClientIp(req)}`, 12, 10 * 60 * 1000).ok)
    return NextResponse.json({ error: "Thanks for all of it! Please wait a few minutes before sending more." }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Something's missing." }, { status: 400 });
  const input = parsed.data;

  const personId = input.personId && family.people[input.personId] ? input.personId : undefined;
  const question = input.questionId ? family.questions.find((q) => q.id === input.questionId) : undefined;
  const byPersonId = input.byPersonId && family.people[input.byPersonId] ? input.byPersonId : undefined;
  if (!input.text && !input.photos.length) return NextResponse.json({ error: "Add a few words or a photo." }, { status: 400 });

  const c: Contribution = {
    id: crypto.randomUUID(),
    kind: input.photos.length && !input.text && input.kind === "memory" ? "photo" : input.kind,
    personId: personId ?? question?.people[0],
    questionId: question?.id,
    text: input.text,
    photos: input.photos,
    by: input.by,
    byRelation: input.byRelation || undefined,
    byPersonId,
    contact: input.contact || undefined,
    createdAt: new Date().toISOString(),
  };
  await saveContribution(c);

  if (owner) {
    const mod = await readModeration();
    mod.status[c.id] = "approved";
    await writeModeration(mod);
  } else {
    await notify(c).catch((e) => console.error("[family] notify", e));
  }
  return NextResponse.json({ ok: true, id: c.id, approved: owner });
}

async function notify(c: Contribution) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const to = process.env.FAMILY_NOTIFY_TO ?? process.env.CONTACT_EMAIL_TO ?? "wolstoncroft.1@gmail.com";
  const from = process.env.CONTACT_EMAIL_FROM ?? "wolstoncroft.1@gmail.com";
  const about = c.personId ? family.people[c.personId]?.n : undefined;
  const q = c.questionId ? family.questions.find((x) => x.id === c.questionId)?.q : undefined;
  const subject = `${c.by} sent ${KIND_WORDS[c.kind]}${about ? ` about ${about}` : ""}`;
  await new Resend(apiKey).emails.send({
    from,
    to,
    subject: `Family tree: ${subject}`,
    text: [
      `${c.by}${c.byRelation ? ` (${c.byRelation})` : ""} sent ${KIND_WORDS[c.kind]}${about ? ` about ${about}` : ""}.`,
      q ? `\nQuestion: ${q}` : "",
      c.text ? `\n${c.text}` : "",
      c.photos.length ? `\n${c.photos.length} photo${c.photos.length > 1 ? "s" : ""} attached.` : "",
      c.contact ? `\nContact: ${c.contact}` : "",
      `\nReview it: https://www.mattwolstoncroft.com/family/review`,
    ].join("\n"),
  });
}
