import { db } from "@/lib/db";
import { ensureProfile } from "@/lib/seed";
import { jsonError, serializeProfile } from "@/lib/server";
import { getAiConfig } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function GET() {
  const profile = await ensureProfile();
  const ai = await getAiConfig();
  return Response.json({ profile: serializeProfile(profile, ai) });
}

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return jsonError("Invalid request body");

  const data: Record<string, unknown> = {};

  if (body.displayName !== undefined) {
    const name = String(body.displayName).trim();
    if (name.length < 1 || name.length > 40) return jsonError("Display name must be 1-40 characters");
    data.displayName = name;
  }
  if (body.avatarColor !== undefined) {
    const c = String(body.avatarColor);
    if (!/^#[0-9a-fA-F]{6}$/.test(c)) return jsonError("Invalid avatar colour");
    data.avatarColor = c;
  }
  if (body.interests !== undefined) {
    if (!Array.isArray(body.interests)) return jsonError("Interests must be a list");
    data.interests = JSON.stringify(body.interests.slice(0, 12).map(String));
  }
  if (body.goal !== undefined) data.goal = body.goal ? String(body.goal).slice(0, 120) : null;
  if (body.onboarded !== undefined) data.onboarded = Boolean(body.onboarded);
  if (body.demoMode !== undefined) data.demoMode = Boolean(body.demoMode);
  if (body.reminderPrefs !== undefined && typeof body.reminderPrefs === "object") {
    data.reminderPrefs = JSON.stringify(body.reminderPrefs);
  }
  if (body.notifCats !== undefined && typeof body.notifCats === "object") {
    data.notifCats = JSON.stringify(body.notifCats);
  }
  if (body.recentlyViewed !== undefined && Array.isArray(body.recentlyViewed)) {
    data.recentlyViewed = JSON.stringify(body.recentlyViewed.slice(0, 8));
  }

  if (Object.keys(data).length === 0) return jsonError("Nothing to update");

  await ensureProfile();
  const updated = await db.userProfile.update({ where: { id: "default" }, data });
  const ai = await getAiConfig();
  return Response.json({ profile: serializeProfile(updated, ai) });
}
