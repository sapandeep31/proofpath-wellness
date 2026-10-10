// Shared server-side helpers for API routes

import { db } from "@/lib/db";
import { computeEstimate, computeReminderPlan } from "@/lib/calc";
import {
  DEFAULT_NOTIF_CATS,
  DEFAULT_REMINDER_PREFS,
  type NotifCats,
  type ProductDTO,
  type ProfileDTO,
  type QuantityEstimate,
  type ReminderPrefs,
} from "@/lib/types";

type PrismaProduct = {
  [K in keyof ProductDTO]: unknown;
};

 

export function serializeProduct(p: any): ProductDTO {
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    artKey: p.artKey,
    artHue: p.artHue,
    sizeValue: p.sizeValue,
    unit: p.unit,
    purchaseDate: p.purchaseDate?.toISOString() ?? null,
    openingDate: p.openingDate?.toISOString() ?? null,
    startingQuantity: p.startingQuantity,
    currentQuantity: p.currentQuantity,
    quantityKnown: p.quantityKnown,
    amountPerUse: p.amountPerUse,
    frequency: p.frequency,
    applicationsPerWeek: p.applicationsPerWeek,
    price: p.price,
    purchaseLink: p.purchaseLink,
    expiryDate: p.expiryDate?.toISOString() ?? null,
    batchNumber: p.batchNumber,
    notes: p.notes,
    instructions: p.instructions,
    ingredients: p.ingredients,
    status: p.status,
    firstReminderDays: p.firstReminderDays,
    secondReminderEnabled: p.secondReminderEnabled,
    secondReminderDays: p.secondReminderDays,
    finalReminderEnabled: p.finalReminderEnabled,
    isDemo: p.isDemo,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export function estimateFor(p: any, logs: any[] = []): QuantityEstimate {
  return computeEstimate(p as never, logs.map((l) => ({ amountUsed: l.amountUsed, loggedAt: l.loggedAt })));
}

export async function getProfileRow() {
  let profile = await db.userProfile.findUnique({ where: { id: "default" } });
  if (!profile) {
    profile = await db.userProfile.create({ data: { id: "default" } });
  }
  return profile;
}

export function serializeProfile(profile: any, ai: { source: "saved" | "env" | null; keyHint: string | null; model: string }): ProfileDTO {
  let reminderPrefs: ReminderPrefs = DEFAULT_REMINDER_PREFS;
  let notifCats: NotifCats = DEFAULT_NOTIF_CATS;
  let interests: string[] = [];
  let recentlyViewed: string[] = [];
  try {
    if (profile.reminderPrefs) reminderPrefs = { ...DEFAULT_REMINDER_PREFS, ...JSON.parse(profile.reminderPrefs) };
    if (profile.notifCats) notifCats = { ...DEFAULT_NOTIF_CATS, ...JSON.parse(profile.notifCats) };
    if (profile.interests) interests = JSON.parse(profile.interests);
    if (profile.recentlyViewed) recentlyViewed = JSON.parse(profile.recentlyViewed);
  } catch {
    // fall back to defaults
  }
  return {
    id: profile.id,
    displayName: profile.displayName,
    avatarColor: profile.avatarColor,
    interests,
    goal: profile.goal,
    onboarded: profile.onboarded,
    demoMode: profile.demoMode,
    reminderPrefs,
    notifCats,
    recentlyViewed,
    aiConfigured: ai.source != null,
    aiKeySource: ai.source,
    aiKeyHint: ai.keyHint,
    aiModel: ai.model,
  };
}

// ---------------- Reminder recalculation engine ----------------
// Runs on data changes and dashboard load. Uses real dates; dedupes via dedupeKey.
export async function recalcReminders() {
  const profile = await getProfileRow();
  let prefs: ReminderPrefs = DEFAULT_REMINDER_PREFS;
  let cats: NotifCats = DEFAULT_NOTIF_CATS;
  try {
    if (profile.reminderPrefs) prefs = { ...DEFAULT_REMINDER_PREFS, ...JSON.parse(profile.reminderPrefs) };
    if (profile.notifCats) cats = { ...DEFAULT_NOTIF_CATS, ...JSON.parse(profile.notifCats) };
  } catch {
    // defaults
  }
  const now = new Date();

  const products = await db.product.findMany({ include: { usageLogs: true } });
  const expected: { type: string; title: string; body: string; scheduledFor: Date; dedupeKey: string; productId?: string }[] = [];

  // Replenishment reminders from live product estimates
  for (const p of products) {
    if (p.status === "active" || p.status === "paused") {
      const estimate = estimateFor(p, p.usageLogs);
      const plan = computeReminderPlan(p as never, estimate, prefs, now);
      for (const item of plan) {
        expected.push({
          type: item.type,
          title: item.title,
          body: item.body,
          scheduledFor: new Date(item.scheduledFor),
          dedupeKey: item.dedupeKey,
          productId: p.id,
        });
      }
    }
  }

  // Check-in reminders from journeys
  if (prefs.checkin && cats.checkin) {
    const journeys = await db.journey.findMany({
      where: { visibility: "private" },
      include: { checkins: { orderBy: { date: "desc" }, take: 1 } },
    });
    for (const j of journeys) {
      const freqDays = j.checkinFrequency === "daily" ? 1 : j.checkinFrequency === "biweekly" ? 14 : 7;
      const last = j.checkins[0]?.date ?? j.startDate;
      const dueAt = new Date(last.getTime() + freqDays * 24 * 60 * 60 * 1000);
      if (dueAt <= now) {
        const weekKey = new Date(last.getTime() + freqDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        expected.push({
          type: "reflection",
          title: "Your journey reflection is ready",
          body: `"${j.title}" is due for a check-in. A short reflection keeps your timeline meaningful.`,
          scheduledFor: dueAt,
          dedupeKey: `checkin:${j.id}:${weekKey}`,
          journeyId: j.id,
        });
      }
    }
  }

  // Upsert expected notifications (respect category toggles)
  for (const e of expected) {
    const cat = e.type.startsWith("replenishment") || e.type === "low-stock" || e.type === "runout" ? "replenishment" : e.type === "reflection" || e.type === "checkin" ? "checkin" : "system";
    if (cat === "replenishment" && !cats.replenishment) continue;
    if (cat === "checkin" && !cats.checkin) continue;
    const existing = await db.notification.findUnique({ where: { dedupeKey: e.dedupeKey } });
    if (!existing) {
      await db.notification.create({
        data: {
          type: e.type,
          category: cat,
          title: e.title,
          body: e.body,
          productId: e.productId ?? null,
          journeyId: (e as { journeyId?: string }).journeyId ?? null,
          scheduledFor: e.scheduledFor,
          dedupeKey: e.dedupeKey,
          isDemo: false,
        },
      });
    } else if (!existing.read) {
      // keep future-scheduled reminders in sync with the latest estimate
      await db.notification.update({
        where: { id: existing.id },
        data: { scheduledFor: e.scheduledFor, title: e.title, body: e.body },
      });
    }
  }

  // Cancel pending reminders that are no longer expected (config changed / product finished / prefs off)
  const expectedKeys = new Set(expected.map((e) => e.dedupeKey));
  const pending = await db.notification.findMany({
    where: { read: false, isDemo: false, type: { in: ["replenishment-1", "replenishment-2", "replenishment-final", "low-stock", "runout", "reflection"] } },
    select: { id: true, dedupeKey: true },
  });
  for (const n of pending) {
    if (n.dedupeKey && !expectedKeys.has(n.dedupeKey)) {
      await db.notification.delete({ where: { id: n.id } });
    }
  }
}

// ---------------- Rate limiter (in-memory) ----------------
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit = 20, windowMs = 60_000): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
