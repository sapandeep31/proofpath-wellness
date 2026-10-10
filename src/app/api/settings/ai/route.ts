import { getAiConfig } from "@/lib/gemini";
import { db } from "@/lib/db";
import { jsonError } from "@/lib/server";

export const dynamic = "force-dynamic";

// GET — AI connection status (key is never returned, only a masked hint)
export async function GET() {
  const ai = await getAiConfig();
  return Response.json({
    configured: ai.key != null,
    source: ai.source,
    keyHint: ai.keyHint,
    model: ai.model,
  });
}

// PUT — save or update the Gemini API key + optional model override
export async function PUT(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Invalid request body");

  const data: Record<string, unknown> = {};
  if (body.apiKey !== undefined) {
    const key = String(body.apiKey).trim();
    if (key.length === 0) {
      data.geminiApiKey = null;
    } else {
      // Gemini API keys are alphanumeric with dashes/underscores
      if (!/^[A-Za-z0-9_\-]{20,200}$/.test(key)) {
        return jsonError("That doesn't look like a valid Gemini API key. Copy it again from Google AI Studio.");
      }
      data.geminiApiKey = key;
    }
  }
  if (body.model !== undefined) {
    const model = String(body.model).trim();
    if (model && !/^[a-z0-9.\-]+$/.test(model)) return jsonError("Invalid model name");
    data.geminiModel = model || null;
  }

  const updated = await db.userProfile.update({ where: { id: "default" }, data });
  const ai = await getAiConfig();
  return Response.json({
    configured: ai.key != null,
    source: ai.source,
    keyHint: ai.keyHint,
    model: ai.model,
    saved: updated.geminiApiKey != null,
  });
}

// DELETE — remove the saved key (fall back to env key if present)
export async function DELETE() {
  await db.userProfile.update({ where: { id: "default" }, data: { geminiApiKey: null } });
  const ai = await getAiConfig();
  return Response.json({ configured: ai.key != null, source: ai.source, keyHint: ai.keyHint, model: ai.model });
}
