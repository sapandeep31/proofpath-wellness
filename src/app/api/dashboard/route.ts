import { db } from "@/lib/db";
import { recalcReminders, serializeProfile, serializeProduct, estimateFor } from "@/lib/server";
import { getAiConfig } from "@/lib/gemini";
import { fmtDate } from "@/lib/calc";
import type { DashboardDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

const DAY = 24 * 60 * 60 * 1000;

export async function GET() {
  await recalcReminders();

  const profileRow = await db.userProfile.findUnique({ where: { id: "default" } });
  const ai = await getAiConfig();
  const profile = serializeProfile(profileRow!, ai);

  const products = await db.product.findMany({ include: { usageLogs: { orderBy: { loggedAt: "desc" } } } });
  const serialized = products.map((p) => ({ ...serializeProduct(p), _logs: p.usageLogs.length }));

  const activeProducts = serialized
    .filter((p) => p.status === "active" || p.status === "paused")
    .map((p) => ({ ...p, estimate: estimateFor(products.find((x) => x.id === p.id)!, products.find((x) => x.id === p.id)!.usageLogs) }));

  // Supply overview messages (clearly labelled estimates)
  const supplyOverview = activeProducts
    .filter((p) => p.estimate.known && p.estimate.daysRemaining != null)
    .map((p) => {
      const d = p.estimate.daysRemaining!;
      const name = p.name.toLowerCase();
      if (d <= 3) return { product: p, estimate: p.estimate, message: `Your ${name} is running low — about ${d} ${d === 1 ? "day" : "days"} left (estimate).`, tone: "low" as const };
      if (d <= 10) return { product: p, estimate: p.estimate, message: `Your ${name} may need replenishing in about ${d} days (estimate).`, tone: "soon" as const };
      return { product: p, estimate: p.estimate, message: `Your ${name} has approximately ${d} days remaining (estimate).`, tone: "ok" as const };
    })
    .sort((a, b) => (a.estimate.daysRemaining ?? 999) - (b.estimate.daysRemaining ?? 999));

  // Journeys with last check-in + next due
  const journeysRaw = await db.journey.findMany({
    include: { product: true, checkins: { orderBy: { date: "desc" } } },
  });
  const journeys = journeysRaw.map((j) => {
    const last = j.checkins[0] ?? null;
    const freqDays = j.checkinFrequency === "daily" ? 1 : j.checkinFrequency === "biweekly" ? 14 : 7;
    const base = last?.date ?? j.startDate;
    const nextDue = new Date(base.getTime() + freqDays * DAY);
    return {
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
      checkinFrequency: j.checkinFrequency as "daily" | "weekly" | "biweekly",
      privateNotes: j.privateNotes,
      visibility: j.visibility as "private" | "community",
      isDemo: j.isDemo,
      createdAt: j.createdAt.toISOString(),
      updatedAt: j.updatedAt.toISOString(),
      lastCheckIn: last ? { ...last, date: last.date.toISOString(), createdAt: last.createdAt.toISOString() } : null,
      checkInCount: j.checkins.length,
      nextDue: nextDue.toISOString(),
    };
  });

  const allCheckins = await db.checkIn.findMany({ orderBy: { date: "desc" } });
  const recentCheckIns = allCheckins.slice(0, 5).map((c) => ({
    ...c,
    date: c.date.toISOString(),
    createdAt: c.createdAt.toISOString(),
    journeyTitle: journeysRaw.find((j) => j.id === c.journeyId)?.title ?? "Journey",
  }));

  const notifications = await db.notification.findMany({ orderBy: [{ scheduledFor: "desc" }] });
  const now = Date.now();
  const upcomingReminders = notifications
    .filter((n) => !n.read && n.scheduledFor.getTime() <= now && (n.category === "replenishment" || n.type === "reflection"))
    .slice(0, 4)
    .map((n) => ({ ...n, scheduledFor: n.scheduledFor.toISOString(), createdAt: n.createdAt.toISOString() }));

  const recentNotifications = notifications.slice(0, 6).map((n) => ({
    ...n,
    scheduledFor: n.scheduledFor.toISOString(),
    createdAt: n.createdAt.toISOString(),
  }));

  // Weekly reflection — grounded in actual recorded entries only
  const monthAgo = Date.now() - 30 * DAY;
  const monthCheckins = allCheckins.filter((c) => c.date.getTime() >= monthAgo);
  const changeCounts: Record<string, number> = {};
  let ratingSum = 0;
  let ratingCount = 0;
  for (const c of monthCheckins) {
    if (c.change) changeCounts[c.change] = (changeCounts[c.change] ?? 0) + 1;
    if (c.overallRating != null) {
      ratingSum += c.overallRating;
      ratingCount += 1;
    }
  }
  const positiveCount = (changeCounts["improved"] ?? 0);
  let message: string;
  let hasData = monthCheckins.length > 0;
  if (!hasData) {
    message = "No check-ins recorded in the last month yet. Your first check-in will unlock your weekly reflection.";
  } else {
    const parts: string[] = [];
    parts.push(
      monthCheckins.length === 1
        ? "You completed one check-in this month"
        : `You completed ${monthCheckins.length} check-ins this month`
    );
    if (positiveCount > 0) {
      parts.push(
        positiveCount === monthCheckins.length
          ? "and reported a positive experience in all of them"
          : `and reported a positive experience in ${positiveCount} of them`
      );
    } else {
      parts.push("with no reported improvements so far — that's still useful information");
    }
    if (ratingCount > 0) {
      const avg = Math.round((ratingSum / ratingCount) * 10) / 10;
      parts.push(`(average rating ${avg}/5)`);
    }
    message = parts.join(" ") + ".";
  }

  const dashboard: DashboardDTO = {
    profile,
    activeProducts: activeProducts.map(({ _logs, ...p }) => p),
    journeys,
    supplyOverview,
    upcomingReminders,
    recentCheckIns,
    recentNotifications,
    weeklyReflection: {
      monthCount: monthCheckins.length,
      positiveCount,
      changeCounts,
      avgRating: ratingCount ? Math.round((ratingSum / ratingCount) * 10) / 10 : null,
      lastCheckInDate: allCheckins[0]?.date.toISOString() ?? null,
      message,
      hasData,
    },
    totalProducts: serialized.length,
  };

  return Response.json(dashboard);
}

// keep fmtDate import used for tree-shaking safety in dev
void fmtDate;
