import { db } from "@/lib/db";
import { jsonError, recalcReminders, serializeProduct } from "@/lib/server";
import { frequencyToPerWeek } from "@/lib/calc";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const product = await db.product.findUnique({ where: { id }, include: { usageLogs: { orderBy: { loggedAt: "desc" } } } });
  if (!product) return jsonError("Product not found", 404);
  return Response.json({
    product: serializeProduct(product),
    usageLogs: product.usageLogs.map((l) => ({ ...l, loggedAt: l.loggedAt.toISOString() })),
  });
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function date(v: unknown): Date | null {
  if (!v || typeof v !== "string") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}
function str(v: unknown, max = 300): string | null {
  if (v === null || v === undefined || v === "") return null;
  return String(v).slice(0, max);
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const existing = await db.product.findUnique({ where: { id } });
  if (!existing) return jsonError("Product not found", 404);

  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Invalid request body");

  const data: Record<string, unknown> = {};
  const touch = (k: string, v: unknown) => {
    if (v !== undefined) data[k] = v;
  };

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (name.length < 1) return jsonError("Product name is required");
    data.name = name.slice(0, 80);
  }
  touch("brand", str(body.brand, 60));
  if (body.category !== undefined) data.category = str(body.category, 20) || "Skincare";
  if (body.artKey !== undefined) data.artKey = str(body.artKey, 20) || "bottle";
  if (body.artHue !== undefined) data.artHue = Math.min(360, Math.max(0, num(body.artHue) ?? 140));
  touch("sizeValue", num(body.sizeValue));
  if (body.unit !== undefined) data.unit = str(body.unit, 10) || "mL";
  if (body.purchaseDate !== undefined) data.purchaseDate = date(body.purchaseDate);
  if (body.openingDate !== undefined) data.openingDate = date(body.openingDate);

  if (body.quantityKnown !== undefined) {
    data.quantityKnown = Boolean(body.quantityKnown);
    if (!body.quantityKnown) data.currentQuantity = null;
  }
  if (body.startingQuantity !== undefined) {
    const v = num(body.startingQuantity);
    if (v != null && v < 0) return jsonError("Starting quantity cannot be negative");
    data.startingQuantity = v;
  }
  if (body.currentQuantity !== undefined) {
    const v = num(body.currentQuantity);
    if (v != null && v < 0) return jsonError("Current quantity cannot be negative");
    data.currentQuantity = v;
    data.quantityKnown = v != null;
  }

  touch("amountPerUse", num(body.amountPerUse));
  if (body.frequency !== undefined) {
    data.frequency = str(body.frequency, 20) || null;
    data.applicationsPerWeek =
      body.applicationsPerWeek !== undefined && body.applicationsPerWeek !== ""
        ? num(body.applicationsPerWeek)
        : frequencyToPerWeek(data.frequency as string | null);
  } else if (body.applicationsPerWeek !== undefined) {
    data.applicationsPerWeek = body.applicationsPerWeek === "" ? null : num(body.applicationsPerWeek);
  }

  touch("price", num(body.price));
  if (body.purchaseLink !== undefined) {
    const link = str(body.purchaseLink, 500);
    if (link && !/^https?:\/\//i.test(link)) return jsonError("Purchase link must start with http:// or https://");
    data.purchaseLink = link;
  }
  if (body.expiryDate !== undefined) data.expiryDate = date(body.expiryDate);
  touch("batchNumber", str(body.batchNumber, 40));
  touch("notes", str(body.notes, 2000));
  touch("instructions", str(body.instructions, 2000));
  touch("ingredients", str(body.ingredients, 3000));

  if (body.status !== undefined) {
    if (!["active", "paused", "finished", "archived"].includes(String(body.status))) return jsonError("Invalid status");
    data.status = String(body.status);
  }
  if (body.firstReminderDays !== undefined)
    data.firstReminderDays = Math.min(60, Math.max(1, num(body.firstReminderDays) ?? 7));
  if (body.secondReminderEnabled !== undefined) data.secondReminderEnabled = Boolean(body.secondReminderEnabled);
  if (body.secondReminderDays !== undefined)
    data.secondReminderDays = Math.min(30, Math.max(1, num(body.secondReminderDays) ?? 3));
  if (body.finalReminderEnabled !== undefined) data.finalReminderEnabled = Boolean(body.finalReminderEnabled);

  // cross-field sanity
  const sq = (data.startingQuantity as number | null) ?? existing.startingQuantity;
  const cq = (data.currentQuantity as number | null) ?? existing.currentQuantity;
  if (sq != null && cq != null && cq > sq) return jsonError("Current quantity cannot be more than the starting quantity");

  const product = await db.product.update({ where: { id }, data });
  await recalcReminders();
  return Response.json({ product: serializeProduct(product) });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const existing = await db.product.findUnique({ where: { id } });
  if (!existing) return jsonError("Product not found", 404);
  await db.product.delete({ where: { id } });
  await recalcReminders();
  return Response.json({ ok: true });
}
