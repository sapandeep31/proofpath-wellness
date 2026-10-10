import { db } from "@/lib/db";
import { jsonError, recalcReminders } from "@/lib/server";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function date(v: unknown): Date | null {
  if (!v || typeof v !== "string") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}
function str(v: unknown, max = 2000): string | null {
  if (v === null || v === undefined || v === "") return null;
  return String(v).slice(0, max);
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const existing = await db.journey.findUnique({ where: { id } });
  if (!existing) return jsonError("Journey not found", 404);

  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Invalid request body");

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) {
    const t = String(body.title).trim();
    if (t.length < 1) return jsonError("Journey title is required");
    data.title = t.slice(0, 80);
  }
  if (body.productId !== undefined) {
    if (body.productId) {
      const p = await db.product.findUnique({ where: { id: String(body.productId) } });
      if (!p) return jsonError("Selected product not found", 404);
    }
    data.productId = body.productId ? String(body.productId) : null;
  }
  if (body.concern !== undefined) {
    const c = String(body.concern).trim();
    if (c.length < 1) return jsonError("Concern is required");
    data.concern = c.slice(0, 60);
  }
  if (body.startDate !== undefined) {
    const d = date(body.startDate);
    if (d) data.startDate = d;
  }
  if (body.baselineCurrent !== undefined) data.baselineCurrent = str(body.baselineCurrent);
  if (body.baselineConcern !== undefined) data.baselineConcern = str(body.baselineConcern, 200);
  if (body.baselineSatisfaction !== undefined)
    data.baselineSatisfaction =
      body.baselineSatisfaction == null
        ? null
        : Math.min(5, Math.max(1, Number(body.baselineSatisfaction) || 1));
  if (body.baselineNotes !== undefined) data.baselineNotes = str(body.baselineNotes);
  if (body.goal !== undefined) data.goal = str(body.goal, 200);
  if (body.checkinFrequency !== undefined)
    data.checkinFrequency = ["daily", "weekly", "biweekly"].includes(String(body.checkinFrequency))
      ? String(body.checkinFrequency)
      : "weekly";
  if (body.privateNotes !== undefined) data.privateNotes = str(body.privateNotes);
  if (body.visibility !== undefined) data.visibility = body.visibility === "community" ? "community" : "private";

  const journey = await db.journey.update({ where: { id }, data });
  await recalcReminders();
  return Response.json({
    journey: { ...journey, startDate: journey.startDate.toISOString(), createdAt: journey.createdAt.toISOString() },
  });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const existing = await db.journey.findUnique({ where: { id } });
  if (!existing) return jsonError("Journey not found", 404);
  await db.journey.delete({ where: { id } });
  await recalcReminders();
  return Response.json({ ok: true });
}
