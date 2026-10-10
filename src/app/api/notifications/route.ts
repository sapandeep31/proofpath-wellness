import { db } from "@/lib/db";
import { jsonError } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const notifications = await db.notification.findMany({ orderBy: [{ scheduledFor: "desc" }] });
  return Response.json({
    notifications: notifications.map((n) => ({
      ...n,
      scheduledFor: n.scheduledFor.toISOString(),
      createdAt: n.createdAt.toISOString(),
    })),
  });
}

// Mark read: { id } or { all: true }
export async function PATCH(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Invalid request body");
  if (body.all) {
    await db.notification.updateMany({ where: { read: false }, data: { read: true } });
    return Response.json({ ok: true });
  }
  if (!body.id) return jsonError("Notification id required");
  await db.notification.update({ where: { id: String(body.id) }, data: { read: true } });
  return Response.json({ ok: true });
}

// Clear all read notifications
export async function DELETE() {
  await db.notification.deleteMany({ where: { read: true } });
  return Response.json({ ok: true });
}
