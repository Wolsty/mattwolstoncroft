import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt } from "@/lib/chat/system-prompt";
import { getClientIp, takeToken } from "@/lib/rate-limit";

// Node runtime — we read /docs/*.md from disk at module load for the
// system prompt. Edge would require the corpus to be inlined at build
// time; keeping it on Node is simpler and the latency cost is negligible
// for this endpoint.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 700;
const RATE_LIMIT = 10; // per IP
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      "Server is not configured: ANTHROPIC_API_KEY is missing.",
      { status: 503 },
    );
  }

  const ip = getClientIp(req);
  const rl = takeToken(`chat:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!rl.ok) {
    return new Response(
      `Rate limit hit. Try again at ${new Date(rl.resetAt).toISOString()}.`,
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil((rl.resetAt - Date.now()) / 1000).toString(),
        },
      },
    );
  }

  let body: { message?: string } = {};
  try {
    body = (await req.json()) as { message?: string };
  } catch {
    return new Response("Invalid JSON body.", { status: 400 });
  }
  const message = (body.message ?? "").toString().trim();
  if (!message) {
    return new Response("Message is required.", { status: 400 });
  }
  if (message.length > 1500) {
    return new Response("Message is too long (max 1500 chars).", { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey });
  const systemPrompt = buildSystemPrompt();

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const anthropicStream = anthropic.messages.stream({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: systemPrompt,
          messages: [{ role: "user", content: message }],
        });

        for await (const event of anthropicStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        console.error("[api/chat] stream error", err);
        // Surface a graceful error without leaking internals
        controller.enqueue(
          encoder.encode(
            "\n\n(Sorry — the assistant hit an error mid-response. Try again.)",
          ),
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
    },
  });
}
