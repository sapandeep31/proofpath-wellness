import { db } from "@/lib/db";
import { jsonError } from "@/lib/server";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const existing = await db.checkIn.findUnique({ where: { id } });
  if (!existing) return jsonError("Check-in not found", 404);

  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Invalid request body");

  const data: Record<string, unknown> = {};
  if (body.overallRating !== undefined)
    data.overallRating =
      body.overallRating == null ? null : Math.min(5, Math.max(1, Number(body.overallRating) || 1));
  if (body.change !== undefined)
    data.change = ["improved", "same", "worsened", "unsure"].includes(String(body.change)) ? String(body.change) : null;
  if (body.consistency !== undefined)
    data.consistency = ["every-day", "most-days", "some-days", "rarely"].includes(String(body.consistency))
      ? String(body.consistency)
      : null;
  if (body.reactions !== undefined)
    data.reactions = ["none", "mild", "moderate", "severe"].includes(String(body.reactions))
      ? String(body.reactions)
      : null;
  if (body.reactionDetails !== undefined)
    data.reactionDetails = typeof body.reactionDetails === "string" ? body.reactionDetails.slice(0, 1000) : null;
  if (body.notes !== undefined)
    data.notes = typeof body.notes === "string" ? body.notes.slice(0, 2000) : null;
  if (body.date !== undefined) {
    const d = new Date(String(body.date));
    if (!Number.isNaN(d.getTime()) && d.getTime() <= Date.now() + 24 * 60 * 60 * 1000) data.date = d;
  }

  const checkin = await db.checkIn.update({ where: { id }, data });
  return Response.json({
    checkin: { ...checkin, date: checkin.date.toISOString(), createdAt: checkin.createdAt.toISOString() },
  });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const existing = await db.checkIn.findUnique({ where: { id } });
  if (!existing) return jsonError("Check-in not found", 404);
  await db.checkIn.delete({ where: { id } });
  return Response.json({ ok: true });
}
