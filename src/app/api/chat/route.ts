// AI Skin Support — "Ask Skin Guide"
// Real integration: Google Gemini API (generativelanguage.googleapis.com), key from DB or env.
// Fallback: clearly-labelled demo assistant when no key is configured (spec 9.6).

import { db } from "@/lib/db";
import { GeminiError, SKIN_GUIDE_SYSTEM, generateContent, getAiConfig, type GeminiContent } from "@/lib/gemini";
import { jsonError, rateLimit, serializeProduct } from "@/lib/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Emergency keyword pre-check — safety guidance must never wait on the model (spec 9.4)
const EMERGENCY_RE =
  /\b(can'?t breathe|cannot breathe|difficulty breathing|hard to breathe|throat (is )?swell|tongue (is )?swell|swelling of (the )?throat|swelling of (the )?tongue|faint(ed|ing)?|about to pass out|anaphyla|xhersis|lips turning|blue lips|widespread blister|rapidly worsening|whole (body|face) swelling|hives everywhere)\b/i;

const URGENT_BANNER =
  "**This may be an emergency.** Difficulty breathing, throat or tongue swelling, fainting, or rapidly worsening symptoms can signal a serious allergic reaction. Seek emergency medical help immediately (in India, dial 112 or go to the nearest emergency department). Do not wait for further advice from this app.";

function demoReply(message: string): string {
  const m = message.toLowerCase();

  if (EMERGENCY_RE.test(message)) {
    return `${URGENT_BANNER}\n\nI'm a demonstration assistant, so please treat this message as general information only — but do not wait on me for this one. Pause the product you suspect, and get medical help now.`;
  }

  if (/\b(bump|breakout|pimple|acne|spots?)\b/.test(m)) {
    return [
      "Thank you for telling me — new bumps after a product change are worth looking at carefully.",
      "",
      "A few short questions so I understand better:",
      "• When did the bumps first appear after starting the product?",
      "• Are they itchy, painful, or spreading?",
      "• Have you paused the product since noticing them?",
      "",
      "Some general educational context:",
      "• Timing alone can't prove the product caused the bumps — skin can react to many things at once. But a new product is a reasonable thing to review.",
      "• A cautious step many people take is to stop applying the suspected product until they can get appropriate advice, rather than continuing to test it on reactive skin.",
      "• Avoid adding new actives or home remedies to treat it — that often complicates the picture.",
      "",
      "If the bumps become painful, blistered, widespread, or keep worsening, please have a healthcare professional take a look. I can help you prepare a short symptom summary to show them.",
      "",
      "_You're chatting with the ProofPath demo assistant. Connect a Gemini API key in Profile & Settings → AI connection for live, AI-generated guidance._",
    ].join("\n");
  }

  if (/\b(itch|itchy|irritat|red|burn|sting)\b/.test(m)) {
    return [
      "I'm sorry your skin is feeling uncomfortable — let's think through it calmly.",
      "",
      "A few quick questions:",
      "• Where exactly is the irritation, and when did it start?",
      "• Is it mild, moderate, or getting quickly worse?",
      "• Did you apply anything new in the last few days?",
      "",
      "General educational notes:",
      "• Redness and itching after a new product can have several causes; timing alone can't confirm which one applies to you.",
      "• It's generally advised not to keep applying a suspected product to test the reaction, and not to layer on additional active products or home remedies.",
      "• If the irritation is spreading, painful, blistering, or persists beyond a few days, a pharmacist or doctor can give you advice suited to your skin.",
      "",
      "_You're chatting with the ProofPath demo assistant. Connect a Gemini API key in Profile & Settings → AI connection for live, AI-generated guidance._",
    ].join("\n");
  }

  if (/\bingredient\b|\blabel\b|\blist\b/.test(m)) {
    return [
      "I can help you read an ingredient list in general terms.",
      "",
      "If you select a product from My Products while chatting, I'll use its verified details. Otherwise, you can type the ingredients exactly as they appear on your label, and I'll explain the common role of each — humectant, emollient, surfactant, preservative, and so on.",
      "",
      "One caveat: an ingredient being present doesn't tell us how your skin responds to it, and 'natural' doesn't automatically mean gentler. If you've noticed a reaction, a professional can test properly.",
      "",
      "_You're chatting with the ProofPath demo assistant._",
    ].join("\n");
  }

  if (/\bdermatolog|doctor|appointment|prepare|questions?\b/.test(m)) {
    return [
      "Preparing before an appointment helps a lot. Here's a checklist you can bring:",
      "",
      "• **When it started** and what changed in your routine around then.",
      "• **Your symptoms**: where they appear, how they feel, and whether they've spread.",
      "• **Products used**, with photos of the ingredient labels if possible.",
      "• **What you've already tried** (stopping a product, gentle cleansing, etc.).",
      "• **Photos** of the area taken across a few days.",
      "",
      "A useful set of questions to ask: *What could explain this? What should I do if it worsens? Which ingredients should I avoid while it settles?*",
      "",
      "You can tap **Save summary** above and I'll compile your conversation into a private note you can show a professional.",
      "",
      "_You're chatting with the ProofPath demo assistant._",
    ].join("\n");
  }

  return [
    "Thank you for sharing that. I'm here to help you understand what you're experiencing and find a safe next step.",
    "",
    "A few short questions to start:",
    "• Which product do you suspect, and when did you last use it?",
    "• What exactly are you noticing (redness, itching, bumps, dryness)?",
    "• Is it mild, moderate, severe, or rapidly worsening?",
    "",
    "I can offer general educational information, help you review a product's label, and help you prepare a summary for a healthcare professional. I can't diagnose or prescribe — for persistent or concerning symptoms, a qualified professional is the right next step.",
    "",
    "_You're chatting with the ProofPath demo assistant. Connect a Gemini API key in Profile & Settings → AI connection for live, AI-generated guidance._",
  ].join("\n");
}

export async function GET() {
  const messages = await db.chatMessage.findMany({ orderBy: { createdAt: "asc" } });
  const ai = await getAiConfig();
  return Response.json({
    messages: messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      productId: m.productId,
      imageMime: m.imageMime,
      hasImage: m.imageData != null,
      demo: m.demo,
      createdAt: m.createdAt.toISOString(),
    })),
    aiConfigured: ai.key != null,
    aiModel: ai.model,
    aiKeySource: ai.source,
  });
}

export async function POST(req: Request) {
  if (!rateLimit("chat", 15, 60_000)) {
    return jsonError("You're sending messages quickly. Please wait a few seconds and try again.", 429);
  }

  const body = await req.json().catch(() => null);
  const message = body?.message ? String(body.message).trim() : "";
  const productId = body?.productId ? String(body.productId) : null;
  const imageMime = body?.imageMime ? String(body.imageMime) : null;
  const imageData = body?.imageData ? String(body.imageData) : null; // base64 without prefix

  if (!message && !imageData) return jsonError("Type a question first");
  if (message.length > 4000) return jsonError("Message is too long (max 4000 characters)");
  if (imageData && imageData.length > 4_500_000) return jsonError("Image is too large — please use one under about 3 MB");
  if (imageData && !/^image\/(png|jpeg|jpg|webp|heic|heif)$/.test(imageMime ?? ""))
    return jsonError("Unsupported image type. Use PNG, JPEG or WebP.");

  // Save the user's message
  const userMsg = await db.chatMessage.create({
    data: { role: "user", content: message || "(shared a photo)", productId, imageMime, imageData, demo: false },
  });

  const ai = await getAiConfig();
  const isEmergency = EMERGENCY_RE.test(message);

  // Build product-aware context (verified data only — never invented)
  let productContext = "";
  if (productId) {
    const product = await db.product.findUnique({ where: { id: productId } });
    if (product) {
      const p = serializeProduct(product);
      productContext = [
        "The user selected this product from their inventory. Use ONLY these verified details; if a field is missing, say the information isn't available rather than guessing:",
        `- Name: ${p.name}`,
        `- Brand (as entered): ${p.brand || "not specified"}`,
        `- Category: ${p.category}`,
        p.ingredients ? `- Ingredient list (as entered by the user): ${p.ingredients}` : "- Ingredient list: not available — ask the user to check the label",
        p.instructions ? `- Directions for use: ${p.instructions}` : "",
        p.notes ? `- User's own notes: ${p.notes}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    }
  }

  let replyText: string;
  let demo = false;

  if (!ai.key) {
    demo = true;
    replyText = demoReply(message);
  } else {
    try {
      // Conversation history (last 20 messages)
      const history = await db.chatMessage.findMany({ orderBy: { createdAt: "asc" } });
      const recent = history.slice(-21, -1); // exclude the message just saved
      const contents: GeminiContent[] = [];
      for (const h of recent) {
        if (!h.content) continue;
        const parts: GeminiContent["parts"] = [];
        if (h.imageData && h.imageMime) {
          parts.push({ inlineData: { mimeType: h.imageMime, data: h.imageData } });
        }
        parts.push({ text: h.content });
        contents.push({ role: h.role === "user" ? "user" : "model", parts });
      }
      const parts: GeminiContent["parts"] = [];
      if (imageData && imageMime) {
        parts.push({ inlineData: { mimeType: imageMime, data: imageData } });
        parts.push({ text: message || "Here is a photo of my skin. What general things should I know?" });
      } else {
        parts.push({ text: message });
      }
      contents.push({ role: "user", parts });

      const system = productContext
        ? `${SKIN_GUIDE_SYSTEM}\n\n---\nVERIFIED PRODUCT CONTEXT (from the user's inventory):\n${productContext}`
        : SKIN_GUIDE_SYSTEM;

      replyText = await generateContent({ key: ai.key, model: ai.model }, contents, system, {
        temperature: 0.6,
        maxOutputTokens: 1400,
      });
    } catch (e) {
      const msg = e instanceof GeminiError ? e.message : "The AI assistant is unavailable right now.";
      const status = e instanceof GeminiError ? e.status : 502;
      // Roll back the user message save? Keep it — the user can retry. Return error to UI.
      return Response.json({ error: msg, savedMessageId: userMsg.id }, { status });
    }
  }

  if (isEmergency && !replyText.includes("emergency medical help")) {
    replyText = `${URGENT_BANNER}\n\n${replyText}`;
  }

  const modelMsg = await db.chatMessage.create({
    data: { role: "model", content: replyText, productId, demo },
  });

  return Response.json({
    reply: {
      id: modelMsg.id,
      role: "model",
      content: modelMsg.content,
      productId: modelMsg.productId,
      demo,
      createdAt: modelMsg.createdAt.toISOString(),
    },
    demo,
    savedMessageId: userMsg.id,
  });
}

export async function DELETE() {
  await db.chatMessage.deleteMany({});
  return Response.json({ ok: true });
}
