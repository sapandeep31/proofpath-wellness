import { db } from "@/lib/db";
import { jsonError, recalcReminders, serializeProduct } from "@/lib/server";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// Three quantity-tracking methods (spec 6.3):
//   manual  — user enters the current estimated quantity
//   usage   — user records the amount used in an application
//   visual  — quick visual estimate (full / 3/4 / half / 1/4 / almost empty)
const VISUAL_LEVELS: Record<string, number> = {
  full: 1,
  "three-quarter": 0.75,
  half: 0.5,
  quarter: 0.25,
  "almost-empty": 0.08,
};

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const product = await db.product.findUnique({ where: { id } });
  if (!product) return jsonError("Product not found", 404);

  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Invalid request body");
  const method = String(body.method ?? "");
  if (!["manual", "usage", "visual"].includes(method)) return jsonError("Invalid tracking method");

  let newQuantity = product.currentQuantity;
  let amountUsed: number | null = null;
  let note: string | null = typeof body.note === "string" ? body.note.slice(0, 300) : null;

  if (method === "manual") {
    const q = Number(body.currentQuantity);
    if (!Number.isFinite(q) || q < 0) return jsonError("Enter a valid, non-negative quantity");
    if (product.startingQuantity != null && q > product.startingQuantity)
      return jsonError("Current quantity cannot be more than the starting quantity");
    amountUsed = product.currentQuantity != null ? Math.max(0, product.currentQuantity - q) : null;
    newQuantity = q;
  } else if (method === "usage") {
    const used = Number(body.amountUsed);
    if (!Number.isFinite(used) || used <= 0) return jsonError("Enter the amount you used (greater than 0)");
    if (product.currentQuantity == null) return jsonError("Update your current quantity first so usage can be tracked");
    newQuantity = Math.max(0, product.currentQuantity - used);
    amountUsed = used;
  } else if (method === "visual") {
    const level = String(body.level ?? "");
    if (!VISUAL_LEVELS[level]) return jsonError("Choose one of the visual levels");
    const base = product.startingQuantity ?? product.sizeValue;
    if (base == null) return jsonError("Add the product size first so visual updates can be calculated");
    newQuantity = Math.round(base * VISUAL_LEVELS[level] * 100) / 100;
    amountUsed = product.currentQuantity != null ? Math.max(0, product.currentQuantity - newQuantity) : null;
    note = note ?? `Visual update: ${level.replace("-", " ")}`;
  }

  const updated = await db.product.update({
    where: { id },
    data: { currentQuantity: newQuantity, quantityKnown: true },
  });

  if (method === "usage" && amountUsed != null) {
    await db.usageLog.create({
      data: { productId: id, amountUsed, unit: product.unit, method, note },
    });
  } else if (method === "manual" || method === "visual") {
    await db.usageLog.create({
      data: { productId: id, amountUsed: amountUsed ?? 0, unit: product.unit, method, note: note ?? "Manual quantity update" },
    });
  }

  await recalcReminders();
  return Response.json({ product: serializeProduct(updated) });
}
