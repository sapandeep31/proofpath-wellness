import { db } from "@/lib/db";
import { jsonError, recalcReminders, serializeProduct } from "@/lib/server";
import { frequencyToPerWeek } from "@/lib/calc";

export const dynamic = "force-dynamic";

export async function GET() {
  const products = await db.product.findMany({
    orderBy: { createdAt: "asc" },
    include: { usageLogs: { orderBy: { loggedAt: "desc" } } },
  });
  return Response.json({ products: products.map((p) => serializeProduct(p)) });
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

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Invalid request body");

  const name = String(body.name ?? "").trim();
  if (name.length < 1) return jsonError("Product name is required");
  if (name.length > 80) return jsonError("Product name is too long (max 80 characters)");

  const quantityKnown = body.quantityKnown === false ? false : true;
  const startingQuantity = num(body.startingQuantity);
  const currentQuantity = quantityKnown ? num(body.currentQuantity) ?? startingQuantity : null;
  const frequency = str(body.frequency, 20) || null;

  if (startingQuantity != null && startingQuantity < 0) return jsonError("Starting quantity cannot be negative");
  if (currentQuantity != null && currentQuantity < 0) return jsonError("Current quantity cannot be negative");
  if (currentQuantity != null && startingQuantity != null && currentQuantity > startingQuantity)
    return jsonError("Current quantity cannot be more than the starting quantity");

  const product = await db.product.create({
    data: {
      name,
      brand: str(body.brand, 60) || "",
      category: str(body.category, 20) || "Skincare",
      artKey: str(body.artKey, 20) || "bottle",
      artHue: Math.min(360, Math.max(0, num(body.artHue) ?? Math.floor(Math.random() * 360))),
      sizeValue: num(body.sizeValue),
      unit: str(body.unit, 10) || "mL",
      purchaseDate: date(body.purchaseDate),
      openingDate: date(body.openingDate),
      startingQuantity,
      currentQuantity,
      quantityKnown,
      amountPerUse: num(body.amountPerUse),
      frequency,
      applicationsPerWeek: body.applicationsPerWeek !== undefined && body.applicationsPerWeek !== ""
        ? num(body.applicationsPerWeek)
        : frequencyToPerWeek(frequency),
      price: num(body.price),
      purchaseLink: str(body.purchaseLink, 500),
      expiryDate: date(body.expiryDate),
      batchNumber: str(body.batchNumber, 40),
      notes: str(body.notes, 2000),
      instructions: str(body.instructions, 2000),
      ingredients: str(body.ingredients, 3000),
      status: ["active", "paused", "finished", "archived"].includes(String(body.status)) ? String(body.status) : "active",
      firstReminderDays: Math.min(60, Math.max(1, num(body.firstReminderDays) ?? 7)),
      secondReminderEnabled: body.secondReminderEnabled !== false,
      secondReminderDays: Math.min(30, Math.max(1, num(body.secondReminderDays) ?? 3)),
      finalReminderEnabled: Boolean(body.finalReminderEnabled),
      isDemo: Boolean(body.isDemo),
    },
  });

  await recalcReminders();
  return Response.json({ product: serializeProduct(product) }, { status: 201 });
}
