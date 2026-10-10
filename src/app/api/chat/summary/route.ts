// Saved summaries — private symptom summaries generated from AI conversations (spec Part 16, step 5)

import { db } from "@/lib/db";
import { getAiConfig, generateContent } from "@/lib/gemini";
import { jsonError } from "@/lib/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const summaries = await db.savedSummary.findMany({ orderBy: { createdAt: "desc" } });
  return Response.json({
    summaries: summaries.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() })),
  });
}

export async function POST() {
  const messages = await db.chatMessage.findMany({ orderBy: { createdAt: "asc" } });
  if (messages.length === 0) return jsonError("There's no conversation to summarise yet");

  const transcript = messages
    .slice(-30)
    .map((m) => `${m.role === "user" ? "Customer" : "Assistant"}: ${m.content}`)
    .join("\n\n")
    .slice(0, 12000);

  const ai = await getAiConfig();
  let content: string;

  if (ai.key) {
    try {
      content = await generateContent(
        { key: ai.key, model: ai.model },
        [
          {
            role: "user",
            parts: [
              {
                text: `Below is a private conversation between a customer and the Ask Skin Guide assistant. Write a concise, neutral summary the customer can show a healthcare professional. Include: main concern, timeline if mentioned, symptoms described, products discussed (only those mentioned), and any self-care steps already taken. Use short bullet points. Do not add diagnoses or advice that wasn't in the conversation.\n\n---\n${transcript}`,
              },
            ],
          },
        ],
        "You write clear, neutral medical-appointment summaries for customers. Output only the summary in markdown bullet points, UK English.",
        { temperature: 0.3, maxOutputTokens: 800 }
      );
    } catch {
      content = buildStaticSummary(messages.map((m) => ({ role: m.role, content: m.content })));
    }
  } else {
    content = buildStaticSummary(messages.map((m) => ({ role: m.role, content: m.content })));
  }

  const firstUserMsg = messages.find((m) => m.role === "user")?.content ?? "Skin concern summary";
  const summary = await db.savedSummary.create({
    data: {
      title: firstUserMsg.slice(0, 60) || "Skin concern summary",
      content,
    },
  });

  return Response.json({ summary: { ...summary, createdAt: summary.createdAt.toISOString() } }, { status: 201 });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (id) {
    await db.savedSummary.deleteMany({ where: { id } });
  } else {
    await db.savedSummary.deleteMany({});
  }
  return Response.json({ ok: true });
}

function buildStaticSummary(messages: { role: string; content: string }[]): string {
  const userMsgs = messages.filter((m) => m.role === "user").map((m) => m.content);
  return [
    "**Private conversation summary (auto-compiled)**",
    "",
    `• **Concerns raised:** ${userMsgs.length ? userMsgs.map((m) => `"${m.slice(0, 120)}"`).join("; ") : "—"}`,
    `• **Messages in conversation:** ${messages.length}`,
    "• **Context:** Conversation with the Ask Skin Guide assistant in ProofPath.",
    "",
    "_Generated from your private AI conversation. Nothing was shared publicly._",
  ].join("\n");
}
