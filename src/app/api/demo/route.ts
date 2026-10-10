import { db } from "@/lib/db";
import { clearDemoData, seedDemoData } from "@/lib/seed";
import { jsonError } from "@/lib/server";

export const dynamic = "force-dynamic";

// POST /api/demo/clear — remove sample/demo data, keep user-created records
export async function POST() {
  try {
    await clearDemoData();
    return Response.json({ ok: true });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Could not clear demo data", 500);
  }
}

// PUT /api/demo — re-seed sample data
export async function PUT() {
  try {
    await seedDemoData();
    return Response.json({ ok: true });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Could not re-seed demo data", 500);
  }
}

// DELETE /api/demo — wipe everything (full reset)
export async function DELETE() {
  try {
    await db.checkIn.deleteMany({});
    await db.journey.deleteMany({});
    await db.usageLog.deleteMany({});
    await db.product.deleteMany({});
    await db.notification.deleteMany({});
    await db.chatMessage.deleteMany({});
    await db.savedSummary.deleteMany({});
    const posts = await db.communityPost.findMany({ select: { id: true } });
    for (const p of posts) {
      await db.comment.deleteMany({ where: { postId: p.id } });
      await db.reaction.deleteMany({ where: { postId: p.id } });
    }
    await db.communityPost.deleteMany({});
    await db.userProfile.update({ where: { id: "default" }, data: { onboarded: true } });
    return Response.json({ ok: true });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Could not wipe data", 500);
  }
}
