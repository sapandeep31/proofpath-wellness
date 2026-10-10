import { db } from "@/lib/db";
import { jsonError, recalcReminders } from "@/lib/server";
import { serializeProduct } from "@/lib/server";

export const dynamic = "force-dynamic";

function date(v: unknown): Date | null {
  if (!v || typeof v !== "string") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}
function str(v: unknown, max = 2000): string | null {
  if (v === null || v === undefined || v === "") return null;
  return String(v).slice(0, max);
}

export async function GET() {
  const journeys = await db.journey.findMany({
    orderBy: { createdAt: "desc" },
    include: { product: true, checkins: { orderBy: { date: "desc" } } },
  });
  return Response.json({
    journeys: journeys.map((j) => ({
      id: j.id,
      title: j.title,
      productId: j.productId,
      product: j.product ? serializeProduct(j.product) : null,
      concern: j.concern,
      startDate: j.startDate.toISOString(),
      baselineCurrent: j.baselineCurrent,
      baselineConcern: j.baselineConcern,
      baselineSatisfaction: j.baselineSatisfaction,
      baselineNotes: j.baselineNotes,
      goal: j.goal,
      checkinFrequency: j.checkinFrequency,
      privateNotes: j.privateNotes,
      visibility: j.visibility,
      isDemo: j.isDemo,
      createdAt: j.createdAt.toISOString(),
      updatedAt: j.updatedAt.toISOString(),
      checkins: j.checkins.map((c) => ({
        ...c,
        date: c.date.toISOString(),
        createdAt: c.createdAt.toISOString(),
      })),
    })),
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Invalid request body");

  const title = String(body.title ?? "").trim();
  if (title.length < 1) return jsonError("Journey title is required");
  if (title.length > 80) return jsonError("Journey title is too long (max 80 characters)");

  const concern = String(body.concern ?? "").trim();
  if (concern.length < 1) return jsonError("Tell us what you're tracking (the concern)");

  if (body.productId) {
    const p = await db.product.findUnique({ where: { id: String(body.productId) } });
    if (!p) return jsonError("Selected product not found", 404);
  }

  const frequency = ["daily", "weekly", "biweekly"].includes(String(body.checkinFrequency))
    ? String(body.checkinFrequency)
    : "weekly";
  const visibility = body.visibility === "community" ? "community" : "private";

  const journey = await db.journey.create({
    data: {
      title: title.slice(0, 80),
      productId: body.productId ? String(body.productId) : null,
      concern: concern.slice(0, 60),
      startDate: date(body.startDate) ?? new Date(),
      baselineCurrent: str(body.baselineCurrent),
      baselineConcern: str(body.baselineConcern, 200),
      baselineSatisfaction:
        body.baselineSatisfaction != null && Number.isFinite(Number(body.baselineSatisfaction))
          ? Math.min(5, Math.max(1, Number(body.baselineSatisfaction)))
          : null,
      baselineNotes: str(body.baselineNotes),
      goal: str(body.goal, 200),
      checkinFrequency: frequency,
      privateNotes: str(body.privateNotes),
      visibility,
      isDemo: Boolean(body.isDemo),
    },
  });

  await recalcReminders();
  return Response.json({ journey: { ...journey, startDate: journey.startDate.toISOString(), createdAt: journey.createdAt.toISOString() } }, { status: 201 });
}
