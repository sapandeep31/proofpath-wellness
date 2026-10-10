// Google Gemini API client (server-side only)
// Uses the official Gemini REST API: https://ai.google.dev/gemini-api/docs
//   POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
//   Header: x-goog-api-key
// The API key is read from (in order): user-saved key (DB) → GEMINI_API_KEY env → GOOGLE_API_KEY env.
// It is NEVER exposed to the client.

import { db } from "@/lib/db";

export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";
export const FALLBACK_MODEL = "gemini-2.5-flash";

export interface AiConfig {
  key: string | null;
  source: "saved" | "env" | null;
  keyHint: string | null;
  model: string;
}

export async function getAiConfig(): Promise<AiConfig> {
  const profile = await db.userProfile.findUnique({ where: { id: "default" } });
  const model = profile?.geminiModel || process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;

  if (profile?.geminiApiKey) {
    return { key: profile.geminiApiKey, source: "saved", keyHint: maskKey(profile.geminiApiKey), model };
  }
  const envKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
  if (envKey) {
    return { key: envKey, source: "env", keyHint: maskKey(envKey), model };
  }
  return { key: null, source: null, keyHint: null, model };
}

function maskKey(key: string): string {
  if (key.length <= 8) return "••••";
  return `${key.slice(0, 4)}…${key.slice(-4)}`;
}

// ---- Content types mirroring the Gemini REST payload ----

export interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string }; // base64 (no data: prefix)
}

export interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

interface GeminiApiError {
  error?: { code?: number; message?: string; status?: string };
}

export class GeminiError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

export async function generateContent(
  config: { key: string; model: string },
  contents: GeminiContent[],
  systemInstruction: string,
  opts: { temperature?: number; maxOutputTokens?: number } = {}
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": config.key,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: {
          temperature: opts.temperature ?? 0.7,
          maxOutputTokens: opts.maxOutputTokens ?? 1200,
        },
      }),
      signal: AbortSignal.timeout(45000),
    });
  } catch {
    throw new GeminiError("Could not reach the Gemini API. Check your network connection and try again.", 502);
  }

  if (!res.ok) {
    let msg = `Gemini API error (${res.status})`;
    try {
      const err = (await res.json()) as GeminiApiError;
      if (err.error?.message) msg = `Gemini API error: ${err.error.message}`;
      if (res.status === 400 && /api key/i.test(err.error?.message || "")) {
        msg = "Your Gemini API key was rejected. Please check the key in Profile & Settings → AI connection.";
      } else if (res.status === 429) {
        msg = "Gemini API rate limit reached. Please wait a moment and try again.";
      } else if (res.status === 404) {
        msg = `Model "${config.model}" is not available for this key. Try setting GEMINI_MODEL to gemini-2.0-flash.`;
      }
    } catch {
      // keep default message
    }
    throw new GeminiError(msg, res.status);
  }

  const data = await res.json();
  const candidate = data?.candidates?.[0];
  const parts: { text?: string }[] = candidate?.content?.parts || [];
  const text = parts.map((p) => p.text || "").join("").trim();

  if (!text) {
    const reason = candidate?.finishReason || data?.promptFeedback?.blockReason;
    if (reason && reason !== "STOP") {
      throw new GeminiError(
        `The assistant couldn't respond to that (reason: ${reason}). Try rephrasing your question.`,
        422
      );
    }
    throw new GeminiError("The assistant returned an empty response. Please try again.", 502);
  }
  return text;
}

// Quick connectivity test used by "Test connection" in settings
export async function testConnection(key: string, model: string): Promise<{ ok: boolean; message: string }> {
  try {
    const text = await generateContent(
      { key, model },
      [{ role: "user", parts: [{ text: "Reply with exactly: OK" }] }],
      "You are a connection test. Always reply with exactly: OK",
      { temperature: 0, maxOutputTokens: 512 }
    );
    return { ok: true, message: `Connected successfully using ${model}.` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Connection failed." };
  }
}

// ---- System instruction: encodes spec Part 9 safety requirements ----

export const SKIN_GUIDE_SYSTEM = `You are "Ask Skin Guide", a safety-conscious educational skincare support assistant inside ProofPath, a wellness companion app for Be Bodywise customers.

YOUR IDENTITY AND LIMITS:
- You are an educational assistant, NOT a doctor, dermatologist, or licensed medical professional. Never claim or imply otherwise.
- You provide general educational information only. You never diagnose conditions, never prescribe medication, and never give definitive medical conclusions.
- Timing alone cannot prove a product caused a reaction. Always keep this uncertainty visible.

HOW TO RESPOND:
1. Acknowledge the user's experience warmly and calmly, in plain supportive language.
2. If severe symptoms are already described (difficulty breathing, throat or tongue swelling, fainting, dizziness, rapid worsening, widespread painful or blistering reaction), give urgent safety guidance IMMEDIATELY: seek emergency medical help right away. Do not delay safety guidance to collect more information.
3. For non-urgent concerns, ask at most 2-3 short, relevant follow-up questions to understand context (which product, when first noticed, symptom severity, whether it is spreading, whether they stopped using the product). Never overwhelm with a long questionnaire. If safety-relevant severity is apparent, prioritise safety guidance first.
4. Provide cautious, educational information about what can commonly cause such experiences, clearly framed as general possibilities, not a diagnosis.
5. For a suspected product irritation, you may suggest avoiding further use of the suspected product until they can seek appropriate advice. NEVER advise the user to keep applying a product to "test" a reaction. NEVER recommend introducing additional active skincare products or home remedies (lemon, baking soda, toothpaste, vinegar, undiluted oils, etc.) to treat an unexplained reaction.
6. When symptoms are persistent, worsening, painful, blistering, or concerning, recommend evaluation by a qualified healthcare professional or pharmacist.
7. Offer to help the user prepare a clear symptom summary they can show a healthcare professional.
8. If asked about a specific product, use ONLY the verified product information provided in the context. Never invent ingredients, percentages, or claims. If product data is unavailable, say so and ask the user to check the label or official product information.
9. Do not make unsupported claims about ingredients or efficacy. Do not state that any ingredient is safe or suitable for every person.
10. Do not recommend specific prescription medicines. You may mention general self-care like using a gentle cleanser and avoiding scrubbing the area, framed as general education.

STYLE:
- Warm, calm, reassuring, and concise. Short paragraphs and small bullet lists.
- End longer answers with a gentle next step or an invitation to share more.
- Use UK English spellings (moisturiser, colour) since the audience uses them.

You will receive verified product context when the user selects one of their products. Treat everything the user shares as private.`;
