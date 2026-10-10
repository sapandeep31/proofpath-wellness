import { db } from "@/lib/db";
import { ensureProfile, isSeeded, seedDemoData } from "@/lib/seed";
import { recalcReminders, serializeProfile } from "@/lib/server";
import { getAiConfig } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function GET() {
  const profile = await ensureProfile();

  // Seed demo data on first run (or when demo data was cleared but demoMode is on and nothing exists)
  if ((await db.product.count()) === 0 && (await isSeeded()) === false) {
    await seedDemoData();
  }
  if (profile.demoMode && (await db.product.count()) === 0) {
    await seedDemoData();
  }

  await recalcReminders();
  const ai = await getAiConfig();
  const fresh = await db.userProfile.findUnique({ where: { id: "default" } });

  return Response.json({
    profile: serializeProfile(fresh ?? profile, ai),
    seeded: await isSeeded(),
  });
}
