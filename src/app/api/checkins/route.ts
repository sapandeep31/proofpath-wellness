import { db } from "@/lib/db";
import { jsonError, recalcReminders } from "@/lib/server";

export const dynamic = "force-dynamic";

// Safety guidance when a potentially serious reaction is reported (spec 8.3)
function safetyNotice(reactions: string | null): string | null {
  if (reactions === "severe") {
    return "You reported a severe reaction. Please pause the product you suspect and seek prompt medical care — urgently if there is any difficulty breathing, throat or tongue swelling, or dizziness.";
  }
  if (reactions === "moderate") {
    return "You reported a noticeable reaction. Consider pausing the suspected product, keeping the area clean and uncluttered, and seeking professional advice if it persists, spreads, or worsens.";
  }
  return null;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Invalid request body");

  const journeyId = String(body.journeyId ?? "");
  const journey = await db.journey.findUnique({ where: { id: journeyId } });
  if (!journey) return jsonError("Journey not found", 404);

  const reactions = ["none", "mild", "moderate", "severe"].includes(String(body.reactions))
    ? String(body.reactions)
    : null;
  const change = ["improved", "same", "worsened", "unsure"].includes(String(body.change)) ? String(body.change) : null;
  const consistency = ["every-day", "most-days", "some-days", "rarely"].includes(String(body.consistency))
    ? String(body.consistency)
    : null;

  const overallRating =
    body.overallRating != null && Number.isFinite(Number(body.overallRating))
      ? Math.min(5, Math.max(1, Number(body.overallRating)))
      : null;

  let checkDate = new Date();
  if (body.date) {
    const d = new Date(String(body.date));
    if (!Number.isNaN(d.getTime())) {
      if (d.getTime() > Date.now() + 24 * 60 * 60 * 1000) return jsonError("Check-in date cannot be in the future");
      checkDate = d;
    }
  }

  const checkin = await db.checkIn.create({
    data: {
      journeyId,
      date: checkDate,
      overallRating,
      change,
      consistency,
      reactions,
      reactionDetails: typeof body.reactionDetails === "string" ? body.reactionDetails.slice(0, 1000) : null,
      notes: typeof body.notes === "string" ? body.notes.slice(0, 2000) : null,
      isDemo: Boolean(body.isDemo) || journey.isDemo,
    },
  });

  await recalcReminders();
  const notice = safetyNotice(reactions);
  if (reactions === "severe") {
    await db.notification.create({
      data: {
        type: "system",
        category: "system",
        title: "Safety guidance for your recent check-in",
        body: notice ?? "",
        journeyId,
      },
    });
  }

  return Response.json({ checkin: { ...checkin, date: checkin.date.toISOString(), createdAt: checkin.createdAt.toISOString() }, safetyNotice: notice }, { status: 201 });
}
