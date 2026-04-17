import { Resend } from "resend";
import { z } from "zod";
import { getClientIp, takeToken } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Per the "Definition of done": rate-limits after 3 submissions from one
// IP in 10 minutes.
const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 10 * 60 * 1000;

const ContactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z
    .string()
    .trim()
    .email("Valid email is required")
    .max(320),
  message: z.string().trim().min(1, "Message is required").max(5000),
});

export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_EMAIL_TO ?? "wolstoncroft.1@gmail.com";
  const from =
    process.env.CONTACT_EMAIL_FROM ?? "wolstoncroft.1@gmail.com";

  if (!apiKey) {
    return Response.json(
      { error: "Server is not configured: RESEND_API_KEY is missing." },
      { status: 503 },
    );
  }

  const ip = getClientIp(req);
  const rl = takeToken(`contact:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!rl.ok) {
    return Response.json(
      {
        error:
          "Too many messages from this address. Please try again in a few minutes.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil((rl.resetAt - Date.now()) / 1000).toString(),
        },
      },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return Response.json(
      { error: first?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const { name, email, message } = parsed.data;

  const resend = new Resend(apiKey);

  try {
    const result = await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject: `Portfolio contact — ${name}`,
      text: [
        `From: ${name} <${email}>`,
        `IP: ${ip}`,
        "",
        message,
      ].join("\n"),
    });
    if ("error" in result && result.error) {
      console.error("[api/contact] resend error", result.error);
      return Response.json(
        { error: "Couldn't send right now. Try again." },
        { status: 502 },
      );
    }
  } catch (err) {
    console.error("[api/contact] unexpected error", err);
    return Response.json(
      { error: "Couldn't send right now. Try again." },
      { status: 502 },
    );
  }

  return Response.json({ ok: true });
}
