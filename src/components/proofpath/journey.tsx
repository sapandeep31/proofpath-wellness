"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CalendarCheck,
  ChevronDown,
  CircleDot,
  Eye,
  EyeOff,
  LineChart as LineChartIcon,
  Lock,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { api, useApp } from "@/lib/store";
import { EmptyCard, SampleBadge } from "./dashboard";
import { fmtDate, relativeDays } from "@/lib/calc";
import { CONCERNS } from "@/lib/types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

 

const CHANGE_LABELS: Record<string, string> = {
  improved: "Improved",
  same: "No noticeable change",
  worsened: "Worsened",
  unsure: "Unsure",
};
const CONSISTENCY_LABELS: Record<string, string> = {
  "every-day": "Every day",
  "most-days": "Most days",
  "some-days": "Some days",
  rarely: "Rarely",
};
const REACTION_LABELS: Record<string, string> = {
  none: "None",
  mild: "Mild",
  moderate: "Moderate",
  severe: "Severe",
};

export function JourneySection() {
  const { journeys, selectedJourneyId, journeyForm, checkInForm, openJourneyForm, closeJourneyForm, openCheckInForm, closeCheckInForm } = useApp();

  const editing = journeyForm.editId ? journeys.find((j) => j.id === journeyForm.editId) ?? null : null;
  const selected = journeys.find((j) => j.id === selectedJourneyId) ?? null;
  const checkInJourney = checkInForm.journeyId ? journeys.find((j) => j.id === checkInForm.journeyId) ?? null : null;
  const existingCheckIn = checkInForm.existingId && checkInJourney
    ? checkInJourney.checkins?.find((c: any) => c.id === checkInForm.existingId) ?? null
    : null;

  if (selected) {
    return (
      <>
        <JourneyDetail
          journey={selected}
          onEdit={() => openJourneyForm(selected.id)}
          onCheckIn={() => openCheckInForm(selected.id)}
        />
        <JourneyFormDialog open={journeyForm.open} onClose={closeJourneyForm} journey={editing} />
        <CheckInDialog journey={checkInJourney} existing={existingCheckIn} onClose={closeCheckInForm} />
      </>
    );
  }

  return (
    <>
      <JourneyList onAdd={() => openJourneyForm(null)} />
      <JourneyFormDialog open={journeyForm.open} onClose={closeJourneyForm} journey={editing} />
      <CheckInDialog journey={checkInJourney} existing={existingCheckIn} onClose={closeCheckInForm} />
    </>
  );
}

/* ------------------------------- List ------------------------------- */

function JourneyList({ onAdd }: { onAdd: () => void }) {
  const { journeys, products, openJourney, dashboard } = useApp();

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl">My Journey</h1>
          <p className="text-muted-foreground mt-1">
            Your personal experience records — private by default, shared only when you choose.
          </p>
        </div>
        <Button onClick={onAdd} className="rounded-full gap-2 bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Create a journey
        </Button>
      </div>

      {journeys.length === 0 ? (
        <EmptyCard
          icon={CalendarCheck}
          title="No journeys yet"
          body="A journey follows one product or concern over time — a baseline, weekly check-ins, a timeline and a chart built only from what you record."
          action={
            <Button onClick={onAdd} className="rounded-full gap-2">
              <Plus className="h-4 w-4" /> Create your first journey
            </Button>
          }
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {journeys.map((j) => {
            const product = products.find((p) => p.id === j.productId);
            const checkins: any[] = j.checkins ?? [];
            const last = checkins[0] ?? null;
            const freqDays = j.checkinFrequency === "daily" ? 1 : j.checkinFrequency === "biweekly" ? 14 : 7;
            const base = last ? new Date(last.date) : new Date(j.startDate);
            const nextDue = new Date(base.getTime() + freqDays * 86400000);
            const due = nextDue.getTime() <= Date.now();
            return (
              <motion.button
                key={j.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => openJourney(j.id)}
                className="text-left bg-white rounded-2xl border border-border p-6 shadow-soft hover:shadow-lift hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-semibold text-[15px]">{j.title}</h2>
                      {j.isDemo && <SampleBadge />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {j.concern} · since {fmtDate(j.startDate)} · {checkins.length} check-ins
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide flex items-center gap-1 shrink-0",
                      j.visibility === "community" ? "bg-rose-soft text-[#7A4A44]" : "bg-sage/60 text-primary"
                    )}
                  >
                    {j.visibility === "community" ? <Eye className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                    {j.visibility === "community" ? "Shared" : "Private"}
                  </span>
                </div>

                {product && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Tracking: <span className="text-foreground font-medium">{product.name}</span>
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between text-xs">
                  {last ? (
                    <p className="text-muted-foreground">
                      Last check-in {relativeDays(last.date)} ·{" "}
                      {last.change ? CHANGE_LABELS[last.change] : "recorded"}
                    </p>
                  ) : (
                    <p className="text-muted-foreground">Baseline recorded — no check-ins yet</p>
                  )}
                  <span className={cn("font-medium", due ? "text-primary" : "text-muted-foreground")}>
                    {due ? "Check-in due" : `Next ${relativeDays(nextDue.toISOString())}`}
                  </span>
                </div>
                {due && <Progress value={100} className="h-1 mt-3 bg-muted" />}
              </motion.button>
            );
          })}
        </div>
      )}

      {dashboard && dashboard.journeys.length === 0 && (
        <p className="text-xs text-muted-foreground mt-4 text-center">
          Tip: pair each journey with a product from My Products for product-aware AI guidance.
        </p>
      )}
    </div>
  );
}

/* ------------------------------ Detail ------------------------------ */

function JourneyDetail({ journey, onEdit, onCheckIn }: { journey: any; onEdit: () => void; onCheckIn: () => void }) {
  const { setView, openCheckInForm } = useApp();
  const { toast } = useToast();
  const [range, setRange] = useState("all");
  const [showBaseline, setShowBaseline] = useState(false);

  const checkins: any[] = journey.checkins ?? [];

  const chartData = useMemo(() => {
    const asc = [...checkins].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const cutoff = range === "30" ? Date.now() - 30 * 86400000 : range === "90" ? Date.now() - 90 * 86400000 : 0;
    return asc
      .filter((c) => new Date(c.date).getTime() >= cutoff)
      .map((c) => ({
        date: new Date(c.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
        rating: c.overallRating,
        change: c.change,
      }))
      .filter((d) => d.rating != null);
  }, [checkins, range]);

  const insights = useMemo(() => {
    const total = checkins.length;
    if (total === 0) return "No check-ins recorded yet — your baseline is saved, and your first weekly reflection will build from it.";
    const counts: Record<string, number> = {};
    let rated = 0;
    let sum = 0;
    for (const c of checkins) {
      if (c.change) counts[c.change] = (counts[c.change] ?? 0) + 1;
      if (c.overallRating != null) {
        sum += c.overallRating;
        rated++;
      }
    }
    const parts: string[] = [];
    parts.push(
      total === 1
        ? "You recorded one check-in"
        : `You recorded ${total} check-ins over the last ${Math.max(1, Math.round((Date.now() - new Date(journey.startDate).getTime()) / 86400000))} days`
    );
    const seg = Object.entries(counts)
      .map(([k, v]) => `${v} ${CHANGE_LABELS[k]?.toLowerCase() ?? k}`)
      .join(", ");
    if (seg) parts.push(`— ${seg}`);
    if (rated > 0) parts.push(`(average rating ${Math.round((sum / rated) * 10) / 10}/5)`);
    const last = checkins[0];
    const gap = Math.round((Date.now() - new Date(last.date).getTime()) / 86400000);
    if (gap > 10) parts.push(`. It's been ${gap} days since the last entry — whenever you're ready, the next one keeps the timeline meaningful. No guilt — inconsistent tracking never invalidates your experience.`);
    return parts.join(" ") + ".";
  }, [checkins, journey.startDate]);

  const deleteCheckin = async (id: string) => {
    if (!confirm("Delete this check-in? This cannot be undone.")) return;
    try {
      await api(`/api/checkins/${id}`, { method: "DELETE" });
      await useApp.getState().refreshJourneys();
      await useApp.getState().refreshDashboard();
      toast({ title: "Check-in deleted" });
    } catch (e) {
      toast({ title: "Could not delete", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    }
  };

  const deleteJourney = async () => {
    if (!confirm(`Delete the journey "${journey.title}" and all its check-ins?`)) return;
    try {
      await api(`/api/journeys/${journey.id}`, { method: "DELETE" });
      await useApp.getState().refreshJourneys();
      await useApp.getState().refreshDashboard();
      setView("journey");
      toast({ title: "Journey deleted" });
    } catch (e) {
      toast({ title: "Could not delete", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    }
  };

  const toggleVisibility = async () => {
    const next = journey.visibility === "private" ? "community" : "private";
    if (next === "community") {
      const ok = confirm(
        `Share "${journey.title}" with The ProofPath Circle?\n\nWhat becomes visible: your display name, the journey title, concern category and the check-in notes you choose to post. Your private notes and baseline details stay private.\n\nYou can withdraw at any time.`
      );
      if (!ok) return;
      toast({ title: "Sharing requires a post", description: "Create a community post from this journey to share it — opened for you." });
      useApp.getState().setView("community");
      return;
    }
    try {
      await api(`/api/journeys/${journey.id}`, { method: "PATCH", body: JSON.stringify({ visibility: "private" }) });
      await useApp.getState().refreshJourneys();
      toast({ title: "Journey set to private" });
    } catch (e) {
      toast({ title: "Could not update", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    }
  };

  return (
    <div>
      <button onClick={() => setView("journey")} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5">
        <ArrowLeft className="h-4 w-4" /> All journeys
      </button>

      <div className="bg-white rounded-2xl border border-border shadow-soft p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-2xl sm:text-3xl">{journey.title}</h1>
              {journey.isDemo && <SampleBadge />}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {journey.concern} · started {fmtDate(journey.startDate)} · weekly reflection cadence:{" "}
              {journey.checkinFrequency === "daily" ? "daily" : journey.checkinFrequency === "biweekly" ? "every 2 weeks" : "weekly"}
            </p>
            {journey.goal && (
              <p className="text-sm mt-2 rounded-xl bg-sage-soft border border-border/60 px-3.5 py-2 inline-block">
                <span className="text-[10px] uppercase tracking-wider text-primary block">Personal goal</span>
                {journey.goal}
              </p>
            )}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <Button onClick={onCheckIn} className="rounded-full gap-2 bg-primary hover:bg-primary/90">
              <CalendarCheck className="h-4 w-4" /> Log a check-in
            </Button>
            <Button variant="outline" size="sm" onClick={onEdit} className="rounded-full gap-1.5 bg-transparent">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
            <Button variant="outline" size="sm" onClick={toggleVisibility} className="rounded-full gap-1.5 bg-transparent">
              {journey.visibility === "community" ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {journey.visibility === "community" ? "Shared" : "Private"}
            </Button>
            <Button variant="outline" size="sm" onClick={deleteJourney} className="rounded-full gap-1.5 text-destructive hover:text-destructive bg-transparent">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Baseline */}
        <div className="mt-6 rounded-2xl bg-[#FAF8F3] border border-border/70 p-5">
          <button onClick={() => setShowBaseline((s) => !s)} className="w-full flex items-center justify-between text-left">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Baseline — where you started</p>
              <p className="text-sm mt-0.5">
                {journey.baselineCurrent ? journey.baselineCurrent.slice(0, 110) + (journey.baselineCurrent.length > 110 ? "…" : "") : "No baseline recorded"}
              </p>
            </div>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform shrink-0", showBaseline && "rotate-180")} />
          </button>
          <AnimatePresence>
            {showBaseline && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="mt-4 pt-4 border-t border-border/60 grid sm:grid-cols-2 gap-4 text-[13px]">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Main concern at start</p>
                    <p>{journey.baselineConcern || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Satisfaction at start</p>
                    <p>{journey.baselineSatisfaction ? `${journey.baselineSatisfaction}/5` : "—"}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">Observations</p>
                    <p className="whitespace-pre-wrap">{journey.baselineNotes || "—"}</p>
                  </div>
                  <p className="sm:col-span-2 text-[11px] text-muted-foreground italic">
                    Your baseline is a personal, subjective record — not a clinical measurement, and never shared.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Chart */}
        <div className="mt-6">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <h2 className="font-display text-xl flex items-center gap-2">
              <LineChartIcon className="h-5 w-5 text-primary" /> Self-reported experience
            </h2>
            <div className="flex gap-1.5">
              {[
                { k: "30", l: "30 days" },
                { k: "90", l: "90 days" },
                { k: "all", l: "All" },
              ].map((r) => (
                <button
                  key={r.k}
                  onClick={() => setRange(r.k)}
                  className={cn("rounded-full px-3 py-1.5 text-xs font-medium", range === r.k ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}
                >
                  {r.l}
                </button>
              ))}
            </div>
          </div>
          {chartData.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center">
              <p className="text-sm text-muted-foreground">
                Your chart appears here once check-ins with ratings are recorded — built only from your entries, and labelled as personal, self-reported experience. It can show patterns in how you felt, but it can&apos;t prove a product caused a change.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-white p-4">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 16, bottom: 0, left: -18 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8E5DD" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#777970" }} tickLine={false} axisLine={{ stroke: "#E8E5DD" }} />
                    <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: "#777970" }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid #E8E5DD", fontSize: 12 }}
                      formatter={(v: number) => [`${v}/5`, "Experience"]}
                    />
                    <Line type="monotone" dataKey="rating" stroke="#314C3C" strokeWidth={2.4} dot={{ r: 3.5, fill: "#314C3C" }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 flex items-start gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                Personal, self-reported ratings over time. This reflects how you felt at each check-in — it cannot prove that a product caused a result.
              </p>
            </div>
          )}
        </div>

        {/* Insights */}
        <div className="mt-6 rounded-2xl bg-lavender-soft border border-border p-5">
          <h3 className="font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#5B4A6E]" /> Journey insights
          </h3>
          <p className="text-[13.5px] leading-relaxed mt-2">{insights}</p>
        </div>

        {/* Timeline */}
        <div className="mt-8">
          <h2 className="font-display text-xl mb-4">Progress timeline</h2>
          {checkins.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center">
              <p className="text-sm text-muted-foreground">No entries yet. The timeline fills in as you log weekly check-ins.</p>
            </div>
          ) : (
            <ol className="relative border-l-2 border-border ml-3 space-y-6">
              <AnimatePresence>
                {checkins.map((c, i) => (
                  <motion.li
                    key={c.id}
                    layout
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="ml-6"
                  >
                    <span className="absolute -left-[9px] mt-1.5 h-4 w-4 rounded-full border-2 border-white bg-primary shadow" />
                    <div className="bg-[#FAF8F3] rounded-2xl border border-border/70 p-4.5 p-5">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <p className="text-sm font-semibold">
                            {fmtDate(c.date)} ·{" "}
                            <span className="text-muted-foreground font-normal">
                              {relativeDays(c.date)}
                            </span>
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {c.overallRating != null && (
                              <span className="rounded-full bg-white border border-border px-2.5 py-0.5 text-[11px]">
                                {"★".repeat(c.overallRating)}
                                {"☆".repeat(5 - c.overallRating)}
                              </span>
                            )}
                            {c.change && (
                              <span className={cn(
                                "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                                c.change === "improved" ? "bg-sage/70 text-primary" : c.change === "worsened" ? "bg-rose-soft text-[#7A4A44]" : "bg-muted text-muted-foreground"
                              )}>
                                {CHANGE_LABELS[c.change]}
                              </span>
                            )}
                            {c.consistency && (
                              <span className="rounded-full bg-white border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground">
                                Used {CONSISTENCY_LABELS[c.consistency]?.toLowerCase() ?? c.consistency}
                              </span>
                            )}
                            {c.reactions && c.reactions !== "none" && (
                              <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium flex items-center gap-1", c.reactions === "severe" ? "bg-destructive text-white" : "bg-rose-soft text-[#7A4A44]")}>
                                <AlertTriangle className="h-3 w-3" /> Reaction: {REACTION_LABELS[c.reactions]}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openCheckInForm(journey.id, c.id)} className="h-8 gap-1 text-xs">
                            <Pencil className="h-3 w-3" /> Edit
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteCheckin(c.id)} className="h-8 gap-1 text-xs text-destructive hover:text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {c.reactionDetails && (
                        <p className="text-[13px] mt-2">
                          <span className="text-muted-foreground">Reaction details: </span>
                          {c.reactionDetails}
                        </p>
                      )}
                      {c.notes && <p className="text-[13.5px] mt-2 leading-relaxed whitespace-pre-wrap">{c.notes}</p>}
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------- Journey form ---------------------------- */

function JourneyFormDialog({ open, onClose, journey }: { open: boolean; onClose: () => void; journey: any | null }) {
  const { products } = useApp();
  const { toast } = useToast();
  const isEdit = !!journey;
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState(() => defaults(journey));

  useEffect(() => {
    if (open) setF(defaults(journey));
  }, [open, journey]);

  const set = (k: string, v: unknown) => setF((p: any) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!f.title.trim()) return toast({ title: "Give your journey a title", variant: "destructive" });
    if (!f.concern) return toast({ title: "Choose what you're tracking", variant: "destructive" });
    setBusy(true);
    try {
      const body = {
        title: f.title.trim(),
        productId: f.productId || null,
        concern: f.concern,
        startDate: f.startDate || undefined,
        baselineCurrent: f.baselineCurrent || null,
        baselineConcern: f.baselineConcern || null,
        baselineSatisfaction: f.baselineSatisfaction,
        baselineNotes: f.baselineNotes || null,
        goal: f.goal || null,
        checkinFrequency: f.checkinFrequency,
        privateNotes: f.privateNotes || null,
      };
      if (isEdit) {
        await api(`/api/journeys/${journey.id}`, { method: "PATCH", body: JSON.stringify(body) });
        toast({ title: "Journey updated" });
      } else {
        await api("/api/journeys", { method: "POST", body: JSON.stringify(body) });
        toast({ title: "Journey created", description: "Record your baseline reflections — then check in weekly." });
      }
      await Promise.all([useApp.getState().refreshJourneys(), useApp.getState().refreshDashboard()]);
      onClose();
    } catch (e) {
      toast({ title: "Could not save", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto scrollbar-thin bg-[#FAF8F3] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{isEdit ? "Edit journey" : "Create a journey"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Adjust the details — your timeline stays intact." : "Follow a product or concern over time. Private by default; sharing is always your explicit choice."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[13px]">Journey title <span className="text-destructive">*</span></Label>
            <Input value={f.title} onChange={(e) => set("title", e.target.value)} placeholder='e.g. "Body moisturiser journey"' maxLength={80} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Product (optional)</Label>
              <Select value={f.productId} onValueChange={(v) => set("productId", v)}>
                <SelectTrigger className="bg-white"><SelectValue placeholder="None — concern only" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None — concern only</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Concern being tracked <span className="text-destructive">*</span></Label>
              <Select value={f.concern} onValueChange={(v) => set("concern", v)}>
                <SelectTrigger className="bg-white"><SelectValue placeholder="Choose…" /></SelectTrigger>
                <SelectContent>
                  {CONCERNS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Start date</Label>
              <Input type="date" value={f.startDate} onChange={(e) => set("startDate", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Check-in frequency</Label>
              <Select value={f.checkinFrequency} onValueChange={(v) => set("checkinFrequency", v)}>
                <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-border p-4 space-y-3.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Baseline — your starting point</p>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Current experience</Label>
              <Textarea value={f.baselineCurrent} onChange={(e) => set("baselineCurrent", e.target.value)} rows={2} placeholder="How things are today, in your own words…" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[13px]">Main concern</Label>
                <Input value={f.baselineConcern} onChange={(e) => set("baselineConcern", e.target.value)} placeholder="e.g. flaky shins" maxLength={200} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px]">Satisfaction right now: <span className="font-semibold">{f.baselineSatisfaction}/5</span></Label>
                <Slider
                  value={[f.baselineSatisfaction]}
                  min={1}
                  max={5}
                  step={1}
                  onValueChange={(v) => set("baselineSatisfaction", v[0])}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Relevant observations (optional)</Label>
              <Textarea value={f.baselineNotes} onChange={(e) => set("baselineNotes", e.target.value)} rows={2} />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Personal goal (optional)</Label>
              <Input value={f.goal} onChange={(e) => set("goal", e.target.value)} placeholder="e.g. stay consistent for 8 weeks" maxLength={200} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Private notes (optional)</Label>
              <Input value={f.privateNotes} onChange={(e) => set("privateNotes", e.target.value)} placeholder="Never shared, even when you publish" maxLength={500} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" onClick={onClose} className="rounded-full">Cancel</Button>
          <Button onClick={submit} disabled={busy} className="rounded-full bg-primary hover:bg-primary/90">
            {busy ? "Saving…" : isEdit ? "Save changes" : "Create journey"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function defaults(j: any) {
  return {
    title: j?.title ?? "",
    productId: j?.productId ?? "none",
    concern: j?.concern ?? "",
    startDate: j?.startDate ? new Date(j.startDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    baselineCurrent: j?.baselineCurrent ?? "",
    baselineConcern: j?.baselineConcern ?? "",
    baselineSatisfaction: j?.baselineSatisfaction ?? 3,
    baselineNotes: j?.baselineNotes ?? "",
    goal: j?.goal ?? "",
    checkinFrequency: j?.checkinFrequency ?? "weekly",
    privateNotes: j?.privateNotes ?? "",
  };
}

/* ---------------------------- Check-in form ---------------------------- */

function CheckInDialog({ journey, existing, onClose }: { journey: any | null; existing?: any; onClose: () => void }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [rating, setRating] = useState(existing?.overallRating ?? 3);
  const [change, setChange] = useState(existing?.change ?? "unsure");
  const [consistency, setConsistency] = useState(existing?.consistency ?? "most-days");
  const [reactions, setReactions] = useState(existing?.reactions ?? "none");
  const [reactionDetails, setReactionDetails] = useState(existing?.reactionDetails ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [date, setDate] = useState(existing ? new Date(existing.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
  const [safetyNotice, setSafetyNotice] = useState<string | null>(null);

  if (!journey) return null;

  const submit = async () => {
    setBusy(true);
    try {
      const body = {
        journeyId: journey.id,
        overallRating: rating,
        change,
        consistency,
        reactions,
        reactionDetails: reactionDetails || null,
        notes: notes || null,
        date,
      };
      let notice: string | null = null;
      if (existing) {
        await api(`/api/checkins/${existing.id}`, { method: "PATCH", body: JSON.stringify(body) });
      } else {
        const d = await api<{ safetyNotice: string | null }>("/api/checkins", { method: "POST", body: JSON.stringify(body) });
        notice = d.safetyNotice;
      }
      await Promise.all([useApp.getState().refreshJourneys(), useApp.getState().refreshDashboard()]);
      onClose();
      if (notice) {
        setSafetyNotice(notice);
        toast({ title: "Check-in saved with safety guidance", variant: "destructive", description: notice, duration: 10000 });
      } else {
        toast({ title: existing ? "Check-in updated" : "Check-in recorded", description: "Your timeline and chart are up to date." });
      }
    } catch (e) {
      toast({ title: "Could not save", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin bg-[#FAF8F3] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{existing ? "Edit check-in" : "Weekly check-in"}</DialogTitle>
          <DialogDescription>
            A short reflection on &ldquo;{journey.title}&rdquo;. Two minutes now, a meaningful timeline later.
          </DialogDescription>
        </DialogHeader>

        {safetyNotice && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-4 text-[13px] text-destructive flex gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            {safetyNotice}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Date</Label>
              <Input type="date" max={new Date().toISOString().slice(0, 10)} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Overall this week: <span className="font-semibold">{rating}/5</span></Label>
              <Slider value={[rating]} min={1} max={5} step={1} onValueChange={(v) => setRating(v[0])} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px]">Have you noticed any changes?</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["improved", "same", "worsened", "unsure"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setChange(c)}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-[13px] transition-colors",
                    change === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white hover:border-primary/40"
                  )}
                >
                  {CHANGE_LABELS[c]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px]">How consistently did you use the product?</Label>
            <div className="flex flex-wrap gap-2">
              {(["every-day", "most-days", "some-days", "rarely"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setConsistency(c)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-xs transition-colors",
                    consistency === c ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white hover:border-primary/40"
                  )}
                >
                  {CONSISTENCY_LABELS[c]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px] flex items-center gap-1.5">
              <CircleDot className="h-3.5 w-3.5" /> Any unwanted reactions?
            </Label>
            <div className="flex flex-wrap gap-2">
              {(["none", "mild", "moderate", "severe"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setReactions(r)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-xs transition-colors",
                    reactions === r
                      ? r === "none"
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-destructive bg-destructive text-white"
                      : "border-border bg-white hover:border-primary/40"
                  )}
                >
                  {REACTION_LABELS[r]}
                </button>
              ))}
            </div>
            {reactions !== "none" && (
              <Textarea
                value={reactionDetails}
                onChange={(e) => setReactionDetails(e.target.value)}
                rows={2}
                placeholder="What did you notice, where, and when?"
                className="mt-2 bg-white"
              />
            )}
            {reactions === "severe" && (
              <p className="text-xs text-destructive flex items-start gap-1.5 mt-1.5">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                For severe reactions, please pause the product and seek prompt medical care. If there is any difficulty breathing, throat or tongue swelling, or dizziness, treat it as an emergency.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px]">Anything else you&apos;d like to record? (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Small details help future-you understand the picture…" className="bg-white" />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <Button variant="ghost" onClick={onClose} className="rounded-full">Cancel</Button>
          <Button onClick={submit} disabled={busy} className="rounded-full bg-primary hover:bg-primary/90">
            {busy ? "Saving…" : existing ? "Save changes" : "Record check-in"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
