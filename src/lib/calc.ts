// ProofPath quantity & reminder calculation engine
// Implements spec Part 6.4 (usage calculations) and Part 7 (reminder scheduling)
// All estimates are clearly labelled estimates; never fabricated when data is missing.

import type { ProductDTO, QuantityEstimate, ReminderPlanItem, ReminderPrefs } from "./types";

interface LogLike {
  amountUsed: number;
  loggedAt: string | Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function daysBetween(a: Date, b: Date): number {
  return Math.max((b.getTime() - a.getTime()) / DAY_MS, 0);
}

export function computeEstimate(
  product: Pick<
    ProductDTO,
    | "quantityKnown"
    | "currentQuantity"
    | "startingQuantity"
    | "openingDate"
    | "purchaseDate"
    | "applicationsPerWeek"
    | "amountPerUse"
    | "amountPerUse"
    | "unit"
    | "createdAt"
  >,
  logs: LogLike[] = [],
  now: Date = new Date()
): QuantityEstimate {
  const unknown: QuantityEstimate = {
    known: false,
    percentUsed: null,
    dailyConsumption: null,
    weeklyConsumption: null,
    daysRemaining: null,
    runOutDate: null,
    basis: "none",
    basisLabel: "Quantity not tracked yet — update your estimated quantity to see supply insights.",
  };

  if (!product.quantityKnown || product.currentQuantity == null) return unknown;

  const current = product.currentQuantity;
  const starting = product.startingQuantity;

  // --- Daily consumption ---
  // 1) Consumption-based: (starting - current) / days since tracking began
  let dailyConsumption: number | null = null;
  let basis: QuantityEstimate["basis"] = "none";

  const trackStartCandidates = [
    product.openingDate,
    logs.length ? logs.map((l) => new Date(l.loggedAt)).sort((a, b) => a.getTime() - b.getTime())[0] : null,
    product.purchaseDate,
  ].filter(Boolean) as string[];
  const trackStart = trackStartCandidates.length
    ? new Date(trackStartCandidates[0])
    : null;

  if (starting != null && starting > 0 && trackStart) {
    const periodDays = daysBetween(trackStart, now);
    if (periodDays >= 1) {
      const consumed = starting - current;
      if (consumed > 0) {
        dailyConsumption = consumed / periodDays;
        basis = "logs";
      }
    }
  }

  // 2) Configured rate: applications per week x amount per use
  let configuredDaily: number | null = null;
  if (product.applicationsPerWeek != null && product.amountPerUse != null && product.amountPerUse > 0) {
    configuredDaily = (product.applicationsPerWeek * product.amountPerUse) / 7;
  }

  if (dailyConsumption == null && configuredDaily != null) {
    dailyConsumption = configuredDaily;
    basis = "configured";
  } else if (dailyConsumption != null && configuredDaily != null) {
    // Blend: trust observed consumption but avoid extremes from a single update
    dailyConsumption = Math.max(dailyConsumption, configuredDaily) * 0.5 + Math.min(dailyConsumption, configuredDaily) * 0.5;
    basis = "mixed";
  }

  const basisLabel =
    basis === "logs"
      ? "Based on your recorded consumption since you started tracking."
      : basis === "configured"
        ? "Based on the usage rate you configured (applications per week × amount per use)."
        : basis === "mixed"
          ? "Blended from your recorded consumption and configured usage rate."
          : "Not enough information yet — add your usage rate or update quantities.";

  if (dailyConsumption == null || dailyConsumption <= 0) {
    return {
      known: true,
      percentUsed: starting != null && starting > 0 ? Math.min(100, Math.max(0, ((starting - current) / starting) * 100)) : null,
      dailyConsumption: null,
      weeklyConsumption: null,
      daysRemaining: null,
      runOutDate: null,
      basis: "none",
      basisLabel:
        basis === "none" && configuredDaily == null
          ? "Add an amount per use and frequency (or log usage) to calculate an estimated run-out date. We won't invent one."
          : basisLabel,
    };
  }

  const daysRemaining = current / dailyConsumption;
  const runOutDate = new Date(now.getTime() + daysRemaining * DAY_MS);

  return {
    known: true,
    percentUsed:
      starting != null && starting > 0 ? Math.min(100, Math.max(0, ((starting - current) / starting) * 100)) : null,
    dailyConsumption: Math.round(dailyConsumption * 100) / 100,
    weeklyConsumption: Math.round(dailyConsumption * 7 * 100) / 100,
    daysRemaining: Math.max(0, Math.round(daysRemaining)),
    runOutDate: runOutDate.toISOString(),
    basis,
    basisLabel,
  };
}

// Generate the reminder plan (does not touch the DB — routes decide persistence)
export function computeReminderPlan(
  product: Pick<
    ProductDTO,
    | "id"
    | "name"
    | "unit"
    | "status"
    | "firstReminderDays"
    | "secondReminderEnabled"
    | "secondReminderDays"
    | "finalReminderEnabled"
  >,
  estimate: QuantityEstimate,
  prefs: ReminderPrefs,
  now: Date = new Date()
): ReminderPlanItem[] {
  if (product.status === "finished" || product.status === "archived") return [];
  if (!estimate.known || estimate.daysRemaining == null || !estimate.runOutDate) return [];
  if (!prefs.replenishment) return [];

  const runOut = new Date(estimate.runOutDate);
  const items: ReminderPlanItem[] = [];
  const unit = product.unit;
  const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  // First reminder: N days before depletion (default 7)
  const firstAt = new Date(runOut.getTime() - product.firstReminderDays * DAY_MS);
  if (firstAt.getTime() - now.getTime() < DAY_MS) {
    items.push({
      type: "low-stock",
      title: `${product.name} is running low`,
      body: `Your ${product.name} has approximately ${estimate.daysRemaining} ${estimate.daysRemaining === 1 ? "day" : "days"} remaining (about ${fmt(runOut)}). This is an estimate based on your usage.`,
      scheduledFor: now.toISOString(),
      dedupeKey: `low-stock:${product.id}:${runOut.toISOString().slice(0, 10)}`,
    });
  } else {
    items.push({
      type: "replenishment-1",
      title: `Replenish ${product.name} soon`,
      body: `We estimate your ${product.name} will run out around ${fmt(runOut)}. Time to think about a refill.`,
      scheduledFor: firstAt.toISOString(),
      dedupeKey: `replenishment-1:${product.id}:${runOut.toISOString().slice(0, 10)}`,
    });
  }

  // Second reminder
  if (prefs.secondReminder && product.secondReminderEnabled) {
    const secondAt = new Date(runOut.getTime() - product.secondReminderDays * DAY_MS);
    if (secondAt > now) {
      items.push({
        type: "replenishment-2",
        title: `${product.name} may need replenishing`,
        body: `Approximately ${Math.ceil((secondAt.getTime() - now.getTime()) / DAY_MS)} days of supply left. Estimated run-out: ${fmt(runOut)}.`,
        scheduledFor: secondAt.toISOString(),
        dedupeKey: `replenishment-2:${product.id}:${runOut.toISOString().slice(0, 10)}`,
      });
    }
  }

  // Final reminder on run-out date
  if (prefs.finalReminder && product.finalReminderEnabled) {
    if (runOut > now) {
      items.push({
        type: "replenishment-final",
        title: `${product.name} is estimated to run out today`,
        body: `Based on your usage, your ${product.name} (${unit}) may be finished around today. Update the quantity if this estimate looks off.`,
        scheduledFor: runOut.toISOString(),
        dedupeKey: `replenishment-final:${product.id}:${runOut.toISOString().slice(0, 10)}`,
      });
    }
  }

  return items;
}

export const FREQUENCY_MAP: Record<string, number> = {
  daily: 7,
  "twice-daily": 14,
  "alternate-days": 3.5,
  weekly: 1,
};

export const FREQUENCY_LABELS: Record<string, string> = {
  daily: "Daily",
  "twice-daily": "Twice daily",
  "alternate-days": "Every other day",
  weekly: "Weekly",
  custom: "Custom",
};

export function frequencyToPerWeek(frequency: string | null | undefined, custom?: number | null): number | null {
  if (frequency === "custom") return custom ?? null;
  if (frequency && FREQUENCY_MAP[frequency] != null) return FREQUENCY_MAP[frequency];
  return null;
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function relativeDays(iso: string | null | undefined): string {
  if (!iso) return "";
  const diff = Math.round((new Date(iso).getTime() - Date.now()) / DAY_MS);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff > 1) return `in ${diff} days`;
  if (diff === -1) return "yesterday";
  return `${Math.abs(diff)} days ago`;
}
